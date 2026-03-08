/* ---------------------------------------------------------
   SHARED APP UTILITIES
   Used by practitioner, duty, manager, and menu pages
--------------------------------------------------------- */

/* ---------------- USER HELPERS ---------------- */

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function requireUser() {
  const u = getUser();
  if (!u) {
    window.location.href = "index.html";
  }
  return u;
}

/* ---------------- API HELPERS ---------------- */

async function apiGet(url, params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api${url}?${query}`);
  if (!res.ok) throw new Error("API GET failed");
  return res.json();
}

async function apiPost(url, body = {}) {
  const res = await fetch(`/api${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error("API POST failed");
  return res.json();
}

/* ---------------- VISIT STATUS COLOUR LOGIC ---------------- */

function getStatusColourClass(v) {
  // No check-in yet
  if (!v.safe) {
    // High risk
    if (v.high_risk) return "visit-red";

    // Overdue?
    const now = new Date();
    const end = new Date(`${v.date}T${v.end_time}`);
    if (now > end) return "visit-orange";

    // Upcoming or in progress
    return "visit-blue";
  }

  // Safe
  return "visit-green";
}