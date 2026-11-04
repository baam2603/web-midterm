(async () => {
  "use strict";
  const root = document.querySelector(".success-page"),
    code = new URLSearchParams(location.search).get("code");
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
  let timer,
    attempt = 0;
  async function load() {
    try {
      const r = await fetch(
        "../api/bookings/detail.php?code=" + encodeURIComponent(code || ""),
        { credentials: "same-origin", cache: "no-store" },
      );
      const j = await r.json();
      if (!r.ok || j.status !== "success")
        throw Error(j.message || "Không tìm thấy đơn.");
      const b = j.data;
      const waiting = b.status === "pending" && b.payMethod === "online";
      root.innerHTML = `<div class="success-header"><h1>${waiting ? "Đang chờ xác nhận thanh toán" : b.paymentStatus === "paid" ? "Thanh toán thành công" : b.status === "cancelled" ? "Đơn đã hủy" : "Đã ghi nhận đặt phòng"}</h1><p>${waiting ? "Đang chờ VNPay xác nhận giao dịch. Vui lòng chưa thanh toán lại trong lúc chờ kết quả." : b.payMethod === "hotel" ? "Bạn thanh toán tại khách sạn theo chính sách đặt phòng." : esc({ paid: "Đã thanh toán.", failed: "Giao dịch chưa thành công.", expired: "Phiên thanh toán đã hết hạn.", refund_requested: "Yêu cầu hoàn tiền đang được xử lý.", refunded: "Đã hoàn tiền.", paid_requires_review: "Giao dịch cần đối soát. Vui lòng liên hệ hỗ trợ.", unpaid: "Chưa ghi nhận thanh toán." }[b.paymentStatus] || "Vui lòng xem chi tiết đơn để theo dõi trạng thái.")}</p></div><section class="booking-card"><div class="booking-card__body"><h2>${esc(b.hotelName)}</h2><p>Mã đơn: <strong>${esc(b.code)}</strong></p><p>${esc(b.roomName)} · ${b.rooms} phòng · ${b.guests} khách</p><p>${esc(b.checkin)} → ${esc(b.checkout)}</p><p>Tổng tiền: ${Number(b.total).toLocaleString("vi-VN")}₫</p><a class="btn-action" href="../booking/detail.html?code=${encodeURIComponent(b.code)}">Xem chi tiết đơn</a><a class="btn-action" href="../booking/myBooking.html">Đặt phòng của tôi</a><button class="btn-action" id="download-calendar">Lưu lịch</button></div></section>`;
      root.querySelector("#download-calendar").onclick = () => {
        const clean = (x) =>
          String(x)
            .replace(/\\/g, "\\\\")
            .replace(/\r?\n/g, "\\n")
            .replace(/[,;]/g, (m) => "\\" + m);
        const data = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//THREEK//Booking//VI",
          "BEGIN:VEVENT",
          "UID:" + b.code + "@threek",
          "DTSTAMP:" +
            new Date()
              .toISOString()
              .replace(/[-:]/g, "")
              .replace(/\.\d+Z$/, "Z"),
          "DTSTART;VALUE=DATE:" + b.checkin.replace(/-/g, ""),
          "DTEND;VALUE=DATE:" + b.checkout.replace(/-/g, ""),
          "SUMMARY:" + clean(b.hotelName),
          "DESCRIPTION:" + clean("Mã đơn " + b.code),
          "END:VEVENT",
          "END:VCALENDAR",
        ].join("\r\n");
        const url = URL.createObjectURL(
            new Blob([data], { type: "text/calendar;charset=utf-8" }),
          ),
          a = document.createElement("a");
        a.href = url;
        a.download = b.code + ".ics";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
      if (waiting && attempt++ < 10) timer = setTimeout(load, 3000);
    } catch (e) {
      root.innerHTML = `<div class="success-header"><h1>Không tải được đơn</h1><p>${esc(e.message)}</p><a href="../booking/myBooking.html">Xem đặt phòng của tôi</a></div>`;
    }
  }
  window.addEventListener("pagehide", () => clearTimeout(timer));
  await load();
})();
