/* =====================================================================
   hotel.js — đọc ?city=...&id=... rồi dựng trang chi tiết khách sạn.
   Dữ liệu lấy từ hotel-data.js (CITIES, HOTELS).
   ===================================================================== */
(function () {
  const params = new URLSearchParams(location.search);
  const cityKey = params.get("city") || "dalat";
  const hotelId = params.get("id");

  const city = CITIES[cityKey];
  const hotel = city && HOTELS[cityKey] && HOTELS[cityKey][hotelId];

  // Đổi chủ đề màu theo thành phố
  document.body.dataset.city = city ? city.theme : "dalat";

  mountHeader("site-header", {
    logoHref: "index1.html",
    middle: `<div class="text-booking">Booking - Đặt phòng khách sạn</div>`,
  });

  const root = document.getElementById("hotel-root");

  if (!hotel) {
    root.innerHTML = `
      <div class="not-found">
        <h1>Không tìm thấy khách sạn</h1>
        <p><a href="${city ? city.listHref : "index1.html"}">Quay lại danh sách</a></p>
      </div>`;
    return;
  }

  document.title = `${hotel.name} | THREEK.COM`;

  /* ---------- Helpers ---------- */
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => n.toLocaleString("vi-VN") + "₫";
  const icon = (name) => `<i class="material-symbols-rounded">${name}</i>`;

  // Ô ảnh: nền gradient luôn có sẵn, ảnh lỗi/thiếu thì ẩn đi
  const photo = (i, extra = "") => {
    const src = hotel.images[i];
    const img = src ? `<img src="${esc(src)}" alt="${esc(hotel.name)} - ảnh ${i + 1}" loading="lazy" onerror="this.remove()" />` : "";
    return `<button type="button" class="gallery__item gallery__item--${i + 1} ${extra}" data-index="${i}" aria-label="Xem ảnh ${i + 1}">${img}`;
  };

  const total = hotel.images.length;
  const moreCount = Math.max(total - 6, 0);

  const mapQuery = encodeURIComponent(`${hotel.name}, ${hotel.address}`);
  const mapEmbed = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  /* ---------- Render ---------- */
  root.innerHTML = `
    <nav class="breadcrumb" aria-label="Điều hướng">
      <a href="../index1.html">Trang chủ</a>${icon("chevron_right")}
      <a href="../${city.listHref}">${esc(city.name)}</a>${icon("chevron_right")}
      <span class="current">${esc(hotel.name)}</span>
    </nav>

    <section class="hotel-title">
      <div class="hotel-title__stars" aria-label="${hotel.stars} sao">${icon("star").repeat(hotel.stars)}</div>
      <h1>${esc(hotel.name)}</h1>
      <div class="hotel-title__addr">${icon("location_on")}<span>${esc(hotel.address)}</span></div>
    </section>

    <section class="top-grid">
      <div class="gallery" id="gallery">
        ${photo(0)}</button>
        ${photo(1)}</button>
        ${photo(2)}</button>
        ${photo(3)}</button>
        ${photo(4)}</button>
        ${photo(5)}</button>
        <button type="button" class="gallery__item gallery__item--more" data-index="6" aria-label="Xem thêm ảnh">
          ${hotel.images[6] ? `<img src="${esc(hotel.images[6])}" alt="" loading="lazy" onerror="this.remove()" />` : ""}
          <span class="gallery__more-label">${icon("photo_library")} ${moreCount ? `+${moreCount} ảnh` : "Xem tất cả ảnh"}</span>
        </button>
      </div>

      <aside class="aside">
        <div class="card map-card">
          <iframe src="${mapEmbed}" loading="lazy" title="Bản đồ ${esc(hotel.name)}" referrerpolicy="no-referrer-when-downgrade"></iframe>
          <a class="map-card__btn" href="${mapLink}" target="_blank" rel="noopener">${icon("map")} Xem trên bản đồ</a>
        </div>

        <div class="card rating-card">
          <div class="rating-card__top">
            <div>
              <span class="rating-card__label">${esc(hotel.ratingLabel)}</span>
              <span class="rating-card__count">${hotel.reviewCount} đánh giá</span>
            </div>
            <span class="score">${hotel.rating.toString().replace(".", ",")}</span>
          </div>
          <a class="rating-card__link" href="#reviews">Xem tất cả đánh giá ${icon("arrow_forward")}</a>
        </div>

        <div class="card book-card">
          <div class="book-card__price">
            <small>Chỉ từ</small>
            <strong>${money(hotel.priceFrom)}</strong> <span>/ đêm</span>
          </div>
          <button type="button" class="btn-book" id="bookNow">Đặt ngay</button>
        </div>
      </aside>
    </section>

    <section class="description">
      <div class="desc-section">
        <h2>Giới thiệu</h2>
        <p>${esc(hotel.intro)}</p>
      </div>

      <div class="desc-section">
        <h2>Thông số khách sạn</h2>
        <div class="facts">
          ${hotel.facts
            .map((f) => `<div class="fact">${icon(f.icon)}<div><span class="fact__label">${esc(f.label)}</span><span class="fact__value">${esc(f.value)}</span></div></div>`)
            .join("")}
        </div>
      </div>

      <div class="desc-section">
        <h2>Tiện nghi</h2>
        <ul class="amenities">
          ${hotel.amenities.map((a) => `<li>${icon(a.icon)} ${esc(a.label)}</li>`).join("")}
        </ul>
      </div>

      <div class="desc-section">
        <h2>Quy tắc chung</h2>
        <ul class="rules">${hotel.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
      </div>

      <div class="desc-section" id="reviews">
        <h2>Đánh giá của khách</h2>
        <p>Khu vực đánh giá sẽ hiển thị tại đây khi có dữ liệu.</p>
      </div>
    </section>
  `;

  /* ---------- Nút Đặt ngay ---------- */
  document.getElementById("bookNow").addEventListener("click", () => {
    // TODO: đổi sang trang đặt phòng thật của bạn
    location.href = `booking.html?city=${encodeURIComponent(cityKey)}&id=${encodeURIComponent(hotelId)}`;
  });

  /* ---------- Lightbox ---------- */
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCount = document.getElementById("lbCount");
  let current = 0;

  function showImage(i) {
    if (!total) return;
    current = (i + total) % total;
    lbImg.src = hotel.images[current];
    lbImg.alt = `${hotel.name} - ảnh ${current + 1}`;
    lbCount.textContent = `${current + 1} / ${total}`;
  }
  function openLightbox(i) {
    if (!total) return;
    showImage(i);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
  }

  document.getElementById("gallery").addEventListener("click", (e) => {
    const btn = e.target.closest(".gallery__item");
    if (btn) openLightbox(Number(btn.dataset.index));
  });
  document.getElementById("lbClose").addEventListener("click", closeLightbox);
  document.getElementById("lbPrev").addEventListener("click", () => showImage(current - 1));
  document.getElementById("lbNext").addEventListener("click", () => showImage(current + 1));
  lb.addEventListener("click", (e) => {
    if (e.target === lb) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showImage(current - 1);
    if (e.key === "ArrowRight") showImage(current + 1);
  });
})();
