const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkLeaks() {
    const snapshot = await db.collection('leaks').get();
    console.log(`Total leaks in Firebase: ${snapshot.size}`);
    snapshot.forEach(doc => {
        console.log(`ID: ${doc.id}, Data: ${JSON.stringify(doc.data())}`);
    });
    process.exit();
}

checkLeaks();
