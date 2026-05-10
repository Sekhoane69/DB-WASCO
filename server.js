const express = require("express");
console.log("-----------------------------------------");
console.log("SERVER.JS IS LOADING AT: " + new Date().toLocaleTimeString());
console.log("-----------------------------------------");
const mysql = require("mysql2");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Global Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

/* ------------------ MYSQL CONNECTION ------------------ */
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "59544945",
    database: process.env.DB_NAME || "water_billing_db",
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : undefined
});

db.connect(err => {
    if (err) throw err;
    console.log("MySQL Connected");
    // Auto-migrate: add missing columns if they don't exist
    db.query("ALTER TABLE Customers ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00", () => { });
    db.query("ALTER TABLE Customers ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50) DEFAULT 'Domestic'", () => { });
    db.query("ALTER TABLE Payments ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10,2) DEFAULT 0.00", () => { });
    
    // Create Views automatically for the system to use
    db.query(`CREATE OR REPLACE VIEW AllBillsView AS SELECT b.bill_id, b.account_id, c.full_name as name, b.month, b.amount, b.status FROM Bills b JOIN Customers c ON b.account_id = c.account_id;`, () => { });
    db.query(`CREATE OR REPLACE VIEW AdminCustomerView AS SELECT c.account_id, c.full_name, c.district, c.address, c.status, c.balance, c.customer_type, c.phone, c.email, u.is_active, u.role FROM Customers c LEFT JOIN Users u ON c.account_id = u.account_id;`, () => { });
    
    console.log("DB migration and Views check complete");
});

/* ------------------ FIREBASE CONNECTION ------------------ */
let firestore = null;
try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Cloud deployment: load from environment variable
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        // Local development: load from file
        serviceAccount = require("./serviceAccountKey.json");
    }
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    firestore = admin.firestore();
    console.log("Firebase Connected");
} catch (error) {
    console.warn("⚠️ Firebase not configured. Firebase features will be disabled.", error.message);
}

/* ------------------ API ROUTES ------------------ */

/* 🔹 LOGIN (MySQL) */
app.post("/api/login", (req, res) => {
    const { account_id, password } = req.body;

    const sql = `
        SELECT u.role, u.account_id, c.full_name as name, c.district, c.address, c.status, c.balance, c.phone, c.email 
        FROM Users u 
        JOIN Customers c ON u.account_id = c.account_id 
        WHERE u.username = ? AND u.password_hash = ? AND u.is_active = TRUE
    `;
    db.query(sql, [account_id, password], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length > 0) {
            res.json({ success: true, user: result[0] });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    });
});

/* 🔹 REGISTER (MySQL) */
app.post("/api/register", (req, res) => {
    const { account_id, full_name, district, address, phone, email, password } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json(err);

        const sqlCustomer = "INSERT INTO Customers (account_id, full_name, district, address, phone, email) VALUES (?, ?, ?, ?, ?, ?)";
        db.query(sqlCustomer, [account_id, full_name, district, address, phone, email], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ success: false, message: "Error creating customer profile. Account ID might be taken.", error: err });
                });
            }

            const sqlUser = "INSERT INTO Users (account_id, username, password_hash, role) VALUES (?, ?, ?, ?)";
            db.query(sqlUser, [account_id, account_id, password, req.body.role || 'customer'], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ success: false, message: "Error creating user account", error: err });
                    });
                }

                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json(err);
                        });
                    }
                    res.json({ success: true, message: "Registration successful" });

                    // Log for admin if needed
                    if (firestore && req.body.admin_id) {
                        firestore.collection("notifications").add({
                            account_id: req.body.admin_id,
                            message: `ADMIN ACTION: Registered new customer account ${account_id} (${full_name}).`,
                            type: 'system',
                            created_at: new Date().toISOString()
                        });
                    }
                });
            });
        });
    });
});

/* 🔹 GET USER (MySQL) */
app.get("/api/user/:account_id", (req, res) => {
    const { account_id } = req.params;

    const sql = `
        SELECT u.role, u.account_id, c.full_name as name, c.district, c.address, c.status, c.balance, c.phone, c.email 
        FROM Users u 
        JOIN Customers c ON u.account_id = c.account_id 
        WHERE u.account_id = ?
    `;
    db.query(sql, [account_id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    });
});

/* 🔹 UPDATE USER PROFILE (MySQL) */
app.post("/api/user/update", (req, res) => {
    const { account_id, phone, email, address } = req.body;
    const sql = "UPDATE Customers SET phone = ?, email = ?, address = ? WHERE account_id = ?";
    db.query(sql, [phone, email, address, account_id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, message: "Profile updated successfully" });
    });
});

/* 🔹 ADMIN UPDATE CUSTOMER (MySQL) */
app.post("/api/admin/customer/update", async (req, res) => {
    const account_id = req.body.account_id;
    const full_name = req.body.full_name || null;
    const district = req.body.district || null;
    const customer_type = req.body.customer_type || 'Domestic';
    const phone = req.body.phone || null;
    const email = req.body.email || null;
    const address = req.body.address || null;
    const admin_id = req.body.admin_id;

    const sql = "UPDATE Customers SET full_name = ?, district = ?, customer_type = ?, phone = ?, email = ?, address = ? WHERE account_id = ?";
    db.query(sql, [full_name, district, customer_type, phone, email, address, account_id], (err, result) => {
        if (err) {
            console.error("Update Customer Error:", err);
            return res.status(500).json(err);
        }
        
        if (firestore) {
            firestore.collection("notifications").add({
                account_id: admin_id || "System",
                message: `ADMIN ACTION: Updated details for customer ${account_id} (${full_name}).`,
                type: 'system',
                created_at: new Date().toISOString()
            }).catch(e => console.error(e));
        }
        res.json({ success: true, message: "Customer details updated successfully" });
    });
});

/* 🔹 CHANGE PASSWORD (MySQL) */
app.post("/api/user/change-password", (req, res) => {
    const { account_id, old_password, new_password } = req.body;
    
    // First verify old password
    const checkSql = "SELECT password_hash FROM Users WHERE account_id = ?";
    db.query(checkSql, [account_id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length > 0) {
            if (result[0].password_hash === old_password) {
                // Update with new password
                const updateSql = "UPDATE Users SET password_hash = ? WHERE account_id = ?";
                db.query(updateSql, [new_password, account_id], (err, result) => {
                    if (err) return res.status(500).json(err);
                    res.json({ success: true, message: "Password updated successfully" });
                });
            } else {
                res.status(401).json({ success: false, message: "Current password is incorrect" });
            }
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    });
});

/* 🔹 GET ALL BILLS (MySQL) */
app.get("/api/bills/:account_id", (req, res) => {
    const { account_id } = req.params;

    const sql = "SELECT * FROM Bills WHERE account_id = ?";
    db.query(sql, [account_id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});


/* 🔹 DELETE CUSTOMER (MySQL) */
app.delete("/api/customers/:account_id", async (req, res) => {
    const { account_id } = req.params;
    console.log(`[ADMIN] Attempting full deletion of customer: ${account_id}`);

    try {
        // Start a transaction
        await db.promise().beginTransaction();

        // Sequential cleanup of all related data
        // Order matters for Foreign Key constraints!
        
        // 1. Payments linked to customer's bills
        await db.promise().query("DELETE FROM Payments WHERE bill_id IN (SELECT bill_id FROM Bills WHERE account_id = ?)", [account_id]);
        
        // 2. Bills
        await db.promise().query("DELETE FROM Bills WHERE account_id = ?", [account_id]);
        
        // 3. Water Usage
        await db.promise().query("DELETE FROM WaterUsage WHERE account_id = ?", [account_id]);
        
        // 4. User Account
        await db.promise().query("DELETE FROM Users WHERE account_id = ?", [account_id]);
        
        // 5. Final Customer Profile
        const [result] = await db.promise().query("DELETE FROM Customers WHERE account_id = ?", [account_id]);

        if (result.affectedRows === 0) {
            await db.promise().rollback();
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        await db.promise().commit();
        console.log(`[ADMIN] Successfully purged customer: ${account_id}`);
        res.json({ success: true, message: "Customer and all records successfully deleted" });

    } catch (err) {
        await db.promise().rollback();
        console.error(`[ADMIN] Deletion failed for ${account_id}:`, err);
        res.status(500).json({ success: false, message: "Database deletion failed", error: err.message });
    }

    // Log this action for the Admin's Activity Log
    try {
        if (firestore) {
            await firestore.collection("notifications").add({
                account_id: req.body.admin_id || "System", // We'll pass admin_id from frontend
                message: `ADMIN ACTION: Permanently deleted customer account ${account_id} and all related records.`,
                type: 'system',
                created_at: new Date().toISOString()
            });
        }
    } catch (e) { console.error("Log Error:", e); }
});

/* 🔹 BLOCK/UNBLOCK CUSTOMER (MySQL) */
app.post("/api/customers/:account_id/status", async (req, res) => {
    const { account_id } = req.params;
    const { is_active, admin_id } = req.body; 
    
    try {
        await db.promise().query("UPDATE Users SET is_active = ? WHERE account_id = ?", [is_active, account_id]);
        console.log(`[ADMIN] Account ${account_id} status updated to: ${is_active ? 'Active' : 'Blocked'}`);
        res.json({ success: true, message: is_active ? "Account activated" : "Account blocked" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Status update failed" });
    }

    // Log this action for the Admin's Activity Log
    try {
        if (firestore) {
            await firestore.collection("notifications").add({
                account_id: admin_id || "System",
                message: `ADMIN ACTION: ${is_active ? 'Activated' : 'Blocked'} account ${account_id}.`,
                type: 'system',
                created_at: new Date().toISOString()
            });
        }
    } catch (e) { console.error("Log Error:", e); }
});

/* 🔹 TEST ROUTE */
app.get("/api/test", (req, res) => res.json({ ok: true, message: "Server is updated!" }));

/* 🔹 UPDATE USER ROLE (MySQL + Firebase) */
console.log("Registering route: POST /api/user/set-role");
app.post("/api/user/set-role", async (req, res) => {
    const { account_id, role, admin_id } = req.body;
    console.log(`[ADMIN] Role change request: ${account_id} -> ${role} (by ${admin_id})`);
    
    try {
        const [result] = await db.promise().query("UPDATE Users SET role = ? WHERE account_id = ?", [role, account_id]);
        console.log(`[DB] Update result:`, result);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User account not found" });
        }
        
        // Log the change for the Admin's activity log
        if (firestore) {
            await firestore.collection("notifications").add({
                account_id: admin_id || "System",
                message: `ADMIN ACTION: Changed role of ${account_id} to ${role.toUpperCase()}.`,
                type: 'system',
                created_at: new Date().toISOString()
            });
            
            // Also notify the affected user
            await firestore.collection("notifications").add({
                account_id: account_id,
                message: `Your account role has been updated to: ${role.toUpperCase()}.`,
                type: 'system',
                created_at: new Date().toISOString()
            });
        }
        
        res.json({ success: true, message: `Role updated to ${role}` });
    } catch (err) {
        console.error("Role update error:", err);
        res.status(500).json({ success: false, message: "Failed to update role", error: err.message });
    }
});

/* 🔹 GET ALL CUSTOMERS (MySQL) */
app.get("/api/customers", (req, res) => {
    const sql = `SELECT * FROM AdminCustomerView`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

/* 🔹 GET EVERY BILL FOR ADMIN (MySQL) */
app.get("/api/all-bills", (req, res) => {
    const sql = "SELECT * FROM AllBillsView ORDER BY month DESC";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

/* 🔹 GET BILLING RATES (MySQL) */
app.get("/api/rates", (req, res) => {
    const sql = "SELECT * FROM BillingRates ORDER BY usage_from ASC";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

/* 🔹 ADD WATER USAGE (MySQL) */
app.post("/api/usage", (req, res) => {
    const { account_id, month, meter_reading_previous, meter_reading_current } = req.body;

    const sql = `
        INSERT INTO WaterUsage (account_id, month, meter_reading_previous, meter_reading_current)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            meter_reading_previous = ?, 
            meter_reading_current = ?
    `;

    const consumption_m3 = parseFloat(meter_reading_current) - parseFloat(meter_reading_previous);
    db.query(sql, [account_id, month, meter_reading_previous, meter_reading_current, meter_reading_previous, meter_reading_current], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Usage recorded successfully", consumption: consumption_m3 });
    });
});

/* 🔹 GET WATER USAGE (MySQL) */
app.get("/api/usage/:account_id", (req, res) => {
    const { account_id } = req.params;
    const sql = "SELECT * FROM WaterUsage WHERE account_id = ? ORDER BY month DESC";
    db.query(sql, [account_id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

/* 🔹 GET ANALYTICS FOR MANAGER (MySQL) */
app.get("/api/analytics", (req, res) => {
    const sqlStats = `
      SELECT 
        (SELECT COUNT(*) FROM Customers) as total_customers,
        (SELECT SUM(amount) FROM Bills WHERE month LIKE '%2025%') as monthly_revenue,
        (SELECT AVG(amount) FROM Bills) as avg_bill,
        (SELECT SUM(amount) FROM Bills WHERE status='Paid') / (SELECT SUM(amount) FROM Bills) * 100 as collection_rate
    `;

    db.query(sqlStats, (err, stats) => {
        if (err) return res.status(500).json(err);

        const sqlDistricts = "SELECT district, COUNT(*) as users, SUM(balance) as total_balance FROM Customers GROUP BY district";
        db.query(sqlDistricts, (err, districts) => {
            if (err) return res.status(500).json(err);

            res.json({
                stats: stats[0],
                districts: districts
            });
        });
    });
});

/* 🔹 GET LAST PAYMENT FOR CUSTOMER (MySQL) */
app.get("/api/last-payment/:account_id", (req, res) => {
    const { account_id } = req.params;
    const sql = `
        SELECT p.amount, p.payment_date, b.month 
        FROM Payments p 
        JOIN Bills b ON p.bill_id = b.bill_id 
        WHERE b.account_id = ? 
        ORDER BY p.payment_date DESC LIMIT 1
    `;
    db.query(sql, [account_id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result.length > 0 ? result[0] : null);
    });
});

/* 🔹 GET BILL SUMMARY STATS FOR ADMIN (MySQL) */
app.get("/api/bill-summary", (req, res) => {
    const sql = `
        SELECT 
            SUM(amount) as total_billed,
            SUM(CASE WHEN status='Paid' THEN amount ELSE 0 END) as total_collected,
            SUM(CASE WHEN status!='Paid' THEN amount ELSE 0 END) as total_outstanding,
            COUNT(CASE WHEN status='Overdue' THEN 1 END) as overdue_accounts
        FROM Bills WHERE month LIKE '%2025%'
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]);
    });
});

/* 🔹 GET CUSTOMER TYPE SEGMENTS (MySQL) */
app.get("/api/segments", (req, res) => {
    const sql = "SELECT customer_type, COUNT(*) as count FROM Customers WHERE customer_type != 'None' GROUP BY customer_type";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

/* 🔹 GET LEAK REPORTS (Firebase) */
app.get("/api/leaks", async (req, res) => {
    try {
        if (firestore) {
            const snapshot = await firestore.collection("leaks").orderBy("created_at", "desc").get();
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.json(data);
        } else {
            res.json([]);
        }
    } catch (err) {
        res.status(500).json(err);
    }
});


/* 🔹 GET NOTIFICATIONS (Firebase) */
app.get("/api/notifications/:account_id", async (req, res) => {
    const { account_id } = req.params;
    try {
        // Fetch user role to determine if they should see system-wide alerts
        const [userRows] = await db.promise().query("SELECT role FROM Users WHERE account_id = ?", [account_id]);
        const userRole = userRows.length > 0 ? userRows[0].role : 'customer';

        if (firestore) {
            // Fetch ALL notifications and filter by target IDs
            const snapshot = await firestore.collection("notifications").get();
            
            // Base IDs to fetch: user's own ID (case insensitive)
            const ids = [account_id.toLowerCase(), account_id.toUpperCase(), account_id];
            
            // Only Admins and Branch Managers get "System" level alerts (Payments, Leaks, etc.)
            if (userRole === 'admin' || userRole === 'manager') {
                ids.push("System");
            }
            
            let data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(n => ids.includes(n.account_id));
            
            // Sort by date (descending)
            data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            res.json(data.slice(0, 30));
        } else {
            res.json([]);
        }
    } catch (err) {
        console.error("Notif Error:", err);
        res.status(500).json({ message: "Firebase error", error: err.message });
    }
});

/* 🔹 SEED TEST NOTIFICATIONS */
app.get("/api/seed-notifs/:account_id", async (req, res) => {
    const { account_id } = req.params;
    if (!firestore) return res.status(500).json({ message: "Firestore not connected" });

    try {
        await firestore.collection("notifications").add({
            account_id: account_id,
            message: "System: Welcome to your new Activity Log!",
            type: "system",
            created_at: new Date().toISOString()
        });
        await firestore.collection("notifications").add({
            account_id: account_id,
            message: "Sample: Your March bill has been processed.",
            type: "bill",
            created_at: new Date().toISOString()
        });
        res.json({ success: true, message: `Seeded 2 notifs for ${account_id}` });
    } catch (err) {
        res.status(500).json(err);
    }
});
app.post("/api/generate-bill", async (req, res) => {
    const { account_id, month } = req.body;
    console.log(`Generating bill for ${account_id}, ${month}`);

    try {
        // Call stored procedure
        await db.promise().query("CALL GenerateBill(?, ?)", [account_id, month]);

        // Get the generated bill amount
        const [billRows] = await db.promise().query("SELECT amount FROM Bills WHERE account_id = ? AND month = ?", [account_id, month]);
        const amount = billRows[0]?.amount || 0;

        // Send notification to Firebase
        if (firestore) {
            await firestore.collection("notifications").add({
                account_id,
                message: `New bill generated for ${month}: M ${amount}`,
                type: 'bill',
                created_at: new Date().toISOString()
            });

            // Log for Admin too
            if (req.body.admin_id) {
                await firestore.collection("notifications").add({
                    account_id: req.body.admin_id,
                    message: `ADMIN ACTION: Generated bill for ${account_id} (${month}) - M ${amount}`,
                    type: 'system',
                    created_at: new Date().toISOString()
                });
            }
        }

        res.json({ success: true, message: "Bill generated", amount });
    } catch (err) {
        console.error("Billing Error:", err);
        res.status(500).json({ success: false, message: err.message || "Database error" });
    }
});

/* 🔹 MAKE PAYMENT (MySQL + Firebase) */
app.post("/api/pay", async (req, res) => {
    const { bill_id, amount, account_id, payment_method } = req.body;
    const payAmount = parseFloat(amount);
    const methodStr = payment_method || 'Card';

    try {
        // 1. Fetch current bill state
        const [billRows] = await db.promise().query("SELECT amount, account_id FROM Bills WHERE bill_id = ?", [bill_id]);
        if (billRows.length > 0) {
            const currentAmount = parseFloat(billRows[0].amount);
            const accId = account_id || billRows[0].account_id;

            // Fetch current customer balance
            const [custRows] = await db.promise().query("SELECT balance FROM Customers WHERE account_id = ?", [accId]);
            const currentCustBalance = custRows.length > 0 ? parseFloat(custRows[0].balance) : 0;
            const newCustBalance = currentCustBalance - payAmount;

            // 2. Record payment in MySQL with credit_balance
            const sqlPay = "INSERT INTO Payments (bill_id, amount, payment_method, credit_balance) VALUES (?, ?, ?, ?)";
            await db.promise().query(sqlPay, [bill_id, payAmount, methodStr, newCustBalance]);

            // 3. Update Bill (subtract amount, check if fully paid)
            const newAmount = Math.max(0, currentAmount - payAmount);
            const newStatus = newAmount < 0.01 ? 'Paid' : 'Pending';

            await db.promise().query("UPDATE Bills SET amount = ?, status = ? WHERE bill_id = ?", [newAmount, newStatus, bill_id]);

            // 4. Update Customer total balance
            await db.promise().query("UPDATE Customers SET balance = ? WHERE account_id = ?", [newCustBalance, accId]);

            // 5. Firebase notification
            if (firestore) {
                await firestore.collection("notifications").add({
                    account_id: accId,
                    message: `Payment of M ${payAmount.toLocaleString()} successful. ${newAmount < 0.01 ? 'Bill fully paid.' : 'Remaining: M ' + newAmount.toLocaleString()}`,
                    type: 'payment',
                    created_at: new Date().toISOString()
                });

                // Also notify Admins
                await firestore.collection("notifications").add({
                    account_id: "System",
                    message: `PAYMENT: Customer ${accId} paid M ${payAmount.toLocaleString()} for bill #${bill_id}.`,
                    type: 'payment',
                    created_at: new Date().toISOString()
                });
            }
        }

        res.json({ success: true, message: "Payment successful" });
    } catch (err) {
        console.error("Payment Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/* 🔹 SUBMIT LEAK REPORT (Firebase ONLY) */
app.post("/api/leak", async (req, res) => {
    const { account_id, district, location, severity, details } = req.body;

    try {
        if (firestore) {
            await firestore.collection("leaks").add({
                account_id,
                district,
                location,
                severity,
                details,
                status: "Open",
                created_at: new Date().toISOString()
            });

            // Notify Admins
            await firestore.collection("notifications").add({
                account_id: "System",
                message: `URGENT: New leak reported by ${account_id} in ${district} (${location})`,
                type: 'leak',
                created_at: new Date().toISOString()
            });

            res.json({ message: "Leak reported successfully" });
        } else {
            res.status(503).json({ message: "Firebase is not configured" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

/* 🔹 UPDATE LEAK STATUS (Firebase) */
app.post("/api/leaks/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        if (firestore) {
            const leakRef = firestore.collection("leaks").doc(id);
            const leakDoc = await leakRef.get();

            await leakRef.update({ status });

            // Notification for status change
            if (leakDoc.exists) {
                const leakData = leakDoc.data();
                await firestore.collection("notifications").add({
                    account_id: leakData.account_id,
                    message: `Leak report #${id.substring(0, 5)} status updated to: ${status}`,
                    type: 'leak',
                    created_at: new Date().toISOString()
                });
            }

            res.json({ success: true, message: "Status updated" });
        } else {
            res.status(500).json({ message: "Firestore not connected" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

/* ------------------ START SERVER ------------------ */
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});