const mysql = require('mysql2');
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "59544945",
    database: "water_billing_db"
});

db.connect(err => {
    if (err) throw err;
    db.query("ALTER TABLE BillingRates ADD COLUMN sewer_surcharge DECIMAL(10,2) DEFAULT 0.00", (err) => {
        if (err && err.code !== 'ER_DUP_COLUMN_NAME') {
            console.error("Error adding column:", err);
        } else {
            console.log("sewer_surcharge column confirmed/added");
        }
        db.end();
    });
});
