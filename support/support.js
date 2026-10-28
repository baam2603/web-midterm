(function () {
  "use strict";
  const u = ThreeKData.current(),
    f = document.getElementById("tk-ticket-form"),
    out = document.getElementById("tk-ticket-status"),
    list = document.getElementById("tk-ticket-list");
  if (u) {
    f.elements.name.value = u.name || "";
    f.elements.email.value = u.email || "";
  }
  const esc = ThreeKData.esc;
  function render() {
    const t = ThreeKData.ticketsForUser();
    list.innerHTML = u
      ? t.length
        ? t
            .map(
              (x) =>
                `<article class="tk-rule"><div class="tk-row"><strong>${esc(x.topic)}</strong><span class="tk-pill ${x.status === "open" ? "warn" : ""}">${x.status === "open" ? "Đang chờ" : "Đã phản hồi"}</span></div><p>${esc(x.message)}</p>${x.reply ? `<p><strong>Phản hồi demo:</strong> ${esc(x.reply)}</p>` : ""}<small class="tk-muted">Mã yêu cầu ${esc(x.id)}</small></article>`,
            )
            .join("")
        : '<p class="tk-muted">Chưa có yêu cầu nào trên tài khoản này.</p>'
      : '<p class="tk-muted">Đăng nhập để theo dõi phản hồi yêu cầu của bạn; yêu cầu khách vãng lai vẫn được lưu demo nhưng không có trang theo dõi công khai.</p>';
  }
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const ticket = ThreeKData.createTicket(
        Object.fromEntries(new FormData(f)),
      );
      out.dataset.error = "false";
      out.textContent = "Đã ghi nhận yêu cầu demo " + ticket.id + ".";
      f.elements.message.value = "";
      render();
    } catch (err) {
      out.dataset.error = "true";
      out.textContent = err.message;
    }
  });
  render();
})();
