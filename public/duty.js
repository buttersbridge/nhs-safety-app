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