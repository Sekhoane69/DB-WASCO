const mysql = require('mysql2');
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "59544945",
    database: "water_billing_db",
    multipleStatements: true
});

const sql = `
DROP PROCEDURE IF EXISTS GenerateBill;
CREATE PROCEDURE GenerateBill(IN p_account_id VARCHAR(50), IN p_month VARCHAR(20))
BEGIN
    DECLARE v_bill_id VARCHAR(50);
    DECLARE v_usage DECIMAL(10,2) DEFAULT 0;
    DECLARE v_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_rate DECIMAL(10,2) DEFAULT 8.50;
    DECLARE v_surcharge DECIMAL(10,2) DEFAULT 6.00;
    DECLARE v_customer_type VARCHAR(50) DEFAULT 'Domestic';
    
    -- Get customer type
    SELECT customer_type INTO v_customer_type FROM Customers WHERE account_id = p_account_id LIMIT 1;
    
    -- Get usage for the month
    SELECT consumption_m3 INTO v_usage FROM WaterUsage WHERE account_id = p_account_id AND month = p_month LIMIT 1;
    
    IF v_usage IS NULL THEN SET v_usage = 0; END IF;
    
    -- Get appropriate rate
    SELECT rate_per_m3, sewer_surcharge INTO v_rate, v_surcharge 
    FROM BillingRates 
    WHERE customer_type = v_customer_type AND v_usage >= usage_from AND v_usage <= usage_to
    LIMIT 1;
    
    -- Final calculation
    SET v_amount = ROUND((v_usage * v_rate) + (v_usage * v_surcharge), 2);
    SET v_bill_id = CONCAT('BL-', p_month, '-', RIGHT(p_account_id, 4));
    
    INSERT INTO Bills (bill_id, account_id, month, usage_m3, amount, status)
    VALUES (v_bill_id, p_account_id, p_month, v_usage, v_amount, 'Pending')
    ON DUPLICATE KEY UPDATE usage_m3 = v_usage, amount = v_amount;
    
    UPDATE Customers SET balance = balance + v_amount WHERE account_id = p_account_id;
END;
`;

db.connect(err => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    db.query(sql, (err) => {
        if (err) console.error(err);
        else console.log("Procedure updated");
        db.end();
    });
});
