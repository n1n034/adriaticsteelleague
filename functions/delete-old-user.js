// Jednokratna skripta: briše stari ograničeni admin račun user@asl.com
// (Firebase Auth račun + pripadajući Firestore users/{uid} dokument).
// Pokretanje: node delete-old-user.js
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const EMAIL = 'user@asl.com';

(async () => {
  try {
    const userRecord = await admin.auth().getUserByEmail(EMAIL);
    console.log(`Nađen Auth račun ${EMAIL} (uid: ${userRecord.uid})`);

    await admin.firestore().doc(`users/${userRecord.uid}`).delete();
    console.log(`Obrisan Firestore dokument users/${userRecord.uid}`);

    await admin.auth().deleteUser(userRecord.uid);
    console.log(`Obrisan Auth račun ${EMAIL}`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log(`Račun ${EMAIL} ne postoji (već obrisan?) - ništa za napraviti.`);
    } else {
      console.error('Greška:', err);
      process.exit(1);
    }
  }
})();
