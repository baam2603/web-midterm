/* Add-on for existing auth-service.js: does not modify login/register. */
(function () {
  "use strict";
  async function post(endpoint, data) {
    const response = await fetch(window.getApiUrl("auth/" + endpoint), {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    let payload;
    try { payload = await response.json(); }
    catch { throw new Error("Máy chủ không trả về JSON hợp lệ."); }
    if (!response.ok || payload.status !== "success") {
      throw new Error(payload.message || "Không xử lý được yêu cầu.");
    }
    return payload.message;
  }
  window.requestPasswordReset = (email) => post("request-password-reset.php", { email });
  window.resetPasswordWithOtp = (email, otp, password) => post("reset-password.php", { email, otp, password });
})();
