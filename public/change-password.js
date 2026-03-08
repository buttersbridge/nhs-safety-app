const user = requireUser();

document.getElementById("menuBtn").onclick = () => {
  window.location.href = "menu.html";
};

document.getElementById("saveBtn").onclick = async () => {
  const oldPassword = document.getElementById("oldPassword").value;
  const newPassword = document.getElementById("newPassword").value;

  const msg = document.getElementById("msg");
  msg.textContent = "";
  msg.style.color = "";

  try {
    const res = await apiPost("/api/change-password", {
      userId: user.id,
      oldPassword,
      newPassword
    });

    msg.textContent = "Password updated successfully.";
    msg.style.color = "green";

  } catch (err) {
    msg.textContent = "Error: " + err.message;
    msg.style.color = "red";
  }
};