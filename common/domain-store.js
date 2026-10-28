/* THREEK UI domain adapter (localStorage demo). Replace these methods with API calls later.
   NEVER trust localStorage role/account/payment data in a real backend. */
(function () {
  "use strict";
  const KEY = "threek_domain_v2";
  const esc = (v) =>
    String(v ?? "").replace(
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
  const blank = () => ({
    hotels: {},
    customHotels: [],
    reviews: [],
    tickets: [],
    notifications: [],
    audit: [],
  });
  const read = () => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "null");
      return d && typeof d === "object" ? { ...blank(), ...d } : blank();
    } catch {
      return blank();
    }
  };
  const write = (data) => {
    localStorage.setItem(KEY, JSON.stringify(data));
    if (typeof dispatchEvent === "function" && typeof Event !== "undefined")
      window.dispatchEvent(new Event("threek:domain-updated"));
  };
  const uid = (p) =>
    p +
    "-" +
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const current = () =>
    typeof getCurrentUser === "function" ? getCurrentUser() : null;
  function audit(action, ref) {
    const db = read();
    db.audit.unshift({ action, ref, at: new Date().toISOString() });
    db.audit = db.audit.slice(0, 100);
    write(db);
  }
  function alertUser(userId, type, title, message, code) {
    if (!userId) return;
    const db = read();
    db.notifications.unshift({
      id: uid("N"),
      userId,
      type,
      title,
      message,
      code: code || "",
      read: false,
      at: new Date().toISOString(),
    });
    write(db);
  }
  function notifications() {
    const user = current();
    return user ? read().notifications.filter((n) => n.userId === user.id) : [];
  }
  function markRead(id) {
    const u = current();
    if (!u) throw Error("Cần đăng nhập.");
    const d = read(),
      n = d.notifications.find((x) => x.id === id && x.userId === u.id);
    if (!n) throw Error("Không tìm thấy thông báo.");
    n.read = true;
    write(d);
  }
  function getHotel(city, id) {
    return read().hotels[city + "/" + id] || {};
  }
  function setHotel(city, id, patch) {
    const db = read(),
      key = city + "/" + id,
      old = db.hotels[key] || {};
    const update = { ...old };
    if (patch.name !== undefined) {
      const s = String(patch.name).trim();
      if (s.length < 3 || s.length > 100)
        throw Error("Tên khách sạn cần 3–100 ký tự.");
      update.name = s;
    }
    if (patch.hidden !== undefined) update.hidden = !!patch.hidden;
    if (patch.description !== undefined)
      update.description = String(patch.description).slice(0, 500);
    db.hotels[key] = update;
    write(db);
    audit("hotel.updated", key);
    return update;
  }
  function setRoom(city, id, roomId, patch) {
    const db = read(),
      key = city + "/" + id,
      hotel = db.hotels[key] || {},
      rooms = { ...(hotel.rooms || {}) },
      room = { ...(rooms[roomId] || {}) };
    if (patch.price !== undefined) {
      const n = Number(patch.price);
      if (!Number.isFinite(n) || n < 100000 || n > 100000000)
        throw Error("Giá mỗi đêm phải từ 100.000 đến 100.000.000đ.");
      room.price = Math.round(n);
    }
    if (patch.stock !== undefined) {
      const n = Number(patch.stock);
      if (!Number.isInteger(n) || n < 0 || n > 999)
        throw Error("Tồn phòng phải là số nguyên từ 0–999.");
      room.stock = n;
    }
    if (patch.closed !== undefined) room.closed = !!patch.closed;
    rooms[roomId] = room;
    db.hotels[key] = { ...hotel, rooms };
    write(db);
    audit("room.updated", key + "/" + roomId);
    return room;
  }
  function createHotel(input) {
    const city = String(input.city || ""),
      name = String(input.name || "").trim(),
      address = String(input.address || "").trim();
    const price = Number(input.price),
      stock = Number(input.stock),
      guests = Number(input.guests);
    if (
      !["dalat", "vungtau"].includes(city) ||
      name.length < 3 ||
      address.length < 5 ||
      !Number.isFinite(price) ||
      price < 100000 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      stock > 999 ||
      !Number.isInteger(guests) ||
      guests < 1 ||
      guests > 12
    )
      throw Error(
        "Vui lòng nhập đủ thành phố, tên, địa chỉ, giá, tồn phòng và sức chứa hợp lệ.",
      );
    const db = read(),
      id =
        "custom-" +
        uid("hotel")
          .replace(/[^a-z0-9-]/gi, "")
          .toLowerCase();
    db.customHotels.push({
      city,
      id,
      name,
      address,
      price,
      stock,
      guests,
      createdAt: new Date().toISOString(),
    });
    write(db);
    audit("hotel.created", city + "/" + id);
    return id;
  }
  function deleteHotel(city, id) {
    const db = read(),
      found = db.customHotels.find((x) => x.city === city && x.id === id);
    if (!found) throw Error("Chỉ xóa được khách sạn được tạo trong demo.");
    if (
      window.BookingStore?.all().some(
        (b) => b.city === city && b.hotelId === id,
      )
    )
      throw Error("Khách sạn đã có đặt phòng, hãy chuyển sang trạng thái ẩn.");
    db.customHotels = db.customHotels.filter((x) => x !== found);
    delete db.hotels[city + "/" + id];
    if (window.CITY_DATA?.[city])
      window.CITY_DATA[city].hotels = window.CITY_DATA[city].hotels.filter(
        (h) => h.id !== id,
      );
    if (window.HOTELS?.[city]) delete window.HOTELS[city][id];
    write(db);
    audit("hotel.deleted", city + "/" + id);
  }
  function applyCatalog() {
    const cats = window.CITY_DATA || {},
      full = window.HOTELS || {},
      db = read();
    for (const x of db.customHotels || []) {
      const c = cats[x.city];
      if (!c) continue;
      const h = {
        id: x.id,
        name: x.name,
        address: x.address,
        type: "hotel",
        stars: 3,
        streets: [],
        zones: [],
        price: x.price,
        score: 0,
        reviews: 0,
        capacity: x.guests,
        amenities: ["wifi"],
        photo: x.city === "dalat" ? "pine" : "sea",
        lat: c.lat,
        lng: c.lng,
      };
      if (!(c.hotels || []).some((a) => a.id === x.id)) c.hotels.push(h);
      if (full[x.city] && !full[x.city][x.id]) {
        const img =
          "../sources/" + (x.city === "dalat" ? "dalat1.jpg" : "vungtau.jpg");
        full[x.city][x.id] = {
          name: x.name,
          stars: 3,
          address: x.address,
          rating: 0,
          ratingLabel: "Chưa có đánh giá",
          reviewCount: 0,
          priceFrom: x.price,
          images: Array(6).fill(img),
          intro: "Khách sạn mới được tạo trong giao diện quản trị demo.",
          facts: [
            { icon: "login", label: "Nhận phòng", value: "Từ 14:00" },
            { icon: "logout", label: "Trả phòng", value: "Trước 12:00" },
          ],
          amenities: [{ icon: "wifi", label: "Wifi miễn phí" }],
          rules: ["Thông tin là dữ liệu demo."],
          nearby: [],
          rooms: [
            {
              id: "standard",
              name: "Phòng tiêu chuẩn",
              image: img,
              area: 25,
              bed: "Giường đôi",
              guests: x.guests,
              features: [{ icon: "wifi", label: "Wifi" }],
              breakfast: false,
              refundable: true,
              price: x.price,
              left: x.stock,
            },
          ],
        };
      }
    }
    for (const [city, c] of Object.entries(cats))
      for (const h of c.hotels || []) {
        const o = db.hotels[city + "/" + h.id];
        if (!o) continue;
        if (o.name) h.name = o.name;
        h.hidden = !!o.hidden;
        const detail = full[city]?.[h.id];
        if (detail) {
          if (o.name) detail.name = o.name;
          if (o.description) detail.intro = o.description;
          detail.hidden = !!o.hidden;
          for (const room of detail.rooms || []) {
            const r = o.rooms?.[room.id];
            if (!r) continue;
            if (r.price !== undefined) room.price = r.price;
            if (r.stock !== undefined) room.left = r.stock;
            if (r.closed !== undefined) room.closed = !!r.closed;
          }
          const prices = (detail.rooms || [])
            .filter((r) => !r.closed && Number(r.left ?? 5) > 0)
            .map((r) => r.price);
          if (prices.length) {
            h.price = Math.min(...prices);
            detail.priceFrom = h.price;
          }
        }
      }
  }
  function approvedReviews(city, id) {
    return read()
      .reviews.filter(
        (x) => x.city === city && x.hotelId === id && x.status === "approved",
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  function reviewsForAdmin() {
    return read()
      .reviews.slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  function submitReview(input) {
    const user = current();
    if (!user) throw Error("Đăng nhập để đánh giá.");
    const B = window.BookingStore;
    const booking = B?.find(input.code);
    if (
      !booking ||
      booking.userId !== user.id ||
      B.status(booking) !== "completed"
    )
      throw Error("Chỉ khách đã hoàn tất kỳ lưu trú mới được đánh giá.");
    if (booking.city !== input.city || booking.hotelId !== input.hotelId)
      throw Error("Đơn không thuộc khách sạn này.");
    const score = Number(input.score),
      comment = String(input.comment || "").trim();
    if (
      !Number.isInteger(score) ||
      score < 1 ||
      score > 5 ||
      comment.length < 15 ||
      comment.length > 1500
    )
      throw Error("Chọn 1–5 sao và nội dung 15–1500 ký tự.");
    const db = read();
    if (db.reviews.some((r) => r.code === booking.code))
      throw Error("Đơn lưu trú này đã được đánh giá.");
    db.reviews.push({
      id: uid("R"),
      code: booking.code,
      city: booking.city,
      hotelId: booking.hotelId,
      userId: user.id,
      author: user.displayName || user.name,
      score,
      comment,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    write(db);
    audit("review.created", booking.code);
    return true;
  }
  function moderateReview(id, status) {
    if (!["approved", "rejected"].includes(status))
      throw Error("Trạng thái không hợp lệ.");
    const db = read(),
      r = db.reviews.find((x) => x.id === id);
    if (!r) throw Error("Không tìm thấy đánh giá.");
    r.status = status;
    write(db);
    alertUser(
      r.userId,
      "review",
      "Kết quả duyệt đánh giá",
      status === "approved"
        ? "Đánh giá của bạn đã được hiển thị."
        : "Đánh giá chưa được duyệt.",
      r.code,
    );
    audit("review." + status, id);
  }
  function createTicket(input) {
    const name = String(input.name || "").trim(),
      email = String(input.email || "")
        .trim()
        .toLowerCase(),
      message = String(input.message || "").trim();
    if (
      name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      message.length < 15 ||
      message.length > 3000
    )
      throw Error("Nhập họ tên, email hợp lệ và nội dung từ 15–3000 ký tự.");
    const db = read(),
      u = current();
    const item = {
      id: uid("S"),
      name,
      email,
      message,
      topic: String(input.topic || "Khác"),
      code: String(input.code || "").trim(),
      userId: u?.id || null,
      status: "open",
      reply: "",
      createdAt: new Date().toISOString(),
    };
    db.tickets.push(item);
    write(db);
    audit("ticket.created", item.id);
    return item;
  }
  function ticketsForUser() {
    const u = current();
    return u ? read().tickets.filter((t) => t.userId === u.id) : [];
  }
  function answerTicket(id, reply) {
    const db = read(),
      t = db.tickets.find((x) => x.id === id);
    if (!t) throw Error("Không tìm thấy yêu cầu.");
    reply = String(reply || "").trim();
    if (reply.length < 5) throw Error("Nội dung phản hồi quá ngắn.");
    t.reply = reply;
    t.status = "answered";
    t.answeredAt = new Date().toISOString();
    write(db);
    alertUser(t.userId, "support", "Hỗ trợ đã phản hồi", reply, t.code);
    audit("ticket.answered", id);
  }
  function history() {
    return read().audit;
  }
  window.ThreeKData = {
    read,
    esc,
    uid,
    current,
    audit,
    alertUser,
    notifications,
    markRead,
    getHotel,
    setHotel,
    setRoom,
    createHotel,
    deleteHotel,
    applyCatalog,
    approvedReviews,
    reviewsForAdmin,
    submitReview,
    moderateReview,
    createTicket,
    ticketsForUser,
    answerTicket,
    history,
  };
})();
