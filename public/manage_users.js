// Manager-only practitioner management
const manager = requireUser();

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
  window.location.href = "manager.html";
};

/* ---------------- ELEMENTS ---------------- */

const practitionerList = document.getElementById("practitionerList");
const addUserForm = document.getElementById("addUserForm");

/* ---------------- LOAD PRACTITIONERS ---------------- */

async function loadPractitioners() {
  const users = await apiGet("/api/practitioners");
  practitionerList.innerHTML = "";

  users.forEach((u) => {
    const row = document.createElement("div");
    row.className = "practitioner-row";

    const label = document.createElement("span");
    label.textContent = `${u.name} (${u.email})`;

    /* Promote button */
    const promoteBtn = document.createElement("button");
    promoteBtn.className = "promote-btn";
    promoteBtn.textContent = "Make Manager";

    promoteBtn.onclick = async () => {
      if (confirm(`Promote ${u.name} to manager?`)) {
        await apiPost(`/users/${u.id}/role`, { role: "manager" });
        loadPractitioners();
      }
    };

    /* Hide promote button if already manager */
    if (u.role === "manager") {
      promoteBtn.style.display = "none";
    }

    /* Delete button */
    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "Delete";

    delBtn.onclick = async () => {
      if (confirm("Delete this practitioner?")) {
        await fetch(`/api/users/${u.id}`, { method: "DELETE" });
        loadPractitioners();
      }
    };

    row.appendChild(label);
    row.appendChild(promoteBtn);
    row.appendChild(delBtn);
    practitionerList.appendChild(row);
  });
}

/* ---------------- ADD PRACTITIONER ---------------- */

addUserForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    name: document.getElementById("newName").value,
    email: document.getElementById("newEmail").value,
    password: document.getElementById("newPassword").value,
    role: "practitioner"
  };

  await apiPost("/users", body);
  addUserForm.reset();
  loadPractitioners();
});

/* ---------------- INITIAL LOAD ---------------- */

loadPractitioners();