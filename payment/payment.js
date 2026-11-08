(function () {
  const KEY = "threek_checkout";
  const draft = window.paymentDraft;
  const savedBooking = window.paymentBooking || null;
  const localImage = (path) =>
    typeof path === "string" &&
    /^(sources|uploads)\/[A-Za-z0-9_./-]+$/.test(path) &&
    !path.includes("..")
      ? "../" + path
      : "";
  const city = draft && CITIES[draft.city];
  const hotel = savedBooking
    ? {
        name: savedBooking.hotelName,
        images: [localImage(savedBooking.hotelImage)].filter(Boolean),
        facts: [],
      }
    : city && HOTELS[draft.city] && HOTELS[draft.city][draft.hotelId];
  const room = savedBooking
    ? {
        id: savedBooking.roomId,
        name: savedBooking.roomName,
        price:
          Number(savedBooking.subtotal ?? savedBooking.total) /
          (savedBooking.rooms * savedBooking.nights),
        refundable: savedBooking.refundable,
        image: localImage(savedBooking.roomImage),
      }
    : hotel && (hotel.rooms || []).find((r) => r.id === draft.roomId);

  document.body.dataset.city = city ? city.theme : "dalat";
  mountHeader("site-header", {
    logoHref: "../index1.html",
    middle: `<div class="text-booking">Booking - Thanh toán</div>`,
  });
  const root = document.getElementById("pay-root");

  if (!room) {
    root.innerHTML = `
      <div class="not-found">
        <h1>Phiên thanh toán đã hết hạn</h1>
        <p><a href="../index1.html">Về trang chủ để chọn phòng lại</a></p>
      </div>`;
    return;
  }
  document.title = `Thanh toán - ${hotel.name} | THREEK.COM`;

  /* ---------- Helpers ---------- */
  const $ = (s) => document.querySelector(s);
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
  const icon = (n) => `<i class="material-symbols-rounded">${esc(n)}</i>`;
  const pad = (n) => String(n).padStart(2, "0");
  const fromISO = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const fmtDate = (s) =>
    fromISO(s).toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const factOf = (label, fb) => {
    const f = (hotel.facts || []).find((x) => x.label === label);
    return f ? f.value : fb;
  };
  const luhn = (num) => {
    let sum = 0,
      dbl = false;
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

  /* ---------- Giá (tính lại, không tin số từ trang trước) ---------- */
  const COUPONS = {
    THREEK10: { type: "percent", value: 10 },
    WELCOME: { type: "amount", value: 200000 },
  };
  const TAX_RATE = 0.1;
  const rule = draft.coupon && COUPONS[draft.coupon];
  const nights = Math.max(
    Math.round((fromISO(draft.checkout) - fromISO(draft.checkin)) / 864e5),
    1,
  );
  draft.rooms = Math.max(1, Number(draft.rooms) || 1);
  let base = room.price * nights * draft.rooms;
  let discount = rule
    ? rule.type === "percent"
      ? Math.round((base * rule.value) / 100)
      : Math.min(rule.value, base)
    : 0;
  let tax = Math.round((base - discount) * TAX_RATE);
  let total = base - discount + tax;
  let quoteReady = false,
    saving = false;
  if (!draft.requestKey && !savedBooking)
    draft.requestKey = crypto.randomUUID();

  /* ---------- State ---------- */
  if (!draft.deadline) draft.deadline = Date.now() + 15 * 60 * 1000;
  if (!draft.code)
    draft.code = "TK" + Date.now().toString(36).toUpperCase().slice(-6);
  try {
    if (!savedBooking) sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch (_) {}

  const METHODS = [
    ["card", "credit_card", "Thẻ tín dụng / ghi nợ", "Chỉ dùng thẻ thử nghiệm"],
    ["wallet", "account_balance_wallet", "Ví điện tử", "MoMo, ZaloPay"],
    [
      "bank",
      "account_balance",
      "Chuyển khoản ngân hàng",
      "Mô phỏng · chưa chuyển tiền",
    ],
    ["hotel", "storefront", "Thanh toán tại khách sạn", "Trả khi nhận phòng"],
  ];
  const WALLETS = { momo: "MoMo", zalopay: "ZaloPay" };
  const state = {
    phase: savedBooking ? "done" : "pay", // pay | done | expired
    method: METHODS.some((m) => m[0] === draft.pay) ? draft.pay : "card",
    wallet: "momo",
    card: { name: "", number: "", exp: "", cvv: "" },
  };
  const back = new URL(draft.back || "../hotel/Booking.html", location.href);
  const backUrl =
    back.origin === location.origin
      ? back.href
      : new URL("../index1.html", location.href).href;

  /* ---------- Khung trang ---------- */
  root.innerHTML = `
    <nav class="breadcrumb" aria-label="Điều hướng">
      <a href="../index1.html">Trang chủ</a>${icon("chevron_right")}
      <a href="../hotel/hotel.html?city=${encodeURIComponent(draft.city)}&id=${encodeURIComponent(draft.hotelId)}">${esc(hotel.name)}</a>${icon("chevron_right")}
      <a href="${esc(backUrl)}" data-back>Đặt phòng</a>${icon("chevron_right")}
      <span class="current">Thanh toán</span>
    </nav>
    <h1 class="booking-title">Thanh toán mô phỏng</h1>
    <ol class="stepper" id="pStepper"></ol>
    <div class="booking-grid">
      <div class="booking-left" id="pLeft"></div>
      <aside class="booking-aside">
        <div class="card price-card" id="pPrice"></div>
        <div class="card summary-card" id="pSummary"></div>
      </aside>
    </div>`;

  const STEPS = [
    "Thông tin khách hàng",
    "Chi tiết thanh toán",
    "Đã xác nhận đặt chỗ!",
  ];
  function renderStepper() {
    const cur = state.phase === "done" ? 3 : 2;
    $("#pStepper").innerHTML = STEPS.map((t, i) => {
      const n = i + 1;
      const cls = n < cur ? "is-done" : n === cur ? "is-active" : "";
      return `<li class="${cls}" ${n === 1 && cur < 3 ? "data-back" : ""}>
        <span class="stepper__dot">${n < cur ? icon("check") : n}</span><span>${t}</span></li>`;
    }).join("");
  }

  function renderPrice() {
    const hasBreakdown = !savedBooking || savedBooking.subtotal !== null;
    $("#pPrice").innerHTML = `
      <h2>Chi tiết giá</h2>
      <ul class="price-lines">
        <li><span>${draft.rooms} phòng × ${nights} đêm<small>${hasBreakdown ? money(room.price) : "Giá đã chốt"} / đêm</small></span><b>${hasBreakdown ? money(base) : "Chưa lưu chi tiết"}</b></li>
        ${discount ? `<li class="is-discount"><span>Giảm giá<small>Mã ${esc(draft.coupon || "đã áp dụng")}</small></span><b>-${money(discount)}</b></li>` : ""}
        <li><span>Thuế &amp; phí (${TAX_RATE * 100}%)</span><b>${hasBreakdown ? money(tax) : "Chưa lưu chi tiết"}</b></li>
      </ul>
      <div class="price-total"><span>Tổng cộng</span><strong>${money(total)}</strong></div>
      <p class="price-sub">Đã bao gồm thuế và phí dịch vụ.</p>`;
  }

  function renderSummary() {
    const img = room.image || (hotel.images && hotel.images[0]) || "";
    $("#pSummary").innerHTML = `
      <div class="summary-card__photo">
        ${img ? `<img src="${esc(img)}" alt="${esc(room.name)}" onerror="this.remove()" />` : ""}
      </div>
      <div class="summary-card__body">
        <h3>Tóm tắt đặt phòng</h3>
        <ul class="summary-list">
          <li>${icon("hotel")}<span>Khách sạn</span><b>${esc(hotel.name)}</b></li>
          <li>${icon("bed")}<span>Loại phòng</span><b>${esc(room.name)}</b></li>
          <li>${icon("person")}<span>Người nhận phòng</span><b>${esc(draft.lastName)} ${esc(draft.firstName)}</b></li>
          <li>${icon("group")}<span>Số khách / số phòng</span><b>${draft.guests} khách · ${draft.rooms} phòng</b></li>
          <li>${icon("login")}<span>Nhận phòng<em>${esc(factOf("Nhận phòng", "Từ 14:00"))}</em></span><b>${fmtDate(draft.checkin)}</b></li>
          <li>${icon("logout")}<span>Trả phòng<em>${esc(factOf("Trả phòng", "Trước 12:00"))}</em></span><b>${fmtDate(draft.checkout)}</b></li>
          <li>${icon("nights_stay")}<span>Thời gian lưu trú</span><b>${nights} đêm</b></li>
        </ul>
      </div>`;
  }

  /* ---------- Cột trái ---------- */
  const cf = (label, key, ph, attrs = "", full = false) => `
    <label class="field ${full ? "full" : ""}">
      <span>${label} <b>*</b></span>
      <input type="text" data-c="${key}" placeholder="${ph}" value="${esc(state.card[key])}" ${attrs} />
      <em class="field__err" data-err="${key}"></em>
    </label>`;
  const bankRow = (k, v, copy) => `
    <li><span>${k}</span><b>${esc(v)}</b>${
      copy
        ? `<button type="button" class="copy" data-copy="${esc(copy)}" aria-label="Sao chép ${k}">${icon("content_copy")}</button>`
        : ""
    }</li>`;

  function detailHTML() {
    if (state.method === "card") {
      const c = state.card;
      return `
        <div class="cc" aria-hidden="true">
          <div class="cc__chip"></div>
          <div class="cc__num ${c.number ? "" : "is-empty"}" id="ccNum">${esc(c.number || "0000 0000 0000 0000")}</div>
          <div class="cc__row">
            <span class="${c.name ? "" : "is-empty"}" id="ccName">${esc(c.name || "Tên chủ thẻ")}</span>
            <span class="${c.exp ? "" : "is-empty"}" id="ccExp">${esc(c.exp || "MM/YY")}</span>
          </div>
        </div>
        <div class="form-grid">
          ${cf("Tên chủ thẻ", "name", "NGUYEN VAN A", 'autocomplete="cc-name"', true)}
          ${cf("Số thẻ", "number", "0000 0000 0000 0000", 'inputmode="numeric" autocomplete="cc-number" maxlength="23"', true)}
          ${cf("Ngày hết hạn", "exp", "MM/YY", 'inputmode="numeric" autocomplete="cc-exp" maxlength="5"')}
          ${cf("CVV", "cvv", "123", 'inputmode="numeric" autocomplete="cc-csc" maxlength="4"')}
        </div>`;
    }
    if (state.method === "wallet") {
      const icons = {
        momo: "account_balance_wallet",
        zalopay: "qr_code_2",
      };
      return `
        <div class="wallets">
          ${Object.entries(WALLETS)
            .map(
              ([k, n]) =>
                `<label class="wallet"><input type="radio" name="wallet" value="${k}" ${state.wallet === k ? "checked" : ""} />${icon(icons[k])}${n}</label>`,
            )
            .join("")}
        </div>
        <div class="pay-note">Bản demo mô phỏng thanh toán qua ${WALLETS[state.wallet]} với số tiền ${money(total)}; không mở ứng dụng ví thực tế.</div>`;
    }
    if (state.method === "bank") {
      return `
        <ul class="bank-list">
          ${bankRow("Ngân hàng", "NGÂN HÀNG DEMO")}
          ${bankRow("Số tài khoản", "KHÔNG CÓ TÀI KHOẢN THẬT")}
          ${bankRow("Chủ tài khoản", "THREEK DEMO")}
          ${bankRow("Số tiền", money(total), String(total))}
          ${bankRow("Nội dung", draft.code, draft.code)}
        </ul>
        <div class="pay-note">DỮ LIỆU MINH HỌA: Không chuyển tiền thật tới các thông tin này. Lựa chọn được lưu cùng đơn trên hệ thống; chưa ghi nhận giao dịch tiền thật.</div>`;
    }
    return `<div class="pay-note">Bạn thanh toán tại khách sạn khi nhận phòng. Đơn đặt phòng được lưu trên hệ thống sau khi xác nhận.</div>`;
  }

  const payLabel = () =>
    state.method === "card"
      ? `Thanh toán ${money(total)}`
      : state.method === "wallet"
        ? `Thanh toán bằng ${WALLETS[state.wallet]}`
        : state.method === "bank"
          ? "Xác nhận chuyển khoản demo"
          : "Xác nhận đặt phòng";

  function payHTML() {
    const opts = METHODS.map(
      ([v, ic, t, s]) => `
      <label class="pay-opt">
        <input type="radio" name="pay" value="${v}" ${state.method === v ? "checked" : ""} />
        ${icon(ic)}<div>${t}<small>${s}</small></div>
      </label>`,
    ).join("");
    return `
      <div class="hold" id="hold">${icon("timer")}<span>Phiên xác nhận còn <b id="holdTime">--:--</b></span></div>
      <div class="card">
        <h2>Chọn cách thanh toán</h2>
        <div class="pay-options">${opts}</div>
        ${detailHTML()}
      </div>
      <div class="actions">
        <button type="button" class="btn btn--ghost" data-back>${icon("arrow_back")} Sửa thông tin đặt phòng</button>
        <button type="button" class="btn btn--primary" data-pay>${icon("lock")} ${payLabel()}</button>
      </div>
      <p class="secure">${icon("verified_user")} THANH TOÁN DEMO — không trừ tiền, không gửi email. Chỉ dùng số thẻ thử nghiệm, không nhập thẻ thật.</p>`;
  }

  function doneHTML() {
    const paid = savedBooking?.paymentStatus === "paid";
    const who = esc(draft.firstName);
    const msg = paid
      ? `Cảm ơn ${who}. Thanh toán đã được xác nhận trên hệ thống.`
      : state.method === "hotel"
        ? `Cảm ơn ${who}. Đơn đã được lưu; bạn thanh toán tại khách sạn khi nhận phòng. Chưa gửi email xác nhận.`
        : `Cảm ơn ${who}. Đơn đã được lưu với phương thức thanh toán mô phỏng. Chưa thu tiền và chưa gửi email.`;
    return `
      <div class="card done">
        <div class="done__icon">${icon("check")}</div>
        <h2>${savedBooking?.status === "cancelled" ? "Đơn đã hủy" : "Đặt phòng thành công!"}</h2>
        <p>${msg}</p>
        <div class="done__code">${esc(draft.code)}</div>
        <p>${esc(room.name)} · ${nights} đêm<br />
        ${fmtDate(draft.checkin)} → ${fmtDate(draft.checkout)}<br />
        ${paid ? "Đã thanh toán" : "Số tiền cần thanh toán"}: <b>${money(total)}</b></p>
        <div class="done__actions">
          <a class="btn btn--ghost" href="../index1.html">Về trang chủ</a>
          <a class="btn btn--ghost" href="../booking/detail.html?code=${encodeURIComponent(draft.code)}">Xem chi tiết đơn</a>
          <a class="btn btn--primary" href="../booking/myBooking.html">Xem đặt phòng của tôi</a>
        </div>
      </div>`;
  }

  function expiredHTML() {
    return `
      <div class="card done">
        <div class="done__icon is-warn">${icon("timer_off")}</div>
        <h2>Hết thời gian xác nhận</h2>
        <p>Phiên xác nhận đã quá 15 phút. Tồn phòng sẽ được kiểm tra lại khi bạn đặt. Bạn có thể đặt lại, thông tin đã nhập vẫn được giữ.</p>
        <div class="done__actions"><a class="btn btn--primary" href="${esc(backUrl)}">Đặt lại phòng</a></div>
      </div>`;
  }

  function renderLeft() {
    $("#pLeft").innerHTML =
      state.phase === "done"
        ? doneHTML()
        : state.phase === "expired"
          ? expiredHTML()
          : payHTML();
    renderStepper();
    if (state.phase === "pay") {
      const button = root.querySelector("[data-pay]");
      if (button) button.disabled = !quoteReady || saving;
      tick();
    }
  }

  /* ---------- Đếm ngược ---------- */
  let timer;
  function tick() {
    const ms = Math.max(0, draft.deadline - Date.now());
    const s = Math.ceil(ms / 1000);
    const el = $("#holdTime");
    if (el) {
      el.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
      $("#hold").classList.toggle("is-low", s <= 120);
    }
    if (ms <= 0) {
      clearInterval(timer);
      if (state.phase === "pay") {
        state.phase = "expired";
        renderLeft();
      }
    }
  }

  /* ---------- Kiểm tra thẻ ---------- */
  function validateCard() {
    const e = {};
    const { name, number, exp, cvv } = state.card;
    const digits = number.replace(/\D/g, "");
    if (digits !== "4111111111111111")
      e.number =
        "Chỉ dùng số thẻ thử nghiệm 4111 1111 1111 1111; không nhập thẻ thật.";
    if (!name.trim()) e.name = "Vui lòng nhập tên chủ thẻ.";
    if (digits.length < 13 || digits.length > 19 || !luhn(digits))
      e.number = "Số thẻ không hợp lệ.";
    const m = /^(\d{2})\/(\d{2})$/.exec(exp);
    if (!m || Number(m[1]) < 1 || Number(m[1]) > 12)
      e.exp = "Dùng định dạng MM/YY.";
    else if (new Date(2000 + Number(m[2]), Number(m[1]), 1) <= new Date())
      e.exp = "Thẻ đã hết hạn.";
    if (!/^\d{3,4}$/.test(cvv)) e.cvv = "CVV gồm 3–4 chữ số.";
    return e;
  }

  function showErrors(errs) {
    const left = $("#pLeft");
    left
      .querySelectorAll(".field")
      .forEach((f) => f.classList.remove("is-invalid"));
    left.querySelectorAll("[data-err]").forEach((em) => (em.textContent = ""));
    const keys = Object.keys(errs);
    keys.forEach((k) => {
      const em = left.querySelector(`[data-err="${k}"]`);
      if (!em) return;
      em.textContent = errs[k];
      em.closest(".field").classList.add("is-invalid");
    });
    const first = left.querySelector(".field.is-invalid input");
    if (first) first.focus();
    return keys.length === 0;
  }

  function selectedMethod() {
    if (state.method === "hotel") return "hotel";
    return (state.method === "wallet" ? state.wallet : state.method) + "_demo";
  }
  async function saveBooking() {
    const response = await fetch("../api/bookings/create.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: draft.city,
        hotelId: draft.hotelId,
        roomId: draft.roomId,
        checkin: draft.checkin,
        checkout: draft.checkout,
        rooms: Number(draft.rooms),
        guests: Number(draft.guests),
        coupon: draft.coupon || "",
        guestName: `${draft.lastName.trim()} ${draft.firstName.trim()}`.trim(),
        email: draft.email,
        phone: draft.phone,
        note: draft.note || "",
        payMethod: selectedMethod(),
        requestKey: draft.requestKey,
        expectedTotal: total,
      }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== "success") {
      const error = Error(result.message || "Không lưu được đặt phòng.");
      error.data = result.data;
      throw error;
    }
    return result.data;
  }
  async function pay(button) {
    if (saving || !quoteReady || state.phase !== "pay") return;
    if (state.method === "card" && !showErrors(validateCard())) return;
    if (Date.now() >= draft.deadline) {
      tick();
      return;
    }
    saving = true;
    button.disabled = true;
    button.textContent = "Đang xử lý...";
    root
      .querySelectorAll("[name=pay],[name=wallet]")
      .forEach((el) => (el.disabled = true));
    try {
      const saved = await saveBooking();
      draft.code = saved.code;
      base = Number(saved.subtotal);
      discount = Number(saved.discount);
      tax = Number(saved.tax);
      total = Number(saved.total);
      history.replaceState(
        null,
        "",
        location.pathname + "?code=" + encodeURIComponent(saved.code),
      );
      try {
        sessionStorage.removeItem(KEY);
      } catch {}
      state.card = { name: "", number: "", exp: "", cvv: "" };
      state.phase = "done";
      clearInterval(timer);
      renderLeft();
      renderPrice();
      renderSummary();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (error.data?.priceChanged) await loadQuote();
      alert(error.message);
    } finally {
      saving = false;
      if (state.phase === "pay") renderLeft();
    }
  }

  /* ---------- Sự kiện ---------- */
  root.addEventListener("change", (e) => {
    const t = e.target;
    if (saving) return;
    if (t.name === "pay") state.method = t.value;
    else if (t.name === "wallet") state.wallet = t.value;
    else return;
    renderLeft();
  });

  root.addEventListener("input", (e) => {
    const k = e.target.dataset.c;
    if (!k) return;
    let v = e.target.value;
    if (k === "number")
      v = v
        .replace(/\D/g, "")
        .slice(0, 19)
        .replace(/(.{4})/g, "$1 ")
        .trim();
    else if (k === "exp") {
      v = v.replace(/\D/g, "").slice(0, 4);
      if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
    } else if (k === "cvv") v = v.replace(/\D/g, "").slice(0, 4);
    e.target.value = v;
    state.card[k] = v;
    const map = {
      number: ["#ccNum", "0000 0000 0000 0000"],
      name: ["#ccName", "Tên chủ thẻ"],
      exp: ["#ccExp", "MM/YY"],
    };
    if (map[k]) {
      const el = $(map[k][0]);
      el.textContent = v || map[k][1];
      el.classList.toggle("is-empty", !v);
    }
  });

  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-back]")) {
      e.preventDefault();
      if (saving) return;
      if (state.phase === "pay") {
        draft.pay = state.method;
        try {
          sessionStorage.setItem(KEY, JSON.stringify(draft));
        } catch (_) {
          alert(
            "Không lưu được thông tin để quay lại. Vui lòng cho phép lưu dữ liệu trong trình duyệt.",
          );
          return;
        }
      }
      location.href = backUrl;
      return;
    }
    const cp = e.target.closest("[data-copy]");
    if (cp) {
      if (navigator.clipboard)
        navigator.clipboard.writeText(cp.dataset.copy).catch(() => {});
      cp.classList.add("is-copied");
      setTimeout(() => cp.classList.remove("is-copied"), 1200);
      return;
    }
    const btn = e.target.closest("[data-pay]");
    if (btn) pay(btn);
  });

  async function loadQuote() {
    const button = root.querySelector("[data-pay]");
    if (button) {
      button.disabled = true;
      button.textContent = "Đang cập nhật giá...";
    }
    try {
      const response = await fetch("../api/bookings/quote.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: draft.city,
          hotelId: draft.hotelId,
          roomId: draft.roomId,
          checkin: draft.checkin,
          checkout: draft.checkout,
          rooms: draft.rooms,
          guests: draft.guests,
          coupon: draft.coupon || "",
        }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "success")
        throw Error(result.message || "Báo giá thất bại");
      base = Number(result.data.subtotal);
      discount = Number(result.data.discount);
      tax = Number(result.data.tax);
      total = Number(result.data.total);
      quoteReady = true;
      renderPrice();
      renderLeft();
      renderSummary();
    } catch (err) {
      quoteReady = false;
      const left = document.getElementById("pLeft");
      if (left)
        left.innerHTML = `<div class="card"><h3>Không thể lấy báo giá</h3><p>${esc(err.message)}</p><a href="${esc(backUrl)}">Quay lại đặt phòng</a></div>`;
    }
  }
  renderLeft();
  renderPrice();
  renderSummary();
  if (savedBooking) {
    base = Number(savedBooking.subtotal ?? savedBooking.total);
    discount = Number(savedBooking.discount || 0);
    tax = Number(savedBooking.tax || 0);
    total = Number(savedBooking.total);
    renderPrice();
  } else {
    loadQuote();
    timer = setInterval(tick, 1000);
  }
  window.addEventListener("pagehide", () => clearInterval(timer));
})();
