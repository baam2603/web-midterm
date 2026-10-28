(function () {
  "use strict";
  const listEl = document.getElementById("booking-list"),
    tabs = [...document.querySelectorAll(".tab")],
    toast = document.getElementById("toast");
  let activeTab = location.hash === "#history" ? "history" : "upcoming";
  const safe = (s) =>
    String(s ?? "").replace(
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
  const date = (s) => {
    const [y, m, d] = String(s || "").split("-");
    return [d, m, y].join("/");
  };
  const money = (n) => Number(n || 0).toLocaleString("vi-VN") + "₫";
  const labels = {
    confirmed: "Đã xác nhận",
    pending: "Chờ thanh toán",
    completed: "Đã lưu trú",
    cancelled: "Đã hủy",
  };
  const upcoming = ["confirmed", "pending"];
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
  }
  function normalized() {
    return BookingStore.all().map((b) => ({
      ...b,
      status: BookingStore.status(b),
      id: b.code,
      hotel: b.hotelName,
      checkIn: b.checkin,
      checkOut: b.checkout,
      addr:
        ((window.CITY_DATA || {})[b.city]?.hotels || []).find(
          (h) => h.id === b.hotelId,
        )?.address || "",
      photo: b.city === "vungtau" ? "sea" : "pine",
    }));
  }
  function renderCard(b) {
    const isUpcoming = upcoming.includes(b.status),
      allowed =
        isUpcoming &&
        b.checkIn > new Date().toISOString().slice(0, 10) &&
        b.refundable !== false;
    const actions =
      `<a class="btn-ghost" href="detail.html?code=${encodeURIComponent(b.code)}">Xem chi tiết</a>` +
      (allowed
        ? `<button class="btn-danger" data-action="cancel" data-id="${safe(b.code)}">Hủy phòng</button>`
        : "") +
      (!isUpcoming
        ? `<a class="btn-solid" href="../hotel/hotel.html?city=${encodeURIComponent(b.city)}&id=${encodeURIComponent(b.hotelId)}">Đặt lại</a>`
        : "");
    return `<article class="booking-card ${b.status === "cancelled" ? "is-cancelled" : ""}">
    <div class="booking-card__photo photo--${safe(b.photo)}"></div><div class="booking-card__body">
    <div class="booking-card__top"><div><h3>${safe(b.hotel)}</h3><span class="booking-card__addr"><i class="ri-map-pin-2-line"></i> ${safe(b.addr)}</span></div><span class="badge badge--${safe(b.status)}">${labels[b.status] || "Đang xử lý"}</span></div>
    <div class="booking-card__meta"><span><i class="ri-calendar-line"></i> ${date(b.checkIn)} – ${date(b.checkOut)} (${b.nights || Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 86400000)} đêm)</span><span><i class="ri-group-line"></i> ${Number(b.guests) || 1} khách · ${Number(b.rooms) || 1} phòng</span></div>
    <div class="booking-card__bottom"><div><div class="booking-card__price">${money(b.total)}</div><span class="booking-card__code">Mã đặt phòng ${safe(b.code)}</span></div><div class="booking-card__actions">${actions}</div></div></div></article>`;
  }
  function empty() {
    const isUp = activeTab === "upcoming";
    return `<div class="empty"><i class="${isUp ? "ri-suitcase-line" : "ri-history-line"}"></i><h3>${isUp ? "Chưa có chuyến đi sắp tới" : "Chưa có lịch sử đặt phòng"}</h3><p>${isUp ? "Chọn điểm đến và đặt phòng cho chuyến đi tiếp theo của bạn." : "Các lần lưu trú đã hoàn thành hoặc bị hủy sẽ hiện ở đây."}</p>${isUp ? '<a class="btn-solid" href="../index1.html">Tìm phòng</a>' : ""}</div>`;
  }
  function render() {
    const all = normalized(),
      up = all.filter((b) => upcoming.includes(b.status)),
      old = all.filter((b) => !upcoming.includes(b.status));
    document.getElementById("count-upcoming").textContent = up.length;
    document.getElementById("count-history").textContent = old.length;
    const selected = activeTab === "upcoming" ? up : old;
    selected.sort((a, b) =>
      activeTab === "upcoming"
        ? a.checkIn.localeCompare(b.checkIn)
        : b.checkIn.localeCompare(a.checkIn),
    );
    listEl.innerHTML = selected.length
      ? selected.map(renderCard).join("")
      : empty();
  }
  function setTab(tab, focus = false) {
    activeTab = tab;
    tabs.forEach((t) => {
      const on = t.dataset.tab === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    listEl.setAttribute("aria-labelledby", "tab-" + tab);
    history.replaceState(null, "", "#" + tab);
    render();
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => setTab(t.dataset.tab));
    t.addEventListener("keydown", (e) => {
      let n = null;
      if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft") n = (i + tabs.length - 1) % tabs.length;
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = tabs.length - 1;
      if (n !== null) {
        e.preventDefault();
        setTab(tabs[n].dataset.tab, true);
      }
    });
  });
  window.addEventListener("hashchange", () =>
    setTab(location.hash === "#history" ? "history" : "upcoming"),
  );
  listEl.addEventListener("click", (e) => {
    const b = e.target.closest('[data-action="cancel"]');
    if (!b) return;
    const order = BookingStore.find(b.dataset.id);
    if (
      !order ||
      !confirm(`Hủy đặt phòng ${order.code} tại ${order.hotelName}?`)
    )
      return;
    try {
      BookingStore.cancel(order.code);
      showToast("Đã hủy đặt phòng " + order.code);
      setTab("history");
    } catch (err) {
      showToast(err.message);
    }
  });
  window.addEventListener("storage", render);
  setTab(activeTab);
})();
