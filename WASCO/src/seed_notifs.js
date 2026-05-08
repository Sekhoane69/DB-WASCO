const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function seedNotifs() {
    const users = ['WAS-00123', 'WAS-00124', 'WAS-00125', 'WAS-00126'];
    for (const id of users) {
        await db.collection('notifications').add({
            account_id: id,
            message: "Welcome to the new WASCO portal! Check your bills and reports here.",
            type: 'info',
            created_at: new Date().toISOString()
        });
    }
    console.log("Seeded welcome notifications.");
    process.exit();
}

seedNotifs();
