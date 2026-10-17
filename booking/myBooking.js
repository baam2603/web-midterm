(function () {
  "use strict";

  const bookings = [
    {
      id: "TK-240118",
      hotel: "Đồi Thông Retreat",
      addr: "Phường 5, gần Hồ Tuyền Lâm",
      city: "dalat",
      photo: "pine",
      checkIn: "2026-11-12",
      checkOut: "2026-11-14",
      guests: 2,
      rooms: 1,
      total: 2500000,
      status: "confirmed",
    },
    {
      id: "TK-240203",
      hotel: "Làn Sương Boutique Hotel",
      addr: "Trung tâm, cạnh Hồ Xuân Hương",
      city: "dalat",
      photo: "mist",
      checkIn: "2026-12-20",
      checkOut: "2026-12-22",
      guests: 3,
      rooms: 1,
      total: 1960000,
      status: "pending",
    },
    {
      id: "TK-230871",
      hotel: "Lữ Quán Cao Nguyên",
      addr: "Đường Trần Hưng Đạo, Đà Lạt",
      city: "dalat",
      photo: "valley",
      checkIn: "2026-08-05",
      checkOut: "2026-08-07",
      guests: 2,
      rooms: 1,
      total: 1520000,
      status: "completed",
    },
    {
      id: "TK-230412",
      hotel: "Khách sạn Biển Xanh",
      addr: "Bãi Sau, Vũng Tàu",
      city: "vungtau",
      photo: "sea",
      checkIn: "2026-05-01",
      checkOut: "2026-05-03",
      guests: 4,
      rooms: 2,
      total: 3200000,
      status: "cancelled",
    },
  ];

  const UPCOMING = ["confirmed", "pending"];
  const STATUS_LABEL = {
    confirmed: "Đã xác nhận",
    pending: "Chờ xác nhận",
    completed: "Đã lưu trú",
    cancelled: "Đã hủy",
  };

  const listEl = document.getElementById("booking-list");
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const toast = document.getElementById("toast");
  let activeTab = "upcoming";
  let toastTimer = null;

  /* ---------- Tiện ích ---------- */
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }
  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const fmtMoney = (n) => n.toLocaleString("vi-VN") + "₫";
  const nights = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

  /* ---------- Render danh sách ---------- */
  function renderCard(b) {
    const isUpcoming = UPCOMING.includes(b.status);
    const actions = isUpcoming
      ? `<button class="btn-ghost" data-action="view" data-id="${b.id}">Xem chi tiết</button>
         <button class="btn-danger" data-action="cancel" data-id="${b.id}">Hủy phòng</button>`
      : `<button class="btn-solid" data-action="rebook" data-id="${b.id}">Đặt lại</button>`;

    return `
      <article class="booking-card ${b.status === "cancelled" ? "is-cancelled" : ""}">
        <div class="booking-card__photo photo--${b.photo}"></div>
        <div class="booking-card__body">
          <div class="booking-card__top">
            <div>
              <h3>${b.hotel}</h3>
              <span class="booking-card__addr"><i class="ri-map-pin-2-line"></i> ${b.addr}</span>
            </div>
            <span class="badge badge--${b.status}">${STATUS_LABEL[b.status]}</span>
          </div>
          <div class="booking-card__meta">
            <span><i class="ri-calendar-line"></i> ${fmtDate(b.checkIn)} – ${fmtDate(b.checkOut)} (${nights(b.checkIn, b.checkOut)} đêm)</span>
            <span><i class="ri-group-line"></i> ${b.guests} khách · ${b.rooms} phòng</span>
          </div>
          <div class="booking-card__bottom">
            <div>
              <div class="booking-card__price">${fmtMoney(b.total)}</div>
              <span class="booking-card__code">Mã đặt phòng ${b.id}</span>
            </div>
            <div class="booking-card__actions">${actions}</div>
          </div>
        </div>
      </article>`;
  }

  function renderEmpty() {
    const upcoming = activeTab === "upcoming";
    return `
      <div class="empty">
        <i class="${upcoming ? "ri-suitcase-line" : "ri-history-line"}"></i>
        <h3>${upcoming ? "Chưa có chuyến đi sắp tới" : "Chưa có lịch sử đặt phòng"}</h3>
        <p>${upcoming ? "Chọn điểm đến và đặt phòng cho chuyến đi tiếp theo của bạn." : "Các lần lưu trú đã hoàn thành hoặc bị hủy sẽ hiện ở đây."}</p>
        ${upcoming ? '<a class="btn-solid" href="index1.html">Tìm phòng</a>' : ""}
      </div>`;
  }

  function render() {
    const upcoming = bookings.filter((b) => UPCOMING.includes(b.status));
    const history = bookings.filter((b) => !UPCOMING.includes(b.status));
    document.getElementById("count-upcoming").textContent = upcoming.length;
    document.getElementById("count-history").textContent = history.length;

    const items = activeTab === "upcoming" ? upcoming : history;
    // Sắp tới: ngày gần nhất lên trước. Lịch sử: mới nhất lên trước.
    items.sort((a, b) =>
      activeTab === "upcoming"
        ? new Date(a.checkIn) - new Date(b.checkIn)
        : new Date(b.checkIn) - new Date(a.checkIn),
    );
    listEl.innerHTML = items.length
      ? items.map(renderCard).join("")
      : renderEmpty();
  }

 
  function setTab(name, { focus = false } = {}) {
    activeTab = name;

    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1; // chỉ tab đang chọn nằm trong thứ tự Tab
      if (on && focus) t.focus();
    });

    listEl.setAttribute("aria-labelledby", "tab-" + name);
    history.replaceState(null, "", "#" + name); // giữ tab khi tải lại trang
    render();
  }

  // 1. Bấm chuột vào tab
  tabs.forEach((t) => t.addEventListener("click", () => setTab(t.dataset.tab)));

  // 2. Dùng bàn phím: ← → đổi tab, Home/End nhảy tab đầu/cuối
  tabs.forEach((t, i) => {
    t.addEventListener("keydown", (e) => {
      let next = null;
      if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft")
        next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      setTab(tabs[next].dataset.tab, { focus: true });
    });
  });

  // 3. Mở thẳng tab qua đường dẫn: myBooking.html#history
  function tabFromHash() {
    const h = location.hash.replace("#", "");
    return h === "history" ? "history" : "upcoming";
  }
  window.addEventListener("hashchange", () => setTab(tabFromHash()));

  /* ---------- Hành động trên thẻ (ủy quyền sự kiện) ---------- */
  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const booking = bookings.find((b) => b.id === btn.dataset.id);
    if (!booking) return;

    if (btn.dataset.action === "cancel") {
      if (!confirm(`Hủy đặt phòng tại ${booking.hotel}?`)) return;
      booking.status = "cancelled"; // TODO: gọi API hủy phòng thật
      showToast("Đã hủy đặt phòng " + booking.id);
      render(); // thẻ tự chuyển sang tab Lịch sử, số đếm cập nhật theo
    } else if (btn.dataset.action === "rebook") {
      location.href =
        booking.city === "vungtau" ? "vungtau.html" : "dalat.html";
    } else if (btn.dataset.action === "view") {
      showToast("Trang chi tiết đặt phòng chưa được tạo");
    }
  });

  setTab(tabFromHash());
})();
