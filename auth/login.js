(function () {
  "use strict";
  const form = document.querySelector("form");
  const status = document.createElement("p");
  status.setAttribute("role", "alert");
  status.style.marginTop = "12px";
  status.style.color = "#b83b37";
  form.appendChild(status);
  const redirect = new URLSearchParams(location.search).get("next");
  const destination =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : "../index1.html";
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    try {
      await loginUser(
        document.getElementById("email").value,
        document.getElementById("password").value,
      );
      location.href = destination;
    } catch (err) {
      status.textContent = err.message;
    }
  });
  document.querySelector(".btn-register").addEventListener("click", (e) => {
    e.preventDefault();
    location.href =
      "register.html" +
      (redirect ? "?next=" + encodeURIComponent(redirect) : "");
  });
  document.querySelector(".btn-forgot-pass").addEventListener("click", (e) => {
    e.preventDefault();
    location.href = "forgot.html";
  });

  // Toggle password visibility using the project's original eye PNG assets.
  function setupPasswordEye(inputId, imageId) {
    const input = document.getElementById(inputId);
    const img = document.getElementById(imageId);
    const button = img?.closest(".password-eye-button");
    if (!input || !img || !button) return;
    button.addEventListener("click", () => {
      const visible = input.type === "password";
      input.type = visible ? "text" : "password";
      img.src = visible ? "../sources/eye-open.png" : "../sources/eye-close.png";
      button.setAttribute("aria-label", visible ? "Ẩn mật khẩu" : "Hiện mật khẩu");
      button.setAttribute("aria-pressed", String(visible));
    });
  }
  setupPasswordEye("password", "eyeicon");
})();
