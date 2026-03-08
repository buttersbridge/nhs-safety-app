const user = requireUser();

/* NAVIGATION */
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
  window.location.href = "manager.html";
};

const visitList = document.getElementById("visitList");

/* LOAD DUTY VISITS */
async function loadVisits() {
  const today = new Date().toISOString().split("T")[0];
  const visits = await apiGet(`/duty/visits?date=${today}`);

  visitList.innerHTML = "";

  visits.forEach(v => {
    const row = document.createElement("div");
    row.classList.add("visit-row");

    const now = new Date();
    const start = new Date(`${v.date}T${v.start_time}`);
    const end = new Date(`${v.date}T${v.end_time}`);

    // SAFE
    if (v.safe === 1) {
      row.classList.add("visit-safe");

    // CURRENT
    } else if (now >= start && now <= end) {
      row.classList.add("visit-current");

    // OVERDUE
    } else if (now > end) {
      const minutesOverdue = Math.floor((now - end) / 60000);

      if (minutesOverdue >= 30) {
        if (v.high_risk === 1) {
          row.classList.add("visit-critical-highrisk"); // blinking red
        } else {
          row.classList.add("visit-critical"); // solid red
        }
      } else {
        row.classList.add("visit-overdue"); // orange
      }
    }

    row.innerHTML = `
      <div class="visit-info">
        <strong>${v.initials}</strong> — ${v.type}<br>
        ${v.start_time} → ${v.end_time}<br>
        Practitioner: ${v.practitioner_name}
      </div>
    `;

    visitList.appendChild(row);
  });
}

loadVisits();
setInterval(loadVisits, 30000); // refresh every 30 seconds