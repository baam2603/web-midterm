(function () {
  "use strict";
  const root = document.getElementById("tk-notifications");
  if (!getCurrentUser()) {
    root.innerHTML =
      '<div class="tk-surface"><p>Đăng nhập để xem thông báo dành riêng cho tài khoản của bạn.</p><a class="tk-primary" href="../auth/login.html?next=%2Faccount%2Fnotifications.html">Đăng nhập</a></div>';
    return;
  }
  const esc = ThreeKData.esc;
  function render() {
    const all = ThreeKData.notifications();
    root.innerHTML = all.length
      ? all
          .map(
            (n) =>
              `<article class="tk-surface"><div class="tk-row"><strong>${esc(n.title)}</strong><span class="tk-pill ${n.read ? "" : "warn"}">${n.read ? "Đã đọc" : "Mới"}</span></div><p>${esc(n.message)}</p><div class="tk-row"><small class="tk-muted">${new Date(n.at).toLocaleString("vi-VN")}</small><div class="tk-actions">${n.code ? `<a class="tk-outline" href="../booking/detail.html?code=${encodeURIComponent(n.code)}">Xem đơn</a>` : ""}${!n.read ? `<button class="tk-quiet" data-read="${esc(n.id)}">Đánh dấu đã đọc</button>` : ""}</div></div></article>`,
          )
          .join("")
      : '<div class="tk-surface tk-empty">Bạn chưa có thông báo nào.</div>';
  }
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-read]");
    if (!btn) return;
    try {
      ThreeKData.markRead(btn.dataset.read);
      render();
    } catch (err) {
      alert(err.message);
    }
  });
  render();
})();
