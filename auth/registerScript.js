(function () {
  "use strict";
  for (const [id, max, min] of [
    ["day-select", 31, 1],
    ["month-select", 12, 1],
  ]) {
    const el = document.getElementById(id);
    for (let i = min; i <= max; i++) el.add(new Option(i, i));
  }
  const y = document.getElementById("year-select");
  for (let i = new Date().getFullYear(); i >= 1900; i--)
    y.add(new Option(i, i));
  const form = document.querySelector("form");
  const status = document.createElement("p");
  status.style.color = "#b83b37";
  status.style.marginTop = "12px";
  status.setAttribute("role", "alert");
  form.appendChild(status);
  const next = new URLSearchParams(location.search).get("next");
  const dest =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "../index1.html";
  document.querySelector(".btn-already-have").addEventListener("click", (e) => {
    e.preventDefault();
    location.href =
      "login.html" + (next ? "?next=" + encodeURIComponent(next) : "");
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    form.classList.add("was-validated");
    if (!form.checkValidity()) return;
    const password = document.getElementById("password").value;
    if (password !== document.getElementById("confirm_password").value) {
      status.textContent = "Mật khẩu xác nhận không khớp.";
      return;
    }
    const day = Number(document.getElementById("day-select").value),
      month = Number(document.getElementById("month-select").value),
      year = Number(y.value);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      status.textContent = "Ngày sinh không hợp lệ.";
      return;
    }
    try {
      await registerUser({
        fullName: (
          document.getElementById("text_ho").value +
          " " +
          document.getElementById("text_ten").value
        ).trim(),
        email: document.getElementById("email").value,
        phone: document.getElementById("text").value,
        birthday: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        password,
      });
      location.href = dest;
    } catch (err) {
      status.textContent = err.message;
    }
  });
})();
