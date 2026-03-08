const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

// Paths
const dbPath = path.join(__dirname, "database.db");
const initPath = path.join(__dirname, "init_db.sql");

// Open database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Failed to open database:", err);
    return;
  }

  console.log("📦 Database opened:", dbPath);

  // Load init SQL
  try {
    const initSQL = fs.readFileSync(initPath, "utf8");

    db.exec(initSQL, (err2) => {
      if (err2) {
        console.error("❌ Error running init_db.sql:", err2);
      } else {
        console.log("✅ init_db.sql executed successfully");
      }
    });
  } catch (e) {
    console.error("❌ Could not read init_db.sql:", e);
  }
});

// Fetch user by ID
async function getUserById(id) {
  const result = await db.query(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

// Update password hash
async function updateUserPassword(id, hash) {
  return db.query(
    "UPDATE users SET password_hash = $1 WHERE id = $2",
    [hash, id]
  );
}

module.exports = {
  getUserById,
  updateUserPassword,
  // ...any other exports you already have
};

module.exports = db;