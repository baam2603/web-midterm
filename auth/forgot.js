(function () {
  "use strict";
  const requestForm = document.getElementById("tk-forgot-request");
  const resetForm = document.getElementById("tk-forgot-reset");
  const feedback = document.getElementById("tk-forgot-feedback");
  if (!requestForm || !resetForm || !feedback) return;
  const message = (text, error) => {
    feedback.dataset.error = error ? "true" : "false";
    feedback.textContent = text;
  };
  requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const btn = requestForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    message("", false);
    try {
      const result = await window.requestPasswordReset(requestForm.elements.email.value.trim());
      message(result, false);
      resetForm.hidden = false;
    } catch (err) { message(err.message || "Không thể gửi yêu cầu.", true); }
    finally { btn.disabled = false; }
  });
  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = resetForm.elements.password.value;
    const confirm = resetForm.elements.confirm.value;
    if (password !== confirm) { message("Mật khẩu xác nhận chưa khớp.", true); return; }
    const btn = resetForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    message("", false);
    try {
      await window.resetPasswordWithOtp(
        requestForm.elements.email.value.trim(), resetForm.elements.otp.value.trim(), password
      );
      resetForm.hidden = true;
      message("Đã cập nhật mật khẩu. Bạn có thể quay lại trang đăng nhập.", false);
    } catch (err) { message(err.message || "Không thể đặt lại mật khẩu.", true); }
    finally { btn.disabled = false; }
  });
})();
