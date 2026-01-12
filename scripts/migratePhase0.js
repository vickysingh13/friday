/**
 * PHASE 0 MIGRATION SCRIPT
 * Run ONCE only
 */

const admin = require("firebase-admin");

// 🔐 Use service account key
// Download from Firebase Console → Project Settings → Service Accounts
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const SUPER_ADMIN_EMAILS = [
  "vdsplofficial@gmail.com",
  "vickysinghofficial13@gmail.com",
];

const FRANCHISE_ORG_ID = "ORG_FRANCHISE_HYD";

async function promoteSuperAdmins() {
  console.log("🔹 Promoting Super Admins...");

  for (const email of SUPER_ADMIN_EMAILS) {
    const user = await auth.getUserByEmail(email);

    // Update Firestore user doc
    await db.collection("users").doc(user.uid).set(
      {
        email,
        role: "super_admin",
        orgId: "ORG_SUPER",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Optional but recommended
    await auth.setCustomUserClaims(user.uid, {
      role: "super_admin",
    });

    console.log(`✅ Super Admin set: ${email}`);
  }
}

async function assignOrgToOtherUsers() {
  console.log("🔹 Assigning orgId to non-super users...");

  const usersSnap = await db.collection("users").get();

  for (const doc of usersSnap.docs) {
    const data = doc.data();

    if (data.role === "super_admin") continue;

    await doc.ref.set(
      {
        orgId: FRANCHISE_ORG_ID,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  console.log("✅ Users org assignment complete");
}

async function assignOrgToMachines() {
  console.log("🔹 Assigning orgId to machines...");

  const machinesSnap = await db.collection("machines").get();

  for (const doc of machinesSnap.docs) {
    await doc.ref.set(
      {
        orgId: FRANCHISE_ORG_ID,
      },
      { merge: true }
    );
  }

  console.log("✅ Machines org assignment complete");
}

async function main() {
  try {
    await promoteSuperAdmins();
    await assignOrgToOtherUsers();
    await assignOrgToMachines();

    console.log("\n🎉 PHASE 0 MIGRATION COMPLETE");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

main();
