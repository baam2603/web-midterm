/* Populate the original receipt markup from the authenticated SQL booking. */
(async () => {
  const main = document.querySelector(".success-page"),
    code = new URLSearchParams(location.search).get("code");
  try {
    const response = await fetch(
      "../api/bookings/detail.php?code=" + encodeURIComponent(code || ""),
      { credentials: "same-origin", cache: "no-store" },
    );
    const result = await response.json();
    if (!response.ok || result.status !== "success")
      throw Error(result.message || "Không tìm thấy đơn.");
    const b = result.data;
    const date = (s) => String(s).split("-").reverse().join("/");
    main.querySelector(".booking-card__id strong").textContent = "#" + b.code;
    const values = main.querySelectorAll(".detail-value");
    values[0].textContent = date(b.checkin) + " — " + date(b.checkout);
    values[1].textContent =
      "Nhận phòng tại quầy lễ tân theo chính sách khách sạn";
    main.querySelector(".success-header p").textContent =
      b.status === "cancelled"
        ? "Đơn đặt phòng này đã được hủy."
        : "Đơn đặt phòng đã được ghi nhận. Chưa thu tiền và chưa gửi email xác nhận.";
    main.querySelector(".booking-card__status span").textContent =
      {
        confirmed: "XÁC NHẬN ĐẶT PHÒNG",
        pending: "ĐANG CHỜ XÁC NHẬN",
        checked_in: "ĐÃ NHẬN PHÒNG",
        completed: "ĐÃ HOÀN TẤT",
        cancelled: "ĐÃ HỦY ĐƠN",
      }[b.status] || "THÔNG TIN ĐẶT PHÒNG";
    main.querySelector(".booking-card__note").textContent =
      `${b.hotelName} · ${b.roomName} · ${b.guests} khách · ${b.rooms} phòng. Tổng ${Number(b.total).toLocaleString("vi-VN")}₫. Vui lòng xuất trình giấy tờ hợp lệ khi nhận phòng.`;
    const buttons = main.querySelectorAll(".btn-action");
    buttons[0].onclick = () => {
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
    buttons[1].onclick = () =>
      location.assign(
        "../booking/detail.html?code=" + encodeURIComponent(b.code),
      );
  } catch (error) {
    main.querySelector(".success-header h1").textContent =
      "Không tải được đơn đặt phòng";
    main.querySelector(".success-header p").textContent = error.message;
    main.querySelector(".booking-card").hidden = true;
    const a = document.createElement("a");
    a.href = "../booking/myBooking.html";
    a.textContent = "Xem đặt phòng của tôi";
    main.querySelector(".success-header").append(a);
  }
})();
