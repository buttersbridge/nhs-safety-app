console.log("Loaded duty.js version 6 (timeline + now-line + overlap)");

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
const dutyGrid = document.getElementById("dutyGrid");

/* ---------------- INITIAL DATE ---------------- */

dutyDate.value = new Date().toISOString().slice(0, 10);

/*----------------- GET COLOURS--------------- */

function getStatusColourClass(v) {
  const now = new Date();
  const start = new Date(`${v.date}T${v.start_time}`);
  const end = new Date(`${v.date}T${v.end_time}`);

  if (v.safe === 1) return "visit-green";
  if (now >= start && now <= end) return "visit-blue";

  if (now > end) {
    const minutesOverdue = Math.floor((now - end) / 60000);
    if (minutesOverdue >= 30) {
      return v.high_risk === 1 ? "visit-red-highrisk" : "visit-red";
    }
    return "visit-orange";
  }

  return "visit-grey";
}

/* ---------------- TIMELINE HELPERS ---------------- */

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/* ---------------- OVERLAP STACKING ---------------- */

function assignOverlapColumns(visits) {
  visits.sort((a, b) => a.start_minutes - b.start_minutes);

  let columns = [];

  visits.forEach(v => {
    let placed = false;

    for (let i = 0; i < columns.length; i++) {
      const last = columns[i][columns[i].length - 1];
      if (v.start_minutes >= last.end_minutes) {
        columns[i].push(v);
        v.column = i;
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push([v]);
      v.column = columns.length - 1;
    }
  });

  return columns.length; // number of columns needed
}

/* ---------------- RENDER TIMELINE ---------------- */

function renderTimeline(visits) {
  dutyGrid.innerHTML = "";

  const dayStart = 8 * 60;
  const dayEnd = 20 * 60;
  const totalMinutes = dayEnd - dayStart;
  const timelineHeight = 1200;

  dutyGrid.style.position = "relative";
  dutyGrid.style.minHeight = timelineHeight + "px";

  // Pre-calc minutes
  visits.forEach(v => {
    v.start_minutes = timeToMinutes(v.start_time);
    v.end_minutes = timeToMinutes(v.end_time);
  });

  // Assign overlap columns
  const totalColumns = assignOverlapColumns(visits);

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

  /* ---- Current Time Line ---- */
  const today = new Date().toISOString().slice(0, 10);
  if (dutyDate.value === today) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (nowMinutes >= dayStart && nowMinutes <= dayEnd) {
      const top = ((nowMinutes - dayStart) / totalMinutes) * timelineHeight;

      const nowLine = document.createElement("div");
      nowLine.className = "timeline-now-line";
      nowLine.style.top = `${top}px`;

      dutyGrid.appendChild(nowLine);
    }
  }

/* ---- Visits ---- */
visits.forEach(v => {
  const top = ((v.start_minutes - dayStart) / totalMinutes) * timelineHeight;
  const height = ((v.end_minutes - v.start_minutes) / totalMinutes) * timelineHeight;

  const div = document.createElement("div");
  div.className = "timeline-visit " + getStatusColourClass(v);

  const widthPercent = 100 / totalColumns;
  div.style.width = `calc(${widthPercent}% - 6px)`;
  div.style.left = `calc(${v.column * widthPercent}% + 20px)`;

  div.style.top = `${top}px`;
  div.style.height = `${height}px`;

  // Only show practitioner name
  div.innerHTML = `<strong>${v.practitioner_name}</strong>`;

  // Show full details on click
  div.onclick = () => {
    alert(
      `${v.practitioner_name}\n` +
      `${v.type} (${v.initials || ""})\n` +
      `${v.start_time}–${v.end_time}\n\n` +
      `Status: ${getStatusColourClass(v).replace("visit-", "")}`
    );
  };

  dutyGrid.appendChild(div);
});

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
setInterval(loadDutyVisits, 30000);