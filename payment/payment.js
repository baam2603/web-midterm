/* Checkout: server pricing, persistent orders and hosted VNPay payments. */
(async () => {
  "use strict";
  const root = document.getElementById("pay-root");
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
  let draft;
  try {
    draft = JSON.parse(sessionStorage.getItem("threek_checkout") || "null");
  } catch {}
  if (!draft) {
    root.textContent = "Phiên thanh toán đã hết hạn. Vui lòng chọn phòng lại.";
    return;
  }
  mountHeader("site-header");
  const room = HOTELS[draft.city]?.[draft.hotelId]?.rooms.find(
      (r) => r.id === draft.roomId,
    ),
    hotel = HOTELS[draft.city]?.[draft.hotelId];
  if (!room) {
    root.textContent = "Loại phòng không còn khả dụng. Vui lòng chọn lại.";
    return;
  }
  let quote = null,
    bookingCode = draft.savedCode || null,
    busy = false;
  const back = new URL(draft.back || "../index1.html", location.href);
  if (back.origin !== location.origin)
    back.href = new URL("../index1.html", location.href).href;
  async function api(path, body) {
    const r = await fetch(path, {
      credentials: "same-origin",
      cache: "no-store",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok || j.status !== "success") {
      const e = Error(j.message || "Không thể kết nối hệ thống.");
      e.data = j.data;
      throw e;
    }
    return j.data;
  }
  const selection = () => ({
    city: draft.city,
    hotelId: draft.hotelId,
    roomId: draft.roomId,
    checkin: draft.checkin,
    checkout: draft.checkout,
    rooms: Number(draft.rooms),
    guests: Number(draft.guests),
    coupon: draft.coupon || "",
  });
  root.innerHTML = `<h1 class="booking-title">Xác nhận đặt phòng</h1><div class="booking-grid"><section class="card booking-left"><h2>${esc(hotel.name)}</h2><p>${esc(room.name)} · ${Number(draft.rooms)} phòng · ${Number(draft.guests)} khách</p><p>${esc(draft.checkin)} → ${esc(draft.checkout)}</p><p>Người nhận phòng: ${esc(draft.lastName)} ${esc(draft.firstName)}</p><p>${esc(draft.email)} · ${esc(draft.phone)}</p><p>Yêu cầu: ${esc(draft.note || "Không có")}</p><form id="checkout-confirm"><label><input type="radio" name="method" value="hotel" checked> Thanh toán tại khách sạn</label><br><label><input type="radio" name="method" value="online"> Thanh toán trực tuyến qua VNPay</label><p>VNPay xử lý thanh toán trên trang của nhà cung cấp. Website không thu thập số thẻ hoặc CVV.</p><label><input type="checkbox" name="terms" required> Tôi đồng ý với điều kiện đặt phòng và chính sách hủy.</label><p id="checkout-message" role="status">Đang lấy giá...</p><button type="submit" class="btn-solid" disabled id="confirm-booking">Xác nhận đặt phòng</button></form><p><a id="checkout-back">Quay lại sửa thông tin</a></p></section><aside class="card" id="checkout-price"></aside></div>`;
  root.querySelector("#checkout-back").href = back.href;
  const form = root.querySelector("form"),
    message = root.querySelector("#checkout-message"),
    button = root.querySelector("button");
  async function loadQuote() {
    quote = null;
    button.disabled = true;
    try {
      quote = await api("../api/bookings/quote.php", selection());
      root.querySelector("#checkout-price").innerHTML =
        `<h2>Chi tiết giá</h2><p>Tiền phòng: ${money(quote.subtotal)}</p><p>Giảm giá: −${money(quote.discount)}</p><p>Thuế/phí: ${money(quote.tax)}</p><strong>Tổng: ${money(quote.total)}</strong>`;
      message.textContent =
        "Giá và tồn phòng được kiểm tra trên hệ thống khi xác nhận. Chưa giữ phòng ở bước này.";
      button.disabled = false;
    } catch (e) {
      message.textContent = e.message;
    }
  }
  async function payOnline() {
    const data = await api("../api/payments/start.php", { code: bookingCode });
    const url = new URL(data.url);
    if (
      !["sandbox.vnpayment.vn", "pay.vnpay.vn"].includes(url.hostname) ||
      url.protocol !== "https:"
    )
      throw Error("Liên kết thanh toán không hợp lệ.");
    location.assign(url.href);
  }
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (busy || !quote || !form.reportValidity()) return;
    busy = true;
    button.disabled = true;
    try {
      if (!bookingCode) {
        const result = await api("../api/bookings/create.php", {
          ...selection(),
          guestName:
            `${draft.lastName.trim()} ${draft.firstName.trim()}`.trim(),
          email: draft.email,
          phone: draft.phone,
          note: draft.note || "",
          payMethod: form.elements.method.value,
          requestKey: draft.requestKey,
          expectedTotal: quote.total,
        });
        bookingCode = result.code;
        draft.savedCode = bookingCode;
        draft.savedMethod = form.elements.method.value;
        sessionStorage.setItem("threek_checkout", JSON.stringify(draft));
      }
      if (draft.savedMethod === "online") {
        button.textContent = "Đang chuyển tới VNPay...";
        await payOnline();
      } else {
        sessionStorage.removeItem("threek_checkout");
        location.assign("success.html?code=" + encodeURIComponent(bookingCode));
      }
    } catch (e) {
      if (e.data?.priceChanged) {
        await loadQuote();
        message.textContent = e.message;
      } else
        message.textContent =
          e.message +
          (bookingCode
            ? " Đơn đã lưu với mã " +
              bookingCode +
              ". Bạn có thể xem trong Đặt phòng của tôi."
            : "");
    } finally {
      busy = false;
      button.disabled = !quote;
      button.textContent =
        bookingCode && draft.savedMethod === "online"
          ? "Thử mở VNPay lại"
          : "Xác nhận đặt phòng";
    }
  };
  if (bookingCode) {
    message.textContent = "Đơn đã được lưu: " + bookingCode;
    form
      .querySelectorAll("[name=method]")
      .forEach((el) => (el.disabled = true));
  }
  try {
    const r = await fetch("../api/health-config.php", { cache: "no-store" }),
      j = await r.json();
    const online = form.querySelector("[value=online]");
    if (!j.data?.onlinePayments) {
      online.disabled = true;
      online.closest("label").append(" — Chưa được kích hoạt");
    } else if (j.data.gatewayMode === "sandbox")
      online
        .closest("label")
        .append(" — Môi trường thử nghiệm VNPay, không phải giao dịch thật");
  } catch (e) {
    form.querySelector("[value=online]").disabled = true;
  }
  if (bookingCode) {
    try {
      const r = await fetch(
          "../api/bookings/detail.php?code=" + encodeURIComponent(bookingCode),
          { credentials: "same-origin", cache: "no-store" },
        ),
        j = await r.json();
      if (!r.ok) throw Error(j.message);
      quote = j.data;
      button.disabled = false;
      message.textContent = "Đơn đã được lưu: " + bookingCode;
      root.querySelector("#checkout-price").textContent =
        "Tổng đã chốt: " + money(quote.total);
    } catch (e) {
      message.textContent = e.message;
    }
  } else await loadQuote();
})();
