
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

  const dest = (() => {
    const home = new URL("../index1.html", location.href);
    if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return home.href;
    const target = new URL(next, location.origin);
    const root = new URL("../", location.href);
    const admin = new URL("../admin/", location.href);
    return target.origin === location.origin && target.pathname.startsWith(root.pathname) && !target.pathname.startsWith(admin.pathname)
      ? target.href : home.href;
  })();

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

      registrationStarted = true;
      const result = await window.registerUser(payload);
      showOtp(result.challenge);
      $("password").value = "";
      $("confirm_password").value = "";
    } catch (err) {
      showError(
        err.message || "Đăng ký thất bại. Vui lòng thử lại."
      );
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  const dialog = $("registration-otp-dialog");
  const otpForm = $("registration-otp-form"), code = $("registration-otp-code");
  const feedback = $("registration-otp-feedback"), verify = $("registration-otp-verify");
  const resend = $("registration-otp-resend"), closeOtp = $("registration-otp-close");
  let challenge = null, expiresAt = 0, resendAt = 0, otpBusy = false, registrationStarted = false, locked = false;

  function updateOtpClock() {
    if (!challenge) return;
    const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    const cooldown = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
    $("registration-otp-timer").textContent = remaining
      ? `Mã còn hiệu lực ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}.`
      : "Mã đã hết hạn. Vui lòng gửi lại mã.";
    verify.disabled = otpBusy || locked || !remaining;
    resend.disabled = otpBusy || locked || cooldown > 0;
    resend.textContent = cooldown ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã";
    closeOtp.disabled = otpBusy;
  }
  function showOtp(value) {
    if (!value?.id) throw Error("Không nhận được phiên xác minh. Vui lòng thử lại.");
    challenge = value;
    expiresAt = Date.now() + value.expiresIn * 1000;
    resendAt = Date.now() + value.retryAfter * 1000;
    locked = false;
    $("registration-otp-email").textContent = value.email;
    code.value = ""; feedback.textContent = "";
    updateOtpClock();
    if (!dialog.open) dialog.showModal();
    code.focus();
  }
  function otpError(error) {
    feedback.textContent = error.message || "Không thực hiện được yêu cầu.";
    if (error.retryAfter) resendAt = Date.now() + error.retryAfter * 1000;
    if (["otp_locked", "registration_expired", "registration_session"].includes(error.code)) locked = true;
  }
  otpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (otpBusy || locked || !challenge || !otpForm.reportValidity()) return;
    otpBusy = true; feedback.textContent = "Đang xác minh..."; updateOtpClock();
    try {
      await window.verifyRegistration(challenge.id, code.value);
      location.replace(dest);
    } catch (error) { otpError(error); }
    finally { otpBusy = false; updateOtpClock(); }
  });
  resend.addEventListener("click", async () => {
    if (otpBusy || locked || !challenge) return;
    otpBusy = true; updateOtpClock();
    try {
      const result = await window.resendRegistration(challenge.id);
      showOtp(result.challenge);
      feedback.textContent = "Mã mới đang được gửi. Chỉ dùng mã mới nhất.";
    } catch (error) { otpError(error); }
    finally { otpBusy = false; updateOtpClock(); }
  });
  closeOtp.addEventListener("click", () => {
    if (!otpBusy) {
      dialog.close();
      showError("Chưa hoàn tất đăng ký. Hãy nhập lại thông tin nếu muốn đăng ký lại; mã mới chỉ được gửi sau thời gian chờ.");
      $("email").focus();
    }
  });
  dialog.addEventListener("cancel", (event) => { if (otpBusy) event.preventDefault(); });
  code.addEventListener("input", () => { code.value = code.value.replace(/[^0-9]/g, "").slice(0, 6); });
  setInterval(updateOtpClock, 1000);
  window.getRegistrationStatus().then((result) => {
    if (!registrationStarted && result.challenge) showOtp(result.challenge);
  }).catch((error) => { if (!registrationStarted) showError(error.message); });

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
  setupPasswordEye("password", "eyeicon1");
  setupPasswordEye("confirm_password", "eyeicon2");
})();