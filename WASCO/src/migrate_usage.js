const mysql = require('mysql2');
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "59544945",
    database: "water_billing_db"
});

const sql = `
ALTER TABLE WaterUsage CHANGE COLUMN IF EXISTS prev_reading meter_reading_previous DECIMAL(10,2);
ALTER TABLE WaterUsage CHANGE COLUMN IF EXISTS curr_reading meter_reading_current DECIMAL(10,2);
ALTER TABLE WaterUsage CHANGE COLUMN IF EXISTS consumption consumption_m3 DECIMAL(10,2);
`;

db.connect(err => {
    if (err) throw err;
    db.query(sql, (err) => {
        if (err) {
            // Fallback for older MySQL versions that don't support CHANGE COLUMN IF EXISTS
            db.query("ALTER TABLE WaterUsage RENAME COLUMN prev_reading TO meter_reading_previous", () => {});
            db.query("ALTER TABLE WaterUsage RENAME COLUMN curr_reading TO meter_reading_current", () => {});
            db.query("ALTER TABLE WaterUsage RENAME COLUMN consumption TO consumption_m3", () => {});
        }
        console.log("Migration complete (checked for old column names)");
        db.end();
    });
});
