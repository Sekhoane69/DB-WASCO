const fetch = require('node-fetch');

async function test() {
    try {
        const res = await fetch("http://localhost:5000/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                account_id: 'TEST-123',
                full_name: 'Test User',
                district: 'Maseru',
                address: 'Test Addr',
                phone: '123',
                email: 'test@test.com',
                password: 'password'
            })
        });
        const text = await res.text();
        console.log("STATUS:", res.status);
        console.log("BODY:", text);
    } catch(err) {
        console.error("FETCH ERROR:", err);
    }
}
test();
