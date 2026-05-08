const mysql = require('mysql2');
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "59544945",
    database: "water_billing_db"
});

db.query("SELECT * FROM Bills LIMIT 5", (err, result) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log("BILL DATA SAMPLE:");
    console.table(result);
    process.exit(0);
});
