const mysql = require('mysql2');
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "59544945",
    database: "water_billing_db"
});

const months = ['March 2025', 'April 2025'];

db.connect(async (err) => {
    if (err) throw err;
    console.log("Connected for seeding...");

    const promiseDb = db.promise();
    
    try {
        const [customers] = await promiseDb.query("SELECT account_id FROM Customers");
        
        if (customers.length === 0) {
            console.log("No customers found to seed usage for.");
            process.exit(0);
        }

        for (const customer of customers) {
            for (const month of months) {
                const prev = Math.floor(Math.random() * 100);
                const curr = prev + Math.floor(Math.random() * 35); // 0-35 m3 consumption
                const consumption = curr - prev;

                await promiseDb.query(`
                    INSERT INTO WaterUsage (account_id, month, meter_reading_previous, meter_reading_current, consumption_m3)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE meter_reading_current = ?, consumption_m3 = ?
                `, [customer.account_id, month, prev, curr, consumption, curr, consumption]);
            }
        }

        console.log(`Successfully seeded usage data for ${customers.length} customers.`);
    } catch (error) {
        console.error("Seeding failed:", error);
    } finally {
        db.end();
    }
});
