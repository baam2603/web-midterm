/* Customer hotel review panel: permitted after a completed, owned stay. */
(function () {
  "use strict";
  const params = new URLSearchParams(location.search),
    city = params.get("city") || "dalat",
    id = params.get("id");
  const section = document.getElementById("reviews");
  if (!section || !window.ThreeKData) return;
  const esc = ThreeKData.esc,
    user = ThreeKData.current();
  const orders = user
    ? BookingStore.visible().filter(
        (b) =>
          b.city === city &&
          b.hotelId === id &&
          BookingStore.status(b) === "completed",
      )
    : [];
  const reviewed = new Set(
    ThreeKData.reviewsForAdmin()
      .filter((r) => r.userId === user?.id)
      .map((r) => r.code),
  );
  function render() {
    const reviews = ThreeKData.approvedReviews(city, id);
    section.innerHTML = `<h2>Đánh giá của khách đã lưu trú</h2><p class="tk-muted">Nhận xét từ khách đã hoàn tất đặt phòng trên bản demo. Đánh giá mới cần được quản trị viên duyệt trước khi hiển thị.</p>
  ${reviews.length ? `<div class="tk-review-grid">${reviews.map((r) => `<article class="tk-surface"><div class="tk-row"><strong>${esc(r.author)}</strong><span class="tk-rating">${"★".repeat(r.score)}${"☆".repeat(5 - r.score)}</span></div><p>${esc(r.comment)}</p><small>${new Date(r.createdAt).toLocaleDateString("vi-VN")} · Khách đã lưu trú (demo)</small></article>`).join("")}</div>` : '<div class="tk-surface tk-muted">Chưa có đánh giá được duyệt trong dữ liệu demo.</div>'}
  ${
    user && orders.some((b) => !reviewed.has(b.code))
      ? `<form id="tk-review-form" class="tk-surface tk-form"><h3>Viết đánh giá sau lưu trú</h3><label>Đơn đặt phòng<select name="code" required>${orders
          .filter((b) => !reviewed.has(b.code))
          .map(
            (b) =>
              `<option value="${esc(b.code)}">${esc(b.code)} · ${esc(b.roomName)}</option>`,
          )
          .join(
            "",
          )}</select></label><label>Điểm đánh giá<select name="score" required>${[5, 4, 3, 2, 1].map((n) => `<option value="${n}">${n} / 5 sao</option>`).join("")}</select></label><label>Nội dung<textarea name="comment" minlength="15" maxlength="1500" required placeholder="Chia sẻ trải nghiệm của bạn (ít nhất 15 ký tự)"></textarea></label><p role="status" id="tk-review-feedback"></p><button type="submit" class="tk-primary">Gửi đánh giá để duyệt</button></form>`
      : user
        ? '<p class="tk-muted">Bạn có thể đánh giá sau khi đã hoàn tất lưu trú tại đây. Mỗi đơn chỉ được đánh giá một lần.</p>'
        : '<p class="tk-muted"><a href="../auth/login.html">Đăng nhập</a> để đánh giá sau khi hoàn thành kỳ lưu trú.</p>'
  }`;
    const form = document.getElementById("tk-review-form");
    if (form)
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = new FormData(form);
        try {
          ThreeKData.submitReview({
            city,
            hotelId: id,
            code: data.get("code"),
            score: data.get("score"),
            comment: data.get("comment"),
          });
          section.innerHTML =
            '<h2>Đánh giá của khách</h2><p role="status">Đã gửi đánh giá demo. Quản trị viên có thể duyệt trong trang Admin.</p>';
        } catch (err) {
          document.getElementById("tk-review-feedback").textContent =
            err.message;
        }
      });
  }
  render();
})();
