// Only managers should access this page
const manager = requireUser();

/* ---------------- PERMISSION CHECK ---------------- */

if (manager.role !== "manager") {
  alert("Current user doesn't have these permissions");
  window.location.href = "menu.html";
}

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
  if (manager.role !== "manager") {
    alert("Current user doesn't have these permissions");
    return;
  }
  window.location.href = "manager.html";
};

/* ---------------- ELEMENTS ---------------- */

const dateInput = document.getElementById("dutyAssignDate");
const practitionerListDiv = document.getElementById("practitionerList");
const saveDutyBtn = document.getElementById("saveDutyBtn");

/* ---------------- INITIAL DATE ---------------- */

dateInput.value = new Date().toISOString().slice(0, 10);

/* ---------------- STATE ---------------- */

let practitioners = [];
let selectedIds = new Set();

/* ---------------- LOAD PRACTITIONERS ---------------- */

async function loadPractitioners() {
  practitioners = await apiGet("/api/practitioners");
  practitionerListDiv.innerHTML = "";

  practitioners.forEach((p) => {
    const label = document.createElement("label");
    label.style.display = "block";
    label.style.marginBottom = "6px";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.style.marginRight = "6px";

    cb.onchange = () => {
      if (cb.checked) selectedIds.add(p.id);
      else selectedIds.delete(p.id);
    };

    label.appendChild(cb);
    label.appendChild(document.createTextNode(`${p.name} (${p.email})`));

    practitionerListDiv.appendChild(label);
  });
}



/* ---------------- INITIAL LOAD ---------------- */

loadPractitioners();