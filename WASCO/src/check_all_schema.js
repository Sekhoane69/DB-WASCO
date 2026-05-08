const mysql = require('mysql2');
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "59544945",
    database: "water_billing_db"
});

db.connect(err => {
    if (err) throw err;
    db.query("SHOW TABLES", (err, tables) => {
        if (err) throw err;
        const list = tables.map(t => Object.values(t)[0]);
        console.log("Tables:", list);
        
        list.forEach(table => {
            db.query(`DESCRIBE ${table}`, (err, res) => {
                console.log(`--- ${table} ---`);
                console.log(JSON.stringify(res, null, 2));
                if (table === list[list.length-1]) db.end();
            });
        });
    });
});
