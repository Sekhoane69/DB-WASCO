const mysql = require('mysql2');
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "59544945",
    database: "water_billing_db"
});

db.connect(err => {
    if (err) throw err;
    db.query("ALTER TABLE Customers ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.00", (err) => {
        if (err && err.code !== 'ER_DUP_COLUMN_NAME') console.error(err);
        db.query("ALTER TABLE Customers ADD COLUMN customer_type VARCHAR(50) DEFAULT 'Domestic'", (err) => {
            if (err && err.code !== 'ER_DUP_COLUMN_NAME') console.error(err);
            console.log("Customer columns confirmed");
            db.end();
        });
    });
});
