const mysql = require('mysql2');
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "59544945",
    database: "water_billing_db",
    multipleStatements: true
});

const sql = `
INSERT INTO BillingRates (tier_name, usage_from, usage_to, rate_per_m3, customer_type, sewer_surcharge)
VALUES 
('Tier 1', 0, 10, 8.50, 'Domestic', 6.00),
('Tier 2', 10.01, 30, 12.75, 'Domestic', 6.00),
('Tier 3', 30.01, 999999, 18.50, 'Domestic', 6.00),
('Commercial 1', 0, 50, 15.00, 'Commercial', 10.00),
('Commercial 2', 50.01, 999999, 25.00, 'Commercial', 10.00)
ON DUPLICATE KEY UPDATE rate_per_m3 = VALUES(rate_per_m3);
`;

db.connect(err => {
    if (err) throw err;
    db.query(sql, (err) => {
        if (err) console.error(err);
        else console.log("Billing rates seeded.");
        db.end();
    });
});
