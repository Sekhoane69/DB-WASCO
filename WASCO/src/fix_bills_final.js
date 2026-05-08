const mysql = require('mysql2');
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "59544945",
    database: "water_billing_db",
    multipleStatements: true
});

const sql = `
-- Add usage_m3 column if it's missing
ALTER TABLE Bills ADD COLUMN IF NOT EXISTS usage_m3 DECIMAL(10,2) DEFAULT 0.00;

-- Rename total_amount to amount if it exists
ALTER TABLE Bills CHANGE COLUMN IF EXISTS total_amount amount DECIMAL(10,2);
`;

db.connect(err => {
    if (err) throw err;
    db.query(sql, (err) => {
        if (err) {
            // Fallback for older MySQL
            db.query("ALTER TABLE Bills ADD COLUMN usage_m3 DECIMAL(10,2) DEFAULT 0.00", () => {});
            db.query("ALTER TABLE Bills CHANGE total_amount amount DECIMAL(10,2)", () => {});
        }
        console.log("Bills structure fixed");
        db.end();
    });
});
