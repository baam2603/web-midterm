(function () {
  "use strict";
  const gate = document.getElementById("tk-admin-gate"),
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

  // Dashboard access is never granted by sessionStorage or localStorage.
  let adminAuthorized = false;

  let dashboardData = null;
  let dashboardError = "";
  let adminHotels = null;
  let adminHotelsError = "";
  async function loadDashboard() {
    dashboardData = null;
    dashboardError = "";

    try {
      const response = await fetch(
        new URL("../api/admin/dashboard.php", location.href),
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      if (response.status === 401 || response.status === 403) {
        adminAuthorized = false;
        window.setAdminHeaderUser?.(null);
        app.hidden = true;
        gate.hidden = false;

        const message = document.getElementById("tk-admin-gate-message");

        if (message) {
          message.textContent =
            response.status === 401
              ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
              : "Tài khoản không có quyền quản trị.";
        }
        return;
      }

      const result = await response.json();

      if (
        !response.ok ||
        result.status !== "success" ||
        !result.data?.metrics ||
        !Array.isArray(result.data.recentBookings)
      ) {
        throw new Error(result.message || "Dữ liệu Dashboard không hợp lệ.");
      }

      dashboardData = result.data;
    } catch (error) {
      console.error("Dashboard API error:", error);
      dashboardError = error.message || "Không thể tải dữ liệu Dashboard.";
    }
  }

  function makeHotelSlug(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/g, "");
  }

  async function loadAdminHotels() {
    adminHotels = null;
    adminHotelsError = "";

    try {
      const response = await fetch(
        new URL("../api/admin/hotels.php", location.href),
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      const result = await response.json().catch(() => null);

      if (response.status === 401 || response.status === 403) {
        adminAuthorized = false;
        window.setAdminHeaderUser?.(null);
        app.hidden = true;
        gate.hidden = false;

        const message = document.getElementById("tk-admin-gate-message");

        if (message) {
          message.textContent =
            response.status === 401
              ? "Phiên đăng nhập đã hết hạn."
              : "Tài khoản không có quyền Admin.";
        }
        return;
      }

      if (
        !response.ok ||
        result?.status !== "success" ||
        !Array.isArray(result.data?.hotels)
      ) {
        throw new Error(
          result?.message || "Không thể tải danh sách khách sạn.",
        );
      }

      adminHotels = result.data.hotels;
    } catch (error) {
      console.error("Hotels API error:", error);
      adminHotelsError = error.message;
    }
  }

  async function createAdminHotel(payload) {
    // Bước 1: Lấy CSRF token
    const csrfResponse = await fetch(
      new URL("../api/admin/csrf.php", location.href),
      {
        credentials: "same-origin",
        cache: "no-store",
      },
    );

    const csrfResult = await csrfResponse.json().catch(() => null);

    if (!csrfResponse.ok || !csrfResult?.data?.csrfToken) {
      throw new Error(csrfResult?.message || "Không lấy được CSRF token.");
    }

    // Bước 2: Gửi dữ liệu khách sạn lên PHP
    const response = await fetch(
      new URL("../api/admin/hotels-create.php", location.href),
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfResult.data.csrfToken,
        },
        body: JSON.stringify(payload),
      },
    );

    const result = await response.json().catch(() => null);

    if (!response.ok || result?.status !== "success") {
      throw new Error(
        result?.message || `Không thể tạo khách sạn (HTTP ${response.status}).`,
      );
    }

    return result.data;
  }

  async function updateHotelVisibility(id, isActive) {
    // Lấy CSRF token từ PHP Session
    const tokenResponse = await fetch(
      new URL("../api/admin/csrf.php", location.href),
      {
        credentials: "same-origin",
        cache: "no-store",
      },
    );

    const tokenResult = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenResult.data?.csrfToken) {
      throw new Error(tokenResult.message || "Không lấy được CSRF token.");
    }

    // Cập nhật trạng thái khách sạn
    const response = await fetch(
      new URL("../api/admin/hotels-visibility.php", location.href),
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": tokenResult.data.csrfToken,
        },
        body: JSON.stringify({
          id,
          is_active: isActive,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok || result.status !== "success") {
      throw new Error(result.message || "Không thể cập nhật khách sạn.");
    }

    return result.data;
  }

  let authRequestId = 0;

  function active() {
    return adminAuthorized;
  }

  async function show() {
    // A later verification result must not be overwritten by an older request.

    window.setAdminHeaderUser?.(null);
    const requestId = ++authRequestId;
    adminAuthorized = false;
    gate.hidden = false;
    app.hidden = true;

    const message = document.getElementById("tk-admin-gate-message");
    const loginLink = document.getElementById("tk-admin-login");

    if (loginLink) {
      const returnPath = location.pathname + location.search + location.hash;
      loginLink.href =
        "../auth/login.html?next=" + encodeURIComponent(returnPath);
    }
    if (message) message.textContent = "Đang kiểm tra quyền truy cập...";

    // Lưu thông tin đã xác thực để sử dụng sau khối try/catch.
    let verifiedAdmin = null;
    try {
      const response = await fetch(
        new URL("../api/admin/me.php", location.href),
        { method: "GET", credentials: "same-origin", cache: "no-store" },
      );
      const result = await response.json().catch(() => null);
      if (requestId !== authRequestId) return;

      if (response.status === 401) {
        throw new Error("Vui lòng đăng nhập để tiếp tục.");
      }
      if (response.status === 403) {
        throw new Error("Tài khoản không có quyền Admin.");
      }
      if (
        !response.ok ||
        result?.status !== "success" ||
        result?.data?.admin?.role !== "admin"
      ) {
        throw new Error(
          result?.message || `Không thể xác thực (HTTP ${response.status}).`,
        );
      }
      verifiedAdmin = result.data.admin;
    } catch (error) {
      if (requestId !== authRequestId) return;
      console.error("Không thể xác minh phiên Admin:", error);
      adminAuthorized = false;
      gate.hidden = false;
      app.hidden = true;
      if (message)
        message.textContent = error?.message || "Không thể kết nối máy chủ.";
      return;
    }

    // Authentication succeeded. Rendering issues should NOT show login again.

    adminAuthorized = true;
    window.setAdminHeaderUser?.(verifiedAdmin);
    gate.hidden = true;
    app.hidden = false;

    content.textContent = "Đang tải Dashboard...";

    await loadDashboard();

    if (active() && tab === "hotels") {
      await loadAdminHotels();
    }

    if (active()) {
      try {
        render();
      } catch (error) {
        console.error("Dashboard render error:", error);

        content.textContent = "Lỗi hiển thị Dashboard: " + error.message;
      }
    }
  }

  // Removed the obsolete tk-enter-admin demo click handler entirely.
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
    const m = dashboardData?.metrics;

    return [
      {
        title: "Tổng khách sạn",
        value: m ? Number(m.hotelCount ?? 0) : "—",
      },
      {
        title: "Đơn đang hoạt động",
        value: m ? Number(m.activeBookings ?? 0) : "—",
      },
      {
        title: "Đơn hoàn tất",
        value: m ? Number(m.completedBookings ?? 0) : "—",
      },
      {
        title: "Giá trị đơn hoàn tất",
        value: m ? money(m.completedValue) : "—",
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
    if (dashboardError) {
      return `
      <div class="tk-surface tk-alert">
        <h2>Không thể tải Dashboard</h2>
        <p>${esc(dashboardError)}</p>
      </div>
    `;
    }

    if (!dashboardData) {
      return `
      <div class="tk-surface">
        Đang tải dữ liệu Dashboard...
      </div>
    `;
    }

    const { metrics, recentBookings } = dashboardData;

    const rows = recentBookings
      .map(
        (b) => `
    <tr>
      <td><strong>${esc(b.code)}</strong></td>
      <td>${esc(b.hotelName)}</td>
      <td>${esc(b.guestName)}</td>
      <td>${statusTag(b.status)}</td>
      <td>${money(b.total)}</td>
    </tr>
  `,
      )
      .join("");

    return `
    <div class="tk-grid">
      <div class="tk-surface">
        <h2>Cần xử lý</h2>

        <p>
          <strong>${Number(metrics.pendingBookings ?? 0)}</strong>
          đơn chờ thanh toán
        </p>

        <p class="tk-muted">
          Số liệu được lấy từ cơ sở dữ liệu MySQL.
        </p>
      </div>

      <div class="tk-surface">
        <h2>Tổng quan hoạt động</h2>

        <p>
          Khách sạn:
          <strong>${Number(metrics.hotelCount ?? 0)}</strong>
        </p>

        <p>
          Đơn đang hoạt động:
          <strong>${Number(metrics.activeBookings ?? 0)}</strong>
        </p>

        <p>
          Đơn hoàn tất:
          <strong>${Number(metrics.completedBookings ?? 0)}</strong>
        </p>

        <p>
          Giá trị đơn hoàn tất:
          <strong>${money(metrics.completedValue)}</strong>
        </p>
      </div>
    </div>

    <h2 style="margin-top:24px">
      5 đơn đặt phòng gần nhất
    </h2>

    ${table(["Mã đơn", "Khách sạn", "Khách", "Trạng thái", "Tổng tiền"], rows)}
  `;
  }

  function hotelTab() {
    if (adminHotelsError) {
      return `
      <div class="tk-surface tk-alert">
        <h2>Lỗi tải khách sạn</h2>
        <p>${esc(adminHotelsError)}</p>
      </div>
    `;
    }

    if (!adminHotels) {
      return `
      <div class="tk-surface">
        Đang tải danh sách khách sạn...
      </div>
    `;
    }

    const cityName = (city) =>
      ({
        dalat: "Đà Lạt",
        vungtau: "Vũng Tàu",
      })[city] || city;

    const rows = adminHotels
      .map(
        (h) => `
    <tr>
      <td>
        <strong>${esc(h.name)}</strong>
        <span class="tk-mini">
          ${esc(h.slug)}
        </span>
      </td>

      <td>${esc(cityName(h.city))}</td>

      <td>${esc(h.address)}</td>

      <td>${Number(h.room_type_count || 0)}</td>

      <td>${money(h.price_per_night)}</td>

      <td>
        <span class="tk-pill ${Number(h.is_active) === 1 ? "" : "bad"}">
          ${Number(h.is_active) === 1 ? "Đang hiển thị" : "Đang ẩn"}
        </span>
      </td>
      
<td>
  <button
    type="button"
    class="${Number(h.is_active) === 1 ? "tk-danger" : "tk-primary"}"
    data-hotel-visibility="${Number(h.id)}"
    data-target-active="${Number(h.is_active) === 1 ? 0 : 1}"
  >
    ${Number(h.is_active) === 1 ? "Ẩn khách sạn" : "Hiển thị"}
  </button>
</td>

    </tr>
  `,
      )
      .join("");

    return `
    

<div class="tk-surface">
  <div class="tk-row">
    <div>
      <h2>Quản lý khách sạn</h2>
      <p class="tk-muted">
        Tổng cộng
        <strong>${adminHotels.length}</strong>
        khách sạn từ MySQL.
      </p>
    </div>

    <button
      type="button"
      class="tk-primary"
      id="tk-open-create-hotel"
      aria-expanded="false"
      aria-controls="tk-create-hotel-panel"
    >
      + Thêm khách sạn
    </button>
  </div>

  <div id="tk-create-hotel-panel" hidden>
    <h3>Thông tin khách sạn mới</h3>

    <p class="tk-muted">
      Khách sạn cần có địa điểm được xác minh
      trên OpenStreetMap trước khi lưu.
    </p>

    <form id="tk-create-hotel-db" class="tk-form">

      <!-- THÀNH PHỐ -->
      <div class="tk-flexcols">
        <label>
          Thành phố *
          <select name="city" required>
            <option value="dalat">Đà Lạt</option>
            <option value="vungtau">Vũng Tàu</option>
          </select>
        </label>

        <label>
          Loại hình *
          <select name="type" required>
            <option value="hotel">Khách sạn</option>
            <option value="resort">Resort</option>
            <option value="homestay">Homestay</option>
          </select>
        </label>
      </div>

      <!-- TÌM KIẾM TRÊN BẢN ĐỒ -->
      <div class="tk-surface">
        <h3>1. Xác minh địa điểm trên bản đồ</h3>
        <label>
          Tìm kiếm theo
          <select id="tk-maps-mode">
            <option value="auto">Tự động nhận diện</option>
            <option value="name">Tên khách sạn</option>
            <option value="address">Địa chỉ / đường phố</option>
          </select>
        </label>
        <label>
          Tên khách sạn cần tìm *
          <input
            id="tk-maps-search"
            type="search"
            minlength="3"
            maxlength="100"
            autocomplete="off"
            placeholder="Nhập tên khách sạn hoặc địa chỉ..."
          >
        </label>

        <div class="tk-actions">
          <button
            type="button"
            id="tk-maps-search-button"
            class="tk-outline"
          >
            Tìm trên OpenStreetMap
          </button>
        </div>

        <div
          id="tk-maps-results"
          class="tk-form"
          role="status"
          aria-live="polite"
        ></div>

        <input
          type="hidden"
          name="google_place_id"
          id="tk-osm-place-id"
        >

        <label>
          Địa chỉ được xác minh *
          <input
            type="text"
            name="address"
            id="tk-verified-address"
            placeholder="Hãy chọn khách sạn từ kết quả tìm kiếm"
            readonly
            required
          >
        </label>

        <a
          id="tk-selected-maps"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          hidden
        >
          Xem vị trí trên OpenStreetMap
        </a>

        <p class="tk-muted">
          Dữ liệu bản đồ:
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
          >
            © OpenStreetMap contributors
          </a>
        </p>
      </div>

      <!-- THÔNG TIN KHÁCH SẠN -->
      <h3>2. Thông tin khách sạn</h3>

      <div class="tk-flexcols">
        <label>
          Tên khách sạn *
          <input
            name="name"
            type="text"
            minlength="3"
            maxlength="150"
            placeholder="Chọn khách sạn trên bản đồ"
            required
          >
        </label>

        <label>
          Slug *
          <input
            name="slug"
            type="text"
            maxlength="80"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="ten-khach-san"
            required
          >
        </label>
      </div>

      <div class="tk-flexcols">
        <label>
          Số sao *
          <select name="stars" required>
            <option value="1">1 sao</option>
            <option value="2">2 sao</option>
            <option value="3" selected>3 sao</option>
            <option value="4">4 sao</option>
            <option value="5">5 sao</option>
          </select>
        </label>

        <label>
          Giá tham khảo/đêm (VNĐ) *
          <input
            name="price_per_night"
            type="number"
            min="100000"
            max="100000000"
            step="1000"
            placeholder="850000"
            required
          >
        </label>
      </div>

      <label>
        Mô tả khách sạn
        <textarea
          name="description"
          maxlength="3000"
          rows="4"
          placeholder="Giới thiệu về khách sạn..."
        ></textarea>
      </label>

      <!-- TRẠNG THÁI -->
      <div class="tk-surface">
        <p>
          <strong>Trạng thái khi tạo:</strong>
          Đang ẩn
        </p>

        <p class="tk-muted">
          Khách sạn mới chưa hiển thị trên website
          Customer. Hãy bổ sung hình ảnh và loại phòng
          trước khi công khai.
        </p>
      </div>

      <!-- NÚT THAO TÁC -->
      <div class="tk-actions">
        <button
          type="submit"
          class="tk-primary"
          id="tk-save-create-hotel"
        >
          Lưu khách sạn
        </button>

        <button
          type="button"
          class="tk-outline"
          id="tk-close-create-hotel"
        >
          Hủy
        </button>
      </div>

    </form>
  </div>
</div>



    <h2 style="margin-top:24px">
      Danh sách khách sạn
    </h2>

    ${table(
      [
        "Khách sạn",
        "Thành phố",
        "Địa chỉ",
        "Loại phòng",
        "Giá tham khảo",
        "Trạng thái",
        "Thao tác",
      ],
      rows,
    )}
  `;
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
    return `<h2>Kiểm tra đánh giá</h2><p class="tk-muted">Chỉ tài khoản có đơn đã lưu trú mới được gửi đánh giá. Đánh giá hiển thị công khai ngay khi gửi; admin chỉ kiểm tra và xóa nội dung vi phạm.</p>${table(
      ["Người gửi", "Khách sạn", "Đánh giá", "Thao tác"],
      ThreeKData.reviewsForAdmin()
        .map(
          (r) =>
            `<tr><td>${esc(r.author)}<span class="tk-mini">${date(r.createdAt)}</span></td><td>${esc(hotelName(r.city, r.hotelId))}</td><td><span class="tk-rating">${"★".repeat(r.score)}</span><p>${esc(r.comment)}</p></td><td><div class="tk-actions"><button class="tk-danger" data-delete-review="${esc(r.id)}">Xóa</button></div></td></tr>`,
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
    // Danh sách khách sạn sử dụng MySQL; form demo cũ không còn trong tab này.
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

  tabs.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-tab]");
    if (!el || !active()) return;

    tab = el.dataset.tab;

    history.replaceState(null, "", "#" + tab);

    if (tab === "overview") {
      content.textContent = "Đang cập nhật Dashboard...";
      await loadDashboard();
    }

    if (tab === "hotels") {
      content.textContent = "Đang tải khách sạn...";
      await loadAdminHotels();
    }

    if (active()) {
      render();
    }
  });

  content.addEventListener("click", (e) => {
    const openBtn = e.target.closest("#tk-open-create-hotel");
    const closeBtn = e.target.closest("#tk-close-create-hotel");

    if (!openBtn && !closeBtn) return;

    const panel = content.querySelector("#tk-create-hotel-panel");
    const toggle = content.querySelector("#tk-open-create-hotel");

    if (!panel || !toggle) return;

    if (openBtn) {
      panel.hidden = !panel.hidden;
    } else {
      panel.hidden = true;
    }

    toggle.setAttribute("aria-expanded", String(!panel.hidden));

    if (!panel.hidden) {
      panel.querySelector('[name="name"]')?.focus();
    }
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
  content.addEventListener("click", async (e) => {
    if (!active()) return;
    const b = e.target.closest("button");
    if (!b) return;
    try {
      if (b.hasAttribute("data-hotel-visibility")) {
        const hotelId = Number(b.dataset.hotelVisibility);
        const newState = Number(b.dataset.targetActive);

        if (
          !Number.isSafeInteger(hotelId) ||
          hotelId < 1 ||
          ![0, 1].includes(newState)
        ) {
          throw new Error("Thông tin khách sạn không hợp lệ.");
        }

        const hotel = adminHotels?.find((h) => Number(h.id) === hotelId);

        if (!hotel) {
          throw new Error("Không tìm thấy khách sạn.");
        }

        const action = newState === 1 ? "hiển thị" : "ẩn";

        if (!confirm(`Bạn có chắc muốn ${action} khách sạn "${hotel.name}"?`)) {
          return;
        }

        b.disabled = true;

        try {
          await updateHotelVisibility(hotelId, newState);

          // Lấy lại dữ liệu mới từ MySQL
          await loadAdminHotels();
          await loadDashboard();

          if (!active()) return;

          render();

          feedback(`Đã ${action} khách sạn "${hotel.name}" thành công.`);
        } finally {
          b.disabled = false;
        }

        return;
      }

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
      } else if (b.dataset.deleteReview) {
        if (!confirm("Xóa đánh giá này? Không thể hoàn tác.")) return;
        ThreeKData.deleteReview(b.dataset.deleteReview);
        render();
        feedback("Đã xóa đánh giá.");
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
  window.addEventListener("storage", show);

  window.addEventListener("threek:auth-updated", show);
  // Revalidate when returning to a previously cached Admin page.

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) show();
  });

  // ========================================
  // OPENSTREETMAP — QUẢN LÝ ĐỊA ĐIỂM
  // ========================================

  let osmSearchVersion = 0;

  function clearOsmSelection(form) {
    form.elements.namedItem("google_place_id").value = "";
    form.elements.namedItem("address").value = "";
    delete form.dataset.selectedOsmKind;
    const mapLink = form.querySelector("#tk-selected-maps");
    const results = form.querySelector("#tk-maps-results");

    if (mapLink) {
      mapLink.hidden = true;
      mapLink.removeAttribute("href");
    }

    if (results) {
      results.replaceChildren();
    }
  }

  // ========================================
  // TẠO SLUG + XÓA ĐỊA ĐIỂM KHI THAY ĐỔI
  // ========================================

  content.addEventListener("input", (e) => {
    const form = e.target.closest("#tk-create-hotel-db");
    if (!form) return;

    const slugInput = form.elements.namedItem("slug");

    if (e.target.name === "slug") {
      slugInput.dataset.userEdited = "true";
      return;
    }

    if (e.target.name === "name") {
      if (slugInput.dataset.userEdited !== "true") {
        slugInput.value = makeHotelSlug(e.target.value);
      }
    }

    if (e.target.id === "tk-maps-search") {
      osmSearchVersion++;
      clearOsmSelection(form);
    }
  });

  // Đổi thành phố phải chọn lại địa điểm
  content.addEventListener("change", (e) => {
    const form = e.target.closest("#tk-create-hotel-db");
    if (!form || e.target.name !== "city") return;

    osmSearchVersion++;
    clearOsmSelection(form);

    const searchInput = form.querySelector("#tk-maps-search");
    if (searchInput) searchInput.value = "";
  });

  // TÌM KHÁCH SẠN TRÊN OPENSTREETMAP
  content.addEventListener("click", async (e) => {
    const searchButton = e.target.closest("#tk-maps-search-button");

    if (!searchButton || !active()) return;

    const form = searchButton.closest("#tk-create-hotel-db");
    const input = form.querySelector("#tk-maps-search");
    const results = form.querySelector("#tk-maps-results");

    const query = input.value.trim();
    const city = form.elements.namedItem("city").value;

    if (query.length < 3) {
      results.textContent = "Vui lòng nhập ít nhất 3 ký tự.";
      return;
    }

    const version = ++osmSearchVersion;
    clearOsmSelection(form);

    searchButton.disabled = true;
    searchButton.textContent = "Đang tìm...";

    results.textContent = "Đang tìm khách sạn trên OpenStreetMap...";

    try {
      const url = new URL("../api/admin/places-search.php", location.href);

      url.searchParams.set("q", query);
      url.searchParams.set("city", city);
      url.searchParams.set(
        "mode",
        form.querySelector("#tk-maps-mode")?.value || "auto",
      );
      const response = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      // Bỏ qua kết quả cũ nếu Admin đã đổi từ khóa
      if (version !== osmSearchVersion || !form.isConnected) {
        return;
      }

      if (
        !response.ok ||
        data?.status !== "success" ||
        !Array.isArray(data.data?.places)
      ) {
        throw new Error(data?.message || "Không thể tìm khách sạn.");
      }

      results.replaceChildren();

      const places = data.data.places;

      if (places.length === 0) {
        results.textContent = "Không tìm thấy khách sạn phù hợp trên bản đồ.";
        return;
      }

      let count = 0;

      for (const place of places) {
        if (
          !/^osm-[NWR][0-9]{1,15}$/.test(place.placeId || "") ||
          !place.name ||
          !place.address
        ) {
          continue;
        }

        count++;

        const button = document.createElement("button");

        button.type = "button";
        button.className = "tk-outline";
        button.style.cssText =
          "display:block;width:100%;text-align:left;" +
          "padding:12px;margin:8px 0;white-space:normal;";

        const kind = place.kind || "lodging";
        const prefix =
          kind === "lodging"
            ? "✓ Cơ sở lưu trú / Căn hộ"
            : kind === "address"
              ? "🏢 Tòa nhà / Địa chỉ xác thực"
              : "○ Khu vực / Đường phố (hãy nhập chi tiết hơn)";
        button.textContent =
          prefix + " — " + place.name + " — " + place.address;
        button.disabled = kind === "location" || place.canSelect === false;
        if (button.disabled)
          button.title =
            "Đây là đường phố/khu vực chung, vui lòng chọn tòa nhà hoặc địa chỉ cụ thể";

        button.addEventListener("click", () => {
          if (version !== osmSearchVersion || !form.isConnected) {
            return;
          }

          if (place.address.length > 255) {
            results.textContent =
              "Địa chỉ quá dài để lưu. Cần điều chỉnh giới hạn dữ liệu.";
            return;
          }

          // Lưu OSM ID & Địa chỉ
          form.elements.namedItem("google_place_id").value = place.placeId;

          const selectedKind = place.kind || "lodging";
          form.dataset.selectedOsmKind = selectedKind;
          form.elements.namedItem("address").value = place.address;

          const nameInput = form.elements.namedItem("name");
          const slug = form.elements.namedItem("slug");

          // Nếu địa điểm có tên rõ ràng (VD: "The Sóng", khách sạn, tòa căn hộ...) thì tự động điền sẵn
          const suggestedName =
            place.name &&
            place.name !== place.address &&
            !/^[0-9]+$/.test(place.name.trim())
              ? place.name.trim().slice(0, 150)
              : "";

          if (suggestedName) {
            nameInput.value = suggestedName;
            if (slug.dataset.userEdited !== "true") {
              slug.value = makeHotelSlug(suggestedName);
            }
          } else {
            // Trường hợp tìm theo số nhà thuần túy chưa có tên tòa nhà
            if (!nameInput.value.trim()) {
              nameInput.placeholder =
                "Nhập tên khách sạn / căn hộ tại địa chỉ này...";
              nameInput.focus();
            }
          }

          // Tạo đường dẫn OpenStreetMap an toàn
          const mapTypes = {
            N: "node",
            W: "way",
            R: "relation",
          };

          const mapType = mapTypes[place.placeId[4]];
          const osmId = place.placeId.slice(5);

          const mapLink = form.querySelector("#tk-selected-maps");

          mapLink.href =
            "https://www.openstreetmap.org/" + mapType + "/" + osmId;

          mapLink.hidden = false;

          results.replaceChildren();
          results.textContent =
            "Đã chọn địa điểm: " +
            place.name +
            " (Bạn có thể giữ nguyên hoặc chỉnh sửa lại Tên khách sạn bên dưới)";
        });

        results.appendChild(button);
      }

      if (count === 0) {
        results.textContent = "Không có địa điểm hợp lệ trong kết quả.";
      }
    } catch (error) {
      if (version === osmSearchVersion) {
        console.error("OSM Search Error:", error);

        results.textContent = error.message || "Lỗi tìm kiếm bản đồ.";
      }
    } finally {
      if (searchButton.isConnected) {
        searchButton.disabled = false;
        searchButton.textContent = "Tìm trên OpenStreetMap";
      }
    }
  });

  //  Lưu vào SQL

  content.addEventListener("submit", async (e) => {
    const form = e.target;

    if (form.id !== "tk-create-hotel-db") return;

    e.preventDefault();

    if (!active()) return;

    const values = Object.fromEntries(new FormData(form));

    const payload = {
      name: values.name.trim(),
      slug: values.slug.trim(),
      city: values.city,
      type: values.type,
      stars: Number(values.stars),
      address: values.address.trim(),

      // Trường này chứa mã địa điểm OSM
      google_place_id: values.google_place_id,

      price_per_night: Number(values.price_per_night),
      description: values.description.trim(),
    };

    // Bắt buộc chọn địa điểm trên bản đồ
    if (
      !/^osm-[NWR][0-9]{1,15}$/.test(payload.google_place_id || "") ||
      !payload.address
    ) {
      feedback(
        "Vui lòng tìm và chọn khách sạn trên " + "OpenStreetMap trước khi lưu.",
        true,
      );
      return;
    }

    if (!form.reportValidity()) return;

    const submitBtn = form.querySelector('[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = "Đang lưu...";

    let created = false;

    try {
      // API PHP xác minh địa điểm và lưu MySQL
      const result = await createAdminHotel(payload);

      created = true;

      // Cập nhật danh sách khách sạn
      await loadAdminHotels();

      // Cập nhật Dashboard
      await loadDashboard();

      if (!active()) return;

      render();

      if (adminHotelsError || dashboardError) {
        feedback(
          "Khách sạn đã được tạo nhưng chưa tải lại " +
            "đầy đủ dữ liệu. Hãy làm mới trang.",
          true,
        );
        return;
      }

      feedback(
        `Đã thêm "${payload.name}" thành công! ` +
          `ID: ${result.id}. Trạng thái: Đang ẩn.`,
      );
    } catch (error) {
      console.error("Create hotel error:", error);

      feedback(
        created
          ? "Khách sạn đã lưu, nhưng lỗi cập nhật " +
              "giao diện: " +
              error.message
          : error.message,
        true,
      );
    } finally {
      if (submitBtn.isConnected) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Lưu khách sạn";
      }
    }
  });

  show();
})();
