// Allow both practitioners and managers to use this diary
const user = requireUser();

const dateInput = document.getElementById("visitDate");
const visitList = document.getElementById("visitList");
const addVisitForm = document.getElementById("addVisitForm");

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
  if (user.role !== "manager") {
    alert("Current user doesn't have these permissions");
    return;
  }
  window.location.href = "manager.html";
};

/* ---------------- INITIAL DATE ---------------- */

dateInput.value = new Date().toISOString().slice(0, 10);

/* ---------------- LOAD VISITS ---------------- */

async function loadVisits() {
  const date = dateInput.value;
  const visits = await apiGet("/visits", { userId: user.id, date });

  visitList.innerHTML = "";

  visits.forEach((v) => {
    const li = document.createElement("li");
    li.className = "visit-item " + getStatusColourClass(v);

    li.innerHTML = `
      <div class="visit-header">
        <span class="visit-type">${v.type}</span>
        <span class="visit-initials">${v.initials || ""}</span>
      </div>
      <div class="visit-time">${v.start_time}–${v.end_time}</div>
    `;

    /* ---- CHECK-IN SAFE BUTTON ---- */
    if (!v.safe) {
      const btn = document.createElement("button");
      btn.textContent = "Check in safe";
      btn.className = "btn btn-primary";
      btn.onclick = async () => {
        await apiPost(`/api/visits/${v.id}/checkin`, {});
        loadVisits();
      };
      li.appendChild(btn);
    }

    /* ---- DELETE BUTTON ---- */
    const del = document.createElement("button");
    del.textContent = "Delete";
    del.className = "btn btn-outline";
    del.onclick = async () => {
      if (confirm("Delete this visit?")) {
        await fetch(`/api/visits/${v.id}`, { method: "DELETE" });
        loadVisits();
      }
    };
    li.appendChild(del);

    visitList.appendChild(li);
  });
}

dateInput.addEventListener("change", loadVisits);

/* ---------------- ADD VISIT ---------------- */

addVisitForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    userId: user.id,
    date: dateInput.value,
    type: document.getElementById("visitType").value,
    initials: document.getElementById("initials").value,
    start_time: document.getElementById("startTime").value,
    end_time: document.getElementById("endTime").value,
    high_risk: document.getElementById("highRisk").checked
  };

  await apiPost("/visits", body);
  addVisitForm.reset();
  loadVisits();
});

/* ---------------- INITIAL LOAD ---------------- */

loadVisits();