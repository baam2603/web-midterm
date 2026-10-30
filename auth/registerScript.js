
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const form = document.querySelector("form");
  const daySelect = $("day-select");
  const monthSelect = $("month-select");
  const yearSelect = $("year-select");

  if (!form || !daySelect || !monthSelect || !yearSelect) {
    console.error("Không tìm thấy form hoặc các ô ngày sinh.");
    return;
  }

  // ==============================
  // 1. KHỞI TẠO NGÀY THÁNG NĂM
  // ==============================

  function initDateSelects() {
    for (let day = 1; day <= 31; day++) {
      daySelect.add(new Option(day, day));
    }

    for (let month = 1; month <= 12; month++) {
      monthSelect.add(new Option(month, month));
    }

    const currentYear = new Date().getFullYear();

    for (let year = currentYear; year >= 1900; year--) {
      yearSelect.add(new Option(year, year));
    }
  }

  initDateSelects();

  // ==============================
  // 2. THÔNG BÁO TRẠNG THÁI
  // ==============================

  const status = document.createElement("p");
  status.style.color = "#b83b37";
  status.style.marginTop = "12px";
  status.setAttribute("role", "alert");

  form.appendChild(status);

  function showError(message) {
    status.style.color = "#b83b37";
    status.textContent = message;
  }

  // ==============================
  // 3. CHUYỂN TRANG
  // ==============================

  const next = new URLSearchParams(location.search).get("next");

  const dest =
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
      ? next
      : "../index1.html";

  const alreadyHaveBtn = document.querySelector(
    ".btn-already-have"
  );

  if (alreadyHaveBtn) {
    alreadyHaveBtn.addEventListener("click", (e) => {
      e.preventDefault();

      location.href =
        "login.html" +
        (next ? "?next=" + encodeURIComponent(next) : "");
    });
  }

  // ==============================
  // 4. LẤY NGÀY SINH
  // ==============================

  function getBirthday() {
    const day = Number(daySelect.value);
    const month = Number(monthSelect.value);
    const year = Number(yearSelect.value);

    if (!day || !month || !year) {
      throw new Error("Vui lòng chọn đầy đủ ngày sinh.");
    }

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new Error("Ngày sinh không hợp lệ.");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date > today) {
      throw new Error("Ngày sinh không được lớn hơn ngày hiện tại.");
    }

    return (
      String(year).padStart(4, "0") +
      "-" +
      String(month).padStart(2, "0") +
      "-" +
      String(day).padStart(2, "0")
    );
  }

  // ==============================
  // 5. XỬ LÝ ĐĂNG KÝ
  // ==============================

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    status.textContent = "";
    form.classList.add("was-validated");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const password = $("password").value;
    const confirmPassword = $("confirm_password").value;

    if (password !== confirmPassword) {
      showError("Mật khẩu xác nhận không khớp.");
      return;
    }

    const submitBtn = form.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    try {
      if (typeof window.registerUser !== "function") {
        throw new Error(
          "Không tìm thấy hàm registerUser. Kiểm tra auth-service.js."
        );
      }

      const birthday = getBirthday();

      const fullName = (
        $("text_ho").value.trim() +
        " " +
        $("text_ten").value.trim()
      ).trim();

      const payload = {
        fullName,
        email: $("email").value.trim(),
        phone: $("text").value.trim(),
        birthday,
        password
      };

      if (submitBtn) submitBtn.disabled = true;

      await window.registerUser(payload);

      location.href = dest;
    } catch (err) {
      showError(
        err.message || "Đăng ký thất bại. Vui lòng thử lại."
      );
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();
