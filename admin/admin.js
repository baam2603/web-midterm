(function () {
  "use strict";
  const gate = document.getElementById("tk-admin-gate"),
    app = document.getElementById("tk-admin-app"),
    tabs = document.getElementById("tk-admin-tabs"),
    content = document.getElementById("tk-admin-content"),
    kpis = document.getElementById("tk-kpis");
  const esc = (value) =>
      String(value ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      ),
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
  let adminRooms = null;
  let adminRoomsError = "";
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

  // 4F: Danh sách loại phòng từ MySQL, chỉ dành cho Admin.
  async function loadAdminRooms() {
    adminRooms = null;
    adminRoomsError = "";
    try {
      const response = await fetch(
        new URL("../api/admin/rooms.php", location.href),
        { credentials: "same-origin", cache: "no-store" },
      );
      const result = await response.json().catch(() => null);
      if (response.status === 401 || response.status === 403) {
        adminAuthorized = false;
        window.setAdminHeaderUser?.(null);
        app.hidden = true;
        gate.hidden = false;
        const message = document.getElementById("tk-admin-gate-message");
        if (message)
          message.textContent =
            response.status === 401
              ? "Phiên đăng nhập đã hết hạn."
              : "Tài khoản không có quyền Admin.";
        return;
      }
      if (
        !response.ok ||
        result?.status !== "success" ||
        !Array.isArray(result.data?.rooms)
      ) {
        throw new Error(
          result?.message || `Không tải được phòng (HTTP ${response.status}).`,
        );
      }
      adminRooms = result.data.rooms;
    } catch (error) {
      console.error("Admin rooms API:", error);
      adminRoomsError = error.message || "Không tải được loại phòng.";
    }
  }

  async function createAdminRoom(payload) {
    const tokenResponse = await fetch(
      new URL("../api/admin/csrf.php", location.href),
      { credentials: "same-origin", cache: "no-store" },
    );
    const tokenData = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok || !tokenData?.data?.csrfToken) {
      throw new Error(tokenData?.message || "Không lấy được mã CSRF.");
    }
    const response = await fetch(
      new URL("../api/admin/rooms-create.php", location.href),
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": tokenData.data.csrfToken,
        },
        body: JSON.stringify(payload),
      },
    );
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.status !== "success") {
      throw new Error(
        result?.message || `Không thể thêm phòng (HTTP ${response.status}).`,
      );
    }
    return result.data;
  }

  // Bài 4H: chỉ cập nhật thông tin phòng, không thay hotel_id/code/room ID.
  async function updateAdminRoom(payload) {
    const response = await fetch(
      new URL("../api/admin/rooms-update.php", location.href),
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": await csrfToken(),
        },
        body: JSON.stringify(payload),
      },
    );
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.status !== "success") {
      const message =
        result?.message ||
        (response.status === 404
          ? "Không thấy api/admin/rooms-update.php. Kiểm tra đường dẫn file PHP."
          : `Không sửa được loại phòng (HTTP ${response.status}). Kiểm tra Network/Response và Apache error.log.`);
      throw new Error(message);
    }
    return result.data;
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

    if (active() && (tab === "hotels" || tab === "rooms")) {
      await loadAdminHotels();
    }
    if (active() && tab === "rooms") {
      await loadAdminRooms();
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
  const statusTag = (v) =>
    `<span class="tk-pill ${["cancelled", "rejected"].includes(v) ? "bad" : ["pending", "open"].includes(v) ? "warn" : ""}">${esc(labels[v] || v || "—")}</span>`;
  function table(head, body) {
    return `<div class="tk-surface tk-tablewrap"><table class="tk-table"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${body || `<tr><td colspan="${head.length}" class="tk-empty">Chưa có dữ liệu phù hợp.</td></tr>`}</tbody></table></div>`;
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
  <button type="button" class="tk-outline" data-hotel-edit-db="${Number(h.id)}">Chỉnh sửa</button>
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
            <option value="homestay">Homestay</option><option value="villa">Villa</option>
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
          Tên khách sạn hoặc địa chỉ cần tìm *
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



    <div class="tk-surface" style="margin-top:16px">
      <h2>Thông tin hiển thị cho khách hàng</h2>
      <form class="tk-form" id="tk-hotel-extras-form">
        <label>Khách sạn
          <select name="hotel_id" required>
            <option value="">-- Chọn khách sạn cần cập nhật --</option>
            ${adminHotels.map((h) => `<option value="${Number(h.id)}">${esc(h.name)}</option>`).join("")}
          </select>
        </label>
        <div class="tk-flexcols">
          <label>Giờ nhận phòng <input type="time" name="checkin_time"></label>
          <label>Giờ trả phòng <input type="time" name="checkout_time"></label>
        </div>
        <label>Quy tắc khách sạn (mỗi dòng một quy tắc)
          <textarea name="rules" rows="4" placeholder="Không hút thuốc trong phòng..."></textarea>
        </label>
        <div id="tk-hotel-amenities-options" class="tk-form" aria-live="polite">Chọn khách sạn để tải tiện nghi.</div>
        <button class="tk-primary" type="submit">Lưu thông tin khách sạn</button>
      </form>
    </div>
    <div class="tk-surface" style="margin-top:16px">
      <h2>Ảnh khách sạn / Ảnh bìa</h2>
      <form id="tk-upload-hotel-image" class="tk-form">
        <input type="hidden" name="kind" value="hotel">
        <label>Khách sạn
          <select name="item_id" required>
            <option value="">-- Chọn khách sạn --</option>
            ${adminHotels.map((h) => `<option value="${Number(h.id)}">${esc(h.name)}</option>`).join("")}
          </select>
        </label>
        <label>Chọn ảnh chụp thực tế (JPEG/PNG/WebP, tối đa 5MB)
          <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required>
        </label>
        <button type="submit" class="tk-outline">Tải ảnh khách sạn</button>
      </form>
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
    if (adminHotelsError || adminRoomsError) {
      return `<div class="tk-surface tk-alert">
        <h2>Không thể tải quản lý phòng</h2>
        <p>${esc(adminHotelsError || adminRoomsError)}</p>
      </div>`;
    }
    if (!Array.isArray(adminHotels) || !Array.isArray(adminRooms)) {
      return `<div class="tk-surface">Đang tải khách sạn và phòng từ MySQL...</div>`;
    }

    const hotelOptions = adminHotels
      .map(
        (h) =>
          `<option value="${Number(h.id)}">${esc(h.name)} (${h.city === "dalat" ? "Đà Lạt" : "Vũng Tàu"})</option>`,
      )
      .join("");

    const rows = adminRooms
      .map(
        (r) => `
      <tr>
        <td><strong>${esc(r.hotel_name)}</strong></td>
        <td><strong>${esc(r.name)}</strong><span class="tk-mini">${esc(r.code)}</span></td>
        <td>${Number(r.capacity)} khách</td>
        <td>${Number(r.total_rooms)} phòng</td>
        <td>${money(r.price_per_night)}</td>
        <td><span class="tk-pill ${Number(r.is_active) === 1 ? "" : "bad"}">
          ${Number(r.is_active) === 1 ? "Đang bán" : "Ngừng bán"}
        </span></td>
        <td><button type="button" class="tk-outline" data-room-edit="${Number(r.id)}">Chỉnh sửa</button></td>
      </tr>`,
      )
      .join("");

    return `
      <div class="tk-surface">
        <h2>Thêm loại phòng — MySQL</h2>
        <p class="tk-muted">Chọn khách sạn đã có trong hệ thống, sau đó tạo loại phòng.
          Giá và số lượng lưu trực tiếp vào bảng room_types.</p>
        ${
          hotelOptions
            ? `
        <form id="tk-create-room-db" class="tk-form">
          <label>Khách sạn *
            <select name="hotel_id" required>
              <option value="">-- Chọn khách sạn --</option>
              ${hotelOptions}
            </select>
          </label>
          <div class="tk-flexcols">
            <label>Tên loại phòng *
              <input name="name" minlength="2" maxlength="120" required
                     placeholder="Ví dụ: Deluxe Ocean View">
            </label>
            <label>Mã phòng *
              <input name="code" maxlength="50" pattern="[a-z0-9]+(-[a-z0-9]+)*"
                     placeholder="deluxe-ocean-view" required>
            </label>
          </div>
          <div class="tk-flexcols">
            <label>Sức chứa mỗi phòng (khách) *
              <input type="number" name="capacity" min="1" max="20" value="2" required>
            </label>
            <label>Tổng số phòng có thể bán *
              <input type="number" name="total_rooms" min="0" max="999" value="1" required>
            </label>
          </div>
          <label>Giá mỗi đêm (VNĐ) *
            <input type="number" name="price_per_night" min="100000" max="100000000"
                   step="1000" placeholder="950000" required>
          </label>
          <div class="tk-flexcols">
            <label>Diện tích (m²) *
              <input name="area_m2" type="number" min="1" max="2000" placeholder="32" required>
            </label>
            <label>Loại giường *
              <input name="bed_type" minlength="2" maxlength="120" placeholder="1 giường king" required>
            </label>
          </div>
          <label>Tiện nghi trong phòng (mỗi dòng một tiện nghi)
            <textarea name="features" rows="4" placeholder="Wifi miễn phí&#10;Ban công riêng&#10;Bồn tắm"></textarea>
          </label>
          <div class="tk-flexcols">
            <label><input type="checkbox" name="breakfast_included" style="width:auto"> Giá này đã bao gồm bữa sáng</label>
            <label><input type="checkbox" name="free_cancellation" style="width:auto"> Cho phép hủy miễn phí theo chính sách đã công bố</label>
          </div>
          <label>Mô tả loại phòng
            <textarea name="description" maxlength="3000" rows="3"
              placeholder="Hướng nhìn, tiện ích, loại giường..."></textarea>
          </label>
          <button type="submit" class="tk-primary">+ Lưu loại phòng</button>
        </form>`
            : `<p class="tk-empty">Chưa có khách sạn trong MySQL. Hãy thêm khách sạn trước.</p>`
        }
      </div>
      <div class="tk-surface" style="margin-top:16px">
        <h2>Ảnh cho loại phòng (JPEG/PNG/WebP, tối đa 5MB)</h2>
        <form id="tk-upload-room-image" class="tk-form">
          <input type="hidden" name="kind" value="room">
          <label>Loại phòng
            <select name="item_id" required>
              <option value="">-- Chọn loại phòng đã lưu --</option>
              ${adminRooms.map((r) => `<option value="${Number(r.id)}">${esc(r.hotel_name)} — ${esc(r.name)}</option>`).join("")}
            </select>
          </label>
          <label>Chọn ảnh phòng thật
            <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required>
          </label>
          <button class="tk-outline" type="submit">Tải ảnh phòng</button>
        </form>
      </div>
      <section id="tk-edit-room-panel" class="tk-surface" style="margin-top:16px;display:none" hidden>
        <h2>Chỉnh sửa loại phòng — MySQL</h2>
        <p id="tk-edit-room-caption" class="tk-muted"></p>
        <p id="tk-room-edit-validation" class="tk-muted" role="status" aria-live="polite" hidden></p>
        <form id="tk-update-room-db" class="tk-form">
          <input type="hidden" name="id">
          <label>Tên loại phòng *
            <input name="name" minlength="2" maxlength="120" required>
          </label>
          <div class="tk-flexcols">
            <label>Sức chứa mỗi phòng *
              <input name="capacity" type="number" min="1" max="20" required>
            </label>
            <label>Tổng số phòng *
              <input name="total_rooms" type="number" min="0" max="999" required>
            </label>
          </div>
          <label>Giá mỗi đêm (VNĐ) *
            <input name="price_per_night" type="number" min="100000" max="100000000" step="1000" required>
          </label>
          <div class="tk-flexcols">
            <label>Diện tích (m²) *
              <input name="area_m2" type="number" min="1" max="2000" required>
            </label>
            <label>Loại giường *
              <input name="bed_type" minlength="2" maxlength="120" required>
            </label>
          </div>
          <label>Tiện nghi phòng (mỗi dòng một tiện nghi)
            <textarea name="features" rows="3"></textarea>
          </label>
          <div class="tk-flexcols">
            <label><input type="checkbox" name="breakfast_included" style="width:auto"> Bao gồm bữa sáng</label>
            <label><input type="checkbox" name="free_cancellation" style="width:auto"> Hủy miễn phí theo chính sách</label>
          </div>
          <label>Mô tả loại phòng
            <textarea name="description" rows="3" maxlength="3000"></textarea>
          </label>
          <label>Trạng thái bán *
            <select name="is_active" required>
              <option value="1">Đang bán</option>
              <option value="0">Ngừng bán (không nhận đơn mới)</option>
            </select>
          </label>
          <p class="tk-muted">Không thay mã phòng và khách sạn để giữ liên kết các đơn cũ.
            Giá mới chỉ áp dụng cho đơn mới. Ngừng bán không hủy đơn đã đặt.</p>
          <div class="tk-actions">
            <button type="submit" class="tk-primary">Lưu thay đổi</button>
            <button type="button" class="tk-outline" id="tk-cancel-room-edit">Hủy chỉnh sửa</button>
          </div>
        </form>
      </section>
      <h2 style="margin-top:24px">Danh sách loại phòng (${adminRooms.length})</h2>
      ${table(["Khách sạn", "Loại phòng / Mã", "Sức chứa", "Số lượng", "Giá/đêm", "Trạng thái", "Thao tác"], rows)}
    `;
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
    if (window.AdminOperations?.has(tab)) {
      window.AdminOperations.mount(content, tab, async () => {
        await loadDashboard();
        if (active())
          kpis.innerHTML = stats()
            .map(
              (x) =>
                `<div class="tk-stat"><small>${x.title}</small><strong>${x.value}</strong></div>`,
            )
            .join("");
      });
      return;
    }
    window.AdminOperations?.cancel();
    delete content.dataset.operation;
    content.innerHTML = (
      {
        overview,
        hotels: hotelTab,
        rooms: roomTab,
      }[tab] || overview
    )();
    window.AdminCatalog?.mount(content, tab, adminHotels || [], async () => {
      await Promise.all([loadAdminHotels(), loadDashboard()]);
      if (active()) {
        render();
        feedback("Đã cập nhật khách sạn trong MySQL.");
      }
    });
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

    if (tab === "hotels" || tab === "rooms") {
      content.textContent =
        tab === "rooms" ? "Đang tải loại phòng..." : "Đang tải khách sạn...";
      await Promise.all([
        loadAdminHotels(),
        ...(tab === "rooms" ? [loadAdminRooms()] : []),
      ]);
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
    } catch (err) {
      feedback(err.message, true);
    }
  });
  window.addEventListener("hashchange", () => {
    const requested = location.hash.slice(1) || "overview";
    tab = ids.some(([id]) => id === requested) ? requested : "overview";
    show();
  });
  window.addEventListener("storage", show);

  window.addEventListener("threek:auth-updated", show);
  // Revalidate when returning to a previously cached Admin page.

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) show();
  });

  // OPENSTREETMAP — QUẢN LÝ ĐỊA ĐIỂM
  let osmSearchVersion = 0;
  let osmSearchController = null;

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
  // TẠO SLUG + XÓA ĐỊA ĐIỂM KHI THAY ĐỔI
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
      osmSearchController?.abort();
      clearOsmSelection(form);
    }
  });

  // Đổi thành phố phải chọn lại địa điểm
  content.addEventListener("change", (e) => {
    const form = e.target.closest("#tk-create-hotel-db");
    if (!form) return;
    if (e.target.id === "tk-maps-mode") {
      osmSearchVersion++;
      osmSearchController?.abort();
      clearOsmSelection(form);
      return;
    }
    if (e.target.name !== "city") return;

    osmSearchVersion++;
    osmSearchController?.abort();
    clearOsmSelection(form);

    const searchInput = form.querySelector("#tk-maps-search");
    if (searchInput) searchInput.value = "";
  });

  // Nhấn Enter trong ô địa chỉ là tìm kiếm, không gửi form thêm khách sạn.
  content.addEventListener("keydown", (e) => {
    if (e.target.id !== "tk-maps-search" || e.key !== "Enter") return;
    e.preventDefault();
    e.target
      .closest("#tk-create-hotel-db")
      ?.querySelector("#tk-maps-search-button")
      ?.click();
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

    osmSearchController?.abort();
    osmSearchController = new AbortController();
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
        signal: osmSearchController.signal,
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

        const kind = place.kind || "location";
        const prefix =
          place.matchSource === "exact_address"
            ? "⌖ Đúng số nhà và đường trên OSM"
            : place.matchSource === "nearby"
              ? "↗ Cơ sở lưu trú LÂN CẬN (" +
                (Number.isFinite(Number(place.distanceMeters))
                  ? Math.round(Number(place.distanceMeters)) + " m"
                  : "gần địa chỉ") +
                ")"
              : kind === "lodging"
                ? "✓ Cơ sở lưu trú / Căn hộ"
                : kind === "address"
                  ? "🏢 Tòa nhà / Địa điểm trên bản đồ"
                  : "○ Khu vực / Đường phố (không thể chọn)";
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
      if (version === osmSearchVersion && error.name !== "AbortError") {
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

    if (form.getAttribute("id") !== "tk-create-hotel-db") return;

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

  // 4F: Tạo mã phòng từ tên, cho phép chỉnh thủ công.
  content.addEventListener("input", (event) => {
    const form = event.target.closest("#tk-create-room-db");
    if (!form) return;
    const code = form.elements.namedItem("code");
    if (event.target.name === "code") {
      code.dataset.edited = "true";
    } else if (event.target.name === "name" && code.dataset.edited !== "true") {
      code.value = makeHotelSlug(event.target.value)
        .slice(0, 50)
        .replace(/-+$/g, "");
    }
  });

  content.addEventListener("submit", async (event) => {
    const form = event.target;
    if (form.getAttribute("id") !== "tk-create-room-db") return;
    event.preventDefault();
    if (!active() || !form.reportValidity()) return;

    const v = Object.fromEntries(new FormData(form));
    const payload = {
      hotel_id: Number(v.hotel_id),
      code: v.code.trim(),
      name: v.name.trim(),
      capacity: Number(v.capacity),
      total_rooms: Number(v.total_rooms),
      price_per_night: Number(v.price_per_night),
      area_m2: Number(v.area_m2),
      bed_type: String(v.bed_type || "").trim(),
      breakfast_included: form.elements.namedItem("breakfast_included").checked,
      free_cancellation: form.elements.namedItem("free_cancellation").checked,
      features: String(v.features || "")
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean),
      description: v.description.trim(),
    };
    const save = form.querySelector('[type="submit"]');
    save.disabled = true;
    save.textContent = "Đang lưu...";
    let created = false;
    try {
      const newRoom = await createAdminRoom(payload);
      created = true;
      await loadAdminRooms();
      if (active()) await loadAdminHotels(); // Cập nhật room_type_count ở tab khách sạn.
      if (!active()) return;
      render();
      if (adminRoomsError || adminHotelsError) {
        feedback(
          "Phòng đã được lưu vào MySQL nhưng chưa tải lại được danh sách. Hãy làm mới trang.",
          true,
        );
      } else {
        feedback(
          `Đã thêm loại phòng "${payload.name}" (ID: ${newRoom.id}) vào MySQL.`,
        );
      }
    } catch (error) {
      console.error("Create room error:", error);
      feedback(
        created
          ? "Phòng đã lưu nhưng lỗi cập nhật giao diện: " + error.message
          : error.message,
        true,
      );
    } finally {
      if (save.isConnected) {
        save.disabled = false;
        save.textContent = "+ Lưu loại phòng";
      }
    }
  });

  // Bài 4G — ảnh khách sạn / ảnh phòng có CSRF, lưu MySQL.
  async function csrfToken() {
    const response = await fetch(
      new URL("../api/admin/csrf.php", location.href),
      { credentials: "same-origin", cache: "no-store" },
    );
    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.data?.csrfToken)
      throw Error(json?.message || "Không lấy được CSRF token.");
    return json.data.csrfToken;
  }

  content.addEventListener("submit", async (e) => {
    const form = e.target;
    if (
      !["tk-upload-hotel-image", "tk-upload-room-image"].includes(
        form.getAttribute("id"),
      )
    )
      return;
    e.preventDefault();
    if (!active() || !form.reportValidity()) return;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const data = new FormData(form);
      const response = await fetch(
        new URL("../api/admin/media-upload.php", location.href),
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "X-CSRF-Token": await csrfToken() },
          body: data,
        },
      );
      const json = await response.json().catch(() => null);
      if (!response.ok || json?.status !== "success")
        throw Error(json?.message || `Lỗi tải ảnh HTTP ${response.status}`);
      const name = form.elements.namedItem("image");
      name.value = "";
      form.dispatchEvent(new Event("admin:media-upload"));
      feedback(
        "Đã tải ảnh thành công lên MySQL. Ảnh đầu tiên được dùng làm ảnh bìa.",
      );
    } catch (error) {
      feedback(error.message, true);
    } finally {
      if (submit.isConnected) submit.disabled = false;
    }
  });

  async function loadHotelExtras(form) {
    const id = Number(form.elements.namedItem("hotel_id").value);
    const target = form.querySelector("#tk-hotel-amenities-options");
    target.replaceChildren();
    if (!Number.isInteger(id) || id < 1) return;
    target.textContent = "Đang tải thông tin từ MySQL...";
    try {
      const url = new URL("../api/admin/hotel-extras.php", location.href);
      url.searchParams.set("hotel_id", String(id));
      const response = await fetch(url, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || json?.status !== "success")
        throw Error(json?.message || "Không tải được thông tin.");
      if (
        !form.isConnected ||
        Number(form.elements.namedItem("hotel_id").value) !== id
      )
        return;
      form.elements.namedItem("checkin_time").value =
        json.data.checkin_time || "";
      form.elements.namedItem("checkout_time").value =
        json.data.checkout_time || "";
      form.elements.namedItem("rules").value = (json.data.rules || []).join(
        "\n",
      );
      target.replaceChildren();
      const selected = new Set(json.data.amenities || []);
      for (const a of json.data.amenity_options || []) {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = "amenity_code";
        input.value = a.code;
        input.checked = selected.has(a.code);
        input.style.width = "auto";
        label.append(input, document.createTextNode(" " + a.label));
        target.append(label);
      }
    } catch (error) {
      target.textContent = error.message;
    }
  }
  content.addEventListener("change", (e) => {
    if (e.target.matches('#tk-hotel-extras-form [name="hotel_id"]'))
      loadHotelExtras(e.target.form);
  });
  content.addEventListener("submit", async (e) => {
    const form = e.target;
    if (form.getAttribute("id") !== "tk-hotel-extras-form") return;
    e.preventDefault();
    if (!active() || !form.reportValidity()) return;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const body = {
        hotel_id: Number(form.elements.namedItem("hotel_id").value),
        checkin_time: form.elements.namedItem("checkin_time").value,
        checkout_time: form.elements.namedItem("checkout_time").value,
        rules: form.elements
          .namedItem("rules")
          .value.split(/\r?\n/)
          .map((x) => x.trim())
          .filter(Boolean),
        amenities: [
          ...form.querySelectorAll('input[name="amenity_code"]:checked'),
        ].map((x) => x.value),
      };
      const response = await fetch(
        new URL("../api/admin/hotel-extras.php", location.href),
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": await csrfToken(),
          },
          body: JSON.stringify(body),
        },
      );
      const json = await response.json().catch(() => null);
      if (!response.ok || json?.status !== "success")
        throw Error(json?.message || "Không cập nhật được thông tin.");
      feedback(
        "Đã cập nhật giờ nhận/trả phòng, quy tắc và tiện nghi trong MySQL.",
      );
    } catch (error) {
      feedback(error.message, true);
    } finally {
      if (submit.isConnected) submit.disabled = false;
    }
  });

  // Bài 4H: mở/đóng form bằng ID lấy từ danh sách MySQL.
  content.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-room-edit]");
    const cancelButton = event.target.closest("#tk-cancel-room-edit");
    if (!editButton && !cancelButton) return;

    const panel = content.querySelector("#tk-edit-room-panel");
    if (!panel) return;
    if (cancelButton) {
      panel.hidden = true;
      panel.style.display = "none";
      return;
    }
    if (!active()) return;

    const id = Number(editButton.dataset.roomEdit);
    const room = adminRooms?.find((item) => Number(item.id) === id);
    if (!room) {
      feedback(
        "Không tìm thấy phòng trong danh sách MySQL. Hãy tải lại trang.",
        true,
      );
      return;
    }

    const form = panel.querySelector("#tk-update-room-db");
    const set = (key, value) => {
      form.elements.namedItem(key).value = value ?? "";
    };
    set("id", room.id);
    set("name", room.name);
    set("capacity", room.capacity);
    set("total_rooms", room.total_rooms);
    set("price_per_night", Number(room.price_per_night));
    set("area_m2", room.area_m2);
    set("bed_type", room.bed_type);
    set(
      "features",
      Array.isArray(room.features) ? room.features.join("\n") : "",
    );
    set("description", room.description);
    set("is_active", Number(room.is_active));
    form.elements.namedItem("breakfast_included").checked =
      Number(room.breakfast_included) === 1;
    form.elements.namedItem("free_cancellation").checked =
      Number(room.free_cancellation) === 1;

    panel.querySelector("#tk-edit-room-caption").textContent =
      `${room.hotel_name} · mã: ${room.code} · ID: ${room.id}`;
    panel.hidden = false;
    panel.style.display = "block";
    const note = panel.querySelector("#tk-room-edit-validation");
    const missingLegacyFields = [
      ["area_m2", "Diện tích (m²)"],
      ["bed_type", "Loại giường"],
      ["is_active", "Trạng thái bán"],
    ].filter(([key]) => !form.elements.namedItem(key).value.trim());
    if (missingLegacyFields.length) {
      note.textContent =
        "Loại phòng này chưa có: " +
        missingLegacyFields.map(([, label]) => label).join(", ") +
        ". Hãy bổ sung trước khi lưu thay đổi.";
      note.hidden = false;
    } else {
      note.textContent = "";
      note.hidden = true;
    }
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
    const firstMissing = missingLegacyFields[0]?.[0];
    form.elements
      .namedItem(firstMissing || "name")
      .focus({ preventScroll: true });
  });

  // Khi trường required bị thiếu, trình duyệt sẽ CHẶN submit event.
  // Hiển thị lý do ngay cạnh form thay vì im lặng khi Admin bấm Lưu.
  content.addEventListener("click", (event) => {
    const save = event.target.closest(
      '#tk-update-room-db button[type="submit"]',
    );
    if (!save) return;
    const form = save.form;
    const invalid = [...form.elements].filter(
      (el) => el.willValidate && !el.checkValidity(),
    );
    if (!invalid.length) return;
    const labels = invalid.map((el) => {
      const label = el.closest("label");
      return (
        label?.firstChild?.textContent?.trim()?.replace(/\s*\*$/, "") || el.name
      );
    });
    const note = content.querySelector("#tk-room-edit-validation");
    if (note) {
      note.textContent =
        "Chưa thể lưu. Kiểm tra: " + [...new Set(labels)].join(", ");
      note.hidden = false;
    }
    form.reportValidity();
  });

  content.addEventListener("submit", async (event) => {
    const form = event.target;
    if (form.getAttribute("id") !== "tk-update-room-db") return;
    event.preventDefault();
    if (!active() || !form.reportValidity()) return;

    const values = Object.fromEntries(new FormData(form));
    const payload = {
      id: Number(values.id),
      name: String(values.name || "").trim(),
      capacity: Number(values.capacity),
      total_rooms: Number(values.total_rooms),
      price_per_night: Number(values.price_per_night),
      area_m2: Number(values.area_m2),
      bed_type: String(values.bed_type || "").trim(),
      breakfast_included: form.elements.namedItem("breakfast_included").checked,
      free_cancellation: form.elements.namedItem("free_cancellation").checked,
      is_active: values.is_active === "1",
      features: String(values.features || "")
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean),
      description: String(values.description || "").trim(),
    };
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = "Đang lưu...";
    let saved = false;
    try {
      await updateAdminRoom(payload);
      saved = true;
      await loadAdminRooms();
      if (active()) await loadAdminHotels();
      if (active()) await loadDashboard();
      if (!active()) return;
      render();
      if (adminRoomsError || adminHotelsError || dashboardError) {
        feedback(
          "Đã lưu phòng vào MySQL nhưng chưa tải lại đủ dữ liệu. Hãy làm mới trang.",
          true,
        );
      } else {
        feedback(
          `Đã cập nhật loại phòng ID ${payload.id}. Customer sẽ dùng dữ liệu mới khi tải lại trang.`,
        );
      }
    } catch (error) {
      console.error("Update room error:", error);
      const note = content.querySelector("#tk-room-edit-validation");
      if (note) {
        note.hidden = false;
        note.textContent = saved
          ? "MySQL đã lưu nhưng lỗi tải lại: " + error.message
          : "Chưa lưu được vào MySQL: " + error.message;
      }
      feedback(
        saved
          ? "Đã lưu vào MySQL nhưng chưa cập nhật được giao diện: " +
              error.message
          : error.message,
        true,
      );
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = "Lưu thay đổi";
      }
    }
  });

  show();
})();
