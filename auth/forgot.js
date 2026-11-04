(() => {
  "use strict";
  const requestForm = document.getElementById("tk-forgot-request"),
    reset = document.getElementById("tk-forgot-reset"),
    out = document.getElementById("tk-forgot-feedback"),
    otp = document.getElementById("tk-demo-otp");
  const token = new URLSearchParams(location.hash.slice(1)).get("token");
  if (otp) otp.hidden = true;
  if (token) {
    requestForm.hidden = true;
    reset.hidden = false;
    reset.querySelector("[name=otp]")?.closest("label")?.remove();
    history.replaceState(null, "", location.pathname);
  } else reset.hidden = true;
  async function submit(form, body) {
    const button = form.querySelector("button");
    button.disabled = true;
    out.textContent = "Đang xử lý...";
    try {
      const r = await fetch("../api/auth/recovery.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok || j.status !== "success")
        throw Error(j.message || "Không thực hiện được yêu cầu.");
      out.textContent = j.message;
      out.dataset.error = "false";
      if (token) reset.hidden = true;
    } catch (e) {
      out.textContent = e.message;
      out.dataset.error = "true";
    } finally {
      button.disabled = false;
    }
  }
  requestForm.onsubmit = (e) => {
    e.preventDefault();
    submit(requestForm, { email: requestForm.elements.email.value });
  };
  reset.onsubmit = (e) => {
    e.preventDefault();
    if (reset.elements.password.value !== reset.elements.confirm.value) {
      out.textContent = "Mật khẩu xác nhận chưa khớp.";
      return;
    }
    submit(reset, { token, password: reset.elements.password.value });
  };
})();
