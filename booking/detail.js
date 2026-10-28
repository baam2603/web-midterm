(function () {
  "use strict";
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
  const root = document.getElementById("booking-detail"),
    code = new URLSearchParams(location.search).get("code");
  const b = BookingStore.findVisible(code);
  if (!b) {
    root.innerHTML =
      '<div class="empty"><h3>Không tìm thấy mã đặt phòng</h3><p>Đơn có thể đã bị xóa hoặc được tạo ở trình duyệt khác.</p><a class="btn-solid" href="myBooking.html">Về danh sách</a></div>';
    return;
  }
  const money = (n) => Number(n || 0).toLocaleString("vi-VN") + "₫";
  const date = (s) =>
    String(s || "")
      .split("-")
      .reverse()
      .join("/");
  const status = BookingStore.status(b),
    labels = {
      confirmed: "Đã xác nhận (demo)",
      pending: "Đang chờ thanh toán (demo)",
      checked_in: "Đã nhận phòng",
      completed: "Đã lưu trú",
      cancelled: "Đã hủy",
    };
  const info = (label, value) =>
    `<span><strong>${label}:</strong> ${safe(value || "—")}</span>`;
  function render() {
    const current = BookingStore.findVisible(code),
      st = BookingStore.status(current);
    root.innerHTML = `
 <article class="booking-card ${st === "cancelled" ? "is-cancelled" : ""}"><div class="booking-card__photo photo--${safe(current.city === "vungtau" ? "sea" : "pine")}"></div>
 <div class="booking-card__body"><div class="booking-card__top"><div><h3>${safe(current.hotelName)}</h3><span class="booking-card__addr">${safe(current.roomName)}</span></div><span class="badge badge--${safe(st)}">${safe(labels[st])}</span></div>
 <div class="booking-card__meta">${info("Mã đặt phòng", current.code)}${info("Người nhận phòng", current.guestName)}${info("Email", current.email)}${info("Điện thoại", current.phone)}${info("Nhận phòng", date(current.checkin))}${info("Trả phòng", date(current.checkout))}${info("Số đêm", current.nights)}${info("Số khách", current.guests)}${info("Số phòng", current.rooms || 1)}${info("Hình thức thanh toán", { bank: "Chuyển khoản (demo)", card: "Thẻ (demo)", hotel: "Tại khách sạn", momo: "MoMo (demo)", zalopay: "ZaloPay (demo)", vnpay: "VNPAY (demo)" }[current.payMethod] || current.payMethod)}${info("Ngày tạo", date((current.createdAt || "").slice(0, 10)))}${info("Trạng thái hoàn tiền", current.refundStatus || "Chưa có yêu cầu")}${info("Yêu cầu đổi ngày", current.changeRequest ? `${date(current.changeRequest.checkin)} – ${date(current.changeRequest.checkout)} (${current.changeRequest.status})` : "Chưa có")}</div>
 <div class="booking-card__bottom"><div><div class="booking-card__price">${money(current.total)}</div><span class="booking-card__code">Đơn được lưu trong trình duyệt này, không phải đặt chỗ thật.</span></div><div class="booking-card__actions"><a href="myBooking.html" class="btn-ghost">Quay lại</a><button type="button" class="btn-ghost" id="print-detail">In biên nhận</button>${["confirmed", "pending"].includes(st) && current.checkin > new Date().toISOString().slice(0, 10) ? `<button class="btn-ghost" type="button" id="change-date-detail">Yêu cầu đổi ngày</button>` : ""}${st === "cancelled" && current.paymentStatus !== "pay-at-hotel-demo" && !current.refundStatus ? `<button type="button" class="btn-ghost" id="refund-detail">Yêu cầu hoàn tiền demo</button>` : ""}${["confirmed", "pending"].includes(st) && current.checkin > new Date().toISOString().slice(0, 10) && current.refundable !== false ? `<button type="button" class="btn-danger" id="cancel-detail">Hủy phòng</button>` : ""}</div></div>
 ${["confirmed", "pending"].includes(st) && current.checkin > new Date().toISOString().slice(0, 10) ? `<form class="tk-form tk-surface" id="change-date-form" hidden style="margin-top:16px"><h3>Yêu cầu đổi lịch lưu trú</h3><p class="tk-muted">Admin sẽ duyệt yêu cầu. Nếu được duyệt, số tiền mô phỏng sẽ tính lại theo số đêm, không có giao dịch tiền thật.</p><label>Nhận phòng mới<input type="date" name="checkin" required value="${safe(current.changeRequest?.checkin || current.checkin)}"></label><label>Trả phòng mới<input type="date" name="checkout" required value="${safe(current.changeRequest?.checkout || current.checkout)}"></label><button class="tk-primary">Gửi yêu cầu đổi ngày</button></form>` : ""}
 </div></article>`;
    document
      .getElementById("change-date-detail")
      ?.addEventListener("click", () => {
        const el = document.getElementById("change-date-form");
        if (el) el.hidden = !el.hidden;
      });
    document
      .getElementById("change-date-form")
      ?.addEventListener("submit", (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        try {
          BookingStore.requestChange(
            code,
            form.elements.checkin.value,
            form.elements.checkout.value,
          );
          render();
          alert(
            "Đã gửi yêu cầu đổi ngày demo. Xem kết quả sau khi Admin duyệt.",
          );
        } catch (err) {
          alert(err.message);
        }
      });
    document
      .getElementById("print-detail")
      ?.addEventListener("click", () => window.print());
    document.getElementById("refund-detail")?.addEventListener("click", () => {
      if (
        !confirm(
          "Gửi yêu cầu hoàn tiền MÔ PHỎNG? Không có tiền thực được chuyển.",
        )
      )
        return;
      try {
        BookingStore.requestRefund(code);
        render();
      } catch (e) {
        alert(e.message);
      }
    });
    const btn = document.getElementById("cancel-detail");
    if (btn)
      btn.addEventListener("click", () => {
        if (!confirm("Bạn muốn hủy đơn " + code + "?")) return;
        try {
          BookingStore.cancelVisible(code);
          render();
        } catch (e) {
          alert(e.message);
        }
      });
  }
  render();
})();
