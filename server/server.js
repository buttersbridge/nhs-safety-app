const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

/* ---------------- LOGIN ---------------- */

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "select id, email, name, role from users where email = ? and password = ?",
    [email, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: "Invalid credentials" });
      res.json(row);
    }
  );
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

app.get("/visits", (req, res) => {
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

app.post("/visits", (req, res) => {
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

/* ---------------- CHANGE PASSWORD (JWT-free) ---------------- */

app.post("/api/change-password", (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;

  // 1. Verify user exists and old password matches
  db.get(
    "select id from users where id = ? and password = ?",
    [userId, oldPassword],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      if (!row) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // 2. Update password
      db.run(
        "update users set password = ? where id = ?",
        [newPassword, userId],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ success: true });
        }
      );
    }
  );
});

/* ---------------- STATIC FILES (MUST BE LAST) ---------------- */

app.use(express.static(path.join(__dirname, "..", "public")));

/* ---------------- START SERVER ---------------- */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});