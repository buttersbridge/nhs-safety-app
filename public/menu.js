const user = requireUser();

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
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

document.getElementById("changePasswordBtn").onclick = () => {
  window.location.href = "change-password.html";
};