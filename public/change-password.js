const user = requireUser();

document.getElementById("menuBtn").onclick = () => {
  window.location.href = "menu.html";
};

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
};

document.getElementById("savePasswordBtn").onclick = async () => {
  const oldPw = document.getElementById("oldPassword").value.trim();
  const newPw = document.getElementById("newPassword").value.trim();
  const confirmPw = document.getElementById("confirmPassword").value.trim();

  if (!oldPw || !newPw || !confirmPw) {
    alert("Please fill in all fields");
    return;
  }

  if (newPw !== confirmPw) {
    alert("New passwords do not match");
    return;
  }

  const result = await apiPost("/user/change-password", {
    old_password: oldPw,
    new_password: newPw
  });

  if (result.error) {
    alert(result.error);
    return;
  }

  alert("Password updated successfully");
  window.location.href = "menu.html";
};