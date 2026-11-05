(() => {
  "use strict";
  const form = document.getElementById("tk-ticket-form"),
    status = document.getElementById("tk-ticket-status"),
    list = document.getElementById("tk-ticket-list");
  const user = window.ThreeKData?.current();
  if (user) {
    form.elements.name.value = user.name || "";
    form.elements.email.value = user.email || "";
  }
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
  async function request(body) {
    const r = await window.apiFetch("../api/support/tickets.php", {
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
      throw Error(j.message || "Không thể tải yêu cầu hỗ trợ.");
    return j.data;
  }
  async function render() {
    try {
      const items = await request();
      list.innerHTML = items.length
        ? items
            .map(
              (t) =>
                `<article class="tk-rule"><strong>#${Number(t.id)} · ${esc(t.topic)}</strong><p>${esc(t.message)}</p><small>${esc({ open: "Đang chờ", answered: "Đã phản hồi", closed: "Đã đóng" }[t.status])}</small>${t.reply ? `<p><strong>Phản hồi:</strong> ${esc(t.reply)}</p>` : ""}</article>`,
            )
            .join("")
        : "<p>Chưa có yêu cầu nào.</p>";
    } catch (e) {
      list.textContent = e.message;
    }
  }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = form.querySelector('button[type="submit"],button');
    button.disabled = true;
    try {
      const t = await request(Object.fromEntries(new FormData(form)));
      status.textContent = `Đã gửi yêu cầu #${t.id}. Phản hồi sẽ xuất hiện bên dưới.`;
      status.dataset.error = "false";
      form.elements.message.value = "";
      await render();
    } catch (e) {
      status.textContent = e.message;
      status.dataset.error = "true";
    } finally {
      button.disabled = false;
    }
  });
  render();
})();
