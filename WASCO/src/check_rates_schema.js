const mysql = require('mysql2');
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "59544945",
    database: "water_billing_db"
});

db.connect(err => {
    if (err) throw err;
    db.query("DESCRIBE BillingRates", (err, res) => {
        if (err) console.error(err);
        else console.log(JSON.stringify(res, null, 2));
        db.end();
    });
});
