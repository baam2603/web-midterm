(function () {
  "use strict";
  const f = document.getElementById("tk-lookup-form"),
    out = document.getElementById("tk-lookup-status");
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(f);
    try {
      const b = BookingStore.verifyGuest(
        d.get("code"),
        d.get("email"),
        d.get("phone"),
      );
      location.href = "detail.html?code=" + encodeURIComponent(b.code);
    } catch (err) {
      out.dataset.error = "true";
      out.textContent = err.message;
    }
  });
})();
