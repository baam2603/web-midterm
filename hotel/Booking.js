(async () => {
  "use strict";
  const root = document.getElementById("booking-root"),
    user = await window.authReady;
  if (!user) {
    location.replace(
      "../auth/login.html?next=" +
        encodeURIComponent(location.pathname + location.search),
    );
    return;
  }
  mountHeader("site-header");
  const params = new URLSearchParams(location.search),
    city = params.get("city") || "dalat",
    hotelId = params.get("id"),
    roomId = params.get("room");
  const hotel = HOTELS[city]?.[hotelId],
    room = hotel?.rooms.find((r) => r.id === roomId);
  if (!room || room.left < 1) {
    root.textContent =
      "Phòng không còn trống trong khoảng ngày này. Vui lòng quay lại chọn phòng hoặc ngày khác.";
    return;
  }
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
  const money = (n) => Number(n).toLocaleString("vi-VN") + "₫";
  const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    }),
    add = (d, n) =>
      new Date(Date.parse(d + "T00:00:00Z") + n * 86400000)
        .toISOString()
        .slice(0, 10);
  let from = params.get("checkin") || add(today, 1),
    to = params.get("checkout") || add(today, 2);
  const names = String(user.fullName || user.name || "")
      .trim()
      .split(/\s+/),
    first = names.pop() || "",
    last = names.join(" ");
  root.innerHTML = `<h1 class="booking-title">Đặt phòng ${esc(hotel.name)}</h1><div class="booking-grid"><section class="card booking-left"><h2>${esc(room.name)}</h2><form id="booking-form"><div class="form-grid"><label class="field">Họ<input name="lastName" minlength="1" maxlength="60" value="${esc(last)}" required></label><label class="field">Tên<input name="firstName" minlength="1" maxlength="60" value="${esc(first)}" required></label><label class="field">Email nhận thông tin<input name="email" type="email" maxlength="150" value="${esc(user.email)}" required></label><label class="field">Điện thoại<input name="phone" type="tel" pattern="[0-9+\\-\\s]{8,25}" value="${esc(user.phone)}" required></label><label class="field">Nhận phòng<input name="checkin" type="date" min="${today}" value="${esc(from)}" required></label><label class="field">Trả phòng<input name="checkout" type="date" min="${add(from, 1)}" value="${esc(to)}" required></label><label class="field">Số phòng<input name="rooms" type="number" min="1" max="30" value="${Math.min(30, Math.max(1, Number(params.get("rooms")) || 1))}" required></label><label class="field">Số khách<input name="guests" type="number" min="1" max="600" value="${Math.min(600, Math.max(1, Number(params.get("guests")) || 1))}" required></label><label class="field full">Mã ưu đãi<input name="coupon" maxlength="30" placeholder="THREEK10 hoặc WELCOME"></label><label class="field full">Yêu cầu đặc biệt<textarea name="note" maxlength="2000"></textarea></label></div><p id="booking-message" role="status"></p><button class="btn-solid" type="submit">Tiếp tục thanh toán</button></form></section><aside class="card" id="booking-price"><p>Đang kiểm tra giá và tồn phòng...</p></aside></div>`;
  const form = root.querySelector("form"),
    message = root.querySelector("#booking-message"),
    price = root.querySelector("#booking-price");
  let controller = null,
    version = 0,
    busy = false;
  function values() {
    return { ...Object.fromEntries(new FormData(form)), city, hotelId, roomId };
  }
  async function quote() {
    controller?.abort();
    controller = new AbortController();
    const v = ++version;
    const d = values();
    const r = await fetch("../api/bookings/quote.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
      signal: controller.signal,
    });
    const j = await r.json();
    if (v !== version) return null;
    if (!r.ok || j.status !== "success")
      throw Error(j.message || "Không lấy được báo giá.");
    price.innerHTML = `<h2>Chi tiết giá</h2><p>${esc(hotel.name)} · ${esc(room.name)}</p><p>${j.data.nights} đêm · ${Number(d.rooms)} phòng</p><p>Tiền phòng: ${money(j.data.subtotal)}</p><p>Giảm giá: −${money(j.data.discount)}</p><p>Thuế/phí: ${money(j.data.tax)}</p><strong>Tổng: ${money(j.data.total)}</strong><p>${Number(j.data.availableRooms)} phòng còn trống cho toàn bộ kỳ ở. Phòng chỉ được giữ sau khi tạo đơn.</p>`;
    message.textContent = "";
    return j.data;
  }
  let timer;
  form.addEventListener("input", (e) => {
    if (
      !["checkin", "checkout", "rooms", "guests", "coupon"].includes(
        e.target.name,
      )
    )
      return;
    if (e.target.name === "checkin") {
      form.elements.checkout.min = add(form.elements.checkin.value, 1);
      if (form.elements.checkout.value <= form.elements.checkin.value)
        form.elements.checkout.value = form.elements.checkout.min;
    }
    clearTimeout(timer);
    timer = setTimeout(
      () =>
        quote().catch((e) => {
          if (e.name !== "AbortError") message.textContent = e.message;
        }),
      300,
    );
  });
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true;
    const button = form.querySelector("button");
    button.disabled = true;
    clearTimeout(timer);
    try {
      if (!(await quote())) return;
      const draft = values();
      draft.rooms = Number(draft.rooms);
      draft.guests = Number(draft.guests);
      draft.coupon = draft.coupon.trim().toUpperCase();
      draft.requestKey = crypto.randomUUID();
      draft.back = location.pathname + location.search;
      sessionStorage.setItem("threek_checkout", JSON.stringify(draft));
      location.assign("../payment/payment.html");
    } catch (e) {
      if (e.name !== "AbortError") message.textContent = e.message;
    } finally {
      busy = false;
      button.disabled = false;
    }
  };
  quote().catch((e) => (message.textContent = e.message));
})();
