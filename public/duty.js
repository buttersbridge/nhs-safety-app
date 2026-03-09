console.log("Loaded duty.js version 8 (multi-column + colours + smart details)");

const userDuty = requireUser();

const dutyDate = document.getElementById("dutyDate");
const dutyColumns = document.getElementById("dutyColumns");
const timeColumn = document.getElementById("timeColumn");
const nowLine = document.getElementById("nowLine");

dutyDate.value = new Date().toISOString().slice(0, 10);

/* ---------------- STATUS COLOURS ---------------- */

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

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/* ---------------- TIME COLUMN ---------------- */

function renderTimeColumn() {
  timeColumn.innerHTML = "";

  const dayStart = 8 * 60;
  const dayEnd = 20 * 60;
  const totalMinutes = dayEnd - dayStart;
  const timelineHeight = 1200;

  for (let h = 8; h <= 20; h++) {
    const minutes = h * 60;
    const top = ((minutes - dayStart) / totalMinutes) * timelineHeight;

    const label = document.createElement("div");
    label.className = "time-label";
    label.style.top = `${top + 32}px`;
    label.textContent = `${String(h).padStart(2, "0")}:00`;

    timeColumn.appendChild(label);
  }
}

/* ---------------- DUTY COLUMNS ---------------- */

function renderDutyColumns(visits) {
  dutyColumns.innerHTML = "";
  renderTimeColumn();

  // Group visits by practitioner
  const groups = {};
  visits.forEach(v => {
    if (!groups[v.practitioner_name]) groups[v.practitioner_name] = [];
    groups[v.practitioner_name].push(v);
  });

  // Assign each practitioner a stable colour index
  const practitionerNames = Object.keys(groups);
  const colourMap = {};
  practitionerNames.forEach((name, index) => {
    colourMap[name] = index % 8; // cycle through 8 colours
  });

  const dayStart = 8 * 60;
  const dayEnd = 20 * 60;
  const totalMinutes = dayEnd - dayStart;
  const timelineHeight = 1200;

  practitionerNames.forEach(name => {
    const colourIndex = colourMap[name];

    const col = document.createElement("div");
    col.className = `practitioner-column practitioner-colour-${colourIndex}`;

    const header = document.createElement("div");
    header.className = `practitioner-header practitioner-header-colour-${colourIndex}`;
    header.textContent = name;
    col.appendChild(header);

    groups[name].forEach(v => {
      const start = timeToMinutes(v.start_time);
      const end = timeToMinutes(v.end_time);

      const top = ((start - dayStart) / totalMinutes) * timelineHeight;
      const height = ((end - start) / totalMinutes) * timelineHeight;

      const div = document.createElement("div");
      div.className = "timeline-visit " + getStatusColourClass(v);
      div.style.top = `${top + 32}px`;
      div.style.height = `${height}px`;

      /* SMART DETAIL LOGIC */
      if (height > 60) {
        div.innerHTML = `
          <strong>${v.initials}</strong><br>
          ${v.type}<br>
          ${v.start_time}–${v.end_time}
        `;
      } else {
        div.innerHTML = `
          <strong>${v.initials}</strong> – ${v.type}
        `;
      }

      div.onclick = () => {
        alert(
          `Patient: ${v.initials}\n` +
          `Type: ${v.type}\n` +
          `Time: ${v.start_time}–${v.end_time}\n` +
          `Practitioner: ${name}`
        );
      };

      col.appendChild(div);
    });

    dutyColumns.appendChild(col);
  });

  renderNowLine();
}

/* ---------------- RED NOW LINE ---------------- */

function renderNowLine() {
  const today = new Date().toISOString().slice(0, 10);
  if (dutyDate.value !== today) {
    nowLine.style.display = "none";
    return;
  }

  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();

  const dayStart = 8 * 60;
  const dayEnd = 20 * 60;
  if (minutes < dayStart || minutes > dayEnd) {
    nowLine.style.display = "none";
    return;
  }

  const timelineHeight = 1200;
  const totalMinutes = dayEnd - dayStart;
  const top = ((minutes - dayStart) / totalMinutes) * timelineHeight;

  nowLine.style.display = "block";
  nowLine.style.top = `${top + 32}px`;
}

/* ---------------- LOAD VISITS ---------------- */

async function loadDutyVisits() {
  const date = dutyDate.value;
  const visits = await apiGet("/api/duty/visits", { date });
  renderDutyColumns(visits);
}

dutyDate.addEventListener("change", loadDutyVisits);
loadDutyVisits();
setInterval(loadDutyVisits, 30000);