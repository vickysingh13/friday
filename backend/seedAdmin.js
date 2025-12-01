// backend/seedAdmin.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// ADMIN EMAIL TO ASSIGN ROLE
const ADMIN_EMAIL = "vdsplofficial@gmail.com";

async function seedAdmin() {
  try {
    // 1) Check if user exists in Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log("Admin user already exists:", userRecord.uid);
    } catch (err) {
      console.log("Admin user does not exist, creating new...");

      userRecord = await auth.createUser({
        email: ADMIN_EMAIL,
        password: "Snackmaster123",    // you provided this earlier
        emailVerified: true
      });
      console.log("Admin user created:", userRecord.uid);
    }

    // 2) Create Firestore user doc
    await db.collection("users").doc(userRecord.uid).set({
      email: ADMIN_EMAIL,
      role: "admin",
      name: "Admin User",
      createdAt: new Date()
    });

    console.log("Admin role assigned successfully.");
    process.exit(0);

  } catch (err) {
    console.error("Error creating admin user:", err);
    process.exit(1);
  }
}

seedAdmin();
