/**
 * PHASE 1.2 — STEP 2
 * Suspend organisation + auto-unassign machines
 */

const admin = require("firebase-admin");
const path = require("path");

console.log("🚀 Script started");

admin.initializeApp({
  credential: admin.credential.cert(
    require(path.join(__dirname, "serviceAccountKey.json"))
  ),
});

const db = admin.firestore();

// 🔴 CHANGE ONLY THIS
const TARGET_ORG_ID = "ORG_FRANCHISE_HYD";

async function suspendOrganisation() {
  console.log("⛔ Suspending organisation:", TARGET_ORG_ID);

  const orgRef = db.collection("organisations").doc(TARGET_ORG_ID);

  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new Error("❌ Organisation not found");
  }

  await orgRef.update({
    suspended: true,
    suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const machinesSnap = await db
    .collection("machines")
    .where("orgId", "==", TARGET_ORG_ID)
    .get();

  console.log(`📦 Machines found: ${machinesSnap.size}`);

  let batch = db.batch();
  let count = 0;

  for (const doc of machinesSnap.docs) {
    batch.update(doc.ref, {
      status: "disabled",
      assigned: false,
      assignedTo: null,
      adminEmail: null,
      orgId: null,
      disabledReason: "ORG_SUSPENDED",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    count++;
  }

  if (count > 0) {
    await batch.commit();
  }

  await db.collection("admin_actions").add({
    action: "ORG_SUSPENDED",
    orgId: TARGET_ORG_ID,
    affectedMachines: count,
    performedBy: "SUPER_ADMIN",
    performedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("✅ Organisation suspended");
  console.log("🚫 Machines unassigned:", count);
  console.log("🎉 PHASE 1.2 STEP 2 COMPLETE");
}

// 🔥 CRITICAL: keep Node alive until finished
(async () => {
  try {
    await suspendOrganisation();
    process.exit(0);
  } catch (err) {
    console.error("❌ Script failed:", err);
    process.exit(1);
  }
})();
