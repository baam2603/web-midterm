const FAV_CITY_LABEL = { dalat: "Đà Lạt", vungtau: "Vũng Tàu" };

function escapeHtml(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

function favHotelUrl(h) {
  return `${route("hotel")}?city=${encodeURIComponent(h.city || "")}&id=${encodeURIComponent(h.id)}`;
}

function renderFavItem(h) {
  const cityName = FAV_CITY_LABEL[h.city] || "Việt Nam";
  const date = h.savedAt ? new Date(h.savedAt).toLocaleDateString("vi-VN") : "";

  return `
    <article class="fav-item" data-id="${escapeHtml(h.id)}">
      <div class="fav-item__thumb fav-item__thumb--${escapeHtml(h.city)}">
        <i class="material-symbols-rounded">hotel</i>
      </div>
      <div class="fav-item__info">
        <h3>${escapeHtml(h.name)}</h3>
        <span class="fav-item__meta">
          <i class="material-symbols-rounded">location_on</i> ${cityName}
          ${date ? `· Đã lưu ${date}` : ""}
        </span>
      </div>
      <div class="fav-item__actions">
        <a class="fav-btn fav-btn--primary" href="${favHotelUrl(h)}">Xem phòng</a>
        <button class="fav-btn fav-btn--ghost fav-item__remove" type="button" data-id="${escapeHtml(h.id)}" data-name="${escapeHtml(h.name)}">
          <i class="material-symbols-rounded">heart_minus</i> Bỏ lưu
        </button>
      </div>
    </article>
  `;
}

function renderFavEmpty() {
  return `
    <div class="fav-empty">
      <i class="material-symbols-rounded">favorite</i>
      <h2>Bạn chưa lưu khách sạn nào</h2>
      <p>Bấm vào biểu tượng trái tim trên mỗi khách sạn để lưu lại và xem sau.</p>
      <div class="fav-empty__links">
        <a class="fav-btn fav-btn--primary" href="${route("dalat")}">Khách sạn Đà Lạt</a>
        <a class="fav-btn fav-btn--ghost" href="${route("vungtau")}">Khách sạn Vũng Tàu</a>
      </div>
    </div>
  `;
}

function renderFavoritesPage() {
  const listEl = document.getElementById("fav-list");
  const countEl = document.getElementById("fav-count");
  if (!listEl) return;

  const list = getFavorites().sort(
    (a, b) => (b.savedAt || 0) - (a.savedAt || 0),
  );

  countEl.textContent = list.length ? `${list.length} khách sạn` : "";
  listEl.innerHTML = list.length
    ? list.map(renderFavItem).join("")
    : renderFavEmpty();
}

/* Bỏ lưu ngay trên trang này */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".fav-item__remove");
  if (!btn) return;

  setFavorites(getFavorites().filter((h) => h.id !== btn.dataset.id));
  showFavToast(`Đã bỏ lưu "${btn.dataset.name}"`, false);
  renderFavoritesPage();
});
