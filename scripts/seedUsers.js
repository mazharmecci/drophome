/**
 * seedUsers.js
 * Script to create Firebase Auth users (if missing)
 * and seed Firestore roles + allowed pages.
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin SDK (ensure GOOGLE_APPLICATION_CREDENTIALS is set)
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

// 🔁 Users to seed
const usersToSeed = [
  {
    email: "ahmadmanj40@gmail.com",
    password: "TempPass123!",       // temporary password
    role: "limited",
    // Filenames only – this matches navbar.js + main.js checks
    allowedPages: [
      "/index.html",
      "/forms/orders.html",
      "/forms/order-history.html",
      "/forms/stock.html"
    ]
  },
  {
    email: "newemployee@example.com",
    password: "TempPass123!",
    role: "limited",
    allowedPages: [
      "index.html",
      "orders.html"
    ]
  }
  // ➕ Add more users here as needed
];

// 🔐 Seed a single user
async function seedUser(user) {
  let uid;

  try {
    // Try to fetch existing Auth user
    const userRecord = await admin.auth().getUserByEmail(user.email);
    uid = userRecord.uid;
    console.log(`ℹ️ User already exists in Auth: ${user.email}`);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      // Create new Auth user if not found
      const newUser = await admin.auth().createUser({
        email: user.email,
        password: user.password
      });
      uid = newUser.uid;
      console.log(`✅ Created new Auth user: ${user.email}`);
    } else {
      console.error(`❌ Error for ${user.email}:`, error.code, error.message);
      return;
    }
  }

  // Seed / update Firestore user document
  try {
    await db.collection("users").doc(uid).set(
      {
        email: user.email,
        role: user.role,
        allowedPages: user.allowedPages  // stored as array of strings
      },
      { merge: true }                    // keep any existing extra fields
    );
    console.log(`✅ Seeded Firestore role for ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to seed Firestore for ${user.email}:`, error.message);
  }
}

// 🚀 Run seeding for all users
(async () => {
  for (const user of usersToSeed) {
    await seedUser(user);
  }
  console.log("🎉 Seeding complete!");
  process.exit(0);
})();
