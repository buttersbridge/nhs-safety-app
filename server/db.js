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

module.exports = db;