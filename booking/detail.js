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
  let booking = null;
  const money = (n) => Number(n || 0).toLocaleString("vi-VN") + "₫";
  const date = (s) =>
    String(s || "")
      .split("-")
      .reverse()
      .join("/");
  const labels = {
    confirmed: "Đã xác nhận",
    pending: "Đang chờ thanh toán",
    checked_in: "Đã nhận phòng",
    completed: "Đã lưu trú",
    cancelled: "Đã hủy",
  };
  const info = (label, value) =>
    `<span><strong>${label}:</strong> ${safe(value || "—")}</span>`;
  function render() {
    const current = booking,
      st = current.status;
    root.innerHTML = `
 <article class="booking-card ${st === "cancelled" ? "is-cancelled" : ""}"><div class="booking-card__photo photo--${safe(current.city === "vungtau" ? "sea" : "pine")}"></div>
 <div class="booking-card__body"><div class="booking-card__top"><div><h3>${safe(current.hotelName)}</h3><span class="booking-card__addr">${safe(current.roomName)}</span></div><span class="badge badge--${safe(st)}">${safe(labels[st])}</span></div>
 <div class="booking-card__meta">${info("Mã đặt phòng", current.code)}${info("Người nhận phòng", current.guestName)}${info("Email", current.email)}${info("Điện thoại", current.phone)}${info("Nhận phòng", date(current.checkin))}${info("Trả phòng", date(current.checkout))}${info("Số đêm", current.nights)}${info("Số khách", current.guests)}${info("Số phòng", current.rooms || 1)}${info("Yêu cầu đặc biệt", current.note || "Không có")}${info("Hình thức thanh toán", { bank: "Chuyển khoản (demo)", card: "Thẻ (demo)", hotel: "Tại khách sạn", online: "VNPay", momo: "MoMo (demo)", zalopay: "ZaloPay (demo)", vnpay: "VNPAY (demo)" }[current.payMethod] || current.payMethod)}${info("Ngày tạo", date((current.createdAt || "").slice(0, 10)))}${info("Trạng thái hoàn tiền", { refund_requested: "Đang chờ hoàn tiền", refunded: "Đã hoàn tiền", paid_requires_review: "Cần đối soát" }[current.paymentStatus] || "Chưa có yêu cầu")}${info("Yêu cầu đổi ngày", "Liên hệ hỗ trợ nếu cần thay đổi ngày")}</div>
 <div class="booking-card__bottom"><div><div class="booking-card__price">${money(current.total)}</div><span class="booking-card__code">Đơn đặt phòng được lưu trên hệ thống.</span></div><div class="booking-card__actions"><a href="myBooking.html" class="btn-ghost">Quay lại</a><button type="button" class="btn-ghost" id="print-detail">In biên nhận</button>${current.canCancel ? `<button type="button" class="btn-danger" id="cancel-detail">Hủy phòng</button>` : ""}</div></div>
 
 </div></article>`;
    if (current.status === "pending" && current.payMethod === "online") {
      const button = document.createElement("button");
      button.className = "btn-solid";
      button.textContent = "Tiếp tục thanh toán VNPay";
      root.querySelector(".booking-card__actions").append(button);
      button.onclick = async () => {
        button.disabled = true;
        try {
          const r = await fetch("../api/payments/start.php", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
          const j = await r.json();
          if (!r.ok) throw Error(j.message);
          const u = new URL(j.data.url);
          if (
            !["sandbox.vnpayment.vn", "pay.vnpay.vn"].includes(u.hostname) ||
            u.protocol !== "https:"
          )
            throw Error("Liên kết không hợp lệ.");
          location.assign(u.href);
        } catch (e) {
          alert(e.message);
          button.disabled = false;
        }
      };
    }
    document
      .getElementById("print-detail")
      ?.addEventListener("click", () => window.print());
    document
      .getElementById("cancel-detail")
      ?.addEventListener("click", async (e) => {
        if (!confirm("Bạn muốn hủy đơn " + code + "?")) return;
        const btn = e.currentTarget;
        btn.disabled = true;
        try {
          const response = await fetch("../api/bookings/cancel.php", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
          const result = await response.json();
          if (!response.ok || result.status !== "success")
            throw Error(result.message || "Hủy thất bại");
          await loadDetail();
        } catch (err) {
          alert(err.message);
        } finally {
          btn.disabled = false;
        }
      });
  }
  async function loadDetail() {
    root.innerHTML = '<div class="empty">Đang tải chi tiết từ MySQL...</div>';
    try {
      const response = await fetch(
        "../api/bookings/detail.php?code=" + encodeURIComponent(code || ""),
        { credentials: "same-origin", cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok || result.status !== "success")
        throw Error(result.message || "Không tìm thấy đơn");
      booking = result.data;
      render();
    } catch (err) {
      root.innerHTML = `<div class="empty"><h3>Không tải được đơn</h3><p>${safe(err.message)}</p><a class="btn-solid" href="myBooking.html">Về danh sách</a></div>`;
    }
  }
  loadDetail();
})();
