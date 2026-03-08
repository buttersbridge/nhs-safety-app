console.log("Loaded duty.js version 5 (timeline)");

const userDuty = requireUser();

/* ---------------- NAVIGATION BUTTONS ---------------- */

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
};

document.getElementById("menuBtn").onclick = () => {
  window.location.href = "menu.html";
};

document.getElementById("dutyBtn").onclick = () => {
  window.location.href = "duty.html";
};

document.getElementById("managerBtn").onclick = () => {
  if (userDuty.role !== "manager") {
    alert("Current user doesn't have these permissions");
    return;
  }
  window.location.href = "manager.html";
};

/* ---------------- ELEMENTS ---------------- */

const dutyDate = document.getElementById("dutyDate");
const dutyGrid = document.getElementById("dutyGrid"); // now used as timeline container

/* ---------------- INITIAL DATE ---------------- */

dutyDate.value = new Date().toISOString().slice(0, 10);

/*----------------- GET COLOURS--------------- */

function getStatusColourClass(v) {
  const now = new Date();
  const start = new Date(`${v.date}T${v.start_time}`);
  const end = new Date(`${v.date}T${v.end_time}`);

  // SAFE
  if (v.safe === 1) {
    return "visit-green";
  }

  // CURRENT
  if (now >= start && now <= end) {
    return "visit-blue";
  }

  // OVERDUE
  if (now > end) {
    const minutesOverdue = Math.floor((now - end) / 60000);

    if (minutesOverdue >= 30) {
      if (v.high_risk === 1) {
        return "visit-red-highrisk"; // blinking red
      }
      return "visit-red"; // solid red
    }

    return "visit-orange"; // < 30 mins overdue
  }

  // Default (future or unknown)
  return "visit-grey";
}

/* ---------------- TIMELINE HELPERS ---------------- */

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/* ---------------- RENDER TIMELINE ---------------- */

function renderTimeline(visits) {
  dutyGrid.innerHTML = ""; // clear old content

  const dayStart = 8 * 60;   // 08:00
  const dayEnd = 20 * 60;    // 20:00
  const totalMinutes = dayEnd - dayStart;
  const timelineHeight = 1200; // px height for full day

  dutyGrid.style.position = "relative";
  dutyGrid.style.minHeight = timelineHeight + "px";

  /* ---- Hour Labels ---- */
  for (let h = 8; h <= 20; h++) {
    const minutes = h * 60;
    const top = ((minutes - dayStart) / totalMinutes) * timelineHeight;

    const label = document.createElement("div");
    label.className = "timeline-time-label";
    label.style.top = `${top}px`;
    label.textContent = `${String(h).padStart(2, "0")}:00`;

    dutyGrid.appendChild(label);
  }

  /* ---- Visits ---- */
  visits.forEach(v => {
    const start = timeToMinutes(v.start_time);
    const end = timeToMinutes(v.end_time);

    const top = ((start - dayStart) / totalMinutes) * timelineHeight;
    const height = ((end - start) / totalMinutes) * timelineHeight;

    const div = document.createElement("div");
    div.className = "timeline-visit " + getStatusColourClass(v);
    div.style.top = `${top}px`;
    div.style.height = `${height}px`;

    div.innerHTML = `
      <strong>${v.practitioner_name}</strong><br>
      ${v.type} (${v.initials || ""})<br>
      ${v.start_time}–${v.end_time}
    `;

    dutyGrid.appendChild(div);
  });
}

/* ---------------- LOAD DUTY VISITS ---------------- */

async function loadDutyVisits() {
  const date = dutyDate.value;

  try {
    const visits = await apiGet("/api/duty/visits", { date });
    renderTimeline(visits);
  } catch (err) {
    console.error("Failed to load duty visits:", err);
  }
}

/* ---------------- EVENT LISTENERS ---------------- */

dutyDate.addEventListener("change", loadDutyVisits);

/* ---------------- INITIAL LOAD ---------------- */

loadDutyVisits();

// Auto‑refresh every 30 seconds
setInterval(loadDutyVisits, 30000);