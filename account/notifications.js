(async () => {
  "use strict";
  const root = document.getElementById("tk-notifications");
  const esc = (x) =>
    String(x ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  async function load(body) {
    const r = await fetch("../api/account/notifications.php", {
      credentials: "same-origin",
      cache: "no-store",
      ...(body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    });
    const j = await r.json();
    if (!r.ok || j.status !== "success")
      throw Error(j.message || "Không tải được thông báo.");
    return j.data;
  }
  async function render(body) {
    try {
      const all = await load(body);
      root.innerHTML = all.length
        ? all
            .map(
              (n) =>
                `<article class="tk-surface"><h3>${esc(n.title)}</h3><p>${esc(n.message)}</p><p>${esc(n.created_at)} · ${n.read_at ? "Đã đọc" : "Mới"}</p>${n.code ? `<a class="tk-outline" href="../booking/detail.html?code=${encodeURIComponent(n.code)}">Xem đơn</a>` : ""}${!n.read_at ? `<button class="tk-outline" data-read="${Number(n.id)}">Đánh dấu đã đọc</button>` : ""}</article>`,
            )
            .join("")
        : "<p>Bạn chưa có thông báo nào.</p>";
    } catch (e) {
      root.textContent = e.message;
    }
  }
  root.onclick = async (e) => {
    const b = e.target.closest("[data-read]");
    if (!b) return;
    b.disabled = true;
    await render({ id: Number(b.dataset.read) });
  };
  await render();
})();
