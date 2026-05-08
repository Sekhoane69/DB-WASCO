const mysql = require('mysql2');
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "59544945",
    database: "water_billing_db",
    multipleStatements: true
});

const sql = `
-- Migrate BillingRates
ALTER TABLE BillingRates RENAME COLUMN min_usage TO usage_from;
ALTER TABLE BillingRates RENAME COLUMN max_usage TO usage_to;
ALTER TABLE BillingRates RENAME COLUMN price_per_m3 TO rate_per_m3;

-- Add sewer_surcharge if missing
ALTER TABLE BillingRates ADD COLUMN IF NOT EXISTS sewer_surcharge DECIMAL(10,2) DEFAULT 0.00;
`;

db.connect(err => {
    if (err) throw err;
    db.query(sql, (err) => {
        if (err) {
            // Fallback for older MySQL
            db.query("ALTER TABLE BillingRates CHANGE min_usage usage_from DECIMAL(10,2)", () => {});
            db.query("ALTER TABLE BillingRates CHANGE max_usage usage_to DECIMAL(10,2)", () => {});
            db.query("ALTER TABLE BillingRates CHANGE price_per_m3 rate_per_m3 DECIMAL(10,2)", () => {});
        }
        console.log("Rates Migration complete");
        db.end();
    });
});
