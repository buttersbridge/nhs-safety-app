console.log("Loaded duty.js version 4");

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

/* ---------------- LOAD DUTY VISITS ---------------- */

async function loadDutyVisits() {
  const date = dutyDate.value;
  const visits = await apiGet("/duty/visits", { date });

  // Hours from 08:00 to 20:00
  const hours = [];
  for (let h = 8; h <= 20; h++) {
    hours.push(h.toString().padStart(2, "0") + ":00");
  }

  dutyGrid.innerHTML = "";

  hours.forEach(hour => {
    const hourBlock = document.createElement("div");
    hourBlock.className = "hour-block";

    const header = document.createElement("div");
    header.className = "hour-header";
    header.textContent = hour;
    hourBlock.appendChild(header);

    // Visits overlapping this hour
    const matching = visits.filter(v => {
      return v.start_time <= hour && v.end_time > hour;
    });

    const list = document.createElement("div");
    list.className = "hour-visits";

    matching.forEach(v => {
      const card = document.createElement("div");
      card.className = "visit-item " + getStatusColourClass(v);

      card.innerHTML = `
        <div class="visit-header">
          <span class="visit-type">${v.practitioner_name}</span>
        </div>
        <div class="visit-time">${v.type} (${v.initials || ""})</div>
        <div class="visit-time">${v.start_time}–${v.end_time}</div>
      `;

      list.appendChild(card);
    });

    hourBlock.appendChild(list);
    dutyGrid.appendChild(hourBlock);
  });
}

/* ---------------- EVENT LISTENERS ---------------- */

dutyDate.addEventListener("change", loadDutyVisits);

/* ---------------- INITIAL LOAD ---------------- */

loadDutyVisits();

// Auto‑refresh every 30 seconds
setInterval(loadDutyVisits, 30000);