const mysql = require('mysql2');
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "59544945",
    database: "water_billing_db",
    multipleStatements: true
});

const sql = `
-- Check Bills
ALTER TABLE Bills RENAME COLUMN IF EXISTS usage TO usage_m3;
ALTER TABLE Bills RENAME COLUMN IF EXISTS bill_amount TO amount;
`;

db.connect(err => {
    if (err) throw err;
    db.query(sql, (err) => {
        if (err) {
            db.query("ALTER TABLE Bills CHANGE usage usage_m3 DECIMAL(10,2)", () => {});
            db.query("ALTER TABLE Bills CHANGE bill_amount amount DECIMAL(10,2)", () => {});
        }
        console.log("Bills Migration complete");
        db.end();
    });
});
