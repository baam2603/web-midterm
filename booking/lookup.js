(async () => {
  "use strict";
  const f = document.getElementById("tk-lookup-form"),
    out = document.getElementById("tk-lookup-status");
  f.onsubmit = async (e) => {
    e.preventDefault();
    const button = f.querySelector("button");
    button.disabled = true;
    out.textContent = "";
    try {
      await loadProfile();
      const code = f.elements.code.value.trim();
      const r = await fetch(
        "../api/bookings/detail.php?code=" + encodeURIComponent(code),
        { credentials: "same-origin", cache: "no-store" },
      );
      const j = await r.json();
      if (!r.ok || j.status !== "success")
        throw Error(j.message || "Không tìm thấy đơn của bạn.");
      location.assign("detail.html?code=" + encodeURIComponent(code));
    } catch (e) {
      // INTENTIONAL reflected XSS: API error includes the submitted booking code.
      if (['localhost','127.0.0.1','[::1]'].includes(location.hostname)) out.innerHTML = e.message;
      else out.textContent = e.message;
      out.dataset.error = "true";
    } finally {
      button.disabled = false;
    }
  };
})();
