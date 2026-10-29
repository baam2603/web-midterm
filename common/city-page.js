/* =====================================================================
   common/city-page.js
   Logic dùng chung cho mọi trang thành phố.
   Khởi tạo từ city-bootstrap.js sau khi city-data.js và API sẵn sàng.
   Yêu cầu: window.CITY_DATA, window.AMENITIES từ city-data.js
   - Thanh tìm kiếm: gợi ý đường phố, lịch chọn ngày, chọn khách & phòng
   - Bộ lọc render tự động theo cấu hình từng thành phố, lọc khách sạn trực tiếp
   - Thời tiết: Open-Meteo (miễn phí, không cần API key)
   - Bản đồ: Leaflet + OpenStreetMap (miễn phí, không cần API key)
   ===================================================================== */
(function () {
  "use strict";

  /* ------------------------- Tiện ích ------------------------- */
  const pad = (n) => String(n).padStart(2, "0");
  const startOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d, n) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const sameDay = (a, b) => a && b && a.getTime() === b.getTime();
  const dateKey = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const fmtDay = (d) => `${d.getDate()} Th${pad(d.getMonth() + 1)}`;
  const fmtMoney = (n) => n.toLocaleString("vi-VN") + "₫";
  const norm = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
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
  const icon = (name) => `<i class="material-symbols-rounded">${name}</i>`;

  const MONTH_NAMES = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  const DOW = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const CHIP_LABEL = {
    breakfast: "Bữa sáng miễn phí",
    parking: "Bãi đỗ xe ô tô",
    fireplace: "Lò sưởi / BBQ",
    pool: "Hồ bơi vô cực",
  };

  function scoreLabel(s) {
    if (s >= 9) return "Tuyệt hảo";
    if (s >= 8) return "Rất tốt";
    if (s >= 7) return "Tốt";
    return "Khá tốt";
  }

  /* ------------------------- Popup nổi dùng chung ------------------------- */
  const Popup = {
    el: null,
    owner: null,
    field: null,
    open(owner, field, node, width) {
      if (this.owner === owner && this.el) return;
      this.close();
      const el = document.createElement("div");
      el.className = "tk-popup";
      el.appendChild(node);
      document.body.appendChild(el);
      this.el = el;
      this.owner = owner;
      this.field = field;
      this.place();
    },
    place() {
      if (!this.el) return;
      const r = this.field.getBoundingClientRect();
      const w = this.el.offsetWidth;
      let left = r.left + window.scrollX;
      const maxLeft =
        window.scrollX + document.documentElement.clientWidth - w - 12;
      left = Math.max(window.scrollX + 12, Math.min(left, maxLeft));
      this.el.style.left = left + "px";
      this.el.style.top = r.bottom + window.scrollY + 10 + "px";
    },
    close() {
      if (this.el) this.el.remove();
      this.el = null;
      this.owner = null;
      this.field = null;
    },
  };
  document.addEventListener("mousedown", (e) => {
    if (!Popup.el) return;
    if (Popup.el.contains(e.target)) return;
    if (Popup.field && Popup.field.contains(e.target)) return;
    Popup.close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") Popup.close();
  });
  window.addEventListener("resize", () => Popup.place());

  /* ------------------------- Nạp Leaflet khi cần ------------------------- */
  let leafletPromise = null;
  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
      const js = document.createElement("script");
      js.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      js.onload = () => resolve(window.L);
      js.onerror = reject;
      document.head.appendChild(js);
    });
    return leafletPromise;
  }

  /* ===================================================================
     initCityPage: chỉ khởi tạo một lần sau khi dữ liệu đã sẵn sàng.
     =================================================================== */
  const initializedCities = new Set();
  window.initCityPage = function (cityKey) {
    if (initializedCities.has(cityKey)) {
      console.warn("[city-page] Trang đã được khởi tạo:", cityKey);
      return true;
    }

    const city = window.CITY_DATA?.[cityKey];
    if (
      !city ||
      !Array.isArray(city.hotels) ||
      !city.filters ||
      !Array.isArray(city.streets) ||
      !window.AMENITIES
    ) {
      console.error(
        "[city-page] Thiếu CITY_DATA/AMENITIES hoặc cấu hình thành phố:",
        cityKey,
        "— kiểm tra common/city-data.js trước khi khởi tạo.",
      );
      return false;
    }

    initializedCities.add(cityKey);
    // Cho CSS đổi bảng màu theo thành phố (xem :root[data-city] trong city-page.css)
    document.documentElement.dataset.city = cityKey;

    const state = {
      street: "",
      checkin: null,
      checkout: null,
      adults: 2,
      children: 0,
      rooms: 1,
      types: new Set(),
      zones: new Set(),
      amenities: new Set(),
      stars: new Set(),
      maxPrice: Infinity,
      sort: 0,
    };

    const $ = (sel, root) => (root || document).querySelector(sel);
    const resultsSection = $(".results");
    const filterSection = $(".panel-section--filter");

    /* ============================ BỘ LỌC ============================ */
    function buildFilters() {
      if (!filterSection) return;
      const f = city.filters;
      const typeHTML = f.types
        .map(
          (t) =>
            `<label><input type="checkbox" data-group="types" value="${t.value}"> ${t.icon ? icon(t.icon) + " " : ""}${esc(t.label)}</label>`,
        )
        .join("");
      const zoneHTML = f.zones
        .map(
          (z) =>
            `<label><input type="checkbox" data-group="zones" value="${z.value}"> ${z.icon ? icon(z.icon) + " " : ""}${esc(z.label)}</label>`,
        )
        .join("");
      const chipHTML = f.amenities
        .map((k) => {
          const a = window.AMENITIES[k];
          return `<label class="chip"><input type="checkbox" data-group="amenities" value="${k}">${icon(a.icon)} ${esc(CHIP_LABEL[k] || a.label)}</label>`;
        })
        .join("");
      const starHTML = [5, 4, 3, 2]
        .map(
          (n) =>
            `<label><input type="checkbox" data-group="stars" value="${n}"> ${icon("star").repeat(n)}</label>`,
        )
        .join("");

      filterSection.innerHTML = `
        <div class="panel-section__head">${icon("tune")}<h3>Bộ lọc</h3></div>
        <div class="filter-group"><span class="filter-label">Loại chỗ ở</span><div class="check-list">${typeHTML}</div></div>
        <div class="filter-group">
          <span class="filter-label">Giá mỗi đêm</span>
          <input type="range" min="0" max="100" step="5" value="100" class="price-range" id="tk-price" />
          <div class="price-range__scale"><span>500K</span><span>5.000K+</span></div>
          <div class="price-range__current" id="tk-price-out">Không giới hạn giá</div>
        </div>
        <div class="filter-group"><span class="filter-label">Vị trí &amp; không khí</span><div class="check-list">${zoneHTML}</div></div>
        <div class="filter-group"><span class="filter-label">Tiện nghi nổi bật</span><div class="chip-filters">${chipHTML}</div></div>
        <div class="filter-group"><span class="filter-label">Đánh giá sao</span><div class="star-filters">${starHTML}</div></div>
        <button type="button" class="tk-btn tk-btn--ghost tk-reset" id="tk-reset">Xóa bộ lọc</button>
      `;

      filterSection.addEventListener("change", (e) => {
        const t = e.target;
        if (t.matches('input[type="checkbox"][data-group]')) {
          const set = state[t.dataset.group];
          const val = t.dataset.group === "stars" ? Number(t.value) : t.value;
          t.checked ? set.add(val) : set.delete(val);
          renderResults();
        }
      });
      filterSection.addEventListener("input", (e) => {
        if (e.target.id !== "tk-price") return;
        const v = Number(e.target.value);
        if (v >= 100) {
          state.maxPrice = Infinity;
          $("#tk-price-out").textContent = "Không giới hạn giá";
        } else {
          state.maxPrice =
            Math.round((500000 + (v / 100) * 4500000) / 50000) * 50000;
          $("#tk-price-out").textContent =
            "Tối đa " + fmtMoney(state.maxPrice) + " / đêm";
        }
        renderResults();
      });
      $("#tk-reset").addEventListener("click", resetFilters);
    }

    function resetFilters() {
      state.types.clear();
      state.zones.clear();
      state.amenities.clear();
      state.stars.clear();
      state.maxPrice = Infinity;
      filterSection
        .querySelectorAll('input[type="checkbox"]')
        .forEach((c) => (c.checked = false));
      const p = $("#tk-price");
      p.value = 100;
      $("#tk-price-out").textContent = "Không giới hạn giá";
      renderResults();
    }

    /* ======================== DANH SÁCH KHÁCH SẠN ======================== */
    let listEl = null;
    let countEl = null;
    let sortEl = null;

    function buildResultsShell() {
      if (!resultsSection) return;
      resultsSection.querySelectorAll(".hotel-card").forEach((c) => c.remove());
      countEl = $(".results-head strong", resultsSection);
      sortEl = $(".results-head select", resultsSection);
      listEl = document.createElement("div");
      listEl.className = "tk-list";
      resultsSection.appendChild(listEl);
      if (sortEl)
        sortEl.addEventListener("change", () => {
          state.sort = sortEl.selectedIndex;
          renderResults();
        });

      listEl.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-view");
        if (btn) location.href = hotelUrl(btn.dataset.id);
      });
      listEl.addEventListener("mouseover", (e) => {
        const card = e.target.closest(".hotel-card");
        highlight(card ? card.dataset.id : null, false);
      });
      listEl.addEventListener("mouseleave", () => highlight(null, false));
    }

    function hotelUrl(id) {
      const p = new URLSearchParams({ city: cityKey, id });
      if (state.checkin) p.set("checkin", dateKey(state.checkin));
      if (state.checkout) p.set("checkout", dateKey(state.checkout));
      p.set("guests", state.adults + state.children);
      p.set("rooms", state.rooms);
      return "../hotel/hotel.html?" + p.toString();
    }

    function matches(h) {
      if (h.hidden) return false;
      if (
        state.checkin &&
        state.checkout &&
        window.HOTELS &&
        window.BookingStore
      ) {
        const detail = window.HOTELS[cityKey]?.[h.id];
        if (
          !detail ||
          !(detail.rooms || []).some(
            (r) =>
              !r.closed &&
              r.guests * state.rooms >= state.adults + state.children &&
              BookingStore.availability(
                cityKey,
                h.id,
                r.id,
                dateKey(state.checkin),
                dateKey(state.checkout),
                r.left ?? 5,
              ) >= state.rooms,
          )
        )
          return false;
      }
      if (state.types.size && !state.types.has(h.type)) return false;
      if (state.zones.size && !h.zones.some((z) => state.zones.has(z)))
        return false;
      for (const a of state.amenities)
        if (!h.amenities.includes(a)) return false;
      if (state.stars.size && !state.stars.has(h.stars)) return false;
      if (h.price > state.maxPrice) return false;
      if (state.adults + state.children > h.capacity * state.rooms)
        return false;
      const q = norm(state.street.trim());
      if (q) {
        const hay = norm(h.address + " " + h.streets.join(" ") + " " + h.name);
        if (!hay.includes(q)) return false;
      }
      return true;
    }

    function cardHTML(h, i) {
      const picked = h.amenities.filter((a) => state.amenities.has(a));
      const rest = h.amenities.filter((a) => !state.amenities.has(a));
      const tags = [...picked, ...rest]
        .slice(0, 3)
        .map(
          (k) =>
            `<span>${icon(window.AMENITIES[k].icon)} ${esc(window.AMENITIES[k].label)}</span>`,
        )
        .join("");
      const photoClass = h.photo ? ` hotel-card__photo--${h.photo}` : "";
      return `
        <article class="hotel-card tk-fade" data-id="${h.id}">
          <div class="hotel-card__photo${photoClass}"></div>
          <div class="hotel-card__body">
            <div class="hotel-card__top">
              <div>
                <h3>${esc(h.name)}</h3>
                <span class="hotel-card__addr">${icon("location_on")} ${esc(h.address)}</span>
              </div>
              <div class="hotel-card__rating">
                <span class="score">${h.score.toFixed(1)}</span>
                <span class="score-label">${scoreLabel(h.score)} · ${h.reviews} đánh giá</span>
              </div>
            </div>
            <div class="hotel-card__tags">${tags}</div>
            <div class="hotel-card__bottom">
              <div class="price">
                <span class="price__from">Chỉ từ</span>
                <span class="price__value">${fmtMoney(h.price)}</span>
                <span class="price__unit">/ đêm</span>
              </div>
              <button type="button" class="btn-solid btn-view" data-id="${h.id}">Xem phòng</button>
            </div>
          </div>
        </article>`;
    }

    let visible = [];
    function renderResults() {
      visible = city.hotels.filter(matches);
      if (state.sort === 1) visible.sort((a, b) => a.price - b.price);
      else if (state.sort === 2) visible.sort((a, b) => b.score - a.score);

      if (countEl) countEl.textContent = visible.length;
      if (listEl) {
        listEl.innerHTML = visible.length
          ? visible.map(cardHTML).join("")
          : `<div class="tk-empty">${icon("search_off")}<p>Không có khách sạn nào phù hợp với yêu cầu của bạn.</p>
             <button type="button" class="tk-btn" id="tk-empty-reset">Xóa bộ lọc</button></div>`;
        const r = $("#tk-empty-reset");
        if (r)
          r.addEventListener("click", () => {
            clearStreet();
            resetFilters();
          });
      }
      updateMap();
    }

    /* ============================ THỜI TIẾT ============================ */
    function weatherInfo(code, isDay) {
      if (code === 0)
        return isDay
          ? ["sunny", "Trời quang, nắng đẹp"]
          : ["clear_night", "Trời quang, đêm trong"];
      if (code === 1 || code === 2)
        return [isDay ? "partly_cloudy_day" : "partly_cloudy_night", "Ít mây"];
      if (code === 3) return ["cloud", "Nhiều mây"];
      if (code === 45 || code === 48) return ["foggy", "Sương mù"];
      if (code >= 51 && code <= 57) return ["rainy", "Mưa phùn"];
      if (code >= 61 && code <= 67) return ["rainy", "Có mưa"];
      if (code >= 71 && code <= 77) return ["weather_snowy", "Lạnh, có tuyết"];
      if (code >= 80 && code <= 82) return ["rainy", "Mưa rào"];
      if (code >= 95) return ["thunderstorm", "Có dông"];
      return ["cloud", "Nhiều mây"];
    }

    async function loadWeather() {
      const body = $(".weather-body");
      if (!body) return;
      const cacheKey = "tk-weather-" + cityKey;
      let data = null;
      try {
        const c = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
        if (c && Date.now() - c.t < 15 * 60 * 1000) data = c.d;
      } catch (_) {}
      try {
        if (!data) {
          const url =
            "https://api.open-meteo.com/v1/forecast?latitude=" +
            city.lat +
            "&longitude=" +
            city.lng +
            "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=auto";
          const res = await fetch(url);
          if (!res.ok) throw new Error("HTTP " + res.status);
          data = (await res.json()).current;
          try {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ t: Date.now(), d: data }),
            );
          } catch (_) {}
        }
        const [ic, desc] = weatherInfo(data.weather_code, data.is_day === 1);
        const iconEl = $(".weather-icon", body);
        if (iconEl) iconEl.textContent = ic;
        const tempEl = $(".weather-temp", body);
        if (tempEl) tempEl.textContent = Math.round(data.temperature_2m) + "°C";
        const descEl = $(".weather-desc", body);
        if (descEl) descEl.textContent = desc;
        let meta = $(".weather-meta", body);
        if (!meta) {
          meta = document.createElement("div");
          meta.className = "weather-meta";
          body.appendChild(meta);
        }
        meta.textContent =
          "Độ ẩm " +
          Math.round(data.relative_humidity_2m) +
          "% · Gió " +
          Math.round(data.wind_speed_10m) +
          " km/h";
      } catch (err) {
        console.warn(
          "[city-page] Không tải được thời tiết, giữ nội dung mặc định.",
          err,
        );
      }
    }

    /* ============================ BẢN ĐỒ ============================ */
    let map = null;
    let markers = {};

    async function initMap() {
      const box = $(".map-canvas");
      if (!box) return;
      try {
        const L = await loadLeaflet();
        box.innerHTML = "";
        box.classList.add("tk-map");
        if (box.clientHeight < 180) box.style.height = "220px";
        map = L.map(box, { scrollWheelZoom: false, zoomControl: true }).setView(
          [city.lat, city.lng],
          city.zoom,
        );
        L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
          maxZoom: 19,
          attribution: "&copy; Google Maps",
        }).addTo(map);

        city.hotels.forEach((h) => {
          const m = L.marker([h.lat, h.lng], {
            icon: L.divIcon({
              className: "",
              html: `<span class="tk-pin">${icon("location_on")}</span>`,
              iconSize: [34, 34],
              iconAnchor: [17, 32],
              popupAnchor: [0, -28],
            }),
          });
          m.bindPopup(
            `<div class="tk-map-pop"><strong>${esc(h.name)}</strong><span>${fmtMoney(h.price)} / đêm</span></div>`,
          );
          m.on("click", () => highlight(h.id, true));
          markers[h.id] = m;
        });
        setTimeout(() => map.invalidateSize(), 200);
        updateMap();
      } catch (err) {
        console.warn("[city-page] Không tải được bản đồ.", err);
      }
    }

    function updateMap() {
      if (!map || !window.L) return;
      const L = window.L;
      const ids = new Set(visible.map((h) => h.id));
      Object.keys(markers).forEach((id) => {
        const m = markers[id];
        if (ids.has(id)) {
          if (!map.hasLayer(m)) m.addTo(map);
        } else if (map.hasLayer(m)) map.removeLayer(m);
      });
      if (visible.length === 1)
        map.setView([visible[0].lat, visible[0].lng], 15);
      else if (visible.length > 1)
        map.fitBounds(L.latLngBounds(visible.map((h) => [h.lat, h.lng])), {
          padding: [24, 24],
          maxZoom: 15,
        });
      else map.setView([city.lat, city.lng], city.zoom);
    }

    function highlight(id, scroll) {
      document
        .querySelectorAll(".hotel-card--active")
        .forEach((c) => c.classList.remove("hotel-card--active"));
      Object.values(markers).forEach(
        (m) =>
          m._icon &&
          m._icon.firstChild &&
          m._icon.firstChild.classList.remove("is-active"),
      );
      if (!id) return;
      const card =
        listEl && listEl.querySelector(`.hotel-card[data-id="${id}"]`);
      if (card) {
        card.classList.add("hotel-card--active");
        if (scroll)
          card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      const m = markers[id];
      if (m && m._icon && m._icon.firstChild)
        m._icon.firstChild.classList.add("is-active");
    }

    /* ======================= THANH TÌM KIẾM ======================= */
    const streetInput = document.getElementById("street");
    const dateInput = document.getElementById("checkin");
    const guestInput = document.getElementById("guests");

    function clearStreet() {
      state.street = "";
      if (streetInput) streetInput.value = "";
    }

    /* ---- 1) Đường phố ---- */
    function initStreet() {
      if (!streetInput) return;
      const field = streetInput.closest(".field") || streetInput;
      streetInput.autocomplete = "off";
      let active = -1;

      function items() {
        const q = norm(streetInput.value.trim());
        return city.streets.filter(
          (s) => !q || norm(s.name + " " + s.note).includes(q),
        );
      }
      function show() {
        const list = items();
        const box = document.createElement("div");
        box.className = "tk-suggest";
        box.innerHTML = list.length
          ? `<div class="tk-suggest__title">Gợi ý tại ${esc(city.name)}</div>` +
            list
              .map(
                (s, i) =>
                  `<button type="button" class="tk-suggest__item${i === active ? " is-active" : ""}" data-name="${esc(s.name)}">
                    ${icon("location_on")}<span><strong>${esc(s.name)}</strong><small>${esc(s.note)}</small></span></button>`,
              )
              .join("")
          : `<div class="tk-suggest__empty">Không tìm thấy gợi ý — nhấn Tìm kiếm để lọc theo từ khóa.</div>`;
        box.addEventListener("mousedown", (e) => {
          e.preventDefault();
          const b = e.target.closest(".tk-suggest__item");
          if (b) pick(b.dataset.name);
        });
        // Thay nội dung popup hiện có (giữ vị trí) hoặc mở mới
        if (Popup.owner === "street" && Popup.el) {
          Popup.el.replaceChildren(box);
        } else {
          Popup.open("street", field, box);
        }
      }
      function pick(name) {
        streetInput.value = name;
        state.street = name;
        Popup.close();
        active = -1;
        renderResults();
        if (dateInput && !state.checkin) setTimeout(() => dateInput.focus(), 0);
      }

      streetInput.addEventListener("focus", () => {
        active = -1;
        show();
      });
      streetInput.addEventListener("click", () => {
        if (Popup.owner !== "street") show();
      });
      streetInput.addEventListener("input", () => {
        active = -1;
        state.street = streetInput.value;
        show();
        renderResults();
      });
      streetInput.addEventListener("keydown", (e) => {
        const list = items();
        if (e.key === "ArrowDown") {
          e.preventDefault();
          active = Math.min(active + 1, list.length - 1);
          show();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          active = Math.max(active - 1, 0);
          show();
        } else if (e.key === "Enter" && active >= 0 && list[active]) {
          e.preventDefault();
          pick(list[active].name);
        }
      });
    }

    /* ---- 2) Lịch chọn ngày ---- */
    function updateDateInput() {
      if (!dateInput) return;
      if (state.checkin && state.checkout) {
        const nights = Math.round((state.checkout - state.checkin) / 86400000);
        dateInput.value = `${fmtDay(state.checkin)} — ${fmtDay(state.checkout)} · ${nights} đêm`;
      } else if (state.checkin) {
        dateInput.value = `${fmtDay(state.checkin)} — …`;
      } else {
        dateInput.value = "";
      }
    }

    function initDates() {
      if (!dateInput) return;
      const field = dateInput.closest(".field") || dateInput;
      dateInput.readOnly = true;
      dateInput.autocomplete = "off";
      const today = startOfDay(new Date());
      dateInput.placeholder = `${fmtDay(addDays(today, 1))} — ${fmtDay(addDays(today, 3))}`;

      function openCal() {
        let view = state.checkin
          ? new Date(state.checkin.getFullYear(), state.checkin.getMonth(), 1)
          : new Date(today.getFullYear(), today.getMonth(), 1);
        const root = document.createElement("div");
        root.className = "tk-cal";

        function monthHTML(first, side) {
          const y = first.getFullYear();
          const m = first.getMonth();
          const lead = (first.getDay() + 6) % 7; // Thứ 2 là cột đầu
          const days = new Date(y, m + 1, 0).getDate();
          let cells = DOW.map(
            (d) => `<div class="tk-cal__dow">${d}</div>`,
          ).join("");
          cells += "<div></div>".repeat(lead);
          for (let d = 1; d <= days; d++) {
            const dt = new Date(y, m, d);
            const cls = ["tk-cal__day"];
            const past = dt < today;
            if (sameDay(dt, today)) cls.push("is-today");
            if (sameDay(dt, state.checkin)) {
              cls.push("is-start");
              if (state.checkout) cls.push("has-range");
            }
            if (sameDay(dt, state.checkout)) {
              cls.push("is-end");
              cls.push("has-range");
            }
            if (
              state.checkin &&
              state.checkout &&
              dt > state.checkin &&
              dt < state.checkout
            )
              cls.push("is-range");
            cells += `<button type="button" class="${cls.join(" ")}" data-date="${dateKey(dt)}"${past ? " disabled" : ""}>${d}</button>`;
          }
          const atMin =
            first.getFullYear() === today.getFullYear() &&
            first.getMonth() === today.getMonth();
          const prev =
            side === 0
              ? `<button type="button" class="tk-cal__nav" data-nav="-1"${atMin ? " disabled" : ""}>${icon("chevron_left")}</button>`
              : `<span class="tk-cal__nav tk-cal__nav--ghost"></span>`;
          const next =
            side === 1
              ? `<button type="button" class="tk-cal__nav" data-nav="1">${icon("chevron_right")}</button>`
              : `<span class="tk-cal__nav tk-cal__nav--ghost"></span>`;
          return `<div class="tk-cal__month"><div class="tk-cal__head">${prev}<strong>${MONTH_NAMES[m]} ${y}</strong>${next}</div><div class="tk-cal__grid">${cells}</div></div>`;
        }

        function render() {
          const second = new Date(view.getFullYear(), view.getMonth() + 1, 1);
          let status = "Chọn ngày nhận phòng";
          if (state.checkin && !state.checkout) status = "Chọn ngày trả phòng";
          if (state.checkin && state.checkout)
            status =
              Math.round((state.checkout - state.checkin) / 86400000) + " đêm";
          root.innerHTML = `
            <div class="tk-cal__months">${monthHTML(view, 0)}${monthHTML(second, 1)}</div>
            <div class="tk-cal__foot"><span>${status}</span>
              <span><button type="button" class="tk-btn tk-btn--ghost" data-clear>Xóa ngày</button></span></div>`;
        }

        root.addEventListener("click", (e) => {
          const nav = e.target.closest("[data-nav]");
          if (nav) {
            view = new Date(
              view.getFullYear(),
              view.getMonth() + Number(nav.dataset.nav),
              1,
            );
            render();
            Popup.place();
            return;
          }
          if (e.target.closest("[data-clear]")) {
            state.checkin = state.checkout = null;
            updateDateInput();
            render();
            return;
          }
          const btn = e.target.closest(".tk-cal__day");
          if (!btn || btn.disabled) return;
          const d = parseKey(btn.dataset.date);
          if (!state.checkin || state.checkout || d <= state.checkin) {
            state.checkin = d;
            state.checkout = null;
            updateDateInput();
            render();
          } else {
            state.checkout = d;
            updateDateInput();
            Popup.close();
            if (guestInput) setTimeout(() => guestInput.focus(), 0);
          }
        });
        // Xem trước khoảng ngày khi rê chuột
        root.addEventListener("mouseover", (e) => {
          if (!state.checkin || state.checkout) return;
          const btn = e.target.closest(".tk-cal__day");
          if (!btn || btn.disabled) return;
          const hover = parseKey(btn.dataset.date);
          root.querySelectorAll(".tk-cal__day").forEach((c) => {
            const d = parseKey(c.dataset.date);
            c.classList.toggle("is-range", d > state.checkin && d < hover);
          });
        });

        render();
        Popup.open("dates", field, root);
      }

      dateInput.addEventListener("focus", openCal);
      dateInput.addEventListener("click", openCal);
    }

    /* ---- 3) Khách & phòng ---- */
    function updateGuestInput() {
      if (guestInput)
        guestInput.value = `${state.adults + state.children} khách · ${state.rooms} phòng`;
    }

    function initGuests() {
      if (!guestInput) return;
      const field = guestInput.closest(".field") || guestInput;
      guestInput.readOnly = true;
      guestInput.autocomplete = "off";
      updateGuestInput();

      const rows = [
        {
          key: "adults",
          label: "Người lớn",
          sub: "Từ 13 tuổi trở lên",
          min: 1,
          max: 16,
        },
        {
          key: "children",
          label: "Trẻ em",
          sub: "Dưới 13 tuổi",
          min: 0,
          max: 8,
        },
        {
          key: "rooms",
          label: "Phòng",
          sub: "Số phòng cần đặt",
          min: 1,
          max: 8,
        },
      ];

      function openGuests() {
        const root = document.createElement("div");
        root.className = "tk-guests";
        function render() {
          root.innerHTML =
            rows
              .map(
                (
                  r,
                ) => `<div class="tk-row"><div><strong>${r.label}</strong><small>${r.sub}</small></div>
                  <div class="tk-step">
                    <button type="button" data-k="${r.key}" data-d="-1"${state[r.key] <= r.min ? " disabled" : ""}>−</button>
                    <output>${state[r.key]}</output>
                    <button type="button" data-k="${r.key}" data-d="1"${state[r.key] >= r.max ? " disabled" : ""}>+</button>
                  </div></div>`,
              )
              .join("") +
            `<button type="button" class="tk-btn" data-done>Xong</button>`;
        }
        root.addEventListener("click", (e) => {
          if (e.target.closest("[data-done]")) {
            Popup.close();
            return;
          }
          const b = e.target.closest("button[data-k]");
          if (!b || b.disabled) return;
          const k = b.dataset.k;
          state[k] += Number(b.dataset.d);
          // Số phòng không được vượt số người lớn
          if (state.rooms > state.adults) {
            if (k === "rooms") state.adults = state.rooms;
            else state.rooms = state.adults;
          }
          updateGuestInput();
          render();
          renderResults();
        });
        render();
        Popup.open("guests", field, root);
      }
      guestInput.addEventListener("focus", openGuests);
      guestInput.addEventListener("click", openGuests);
    }

    /* ---- Nút Tìm kiếm ---- */
    function initSearchSubmit() {
      const form = $(".search-bar");
      if (!form) return;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        Popup.close();
        if (streetInput) state.street = streetInput.value;
        renderResults();
        if (resultsSection)
          resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    /* ============================ KHỞI TẠO ============================ */
    buildFilters();
    buildResultsShell();
    initStreet();
    initDates();
    initGuests();
    initSearchSubmit();
    renderResults();
    loadWeather();
    initMap();
    return true;
  };
})();