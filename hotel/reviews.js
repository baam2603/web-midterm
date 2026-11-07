/* Public hotel reviews; PHP checks ownership and administrator permissions. */
(() => {
  "use strict";
  const section = document.getElementById("reviews");
  if (!section) return;
  const params = new URLSearchParams(location.search);
  const city = params.get("city") || "dalat", hotelId = params.get("id");
  if (!hotelId) return;
  let page = 1, sequence = 0;
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  async function request(path, body, headers = {}) {
    const response = await fetch(path, {
      credentials: "same-origin", cache: "no-store",
      ...(body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== "success") throw Error(result.message || "Không thực hiện được yêu cầu.");
    return result.data;
  }
  function updateSummary(data) {
    const label = document.querySelector(".rating-card__label"), count = document.querySelector(".rating-card__count");
    if (label) label.textContent = data.count ? "Đánh giá từ cộng đồng" : "Chưa có đánh giá";
    if (count) count.textContent = `${data.count} đánh giá`;
    const top = document.querySelector(".rating-card__top");
    let score = top?.querySelector(".score");
    if (data.average == null) score?.remove();
    else if (top) {
      if (!score) { score = document.createElement("span"); score.className = "score"; top.append(score); }
      score.textContent = Number(data.average).toLocaleString("vi-VN");
      score.setAttribute("aria-label", `${data.average} trên 5 sao`);
    }
  }
  async function render(message = "") {
    const ticket = ++sequence;
    section.textContent = "Đang tải đánh giá...";
    try {
      const query = new URLSearchParams({ city, hotelId, page });
      const data = await request("../api/reviews/index.php?" + query);
      if (ticket !== sequence) return;
      page = data.page; updateSummary(data);
      const back = location.pathname + location.search + "#reviews";
      const pages = Math.max(1, Math.ceil(data.count / data.pageSize));
      section.innerHTML = `<h2>Bình luận và đánh giá khách sạn</h2>
        <p>${data.count ? `${data.count} đánh giá · Trung bình ${Number(data.average).toLocaleString("vi-VN")}/5 sao` : "Chưa có đánh giá. Hãy chia sẻ ý kiến đầu tiên."}</p>
        <p id="tk-review-global-feedback" role="status">${esc(message)}</p>
        ${data.canReview ? `<form id="tk-review-form" class="tk-form"><p>Bạn có thể đánh giá mà không cần đặt phòng. Đánh giá được hiển thị ngay.</p><label>Điểm đánh giá<select name="score">${[5,4,3,2,1].map((n) => `<option value="${n}">${n} sao</option>`).join("")}</select></label><label>Bình luận<textarea name="comment" minlength="1" maxlength="1500" required></textarea></label><p id="tk-review-feedback" role="status"></p><button class="tk-primary" type="submit">Đăng đánh giá</button></form>` : `<p><a href="../auth/login.html?next=${encodeURIComponent(back)}">Đăng nhập để bình luận và đánh giá</a>. Không cần đặt phòng.</p>`}
        <div id="tk-review-list">${data.reviews.map((r) => `<article class="tk-surface" data-review-id="${r.id}"><strong>${esc(r.author)}</strong><p aria-label="${r.score} trên 5 sao">${"★".repeat(r.score)}${"☆".repeat(5-r.score)} · ${r.score}/5</p><p style="white-space:pre-wrap;overflow-wrap:anywhere">${r.comment}</p><small>${esc(r.createdAt)}</small>${r.canDelete ? `<p><button class="tk-outline" data-review-delete="${r.id}" type="button">Xóa đánh giá</button></p>` : ""}</article>`).join("")}</div>
        ${pages > 1 ? `<div class="tk-actions"><button class="tk-outline" data-review-page="${page-1}" ${page<=1?"disabled":""}>← Trước</button><span>Trang ${page}/${pages}</span><button class="tk-outline" data-review-page="${page+1}" ${page>=pages?"disabled":""}>Sau →</button></div>` : ""}`;
      const form = section.querySelector("#tk-review-form");
      if (form) form.onsubmit = async (event) => {
        event.preventDefault();const button = form.querySelector("button");button.disabled = true;
        try {
          await request("../api/reviews/create.php", { city, hotelId, score: Number(form.elements.score.value), comment: form.elements.comment.value });
          page = 1; await render("Đánh giá đã được đăng.");
        } catch (error) { form.querySelector("#tk-review-feedback").textContent = error.message; }
        finally { if (button.isConnected) button.disabled = false; }
      };
      section.querySelectorAll("[data-review-delete]").forEach((button) => {
        button.onclick = async () => {
          if (!confirm("Xóa đánh giá này? Không thể khôi phục sau khi xóa.")) return;
          button.disabled = true;
          try {
            const headers = {};
            if (data.isAdmin) headers["X-CSRF-Token"] = (await request("../api/admin/csrf.php")).csrfToken;
            await request("../api/reviews/delete.php", { id: Number(button.dataset.reviewDelete) }, headers);
            await render("Đã xóa đánh giá.");
          } catch (error) { section.querySelector("#tk-review-global-feedback").textContent = error.message; }
          finally { if (button.isConnected) button.disabled = false; }
        };
      });
      section.querySelectorAll("[data-review-page]").forEach((button) => {
        button.onclick = () => { page = Number(button.dataset.reviewPage); render(); };
      });
    } catch (error) { if (ticket === sequence) section.textContent = error.message; }
  }
  render();
})();
