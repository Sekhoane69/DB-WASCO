const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkNotifications() {
    const snapshot = await db.collection('notifications').get();
    console.log(`Total notifications in Firebase: ${snapshot.size}`);
    snapshot.forEach(doc => {
        console.log(`ID: ${doc.id}, Data: ${JSON.stringify(doc.data())}`);
    });
    process.exit();
}

checkNotifications();
