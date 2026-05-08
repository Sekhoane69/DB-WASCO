const mysql = require('mysql2');
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "wasco_db"
});

db.query("SELECT account_id, role FROM Users LIMIT 20", (err, result) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.table(result);
    process.exit(0);
});
