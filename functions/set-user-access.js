// Postavlja ulogu i dodijeljene grupe za jednog korisnika (users/{uid} dokument).
// Traži Auth račun po emailu (mora već postojati - kreiran ručno u Firebase Console),
// zatim upisuje/ažurira Firestore users/{uid} dokument.
//
// VAŽNO: groups sadrži samo SLOVO grupe (npr. "a"), ne puni ID ("grupa-a") -
// kod u index-admin.html/group-detail.html uspoređuje po slovu.
//
// Pokretanje:
//   node set-user-access.js <email> <role: admin|operator> [slovo1,slovo2,...]
//
// Primjer:
//   node set-user-access.js karlob@asl.com operator a
//   node set-user-access.js marinop@asl.com operator b,c
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const [, , email, role, groupsArg] = process.argv;

if (!email || !role || !['admin', 'operator'].includes(role)) {
  console.error('Upotreba: node set-user-access.js <email> <admin|operator> [grupa1,grupa2,...]');
  process.exit(1);
}

const groups = role === 'admin' ? [] : (groupsArg ? groupsArg.split(',').map(g => g.trim().toLowerCase()).filter(Boolean) : []);

(async () => {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.firestore().doc(`users/${userRecord.uid}`).set({ role, groups, email }, { merge: true });
    console.log(`Postavljeno za ${email} (uid: ${userRecord.uid}): role=${role}, groups=[${groups.join(', ')}]`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`Greška: Auth račun za ${email} ne postoji. Prvo ga kreiraj u Firebase Console (Authentication -> Add user).`);
    } else {
      console.error('Greška:', err);
    }
    process.exit(1);
  }
})();
