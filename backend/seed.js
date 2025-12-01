const admin = require('firebase-admin');
const fs = require('fs');
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON');
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)) });
const auth = admin.auth();
const db = admin.firestore();

async function seed() {
  const machines = [
    { id: '_v00001', name: '_v00001', location: 'hyd', capacity: 200, current_stock_percent: 78 },
    { id: '_v00002', name: '_v00002', location: 'hyd', capacity: 180, current_stock_percent: 22 }
  ];
  for (const m of machines) {
    await db.collection('machines').doc(m.id).set(m);
    console.log('seeded machine', m.id);
  }

  const users = [
    { email: 'vdsplofficial@gmail.com', password: 'Snackmaster123', role: 'admin' },
    { email: 'riteshkumarrajak3@gmail.com', password: 'deliveryhead', role: 'refiller' },
    { email: 'ry753136@gmail.com', password: 'storeincharge', role: 'refiller' }
  ];

  for (const u of users) {
    try {
      const userRecord = await auth.getUserByEmail(u.email).catch(() => null);
      if (userRecord) {
        console.log('user already exists', u.email);
      } else {
        const created = await auth.createUser({ email: u.email, password: u.password, emailVerified: true });
        await db.collection('users').doc(created.uid).set({ email: u.email, role: u.role });
        console.log('created user', u.email);
      }
    } catch (err) {
      console.error('error creating user', u.email, err.message);
    }
  }
  console.log('Seeding complete');
  process.exit(0);
}

seed();
