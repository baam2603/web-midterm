/* Approved reviews and eligible stays come from the server. */
(() => {
  "use strict";
  const section = document.getElementById("reviews");
  if (!section) return;
  const params = new URLSearchParams(location.search),
    city = params.get("city") || "dalat",
    hotelId = params.get("id");
  if (!hotelId) return;
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
  async function request(path, body) {
    const r = await window.apiFetch(path, {
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
      throw Error(j.message || "Không thể tải đánh giá.");
    return j.data;
  }
  async function render() {
    section.textContent = "Đang tải đánh giá...";
    const query = new URLSearchParams({ city, hotelId });
    try {
      const [data, eligibility] = await Promise.all([
        request("../api/reviews/index.php?" + query),
        request("../api/reviews/eligibility.php?" + query).catch(() => ({
          bookings: [],
        })),
      ]);
      section.innerHTML = `<h2>Đánh giá của khách đã lưu trú</h2>${data.reviews.length ? data.reviews.map((r) => `<article class="tk-surface"><strong>${esc(r.author)} · ${Number(r.score)}/5</strong><p>${esc(r.comment)}</p></article>`).join("") : "<p>Chưa có đánh giá được duyệt.</p>"}${eligibility.bookings.length ? `<form id="tk-review-form" class="tk-form"><label>Đơn đã hoàn tất<select name="code">${eligibility.bookings.map((b) => `<option value="${esc(b.code)}">${esc(b.code)} · ${esc(b.roomName)}</option>`).join("")}</select></label><label>Điểm<select name="score">${[5, 4, 3, 2, 1].map((n) => `<option>${n}</option>`).join("")}</select></label><label>Nội dung<textarea name="comment" minlength="15" maxlength="1500" required></textarea></label><p id="tk-review-feedback" role="status"></p><button class="tk-primary" type="submit">Gửi để duyệt</button></form>` : "<p>Đăng nhập và hoàn tất lưu trú để gửi đánh giá. Mỗi đơn được đánh giá một lần.</p>"}`;
      const f = section.querySelector("form");
      if (f)
        f.onsubmit = async (e) => {
          e.preventDefault();
          const button = f.querySelector("button");
          button.disabled = true;
          try {
            const body = Object.fromEntries(new FormData(f));
            body.score = Number(body.score);
            await request("../api/reviews/create.php", body);
            await render();
            const p = document.createElement("p");
            p.textContent = "Đã gửi đánh giá, đang chờ quản trị viên duyệt.";
            section.prepend(p);
          } catch (e) {
            f.querySelector("#tk-review-feedback").textContent = e.message;
          } finally {
            if (button.isConnected) button.disabled = false;
          }
        };
    } catch (e) {
      section.textContent = e.message;
    }
  }
  render();
})();
