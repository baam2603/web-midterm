/* =====================================================================
   booking.js — trang đặt phòng. Mở bằng:
   booking.html?city=dalat&id=grand-mercure&room=deluxe
   (tuỳ chọn: &checkin=YYYY-MM-DD&checkout=YYYY-MM-DD)
   Dữ liệu lấy từ hotel-data.js (CITIES, HOTELS).
   ===================================================================== */
(function () {
  const params = new URLSearchParams(location.search);
  const cityKey = params.get("city") || "dalat";
  const hotelId = params.get("id");
  const roomId = params.get("room");

  const city = CITIES[cityKey];
  const hotel = city && HOTELS[cityKey] && HOTELS[cityKey][hotelId];
  const room =
    hotel &&
    !hotel.hidden &&
    (hotel.rooms || []).find((r) => r.id === roomId && !r.closed);

  document.body.dataset.city = city ? city.theme : "dalat";

  mountHeader("site-header", {
    logoHref: "../index1.html",
    middle: `<div class="text-booking">Booking - Đặt phòng khách sạn</div>`,
  });

  const root = document.getElementById("booking-root");

  if (!hotel || !room) {
    const back = hotel
      ? `hotel.html?city=${encodeURIComponent(cityKey)}&id=${encodeURIComponent(hotelId)}`
      : "../index1.html";
    root.innerHTML = `
      <div class="not-found">
        <h1>Không tìm thấy phòng cần đặt</h1>
        <p><a href="${back}">Quay lại</a></p>
      </div>`;
    return;
  }

  document.title = `Đặt phòng - ${hotel.name} | THREEK.COM`;

  /* ---------- Helpers ---------- */
  const esc = (s) =>
    String(s).replace(
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
  const money = (n) => Math.round(n).toLocaleString("vi-VN") + "₫";
  const icon = (name) => `<i class="material-symbols-rounded">${name}</i>`;
  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const fmtDate = (s) =>
    fromISO(s).toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const validISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const COUPONS = {
    THREEK10: { type: "percent", value: 10 },
    WELCOME: { type: "amount", value: 200000 },
  };
  const TAX_RATE = 0.1;

  const factOf = (label, fallback) => {
    const f = (hotel.facts || []).find((x) => x.label === label);
    return f ? f.value : fallback;
  };
  const cancelRule = (hotel.rules || []).find((r) => /hủy phòng/i.test(r));

  /* ---------- State ---------- */
  const state = {
    step: 1,
    lastName: "",
    firstName: "",
    email: "",
    phone: "",
    guests: Math.max(
      1,
      Math.min(
        room.guests * Math.max(1, Number(params.get("rooms")) || 1),
        Number(params.get("guests")) || 1,
      ),
    ),
    rooms: Math.max(
      1,
      Math.min(room.left || 5, Number(params.get("rooms")) || 1),
    ),
    note: "",
    promo: true,
    checkin: validISO(params.get("checkin"))
      ? params.get("checkin")
      : toISO(addDays(today, 1)),
    checkout: validISO(params.get("checkout"))
      ? params.get("checkout")
      : toISO(addDays(today, 2)),
    coupon: null, // { code, ...rule }
    pay: "card",
    card: { name: "", number: "", exp: "", cvv: "" },
    code: "",
  };
  if (fromISO(state.checkin) < today) state.checkin = toISO(addDays(today, 1));
  if (fromISO(state.checkout) <= fromISO(state.checkin))
    state.checkout = toISO(addDays(fromISO(state.checkin), 1));

  // Quay lại từ payment.html: điền sẵn thông tin đã nhập
  try {
    const d = JSON.parse(sessionStorage.getItem("threek_checkout") || "null");
    if (d && d.hotelId === hotelId && d.roomId === roomId) {
      [
        "lastName",
        "firstName",
        "email",
        "phone",
        "guests",
        "rooms",
        "note",
        "checkin",
        "checkout",
        "pay",
      ].forEach((k) => {
        if (d[k] !== undefined && d[k] !== null) state[k] = d[k];
      });
      if (d.coupon && COUPONS[d.coupon])
        state.coupon = { code: d.coupon, ...COUPONS[d.coupon] };
    }
  } catch (_) {}

  const getNights = () =>
    Math.round((fromISO(state.checkout) - fromISO(state.checkin)) / 864e5);

  function calc() {
    const nights = Math.max(getNights(), 0);
    const base = room.price * nights * state.rooms;
    let discount = 0;
    if (state.coupon) {
      discount =
        state.coupon.type === "percent"
          ? Math.round((base * state.coupon.value) / 100)
          : Math.min(state.coupon.value, base);
    }
    const taxable = base - discount;
    const tax = Math.round(taxable * TAX_RATE);
    return { nights, base, discount, tax, total: taxable + tax };
  }

  /* ---------- Khung trang ---------- */
  root.innerHTML = `
    <nav class="breadcrumb" aria-label="Điều hướng">
      <a href="../index1.html">Trang chủ</a>${icon("chevron_right")}
      <a href="hotel.html?city=${encodeURIComponent(cityKey)}&id=${encodeURIComponent(hotelId)}">${esc(hotel.name)}</a>${icon("chevron_right")}
      <span class="current">Đặt phòng</span>
    </nav>
    <h1 class="booking-title">Đặt phòng an toàn</h1>
    <ol class="stepper" id="bkStepper"></ol>
    <div class="booking-grid">
      <div class="booking-left" id="bkLeft"></div>
      <aside class="booking-aside">
        <div class="card price-card" id="bkPrice"></div>
        <div class="card summary-card" id="bkSummary"></div>
      </aside>
    </div>`;

  const $ = (sel) => document.querySelector(sel);
  const elLeft = $("#bkLeft");

  /* ---------- Stepper ---------- */
  const STEPS = [
    "Thông tin khách hàng",
    "Chi tiết thanh toán",
    "Đã xác nhận đặt chỗ!",
  ];
  function renderStepper() {
    $("#bkStepper").innerHTML = STEPS.map((t, i) => {
      const n = i + 1;
      const cls =
        n < state.step ? "is-done" : n === state.step ? "is-active" : "";
      return `<li class="${cls}" ${n < state.step && state.step < 3 ? `data-goto="${n}"` : ""}>
        <span class="stepper__dot">${n < state.step ? icon("check") : n}</span>
        <span class="stepper__label">${t}</span></li>`;
    }).join("");
  }

  /* ---------- Cột phải ---------- */
  function renderPrice() {
    const c = calc();
    const editable = state.step < 3;
    $("#bkPrice").innerHTML = `
      <h2>Chi tiết giá</h2>
      ${
        editable
          ? `<div class="coupon">
               <input id="couponInput" type="text" placeholder="Mã giảm giá" value="${esc(state.coupon ? state.coupon.code : "")}" />
               <button type="button" id="couponBtn">${state.coupon ? "Gỡ" : "Áp dụng"}</button>
             </div>
             <p class="coupon-msg" id="couponMsg">${
               state.coupon ? `Đã áp dụng mã ${esc(state.coupon.code)}` : ""
             }</p>`
          : ""
      }
      <ul class="price-lines">
        <li><span>${state.rooms} phòng × ${c.nights} đêm<small>${money(room.price)} / đêm</small></span><b>${money(c.base)}</b></li>
        ${c.discount ? `<li class="is-discount"><span>Giảm giá</span><b>-${money(c.discount)}</b></li>` : ""}
        <li><span>Thuế &amp; phí (${TAX_RATE * 100}%)</span><b>${money(c.tax)}</b></li>
      </ul>
      <div class="price-total"><span>Tổng cộng</span><strong>${money(c.total)}</strong></div>
      <p class="price-sub">Đã bao gồm thuế và phí dịch vụ.</p>`;
    if (state.coupon) $("#couponMsg").classList.add("is-ok");
  }

  function renderSummary() {
    const img = room.image || (hotel.images && hotel.images[0]) || "";
    const guestsLabel = state.guests + " khách";
    $("#bkSummary").innerHTML = `
      <div class="summary-card__photo">
        ${img ? `<img src="${esc(img)}" alt="${esc(room.name)}" onerror="this.remove()" />` : ""}
      </div>
      <div class="summary-card__body">
        <h3>Tóm tắt đặt phòng</h3>
        <ul class="summary-list">
          <li>${icon("hotel")}<span>Khách sạn</span><b>${esc(hotel.name)}</b></li>
          <li>${icon("bed")}<span>Loại phòng</span><b>${esc(room.name)}</b></li>
          <li>${icon("single_bed")}<span>Giường</span><b>${esc(room.bed)}</b></li>
          <li>${icon("group")}<span>Số khách / số phòng</span><b>${esc(guestsLabel)} · ${state.rooms} phòng</b></li>
          <li>${icon("login")}<span>Nhận phòng<em>${esc(factOf("Nhận phòng", "Từ 14:00"))}</em></span><b>${fmtDate(state.checkin)}</b></li>
          <li>${icon("logout")}<span>Trả phòng<em>${esc(factOf("Trả phòng", "Trước 12:00"))}</em></span><b>${fmtDate(state.checkout)}</b></li>
          <li>${icon("nights_stay")}<span>Thời gian lưu trú</span><b id="sumNights">${getNights()} đêm</b></li>
        </ul>
      </div>`;
  }

  /* ---------- Form helpers ---------- */
  const field = (
    label,
    key,
    {
      type = "text",
      ph = "",
      value = "",
      scope = "f",
      full = false,
      req = true,
      attrs = "",
    } = {},
  ) => `
    <label class="field ${full ? "full" : ""}">
      <span>${label}${req ? " <b>*</b>" : ""}</span>
      <input type="${type}" data-${scope}="${key}" placeholder="${esc(ph)}" value="${esc(value)}" ${attrs} />
      <em class="field__err" data-err="${key}"></em>
    </label>`;

  const policyCard = () => `
    <div class="card policy">
      <h2>Chính sách hủy phòng</h2>
      ${
        room.refundable
          ? `<div class="tag is-yes">${icon("event_available")} Hủy miễn phí</div>
             <p>${esc(cancelRule || "Bạn có thể hủy miễn phí trước ngày nhận phòng theo quy định của khách sạn.")} Sau thời hạn này, phí hủy có thể bằng giá 1 đêm.</p>`
          : `<div class="tag is-no">${icon("event_busy")} Không hoàn tiền</div>
             <p>Mức giá này không được hủy hoặc hoàn tiền. Vui lòng kiểm tra kỹ ngày ở và thông tin trước khi thanh toán.</p>`
      }
    </div>`;

  /* ---------- Bước 1 ---------- */
  function step1HTML() {
    const guestOpts = Array.from({ length: room.guests }, (_, i) => i + 1)
      .map(
        (n) =>
          `<option value="${n}" ${n === state.guests ? "selected" : ""}>${n} khách</option>`,
      )
      .join("");
    return `
      <div class="card">
        <h2>Ai sẽ nhận phòng?</h2>
        <div class="form-grid">
          ${field("Họ", "lastName", { ph: "Nguyễn", value: state.lastName })}
          ${field("Tên", "firstName", { ph: "Văn A", value: state.firstName })}
          ${field("Email", "email", { type: "email", ph: "ban@email.com", value: state.email, full: true })}
          ${field("Số điện thoại", "phone", { type: "tel", ph: "0901 234 567", value: state.phone, full: true })}
          <label class="field">
            <span>Số khách <b>*</b></span>
            <select data-f="guests">${Array.from(
              { length: Math.max(room.guests * state.rooms, state.guests) },
              (_, i) => i + 1,
            )
              .map(
                (n) =>
                  `<option value="${n}" ${n === state.guests ? "selected" : ""}>${n} khách</option>`,
              )
              .join("")}</select>
            <em class="field__err" data-err="guests"></em>
          </label>
          <label class="field">
            <span>Số phòng <b>*</b></span>
            <select data-f="rooms">${Array.from(
              { length: room.left ?? 5 },
              (_, i) => i + 1,
            )
              .map(
                (n) =>
                  `<option value="${n}" ${n === state.rooms ? "selected" : ""}>${n} phòng</option>`,
              )
              .join("")}</select>
            <em class="field__err" data-err="rooms"></em>
          </label>
          <label class="field full">
            <span>Yêu cầu đặc biệt (không bắt buộc)</span>
            <textarea data-f="note" placeholder="Ví dụ: nhận phòng sớm, tầng cao, giường phụ...">${esc(state.note)}</textarea>
          </label>
          <label class="check full">
            <input type="checkbox" data-f="promo" ${state.promo ? "checked" : ""} />
            Nhận ưu đãi và thông tin chuyến đi qua email
          </label>
        </div>
      </div>

      <div class="card">
        <h2>Thời gian lưu trú</h2>
        <div class="form-grid">
          ${field("Ngày nhận phòng", "checkin", { type: "date", value: state.checkin, attrs: `min="${toISO(today)}"` })}
          ${field("Ngày trả phòng", "checkout", { type: "date", value: state.checkout, attrs: `min="${toISO(addDays(fromISO(state.checkin), 1))}"` })}
          <p class="field__hint full" id="nightsNote">Tổng cộng ${getNights()} đêm.</p>
        </div>
      </div>

      ${policyCard()}

      <div class="actions">
        <button type="button" class="btn btn--primary" data-next>Tiếp tục ${icon("arrow_forward")}</button>
      </div>`;
  }

  /* ---------- Bước 2 ---------- */
  function step2HTML() {
    const opt = (v, ic, title, sub) => `
      <label class="pay-opt">
        <input type="radio" name="pay" value="${v}" data-f="pay" ${state.pay === v ? "checked" : ""} />
        ${icon(ic)}<div>${title}<small>${sub}</small></div>
      </label>`;
    let detail = "";
    if (state.pay === "card") {
      detail = `<div class="pay-note">Bạn sẽ nhập dữ liệu thẻ kiểm thử ở bước tiếp theo (không xử lý giao dịch thật).</div>`;
    } else if (state.pay === "bank") {
      detail = `<div class="pay-note">Đây là luồng chuyển khoản mô phỏng. Đơn được lưu ở trạng thái chờ thanh toán, không gửi hướng dẫn qua email.</div>`;
    } else {
      detail = `<div class="pay-note">Bạn chọn trả tại khách sạn (mô phỏng). Website chưa gửi đơn đặt phòng tới khách sạn thật.</div>`;
    }
    return `
      <div class="card">
        <h2>Phương thức thanh toán</h2>
        <div class="pay-options">
          ${opt("card", "credit_card", "Thẻ tín dụng / ghi nợ", "Visa, Mastercard, JCB")}
          ${opt("bank", "account_balance", "Chuyển khoản ngân hàng", "Xác nhận trong bản demo")}
          ${opt("hotel", "storefront", "Thanh toán tại khách sạn", "Trả khi nhận phòng")}
        </div>
        ${detail}
      </div>

      ${policyCard()}

      <div class="actions">
        <button type="button" class="btn btn--ghost" data-back>${icon("arrow_back")} Quay lại</button>
        <button type="button" class="btn btn--primary" data-next>${icon("lock")} Tiếp tục thanh toán</button>
      </div>`;
  }

  /* ---------- Bước 3 ---------- */
  function step3HTML() {
    const c = calc();
    return `
      <div class="card done">
        <div class="done__icon">${icon("check")}</div>
        <h2>Đặt phòng thành công!</h2>
        <p>Cảm ơn ${esc(state.firstName)}. Thông tin xác nhận đã được gửi tới <b>${esc(state.email)}</b>.</p>
        <div class="done__code">${esc(state.code)}</div>
        <p>${esc(room.name)} · ${getNights()} đêm<br />
        ${fmtDate(state.checkin)} → ${fmtDate(state.checkout)}<br />
        Tổng thanh toán: <b>${money(c.total)}</b></p>
        <div class="done__actions">
          <a class="btn btn--ghost" href="../index1.html">Về trang chủ</a>
          <a class="btn btn--primary" href="../booking/myBooking.html">Xem đặt phòng của tôi</a>
        </div>
      </div>`;
  }

  function renderLeft() {
    elLeft.innerHTML =
      state.step === 1
        ? step1HTML()
        : state.step === 2
          ? step2HTML()
          : step3HTML();
    renderStepper();
    renderPrice();
    renderSummary();
  }

  /* ---------- Validation ---------- */
  const luhn = (num) => {
    let sum = 0;
    let dbl = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let d = Number(num[i]);
      if (dbl) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      dbl = !dbl;
    }
    return sum % 10 === 0;
  };

  function validate1() {
    const e = {};
    if (!state.lastName.trim()) e.lastName = "Vui lòng nhập họ.";
    if (!state.firstName.trim()) e.firstName = "Vui lòng nhập tên.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim()))
      e.email = "Email không hợp lệ.";
    if (!/^(0|\+84)\d{9,10}$/.test(state.phone.replace(/[\s.\-]/g, "")))
      e.phone = "Số điện thoại không hợp lệ.";
    if (validISO(state.checkin) && fromISO(state.checkin) < today)
      e.checkin = "Ngày nhận phòng không được ở quá khứ.";
    if (
      !validISO(state.checkin) ||
      !validISO(state.checkout) ||
      getNights() < 1
    )
      e.checkout = "Ngày trả phòng phải sau ngày nhận phòng.";
    if (state.guests > room.guests * state.rooms)
      e.guests = "Số khách vượt quá sức chứa phòng.";
    if (
      BookingStore.availability(
        cityKey,
        hotelId,
        roomId,
        state.checkin,
        state.checkout,
        room.left ?? 5,
      ) < state.rooms
    )
      e.rooms = "Không còn đủ phòng trống cho ngày đã chọn.";
    return e;
  }

  function validate2() {
    const e = {};
    if (state.pay !== "card") return e;
    const { name, number, exp, cvv } = state.card;
    const digits = number.replace(/\D/g, "");
    if (!name.trim()) e.name = "Vui lòng nhập tên chủ thẻ.";
    if (digits.length < 13 || digits.length > 19 || !luhn(digits))
      e.number = "Số thẻ không hợp lệ.";
    const m = /^(\d{2})\/(\d{2})$/.exec(exp);
    if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) {
      e.exp = "Dùng định dạng MM/YY.";
    } else {
      const end = new Date(2000 + Number(m[2]), Number(m[1]), 1); // đầu tháng sau
      if (end <= new Date()) e.exp = "Thẻ đã hết hạn.";
    }
    if (!/^\d{3,4}$/.test(cvv)) e.cvv = "CVV gồm 3–4 chữ số.";
    return e;
  }

  function showErrors(errs) {
    elLeft
      .querySelectorAll(".field")
      .forEach((f) => f.classList.remove("is-invalid"));
    elLeft
      .querySelectorAll("[data-err]")
      .forEach((em) => (em.textContent = ""));
    const keys = Object.keys(errs);
    keys.forEach((k) => {
      const em = elLeft.querySelector(`[data-err="${k}"]`);
      if (!em) return;
      em.textContent = errs[k];
      em.closest(".field").classList.add("is-invalid");
    });
    if (keys.length) {
      const first = elLeft.querySelector(
        ".field.is-invalid input, .field.is-invalid select",
      );
      if (first) first.focus();
    }
    return keys.length === 0;
  }

  /* ---------- Điều hướng bước ---------- */
  function goStep(n) {
    state.step = n;
    renderLeft();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveBooking() {
    const c = calc();
    const record = {
      code: state.code,
      city: cityKey,
      hotelId,
      hotelName: hotel.name,
      roomId: room.id,
      roomName: room.name,
      checkin: state.checkin,
      checkout: state.checkout,
      nights: c.nights,
      guests: state.guests,
      total: c.total,
      guestName: `${state.lastName.trim()} ${state.firstName.trim()}`,
      email: state.email.trim(),
      phone: state.phone.trim(),
      payMethod: state.pay, // KHÔNG lưu thông tin thẻ
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    try {
      const list = JSON.parse(localStorage.getItem("threek_bookings") || "[]");
      list.push(record);
      localStorage.setItem("threek_bookings", JSON.stringify(list));
    } catch (_) {
      /* localStorage không dùng được — bỏ qua */
    }
  }

  function goCheckout() {
    const draft = {
      city: cityKey,
      hotelId,
      roomId: room.id,
      checkin: state.checkin,
      checkout: state.checkout,
      guests: state.guests,
      rooms: state.rooms,
      lastName: state.lastName,
      firstName: state.firstName,
      email: state.email,
      phone: state.phone,
      note: state.note,
      coupon: state.coupon ? state.coupon.code : null,
      pay: state.pay,
      back: location.href,
    };
    try {
      sessionStorage.setItem("threek_checkout", JSON.stringify(draft));
    } catch (_) {}
    location.href = "../payment/payment.html";
  }

  /* ---------- Sự kiện ---------- */
  elLeft.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.c) {
      let v = t.value;
      if (t.dataset.c === "number") {
        v = v
          .replace(/\D/g, "")
          .slice(0, 19)
          .replace(/(.{4})/g, "$1 ")
          .trim();
      } else if (t.dataset.c === "exp") {
        v = v.replace(/\D/g, "").slice(0, 4);
        if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
      } else if (t.dataset.c === "cvv") {
        v = v.replace(/\D/g, "").slice(0, 4);
      }
      t.value = v;
      state.card[t.dataset.c] = v;
      return;
    }
    const k = t.dataset.f;
    if (!k || k === "pay") return;
    if (t.type === "checkbox") state[k] = t.checked;
    else if (k === "guests" || k === "rooms") state[k] = Number(t.value);
    else state[k] = t.value;

    if (k === "checkin" || k === "checkout") {
      if (validISO(state.checkin) && validISO(state.checkout)) {
        if (
          k === "checkin" &&
          fromISO(state.checkout) <= fromISO(state.checkin)
        ) {
          state.checkout = toISO(addDays(fromISO(state.checkin), 1));
          const out = elLeft.querySelector('[data-f="checkout"]');
          if (out) out.value = state.checkout;
        }
        const out = elLeft.querySelector('[data-f="checkout"]');
        if (out) out.min = toISO(addDays(fromISO(state.checkin), 1));
        const note = $("#nightsNote");
        if (note)
          note.textContent =
            getNights() >= 1
              ? `Tổng cộng ${getNights()} đêm.`
              : "Ngày trả phòng phải sau ngày nhận phòng.";
        renderPrice();
        renderSummary();
      }
    } else if (k === "guests" || k === "rooms") {
      if (k === "rooms") {
        state.guests = Math.min(state.guests, room.guests * state.rooms);
        renderLeft();
      } else renderSummary();
    }
  });

  elLeft.addEventListener("change", (e) => {
    if (e.target.dataset.f === "pay") {
      state.pay = e.target.value;
      renderLeft();
    }
  });

  elLeft.addEventListener("click", (e) => {
    if (e.target.closest("[data-back]")) return goStep(state.step - 1);
    if (!e.target.closest("[data-next]")) return;

    if (state.step === 1) {
      if (showErrors(validate1())) goStep(2);
    } else if (state.step === 2) {
      goCheckout();
    }
  });

  $("#bkStepper").addEventListener("click", (e) => {
    const li = e.target.closest("[data-goto]");
    if (li) goStep(Number(li.dataset.goto));
  });

  $("#bkPrice").addEventListener("click", (e) => {
    if (!e.target.closest("#couponBtn")) return;
    if (state.coupon) {
      state.coupon = null;
      return renderPrice();
    }
    const code = $("#couponInput").value.trim().toUpperCase();
    const msg = $("#couponMsg");
    if (!code) return;
    if (COUPONS[code]) {
      state.coupon = { code, ...COUPONS[code] };
      renderPrice();
    } else {
      msg.textContent = "Mã giảm giá không hợp lệ.";
      msg.className = "coupon-msg is-bad";
    }
  });

  renderLeft();
})();
