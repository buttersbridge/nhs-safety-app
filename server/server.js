const authMiddleware = require("./authMiddleware");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..", "public")));

/* ---------------- LOGIN ---------------- */

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "select id, email, name, role from users where email = ? and password = ?",
    [email, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: "Invalid credentials" });

      // ⭐ Create JWT
      const token = jwt.sign(
        {
          id: row.id,
          email: row.email,
          role: row.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // ⭐ Return both user and token
      res.json({
        user: row,
        token
      });
    }
  );
});

/*----------------- CHANGE PASSWORD --------------*/

app.post("/user/change-password", authMiddleware, async (req, res) => {
  console.log("CHANGE PASSWORD HIT, req.user =", req.user);

  const userId = req.user.id;  // ⭐ This will now work
  const { old_password, new_password } = req.body;

  try {
    const user = await db.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const correct = user.password === old_password; // or bcrypt compare
    if (!correct) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    await db.updateUserPassword(userId, new_password);
    res.json({ success: true });

  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ error: "Server error updating password" });
  }
});

/* ---------------- PRACTITIONERS LIST ---------------- */

app.get("/api/practitioners", (req, res) => {
  db.all(
    "select id, name, email, role from users order by name",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* ---------------- CREATE USER ---------------- */

app.post("/api/users", (req, res) => {
  const { name, email, password, role } = req.body;

  db.run(
    "insert into users (name, email, password, role) values (?, ?, ?, ?)",
    [name, email, password, role],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

/* ---------------- DELETE USER ---------------- */

app.delete("/api/users/:id", (req, res) => {
  db.run("delete from users where id = ?", [req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ success: true });
  });
});

/* ---------------- CHANGE USER ROLE ---------------- */

app.post("/api/users/:id/role", (req, res) => {
  const { role } = req.body;

  db.run(
    "update users set role = ? where id = ?",
    [role, req.params.id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

/* ---------------- VISITS ---------------- */

app.get("/api/visits", (req, res) => {
  const { userId, date } = req.query;

  db.all(
    "select * from visits where user_id = ? and date = ? order by start_time",
    [userId, date],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post("/api/visits", (req, res) => {
  const {
    userId,
    date,
    type,
    initials,
    start_time,
    end_time,
    high_risk
  } = req.body;

  db.run(
    `insert into visits
      (user_id, date, type, initials, start_time, end_time, high_risk, safe)
     values (?, ?, ?, ?, ?, ?, ?, 0)`,
    [userId, date, type, initials, start_time, end_time, high_risk ? 1 : 0],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.post("/api/visits/:id/checkin", (req, res) => {
  db.run(
    "update visits set safe = 1 where id = ?",
    [req.params.id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete("/api/visits/:id", (req, res) => {
  db.run("delete from visits where id = ?", [req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ success: true });
  });
});

/* ---------------- DUTY ---------------- */

app.post("/api/duty/assign", (req, res) => {
  const { date, practitionerIds } = req.body;

  db.serialize(() => {
    db.run("delete from duty_assignments where date = ?", [date]);

    const stmt = db.prepare(
      "insert into duty_assignments (date, practitioner_id) values (?, ?)"
    );

    practitionerIds.forEach((id) => {
      stmt.run(date, id);
    });

    stmt.finalize((err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

app.get("/api/duty/visits", (req, res) => {
  const { date } = req.query;

  const sql = `
    select v.*, u.name as practitioner_name
    from visits v
    join duty_assignments d on d.practitioner_id = v.user_id and d.date = v.date
    join users u on u.id = v.user_id
    where v.date = ?
    order by v.start_time
  `;

  db.all(sql, [date], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/* ---------------- START SERVER ---------------- */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});