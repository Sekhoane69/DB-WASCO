const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '59544945',
    database: 'water_billing_db'
});

db.connect(err => {
    if (err) { console.error('Connect error:', err); process.exit(1); }
    
    db.query('ALTER TABLE Customers ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.00', (err) => {
        console.log('balance column:', err ? err.message : 'ADDED OK');

        db.query('ALTER TABLE Customers ADD COLUMN customer_type VARCHAR(50) DEFAULT "Domestic"', (err) => {
            console.log('customer_type column:', err ? err.message : 'ADDED OK');

            // Verify
            db.query('DESCRIBE Customers', (err, rows) => {
                if (err) return console.error(err);
                console.log('Customers columns:', rows.map(r => r.Field).join(', '));
                db.end();
            });
        });
    });
});
