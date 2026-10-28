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

  if (!hotel || hotel.hidden) {
    root.innerHTML = `
      <div class="not-found">
        <h1>Không tìm thấy khách sạn</h1>
        <p><a href="${city ? "../" + city.listHref : "../index1.html"}">Quay lại danh sách</a></p>
      </div>`;
    return;
  }

  document.title = `${hotel.name} | THREEK.COM`;

  /* ---------- Helpers ---------- */
  const esc = (s) =>
    String(s).replace(
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
  const money = (n) => n.toLocaleString("vi-VN") + "₫";
  const icon = (name) => `<i class="material-symbols-rounded">${name}</i>`;

  // Ô ảnh: nền gradient luôn có sẵn, ảnh lỗi/thiếu thì ẩn đi
  const photo = (i, extra = "") => {
    const src = hotel.images[i];
    const img = src
      ? `<img src="${esc(src)}" alt="${esc(hotel.name)} - ảnh ${i + 1}" loading="lazy" onerror="this.remove()" />`
      : "";
    return `<button type="button" class="gallery__item gallery__item--${i + 1} ${extra}" data-index="${i}" aria-label="Xem ảnh ${i + 1}">${img}`;
  };

  const total = hotel.images.length;
  const moreCount = Math.max(total - 6, 0);

  const mapQuery = encodeURIComponent(`${hotel.name}, ${hotel.address}`);
  const mapEmbed = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  /* ---------- Loại phòng ---------- */
  const rooms = hotel.rooms || [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const toISO = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const start =
    params.get("checkin") && params.get("checkin") >= toISO(now)
      ? params.get("checkin")
      : toISO(new Date(now.getTime() + 86400000));
  const end =
    params.get("checkout") && params.get("checkout") > start
      ? params.get("checkout")
      : toISO(new Date(new Date(start + "T12:00:00").getTime() + 86400000));
  const leftFor = (r) =>
    r.closed
      ? 0
      : BookingStore.availability(
          cityKey,
          hotelId,
          r.id,
          start,
          end,
          r.left ?? 5,
        );

  const roomCard = (r) => `
    <article class="room">
      <div class="room__photo">
        ${r.image ? `<img src="${esc(r.image)}" alt="${esc(r.name)}" loading="lazy" onerror="this.remove()" />` : ""}
        <span class="room__badge">${icon("square_foot")} ${r.area} m²</span>
        ${leftFor(r) <= 3 ? `<span class="room__badge room__badge--warn">${leftFor(r) ? `Chỉ còn ${leftFor(r)} phòng` : "Hết phòng"}</span>` : ""}
      </div>
      <div class="room__body">
        <h3>${esc(r.name)}</h3>
        <p class="room__meta">${icon("bed")} ${esc(r.bed)}</p>
        <p class="room__meta">${icon("group")} Tối đa ${r.guests} khách</p>
        <ul class="room__features">
          ${r.features.map((f) => `<li>${icon(f.icon)} ${esc(f.label)}</li>`).join("")}
        </ul>
        <ul class="room__perks">
          <li class="${r.breakfast ? "is-yes" : "is-no"}">${icon(r.breakfast ? "free_breakfast" : "no_meals")} ${r.breakfast ? "Gồm bữa sáng" : "Không gồm bữa sáng"}</li>
          <li class="${r.refundable ? "is-yes" : "is-no"}">${icon(r.refundable ? "event_available" : "event_busy")} ${r.refundable ? "Hủy miễn phí" : "Không hoàn tiền"}</li>
        </ul>
        <button type="button" class="room__detail" data-detail="${esc(r.id)}">${icon("info")} Chi tiết phòng</button>
        <div class="room__foot">
          <div class="room__price">
            ${r.oldPrice ? `<s>${money(r.oldPrice)}</s>` : ""}
            <strong>${money(r.price)}</strong>
            <span>/ đêm · chưa gồm thuế phí</span>
          </div>
          <button type="button" class="room__btn" data-room="${esc(r.id)}" ${leftFor(r) === 0 ? "disabled" : ""}>${leftFor(r) === 0 ? "Hết phòng" : "Chọn phòng"}</button>
        </div>
      </div>
    </article>`;

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

        ${
          (hotel.nearby || []).length
            ? `<div class="card highlight-card">
          <h3>Địa điểm lân cận</h3>
          <ul>
            ${hotel.nearby
              .slice(0, 4)
              .map(
                (p) =>
                  `<li>${icon(p.icon)} <span>${esc(p.name)}</span><b class="nearby__dist">${esc(p.distance)}</b></li>`,
              )
              .join("")}
          </ul>
        </div>`
            : ""
        }
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
            .map(
              (f) =>
                `<div class="fact">${icon(f.icon)}<div><span class="fact__label">${esc(f.label)}</span><span class="fact__value">${esc(f.value)}</span></div></div>`,
            )
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

      <div class="desc-section" id="rooms">
        <div class="rooms-head">
          <h2>Chọn loại phòng</h2>
          <div class="rooms-nav" hidden>
            <button type="button" id="roomsPrev" aria-label="Phòng trước">${icon("chevron_left")}</button>
            <button type="button" id="roomsNext" aria-label="Phòng sau">${icon("chevron_right")}</button>
          </div>
        </div>
        ${rooms.length ? `<div class="rooms" id="roomsTrack">${rooms.map(roomCard).join("")}</div>` : `<p>Hiện chưa có thông tin phòng.</p>`}
      </div>

      <div class="desc-section" id="reviews">
        <h2>Đánh giá của khách</h2>
        <p>Khu vực đánh giá sẽ hiển thị tại đây khi có dữ liệu.</p>
      </div>
    </section>
  `;

  /* ---------- Chọn phòng ---------- */
  function goBooking(roomId) {
    const selected = rooms.find((r) => r.id === roomId);
    if (!selected || !leftFor(selected)) return;
    const next = new URLSearchParams({
      city: cityKey,
      id: hotelId,
      room: roomId,
    });
    next.set("checkin", start);
    next.set("checkout", end);
    for (const key of ["guests", "rooms"])
      if (params.has(key)) next.set(key, params.get(key));
    location.href = `Booking.html?${next}`;
  }

  /* ---------- Carousel loại phòng (mũi tên hiện khi phòng bị tràn) ---------- */
  const track = document.getElementById("roomsTrack");
  if (track) {
    const prevBtn = document.getElementById("roomsPrev");
    const nextBtn = document.getElementById("roomsNext");
    const nav = prevBtn.parentElement;
    const step = () => {
      const card = track.querySelector(".room");
      return card ? card.offsetWidth + 20 : 300;
    };
    const updateArrows = () => {
      const max = track.scrollWidth - track.clientWidth;
      nav.hidden = max <= 4;
      prevBtn.disabled = track.scrollLeft <= 4;
      nextBtn.disabled = track.scrollLeft >= max - 4;
    };
    prevBtn.addEventListener("click", () =>
      track.scrollBy({ left: -step(), behavior: "smooth" }),
    );
    nextBtn.addEventListener("click", () =>
      track.scrollBy({ left: step(), behavior: "smooth" }),
    );
    track.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    updateArrows();
  }

  /* ---------- Popup chi tiết phòng ---------- */
  const modal = document.createElement("div");
  modal.className = "room-modal";
  modal.hidden = true;
  document.body.appendChild(modal);

  function openRoom(id) {
    const r = rooms.find((x) => x.id === id);
    if (!r) return;
    modal.innerHTML = `
      <div class="room-modal__box" role="dialog" aria-modal="true" aria-label="${esc(r.name)}">
        <button type="button" class="room-modal__close" aria-label="Đóng">${icon("close")}</button>
        <div class="room-modal__photo">
          ${r.image ? `<img src="${esc(r.image)}" alt="${esc(r.name)}" onerror="this.remove()" />` : ""}
        </div>
        <div class="room-modal__body">
          <h3>${esc(r.name)}</h3>
          <div class="facts">
            <div class="fact">${icon("square_foot")}<div><span class="fact__label">Diện tích</span><span class="fact__value">${r.area} m²</span></div></div>
            <div class="fact">${icon("bed")}<div><span class="fact__label">Giường</span><span class="fact__value">${esc(r.bed)}</span></div></div>
            <div class="fact">${icon("group")}<div><span class="fact__label">Sức chứa</span><span class="fact__value">Tối đa ${r.guests} khách</span></div></div>
          </div>
          ${r.desc ? `<p class="room-modal__desc">${esc(r.desc)}</p>` : ""}
          <h4>Tiện nghi trong phòng</h4>
          <ul class="room__features">${r.features.map((f) => `<li>${icon(f.icon)} ${esc(f.label)}</li>`).join("")}</ul>
          <ul class="room__perks">
            <li class="${r.breakfast ? "is-yes" : "is-no"}">${icon(r.breakfast ? "free_breakfast" : "no_meals")} ${r.breakfast ? "Gồm bữa sáng" : "Không gồm bữa sáng"}</li>
            <li class="${r.refundable ? "is-yes" : "is-no"}">${icon(r.refundable ? "event_available" : "event_busy")} ${r.refundable ? "Hủy miễn phí" : "Không hoàn tiền"}</li>
          </ul>
          <div class="room__foot">
            <div class="room__price">
              ${r.oldPrice ? `<s>${money(r.oldPrice)}</s>` : ""}
              <strong>${money(r.price)}</strong>
              <span>/ đêm · chưa gồm thuế phí</span>
            </div>
            <button type="button" class="room__btn" data-room="${esc(r.id)}" ${leftFor(r) === 0 ? "disabled" : ""}>${leftFor(r) === 0 ? "Hết phòng" : "Chọn phòng"}</button>
          </div>
        </div>
      </div>`;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeRoom() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest(".room-modal__close"))
      return closeRoom();
    const pick = e.target.closest("[data-room]");
    if (pick) goBooking(pick.dataset.room);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeRoom();
  });

  root.addEventListener("click", (e) => {
    const detail = e.target.closest(".room__detail");
    if (detail) return openRoom(detail.dataset.detail);
    const pick = e.target.closest(".room__btn");
    if (pick) goBooking(pick.dataset.room);
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
  document
    .getElementById("lbPrev")
    .addEventListener("click", () => showImage(current - 1));
  document
    .getElementById("lbNext")
    .addEventListener("click", () => showImage(current + 1));
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
