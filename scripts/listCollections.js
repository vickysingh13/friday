const admin = require("firebase-admin");
const path = require("path");

admin.initializeApp({
  credential: admin.credential.cert(
    require(path.join(__dirname, "serviceAccountKey.json"))
  ),
});

admin.firestore().listCollections().then(cols => {
  console.log("📦 ROOT COLLECTIONS:");
  cols.forEach(c => console.log(" -", c.id));
  process.exit(0);
});
