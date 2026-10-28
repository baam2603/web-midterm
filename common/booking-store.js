/* Booking repository adapter for UI demo. Local data, not server-side inventory locking. */
(function () {
  "use strict";
  const KEY = "threek_bookings",
    GUEST = "threek_guest_access_v2";
  const all = () => {
    try {
      const a = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  };
  const write = (a) => {
    localStorage.setItem(KEY, JSON.stringify(a));
    if (typeof Event !== "undefined")
      window.dispatchEvent(new Event("threek:bookings-updated"));
  };
  const guestCodes = () => {
    try {
      return JSON.parse(sessionStorage.getItem(GUEST) || "[]");
    } catch {
      return [];
    }
  };
  const giveGuestAccess = (code) => {
    const list = guestCodes();
    if (!list.includes(code))
      sessionStorage.setItem(GUEST, JSON.stringify([...list, code]));
  };
  const user = () =>
    typeof getCurrentUser === "function" ? getCurrentUser() : null;
  const today = () => {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
  };
  const overlap = (a, b, c, d) => a < d && c < b;
  const status = (b) =>
    b.status === "confirmed" && b.checkout <= today() ? "completed" : b.status;
  const find = (code) => all().find((b) => b.code === code);
  function canAccess(b) {
    if (!b) return false;
    const u = user();
    if (u) return !!b.userId && b.userId === u.id;
    return !b.userId && guestCodes().includes(b.code);
  }
  const visible = () => all().filter(canAccess);
  function findVisible(code) {
    const b = find(code);
    return canAccess(b) ? b : null;
  }
  function verifyGuest(code, email, phone) {
    const b = find(String(code || "").trim());
    const e = String(email || "")
        .trim()
        .toLowerCase(),
      p = String(phone || "").replace(/\D/g, "");
    if (
      !b ||
      b.userId ||
      !e ||
      !p ||
      b.email?.trim().toLowerCase() !== e ||
      String(b.phone || "").replace(/\D/g, "") !== p
    )
      throw Error(
        "Thông tin tra cứu không khớp đơn đặt phòng dành cho khách vãng lai.",
      );
    if (user())
      throw Error("Vui lòng đăng xuất để tra cứu đơn khách vãng lai.");
    giveGuestAccess(b.code);
    return b;
  }
  function availability(
    city,
    id,
    room,
    checkin,
    checkout,
    stock = 5,
    ignoreCode = "",
  ) {
    if (!(checkin && checkout && checkin < checkout)) return 0;
    const count = all()
      .filter(
        (b) =>
          b.code !== ignoreCode &&
          b.city === city &&
          b.hotelId === id &&
          b.roomId === room &&
          ["confirmed", "pending", "checked_in"].includes(status(b)) &&
          overlap(b.checkin, b.checkout, checkin, checkout),
      )
      .reduce((n, b) => n + Math.max(1, Number(b.rooms) || 1), 0);
    return Math.max(
      0,
      Math.max(0, Number.isFinite(Number(stock)) ? Number(stock) : 5) - count,
    );
  }
  function save(record) {
    if (!record || !record.code || !record.hotelId || !record.roomId)
      throw Error("Thiếu dữ liệu đặt phòng.");
    const a = all(),
      existing = a.find((b) => b.code === record.code);
    if (existing) return existing;
    if (!(record.checkin >= today() && record.checkout > record.checkin))
      throw Error("Ngày lưu trú không hợp lệ.");
    if (!["pending", "confirmed"].includes(record.status))
      throw Error("Trạng thái tạo đơn không hợp lệ.");
    if (!Number.isInteger(Number(record.rooms)) || Number(record.rooms) < 1)
      throw Error("Số phòng không hợp lệ.");
    if (!record.userId) giveGuestAccess(record.code);
    a.push(record);
    write(a);
    window.ThreeKData?.alertUser(
      record.userId,
      "booking",
      "Đã nhận yêu cầu đặt phòng",
      `${record.hotelName} · Mã ${record.code}`,
      record.code,
    );
    return record;
  }
  function cancel(code) {
    const a = all(),
      b = a.find((x) => x.code === code);
    if (!b) throw Error("Không tìm thấy đơn.");
    if (!["confirmed", "pending"].includes(status(b)))
      throw Error("Không thể hủy đơn ở trạng thái này.");
    if (b.checkin <= today())
      throw Error("Không thể hủy khi đã đến ngày nhận phòng.");
    if (b.refundable === false)
      throw Error("Phòng này không hỗ trợ hủy trên giao diện demo.");
    b.status = "cancelled";
    b.cancelledAt = new Date().toISOString();
    write(a);
    window.ThreeKData?.alertUser(
      b.userId,
      "booking",
      "Đơn đã hủy",
      `Mã đơn ${b.code} đã hủy (mô phỏng).`,
      b.code,
    );
    return b;
  }
  function cancelVisible(code) {
    const b = findVisible(code);
    if (!b) throw Error("Bạn không có quyền thao tác với đơn này.");
    return cancel(code);
  }
  const transitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["checked_in", "completed", "cancelled"],
    checked_in: ["completed"],
    completed: [],
    cancelled: [],
    refunded: [],
  };
  function adminSetStatus(code, next) {
    const a = all(),
      b = a.find((x) => x.code === code);
    if (!b) throw Error("Không tìm thấy đơn.");
    const old = status(b);
    if (!(transitions[old] || []).includes(next))
      throw Error(`Không thể chuyển trạng thái ${old} sang ${next}.`);
    if (next === "cancelled" && old === "checked_in")
      throw Error("Đã nhận phòng không thể hủy.");
    b.status = next;
    b.updatedAt = new Date().toISOString();
    write(a);
    window.ThreeKData?.alertUser(
      b.userId,
      "booking",
      "Cập nhật đơn " + b.code,
      `Trạng thái mới: ${next}`,
      b.code,
    );
    window.ThreeKData?.audit("booking." + next, b.code);
    return b;
  }
  function requestChange(code, checkin, checkout) {
    const b = findVisible(code);
    if (!b || !["confirmed", "pending"].includes(status(b)))
      throw Error("Đơn này không còn cho phép yêu cầu đổi ngày.");
    if (!(checkin > today() && checkout > checkin))
      throw Error(
        "Ngày ở mới phải trong tương lai và trả phòng sau nhận phòng.",
      );
    if (b.changeRequest?.status === "pending")
      throw Error("Đã có yêu cầu thay đổi đang chờ duyệt.");
    const nights = Math.round(
      (Date.parse(checkout + "T12:00:00") - Date.parse(checkin + "T12:00:00")) /
        86400000,
    );
    if (nights < 1 || nights > 30)
      throw Error("Kỳ lưu trú mới cần từ 1 đến 30 đêm.");
    const a = all(),
      x = a.find((t) => t.code === code);
    x.changeRequest = {
      checkin,
      checkout,
      nights,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };
    write(a);
    return x;
  }
  function adminChangeDecision(code, decision, stock) {
    if (!["approved", "rejected"].includes(decision))
      throw Error("Trạng thái quyết định không hợp lệ.");
    const a = all(),
      b = a.find((x) => x.code === code);
    if (!b || b.changeRequest?.status !== "pending")
      throw Error("Không có yêu cầu đổi ngày đang chờ.");
    if (!["confirmed", "pending"].includes(status(b)))
      throw Error("Đơn không còn ở trạng thái có thể đổi ngày.");
    const req = b.changeRequest;
    if (decision === "approved") {
      if (
        availability(
          b.city,
          b.hotelId,
          b.roomId,
          req.checkin,
          req.checkout,
          stock,
          b.code,
        ) < Number(b.rooms || 1)
      )
        throw Error("Không đủ phòng trống cho lịch mới.");
      // DEMO QUOTE: pro-rate the original total. Backend MUST requote by nightly rates, tax, coupons, policy.
      const originalNights = Math.max(
        1,
        Number(b.nights) ||
          Math.round(
            (Date.parse(b.checkout) - Date.parse(b.checkin)) / 86400000,
          ),
      );
      b.total = Math.round(
        (Number(b.total || 0) / originalNights) * req.nights,
      );
      b.nights = req.nights;
      b.checkin = req.checkin;
      b.checkout = req.checkout;
    }
    req.status = decision;
    req.decidedAt = new Date().toISOString();
    write(a);
    window.ThreeKData?.alertUser(
      b.userId,
      "booking",
      "Yêu cầu đổi ngày " +
        (decision === "approved" ? "được duyệt" : "bị từ chối"),
      `Mã ${b.code}: ${decision === "approved" ? "lịch lưu trú đã cập nhật, giá demo tính theo số đêm" : "lịch lưu trú giữ nguyên"}.`,
      b.code,
    );
    window.ThreeKData?.audit("booking.change." + decision, code);
    return b;
  }
  function requestRefund(code) {
    const b = findVisible(code);
    if (
      !b ||
      b.status !== "cancelled" ||
      b.paymentStatus === "pay-at-hotel-demo"
    )
      throw Error("Đơn này không có yêu cầu hoàn tiền demo hợp lệ.");
    const a = all(),
      x = a.find((i) => i.code === code);
    x.refundStatus = "requested";
    write(a);
    return x;
  }
  function adminRefund(code) {
    const a = all(),
      b = a.find((x) => x.code === code);
    if (!b || b.status !== "cancelled" || b.refundStatus !== "requested")
      throw Error("Đơn chưa có yêu cầu hoàn tiền demo hợp lệ.");
    b.refundStatus = "refunded-demo";
    write(a);
    window.ThreeKData?.alertUser(
      b.userId,
      "booking",
      "Hoàn tiền mô phỏng",
      `Đơn ${code} đã được cập nhật trạng thái hoàn tiền demo.`,
      code,
    );
    return b;
  }
  window.BookingStore = {
    all,
    visible,
    find,
    findVisible,
    canAccess,
    verifyGuest,
    giveGuestAccess,
    save,
    cancel,
    cancelVisible,
    status,
    availability,
    adminSetStatus,
    requestChange,
    adminChangeDecision,
    requestRefund,
    adminRefund,
  };
})();
