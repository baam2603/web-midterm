(function () {
  "use strict";
  const req = document.getElementById("tk-forgot-request"),
    reset = document.getElementById("tk-forgot-reset"),
    otp = document.getElementById("tk-demo-otp"),
    out = document.getElementById("tk-forgot-feedback");
  req.addEventListener("submit", (e) => {
    e.preventDefault();
    out.textContent = "";
    try {
      const code = startDemoRecovery(req.elements.email.value);
      otp.hidden = false;
      otp.textContent =
        "Mã DEMO của bạn (không gửi email): " + code + " — hiệu lực 10 phút.";
      reset.hidden = false;
      out.dataset.error = "false";
    } catch (err) {
      out.dataset.error = "true";
      out.textContent = err.message;
    }
  });
  reset.addEventListener("submit", async (e) => {
    e.preventDefault();
    out.textContent = "";
    if (reset.elements.password.value !== reset.elements.confirm.value) {
      out.dataset.error = "true";
      out.textContent = "Mật khẩu xác nhận chưa khớp.";
      return;
    }
    try {
      await finishDemoRecovery(
        req.elements.email.value,
        reset.elements.otp.value,
        reset.elements.password.value,
      );
      otp.hidden = true;
      reset.hidden = true;
      out.dataset.error = "false";
      out.innerHTML =
        'Đã đổi mật khẩu trong dữ liệu demo. <a href="login.html">Đăng nhập</a> bằng mật khẩu mới.';
    } catch (err) {
      out.dataset.error = "true";
      out.textContent = err.message;
    }
  });
})();
