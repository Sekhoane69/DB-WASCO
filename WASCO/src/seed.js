const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '59544945',
    database: 'water_billing_db'
});

db.connect(err => {
    if (err) { console.error('Connect error:', err); process.exit(1); }

    // 1. Insert dummy customers into Customers table
    const customers = [
        ['WAS-00123', 'Teboho Mokoena', 'Maseru', 'Ha Hoohlo', '555-0101', 'teboho@email.com', 'Active', 285.40, 'Domestic'],
        ['WAS-00124', 'Lineo Ntlale', 'Leribe', 'Hlotse Main', '555-0102', 'lineo@email.com', 'Active', 0.00, 'Domestic'],
        ['WAS-00125', 'Matlohang Sello', 'Berea', 'Teyateyaneng', '555-0103', 'matlohang@email.com', 'Overdue', 712.00, 'Commercial'],
        ['WAS-00126', 'Retselisitsoe Tau', 'Maseru', 'Mafeteng Rd', '555-0104', 'tau@email.com', 'Active', 190.80, 'Domestic'],
        ['SYS-ADMIN', 'System Administrator', 'HQ', 'Maseru Main', '555-0000', 'admin@wasco.com', 'Active', 0.00, 'None'],
        ['SYS-MANAGER', 'Branch Manager', 'Maseru', 'Branch Office', '555-0001', 'manager@wasco.com', 'Active', 0.00, 'None'],
    ];

    const sqlCust = `INSERT IGNORE INTO Customers 
        (account_id, full_name, district, address, phone, email, status, balance, customer_type) 
        VALUES ?`;

    db.query(sqlCust, [customers], (err) => {
        console.log('Customers seeded:', err ? err.message : 'OK');

        // 2. Insert login accounts into Users table
        const users = [
            ['WAS-00123', 'WAS-00123', 'password123', 'customer'],
            ['WAS-00124', 'WAS-00124', 'password123', 'customer'],
            ['WAS-00125', 'WAS-00125', 'password123', 'customer'],
            ['WAS-00126', 'WAS-00126', 'password123', 'customer'],
            ['SYS-ADMIN', 'admin', 'admin123', 'admin'],
            ['SYS-MANAGER', 'manager', 'manager123', 'manager'],
        ];

        const sqlUsers = `INSERT IGNORE INTO Users 
            (account_id, username, password_hash, role) 
            VALUES ?`;

        db.query(sqlUsers, [users], (err) => {
            console.log('Users seeded:', err ? err.message : 'OK');

            // 3. Verify
            db.query('SELECT username, role FROM Users', (err, rows) => {
                if (err) return console.error(err);
                console.log('\nAll login accounts:');
                rows.forEach(r => console.log(` - ${r.username} (${r.role})`));
                db.end();
            });
        });
    });
});
