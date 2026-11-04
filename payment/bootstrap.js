/* Load SQL data before rendering the original payment UI. */
(async () => {
  const root = document.getElementById("pay-root");
  async function detail(query, optional = false) {
    const response = await fetch("../api/bookings/detail.php?" + query, {
      credentials: "same-origin",
      cache: "no-store",
    });
    const result = await response.json();
    if (optional && response.status === 404) return null;
    if (!response.ok || result.status !== "success")
      throw Error(result.message || "Không tải được đơn đặt phòng.");
    return result.data;
  }
  try {
    const user = await window.authReady;
    if (!user) {
      location.replace(
        "../auth/login.html?next=" +
          encodeURIComponent(location.pathname + location.search),
      );
      return;
    }
    const code = new URLSearchParams(location.search).get("code");
    let draft = null,
      booking = null;
    if (code) booking = await detail(new URLSearchParams({ code }));
    else {
      try {
        draft = JSON.parse(sessionStorage.getItem("threek_checkout") || "null");
      } catch {}
      if (!draft)
        throw Error("Phiên đặt phòng đã hết hạn. Vui lòng chọn phòng lại.");
      if (draft.requestKey)
        booking = await detail(
          new URLSearchParams({ requestKey: draft.requestKey }),
          true,
        );
    }
    if (booking) {
      const names = String(booking.guestName || "")
          .trim()
          .split(/\s+/),
        firstName = names.pop() || "";
      draft = {
        city: booking.city,
        hotelId: booking.hotelId,
        roomId: booking.roomId,
        checkin: booking.checkin,
        checkout: booking.checkout,
        rooms: booking.rooms,
        guests: booking.guests,
        lastName: names.join(" "),
        firstName,
        email: booking.email,
        phone: booking.phone,
        note: booking.note,
        pay: booking.payMethod,
        code: booking.code,
        back: "../booking/myBooking.html",
      };
    } else await HotelDetailAPI.sync(draft);
    window.paymentDraft = draft;
    window.paymentBooking = booking;
    const script = document.createElement("script");
    script.src = "payment.js?v=20261104-original-ui";
    document.body.append(script);
  } catch (error) {
    root.textContent = error.message;
    const back = document.createElement("a");
    back.href = "../booking/myBooking.html";
    back.textContent = " Xem đặt phòng của tôi";
    root.append(back);
  }
})();
