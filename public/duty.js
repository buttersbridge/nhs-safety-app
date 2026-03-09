console.log("Loaded duty.js version 7 (multi-column + red line)");

const userDuty = requireUser();

const dutyDate = document.getElementById("dutyDate");
const dutyColumns = document.getElementById("dutyColumns");
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

/* ---------------- RENDER MULTI‑COLUMN DUTY VIEW ---------------- */

function renderDutyColumns(visits) {
  dutyColumns.innerHTML = "";

  const groups = {};
  visits.forEach(v => {
    if (!groups[v.practitioner_name]) groups[v.practitioner_name] = [];
    groups[v.practitioner_name].push(v);
  });

  const dayStart = 8 * 60;
  const dayEnd = 20 * 60;
  const totalMinutes = dayEnd - dayStart;
  const timelineHeight = 1200;

  Object.keys(groups).forEach(name => {
    const col = document.createElement("div");
    col.className = "practitioner-column";

    const header = document.createElement("div");
    header.className = "practitioner-header";
    header.textContent = name;
    col.appendChild(header);

    groups[name].forEach(v => {
      const start = timeToMinutes(v.start_time);
      const end = timeToMinutes(v.end_time);

      const top = ((start - dayStart) / totalMinutes) * timelineHeight;
      const height = ((end - start) / totalMinutes) * timelineHeight;

      const div = document.createElement("div");
      div.className = "timeline-visit " + getStatusColourClass(v);
      div.style.top = `${top}px`;
      div.style.height = `${height}px`;

      div.textContent = v.initials || "??";

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

/* ---------------- RED CURRENT TIME LINE ---------------- */

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
  nowLine.style.top = `${top + 140}px`; /* adjust for header height */
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