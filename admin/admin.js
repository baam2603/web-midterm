/* Admin FRONTEND DEMO ONLY. No authentication or role security: replace with server admin APIs. */
(function () {
  "use strict";
  const access = "threek_demo_admin_mode",
    gate = document.getElementById("tk-admin-gate"),
    app = document.getElementById("tk-admin-app"),
    tabs = document.getElementById("tk-admin-tabs"),
    content = document.getElementById("tk-admin-content"),
    kpis = document.getElementById("tk-kpis");
  const esc = ThreeKData.esc,
    money = (n) => Number(n || 0).toLocaleString("vi-VN") + "₫",
    date = (s) =>
      String(s || "")
        .split("T")[0]
        .split("-")
        .reverse()
        .join("/");
  const labels = {
    pending: "Chờ thanh toán",
    confirmed: "Đã xác nhận",
    checked_in: "Đã nhận phòng",
    completed: "Đã lưu trú",
    cancelled: "Đã hủy",
  };
  const ids = [
    ["overview", "Tổng quan"],
    ["hotels", "Khách sạn"],
    ["rooms", "Phòng & giá"],
    ["calendar", "Lịch trống"],
    ["bookings", "Đặt phòng"],
    ["reviews", "Đánh giá"],
    ["support", "Hỗ trợ"],
    ["audit", "Nhật ký"],
  ];
  let tab = location.hash.slice(1) || "overview";
  if (!ids.some((i) => i[0] === tab)) tab = "overview";
  function active() {
    return sessionStorage.getItem(access) === "on";
  }
  function show() {
    gate.hidden = active();
    app.hidden = !active();
    if (active()) render();
  }
  document.getElementById("tk-enter-admin").addEventListener("click", () => {
    sessionStorage.setItem(access, "on");
    show();
  });
  const hotels = () =>
    Object.entries(CITY_DATA).flatMap(([city, c]) =>
      (c.hotels || []).map((h) => ({
        ...h,
        city,
        roomList: HOTELS[city]?.[h.id]?.rooms || [],
      })),
    );
  const statusTag = (v) =>
    `<span class="tk-pill ${["cancelled", "rejected"].includes(v) ? "bad" : ["pending", "open"].includes(v) ? "warn" : ""}">${esc(labels[v] || v || "—")}</span>`;
  const hotelName = (city, id) => HOTELS[city]?.[id]?.name || id;
  function table(head, body) {
    return `<div class="tk-surface tk-tablewrap"><table class="tk-table"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${body || `<tr><td colspan="${head.length}" class="tk-empty">Chưa có dữ liệu trong trình duyệt này.</td></tr>`}</tbody></table></div>`;
  }
  function feedback(message, error = false) {
    let el = document.getElementById("tk-admin-feedback");
    if (!el) {
      el = document.createElement("p");
      el.id = "tk-admin-feedback";
      el.className = "tk-feedback";
      content.prepend(el);
    }
    el.dataset.error = String(error);
    el.textContent = message;
    el.scrollIntoView({ block: "nearest" });
  }
  function stats() {
    const all = BookingStore.all(),
      active = all.filter((b) =>
        ["pending", "confirmed", "checked_in"].includes(BookingStore.status(b)),
      ),
      done = all.filter((b) => BookingStore.status(b) === "completed");
    return [
      {
        title: "Khách sạn đang hiển thị",
        value: hotels().filter((h) => !h.hidden).length,
      },
      { title: "Đơn đang hoạt động", value: active.length },
      { title: "Đơn hoàn tất", value: done.length },
      {
        title: "Giá trị đặt phòng demo",
        value: money(
          all
            .filter((b) => b.status !== "cancelled")
            .reduce((v, b) => v + Number(b.total || 0), 0),
        ),
      },
    ];
  }
  function nav() {
    tabs.innerHTML = ids
      .map(
        ([id, label]) =>
          `<button class="tk-tab ${id === tab ? "active" : ""}" data-tab="${id}" role="tab" aria-selected="${id === tab}">${label}</button>`,
      )
      .join("");
  }
  function overview() {
    const all = BookingStore.all().slice().reverse().slice(0, 5),
      review = ThreeKData.reviewsForAdmin().filter(
        (r) => r.status === "pending",
      ).length,
      tickets = ThreeKData.read().tickets.filter(
        (t) => t.status === "open",
      ).length;
    return `<div class="tk-grid"><div class="tk-surface"><h2>Cần xử lý</h2><p>${review} đánh giá chờ duyệt</p><p>${tickets} yêu cầu hỗ trợ chưa phản hồi</p><p>${BookingStore.all().filter((x) => x.status === "pending").length} đơn chờ thanh toán</p><div class="tk-alert">Đây là dữ liệu trên <strong>trình duyệt hiện tại</strong>. Không phải dữ liệu toàn hệ thống và không tự đồng bộ đa thiết bị.</div></div><div class="tk-surface"><h2>Luồng vận hành</h2><p>1. Khách chọn ngày, phòng và tạo đơn.</p><p>2. Admin kiểm tra, xác nhận hoặc xử lý hủy.</p><p>3. Admin cập nhật tồn kho và giá mới.</p><p>4. Khách hoàn tất lưu trú và gửi đánh giá.</p></div></div><h2 style="margin-top:24px">Đơn gần nhất</h2>${table(["Mã đơn", "Khách sạn", "Khách", "Trạng thái", "Tổng tiền"], all.map((b) => `<tr><td>${esc(b.code)}</td><td>${esc(b.hotelName)}</td><td>${esc(b.guestName)}</td><td>${statusTag(BookingStore.status(b))}</td><td>${money(b.total)}</td></tr>`).join(""))}`;
  }
  function hotelTab() {
    return `<div class="tk-flexcols"><section class="tk-surface"><h2>Thêm khách sạn demo</h2><form id="tk-create-hotel" class="tk-form"><label>Điểm đến<select name="city"><option value="dalat">Đà Lạt</option><option value="vungtau">Vũng Tàu</option></select></label><label>Tên khách sạn<input name="name" required minlength="3" maxlength="100" placeholder="Tên khách sạn"></label><label>Địa chỉ<input name="address" required minlength="5"></label><label>Giá phòng tiêu chuẩn (VNĐ)<input type="number" name="price" min="100000" step="10000" value="850000" required></label><div class="tk-flexcols"><label>Số phòng<input type="number" name="stock" min="0" max="999" value="5" required></label><label>Khách/phòng<input type="number" name="guests" min="1" max="12" value="2" required></label></div><button class="tk-primary">+ Thêm khách sạn</button></form></section><section class="tk-surface"><h2>Chỉnh sửa khách sạn</h2><form id="tk-edit-hotel" class="tk-form"><label>Khách sạn<select id="tk-hotel-picker" name="key">${hotels()
      .map(
        (h) =>
          `<option value="${esc(h.city + "/" + h.id)}">${esc(h.name)} · ${h.city === "dalat" ? "Đà Lạt" : "Vũng Tàu"}</option>`,
      )
      .join(
        "",
      )}</select></label><label>Tên hiển thị<input name="name" required minlength="3" maxlength="100"></label><label><input type="checkbox" name="hidden" style="width:auto"> Ẩn khỏi danh sách khách hàng</label><button class="tk-primary">Lưu chỉnh sửa</button><button class="tk-danger" type="button" id="tk-delete-hotel">Xóa khách sạn demo mới (nếu chưa có đơn)</button></form></section></div><h2 style="margin-top:24px">Danh sách khách sạn</h2>${table(
      ["Khách sạn", "Điểm đến", "Loại phòng", "Từ/đêm", "Hiển thị"],
      hotels()
        .map(
          (h) =>
            `<tr><td><strong>${esc(h.name)}</strong><span class="tk-mini">${esc(h.id)}</span></td><td>${h.city === "dalat" ? "Đà Lạt" : "Vũng Tàu"}</td><td>${h.roomList.length}</td><td>${money(h.price)}</td><td>${statusTag(h.hidden ? "Đang ẩn" : "Đang hiển thị")}</td></tr>`,
        )
        .join(""),
    )}`;
  }
  function roomTab() {
    return `<div class="tk-surface"><h2>Quản lý từng loại phòng</h2><p class="tk-muted">Giá và tồn phòng mới có hiệu lực trên trang khách hàng sau khi lưu. Đơn đã đặt giữ nguyên số tiền tại thời điểm tạo.</p><form id="tk-edit-room" class="tk-form"><label>Khách sạn<select id="tk-room-hotel" name="hotel">${hotels()
      .map(
        (h) =>
          `<option value="${esc(h.city + "/" + h.id)}">${esc(h.name)} (${h.city === "dalat" ? "Đà Lạt" : "Vũng Tàu"})</option>`,
      )
      .join(
        "",
      )}</select></label><label>Loại phòng<select name="room" id="tk-room-picker"></select></label><div class="tk-flexcols"><label>Giá/đêm (VNĐ)<input name="price" type="number" min="100000" step="10000" required></label><label>Tổng số phòng có thể bán<input name="stock" type="number" min="0" max="999" required></label></div><label><input type="checkbox" name="closed" style="width:auto"> Ngừng bán loại phòng này</label><button class="tk-primary">Lưu giá và tồn phòng</button></form></div><h2 style="margin-top:24px">Các loại phòng</h2>${table(
      ["Khách sạn", "Phòng", "Giá", "Tồn kho", "Bán"],
      hotels()
        .flatMap((h) =>
          h.roomList.map(
            (r) =>
              `<tr><td>${esc(h.name)}</td><td>${esc(r.name)}</td><td>${money(r.price)}</td><td>${Number(r.left ?? 5)}</td><td>${statusTag(r.closed ? "Tạm ngừng" : "Đang bán")}</td></tr>`,
          ),
        )
        .join(""),
    )}`;
  }
  function calendarTab() {
    return `<div class="tk-surface"><h2>Kiểm tra tồn phòng theo ngày</h2><p class="tk-muted">Đã trừ số phòng của đơn đang chờ, đã xác nhận hoặc đang lưu trú có ngày giao nhau. Đây không phải hệ thống khóa phòng đồng thời.</p><form id="tk-calendar-form" class="tk-form"><div class="tk-flexcols"><label>Nhận phòng<input name="checkin" type="date" required></label><label>Trả phòng<input name="checkout" type="date" required></label></div><button class="tk-outline">Xem phòng còn trống</button></form><div id="tk-calendar-results"></div></div>`;
  }
  function bookingTab() {
    const all = BookingStore.all()
      .slice()
      .sort((a, b) =>
        String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
      );
    return `<div class="tk-surface"><h2>Danh sách và trạng thái đơn</h2><p class="tk-muted">Thao tác xác nhận, nhận phòng, hoàn tất và hủy đơn chỉ là thay đổi trạng thái trong trình duyệt. Không thu hay hoàn tiền thật.</p><label class="tk-form">Tìm theo mã đơn, khách hoặc tên khách sạn<input class="tk-filter" id="tk-booking-filter" placeholder="Tìm đơn..."></label></div><div id="tk-booking-results">${bookingRows(all)}</div>`;
  }
  function bookingRows(all) {
    const next = {
      pending: [
        ["confirmed", "Xác nhận"],
        ["cancelled", "Hủy"],
      ],
      confirmed: [
        ["checked_in", "Nhận phòng"],
        ["completed", "Hoàn tất"],
        ["cancelled", "Hủy"],
      ],
      checked_in: [["completed", "Hoàn tất"]],
      completed: [],
      cancelled: [],
    };
    return table(
      [
        "Mã đơn / Khách",
        "Khách sạn / Phòng",
        "Thời gian",
        "Trạng thái",
        "Tổng tiền",
        "Thao tác",
      ],
      all
        .map((b) => {
          const st = BookingStore.status(b);
          return `<tr><td><strong>${esc(b.code)}</strong><span class="tk-mini">${esc(b.guestName || "")}<br>${esc(b.email || "")}</span></td><td>${esc(b.hotelName)}<span class="tk-mini">${esc(b.roomName)} · ${Number(b.rooms) || 1} phòng</span></td><td>${date(b.checkin)} – ${date(b.checkout)}</td><td>${statusTag(st)}${b.refundStatus ? `<span class="tk-mini">Hoàn tiền: ${esc(b.refundStatus)}</span>` : ""}</td><td>${money(b.total)}</td><td><div class="tk-actions">${(next[st] || []).map(([value, label]) => `<button type="button" class="${value === "cancelled" ? "tk-danger" : "tk-outline"}" data-order="${esc(b.code)}" data-next="${value}">${label}</button>`).join("")}${b.changeRequest?.status === "pending" ? `<div class="tk-mini">Yêu cầu đổi: ${date(b.changeRequest.checkin)} – ${date(b.changeRequest.checkout)}</div><button class="tk-outline" data-change="${esc(b.code)}" data-decision="approved">Duyệt đổi ngày</button><button class="tk-danger" data-change="${esc(b.code)}" data-decision="rejected">Từ chối</button>` : ""}${st === "cancelled" && b.refundStatus === "requested" ? `<button class="tk-primary" data-refund="${esc(b.code)}">Đã hoàn tiền demo</button>` : ""}</div></td></tr>`;
        })
        .join(""),
    );
  }
  function reviewsTab() {
    return `<h2>Duyệt đánh giá</h2><p class="tk-muted">Chỉ tài khoản có đơn đã lưu trú mới được gửi đánh giá. Đánh giá chưa duyệt không hiển thị công khai.</p>${table(
      ["Người gửi", "Khách sạn", "Đánh giá", "Trạng thái", "Thao tác"],
      ThreeKData.reviewsForAdmin()
        .map(
          (r) =>
            `<tr><td>${esc(r.author)}<span class="tk-mini">${date(r.createdAt)}</span></td><td>${esc(hotelName(r.city, r.hotelId))}</td><td><span class="tk-rating">${"★".repeat(r.score)}</span><p>${esc(r.comment)}</p></td><td>${statusTag(r.status)}</td><td><div class="tk-actions">${r.status === "pending" ? `<button class="tk-outline" data-review="${esc(r.id)}" data-moderate="approved">Duyệt</button><button class="tk-danger" data-review="${esc(r.id)}" data-moderate="rejected">Từ chối</button>` : "Đã xử lý"}</div></td></tr>`,
        )
        .join(""),
    )}`;
  }
  function supportTab() {
    const all = ThreeKData.read().tickets.slice().reverse();
    return `<h2>Yêu cầu hỗ trợ</h2>${all.length ? all.map((t) => `<article class="tk-surface"><div class="tk-row"><h3>${esc(t.topic)} · ${esc(t.name)}</h3>${statusTag(t.status)}</div><span class="tk-mini">${esc(t.email)} · ${date(t.createdAt)} · ${esc(t.id)}</span><p>${esc(t.message)}</p>${t.code ? `<p>Mã đơn được cung cấp: ${esc(t.code)}</p>` : ""}${t.reply ? `<p><strong>Đã phản hồi:</strong> ${esc(t.reply)}</p>` : `<form class="tk-form" data-ticket="${esc(t.id)}"><label>Phản hồi hỗ trợ demo<textarea name="reply" minlength="5" required placeholder="Nội dung trả lời (không gửi email thật)"></textarea></label><button class="tk-primary">Đánh dấu đã trả lời</button></form>`}</article>`).join("") : '<div class="tk-surface tk-empty">Chưa có yêu cầu hỗ trợ demo nào.</div>'}`;
  }
  function auditTab() {
    return `<h2>Nhật ký thao tác trong trình duyệt</h2>${table(
      ["Thời gian", "Hành động", "Đối tượng"],
      ThreeKData.history()
        .map(
          (x) =>
            `<tr><td>${new Date(x.at).toLocaleString("vi-VN")}</td><td>${esc(x.action)}</td><td>${esc(x.ref)}</td></tr>`,
        )
        .join(""),
    )}<p class="tk-muted">Nhật ký demo là dữ liệu có thể bị chỉnh sửa trong trình duyệt, không phải hệ thống audit tin cậy.</p>`;
  }
  function render() {
    if (!active()) return;
    const st = stats();
    kpis.innerHTML = st
      .map(
        (x) =>
          `<div class="tk-stat"><small>${x.title}</small><strong>${x.value}</strong></div>`,
      )
      .join("");
    nav();
    content.innerHTML = (
      {
        overview,
        hotels: hotelTab,
        rooms: roomTab,
        calendar: calendarTab,
        bookings: bookingTab,
        reviews: reviewsTab,
        support: supportTab,
        audit: auditTab,
      }[tab] || overview
    )();
    if (tab === "hotels") fillHotel();
    if (tab === "rooms") fillRoomSelect();
    if (tab === "calendar") {
      const d = new Date(),
        p = (x) =>
          [
            x.getFullYear(),
            String(x.getMonth() + 1).padStart(2, "0"),
            String(x.getDate()).padStart(2, "0"),
          ].join("-");
      content.querySelector('[name="checkin"]').value = p(d);
      d.setDate(d.getDate() + 1);
      content.querySelector('[name="checkout"]').value = p(d);
    }
  }
  function fillHotel() {
    const f = content.querySelector("#tk-edit-hotel");
    if (!f || !hotels().length) return;
    const [city, id] = f.elements.key.value.split("/"),
      h = hotels().find((x) => x.city === city && x.id === id);
    if (!h) return;
    f.elements.name.value = h.name;
    f.elements.hidden.checked = !!h.hidden;
  }
  function fillRoomSelect() {
    const f = content.querySelector("#tk-edit-room");
    if (!f || !hotels().length) return;
    const [city, id] = f.elements.hotel.value.split("/");
    const roomList = HOTELS[city]?.[id]?.rooms || [];
    f.elements.room.innerHTML = roomList
      .map((r) => `<option value="${esc(r.id)}">${esc(r.name)}</option>`)
      .join("");
    fillRoom();
  }
  function fillRoom() {
    const f = content.querySelector("#tk-edit-room");
    if (!f) return;
    const [city, id] = f.elements.hotel.value.split("/"),
      room = HOTELS[city]?.[id]?.rooms.find(
        (r) => r.id === f.elements.room.value,
      );
    if (!room) return;
    f.elements.price.value = room.price;
    f.elements.stock.value = room.left ?? 5;
    f.elements.closed.checked = !!room.closed;
  }
  function adjustCatalog() {
    ThreeKData.applyCatalog();
    render();
  }
  tabs.addEventListener("click", (e) => {
    const el = e.target.closest("[data-tab]");
    if (!el) return;
    tab = el.dataset.tab;
    history.replaceState(null, "", "#" + tab);
    render();
  });
  content.addEventListener("change", (e) => {
    if (e.target.id === "tk-hotel-picker") fillHotel();
    if (e.target.id === "tk-room-hotel") fillRoomSelect();
    if (e.target.id === "tk-room-picker") fillRoom();
  });
  content.addEventListener("submit", (e) => {
    if (!active()) return;
    const f = e.target;
    if (
      !f.matches(
        "#tk-create-hotel,#tk-edit-hotel,#tk-edit-room,#tk-calendar-form,[data-ticket]",
      )
    )
      return;
    e.preventDefault();
    try {
      if (f.id === "tk-create-hotel") {
        const input = Object.fromEntries(new FormData(f));
        ThreeKData.createHotel(input);
        adjustCatalog();
        feedback("Đã thêm khách sạn demo.");
      } else if (f.id === "tk-edit-hotel") {
        const [city, id] = f.elements.key.value.split("/");
        ThreeKData.setHotel(city, id, {
          name: f.elements.name.value,
          hidden: f.elements.hidden.checked,
        });
        adjustCatalog();
        feedback("Đã cập nhật khách sạn.");
      } else if (f.id === "tk-edit-room") {
        const [city, id] = f.elements.hotel.value.split("/");
        ThreeKData.setRoom(city, id, f.elements.room.value, {
          price: f.elements.price.value,
          stock: Number(f.elements.stock.value),
          closed: f.elements.closed.checked,
        });
        adjustCatalog();
        feedback("Đã lưu giá và tồn phòng.");
      } else if (f.id === "tk-calendar-form") {
        const from = f.elements.checkin.value,
          to = f.elements.checkout.value;
        if (from >= to) throw Error("Ngày trả phòng phải sau ngày nhận phòng.");
        const rows = hotels().flatMap((h) =>
          h.roomList.map(
            (r) =>
              `<tr><td>${esc(h.name)}</td><td>${esc(r.name)}</td><td>${Number(r.left ?? 5)}</td><td>${r.closed || h.hidden ? "Ngừng bán" : BookingStore.availability(h.city, h.id, r.id, from, to, r.left ?? 5)}</td></tr>`,
          ),
        );
        document.getElementById("tk-calendar-results").innerHTML =
          '<h3 style="margin-top:22px">Kết quả ' +
          date(from) +
          " – " +
          date(to) +
          "</h3>" +
          table(
            ["Khách sạn", "Loại phòng", "Tổng phòng", "Còn trống"],
            rows.join(""),
          );
      } else if (f.dataset.ticket) {
        ThreeKData.answerTicket(f.dataset.ticket, f.elements.reply.value);
        render();
        feedback("Đã lưu phản hồi hỗ trợ (demo).");
      }
    } catch (err) {
      feedback(err.message, true);
    }
  });
  content.addEventListener("input", (e) => {
    if (e.target.id === "tk-booking-filter") {
      const q = e.target.value.trim().toLowerCase(),
        data = BookingStore.all().filter((b) =>
          [b.code, b.guestName, b.hotelName, b.email]
            .join(" ")
            .toLowerCase()
            .includes(q),
        );
      document.getElementById("tk-booking-results").innerHTML =
        bookingRows(data);
    }
  });
  content.addEventListener("click", (e) => {
    if (!active()) return;
    const b = e.target.closest("button");
    if (!b) return;
    try {
      if (b.dataset.change) {
        const booking = BookingStore.find(b.dataset.change);
        const inventory = HOTELS[booking.city]?.[booking.hotelId]?.rooms.find(
          (r) => r.id === booking.roomId,
        );
        const stock = inventory?.closed ? 0 : (inventory?.left ?? 5);
        BookingStore.adminChangeDecision(
          b.dataset.change,
          b.dataset.decision,
          stock,
        );
        render();
        feedback("Đã xử lý yêu cầu đổi ngày.");
      } else if (b.dataset.order) {
        const next = b.dataset.next;
        if (
          !confirm(
            `Chuyển đơn ${b.dataset.order} sang "${labels[next]}" trong bản demo?`,
          )
        )
          return;
        BookingStore.adminSetStatus(b.dataset.order, next);
        render();
        feedback("Đã cập nhật trạng thái đơn.");
      } else if (b.dataset.refund) {
        if (
          !confirm(
            "Xác nhận cập nhật trạng thái hoàn tiền MÔ PHỎNG? Không có giao dịch thật.",
          )
        )
          return;
        BookingStore.adminRefund(b.dataset.refund);
        render();
        feedback("Đã ghi nhận hoàn tiền demo.");
      } else if (b.dataset.review) {
        ThreeKData.moderateReview(b.dataset.review, b.dataset.moderate);
        render();
        feedback("Đã duyệt trạng thái đánh giá.");
      } else if (b.id === "tk-delete-hotel") {
        const f = document.getElementById("tk-edit-hotel"),
          [city, id] = f.elements.key.value.split("/");
        if (!confirm("Xóa khách sạn mới tạo này khỏi dữ liệu demo?")) return;
        ThreeKData.deleteHotel(city, id);
        adjustCatalog();
        feedback("Đã xóa khách sạn demo.");
      }
    } catch (err) {
      feedback(err.message, true);
    }
  });
  window.addEventListener("storage", () => {
    if (active()) render();
  });
  show();
})();
