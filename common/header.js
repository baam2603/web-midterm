const MOCK_LOGIN_ENABLED = true; // đổi thành false khi đã có auth-service.js thật

if (MOCK_LOGIN_ENABLED && typeof getCurrentUser !== "function") {
  window.getCurrentUser = function () {
    if (localStorage.getItem("mock_logged_out") === "1") return null;
    return { name: "Nguyễn Văn A" }; // sửa tên tuỳ ý để test
  };
}
if (MOCK_LOGIN_ENABLED && typeof logout !== "function") {
  window.logout = function () {
    localStorage.setItem("mock_logged_out", "1");
    console.log("[MOCK] đã đăng xuất");
  };
  window.mockLogin = function () {
    localStorage.removeItem("mock_logged_out");
  };
}

/* ---------- 1. Logo / thương hiệu ---------- */
function renderBrand({ logoHref = "index1.html" } = {}) {
  return `
    <a class="brand" href="${logoHref}">
      <img class="img-logo" src="sources/3k5.jpg" alt="" onerror="this.style.display='none'" />THREEK.COM
    </a>
  `;
}

/* ---------- 2. Breadcrumb (dùng ở trang Đà Lạt, Vũng Tàu...) ---------- */
function renderBreadcrumb(items = []) {
  // items: [{ label: 'Trang chủ', href: 'index1.html' }, { label: 'Đà Lạt' }]
  const html = items
    .map((item, i) => {
      const isLast = i === items.length - 1;
      if (isLast || !item.href) return `<span>${item.label}</span>`;
      return `<a href="${item.href}">${item.label}</a><i class="ri-arrow-right-s-line"></i>`;
    })
    .join("");
  return `<nav class="crumb">${html}</nav>`;
}
function renderTextBooking() {
  return `<div class="text-booking">Booking - Đặt phòng khách sạn</div>`;
}

/* ---------- 3. Nút khi CHƯA đăng nhập ---------- */
function renderGuestActions() {
  return `
    <div class="header-actions" id="guest-actions">
      <button class="btn-ghost-header" onclick="location.href='login.html'">Đăng nhập</button>
      <button class="btn-solid-header" onclick="location.href='register.html'">Đăng ký</button>
    </div>
  `;
}

/* ---------- 4. Avatar + dropdown khi ĐÃ đăng nhập ---------- */
function renderDropdownMenu() {
  return `
    <div class="dropdown-menu" id="dropdownMenu" role="menu">
      <a href="taikhoan.html" class="dropdown-item" role="menuitem">
        <i></i> Hồ sơ của tôi
      </a>
      <a href="myBooking.html" class="dropdown-item" role="menuitem">
        <i></i> Đặt phòng của tôi
      </a>
      <div class="dropdown-divider"></div>
      <a href="#" class="dropdown-item dropdown-item--danger" id="logoutBtn" role="menuitem">
        <i></i> Đăng xuất
      </a>
    </div>
  `;
}

function renderProfileActions() {
  return `
    <div class="header-actions" id="profile-actions" style="display:none">
      <div class="user-menu">
        <button class="btn-profile" id="avatarBtn" aria-haspopup="menu" aria-expanded="false">
          <span class="avatar" id="profile-avatar"></span>
          <span id="profile-name"></span>
        </button>
        ${renderDropdownMenu()}
      </div>
    </div>
  `;
}

/* ---------- 5. Hành vi mở/đóng dropdown (tách khỏi phần render) ---------- */
function initAvatarDropdown() {
  const avatarBtn = document.getElementById("avatarBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");
  if (!avatarBtn || !dropdownMenu) return;

  avatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropdownMenu.classList.toggle("is-open");
    avatarBtn.setAttribute("aria-expanded", isOpen);
  });

  document.addEventListener("click", (e) => {
    if (!dropdownMenu.contains(e.target) && !avatarBtn.contains(e.target)) {
      dropdownMenu.classList.remove("is-open");
      avatarBtn.setAttribute("aria-expanded", false);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdownMenu.classList.remove("is-open");
      avatarBtn.setAttribute("aria-expanded", false);
    }
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        // chờ logout() xong (hỗ trợ cả hàm async) rồi mới chuyển trang
        if (typeof window.logout === "function") await window.logout();
      } catch (err) {
        console.error("Đăng xuất lỗi:", err);
      }
      location.href = "index1.html";
    });
  }
}

/* ---------- 6. Kiểm tra trạng thái đăng nhập, đổi UI tương ứng ---------- */
function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] || "";
  return last.charAt(0).toUpperCase();
}

// Ưu tiên tên hiển thị người dùng đã đặt ở trang Tài khoản
function getShownName(user) {
  return (
    localStorage.getItem("threek_display_name") || user.displayName || user.name
  );
}

function updateLoginState() {
  const guestBox = document.getElementById("guest-actions");
  const profileBox = document.getElementById("profile-actions");
  if (!guestBox || !profileBox || typeof getCurrentUser !== "function") return;

  const user = getCurrentUser();
  if (user) {
    guestBox.style.display = "none";
    profileBox.style.display = "flex";
    const shown = getShownName(user);
    const nameEl = document.getElementById("profile-name");
    const avatarEl = document.getElementById("profile-avatar");
    if (nameEl) nameEl.textContent = shown;
    if (avatarEl) avatarEl.textContent = initials(shown);
  } else {
    guestBox.style.display = "flex";
    profileBox.style.display = "none";
  }
}

/* ---------- 7. Ghép tất cả lại, gắn vào DOM ---------- */
function mountHeader(mountId, { logoHref, middle } = {}) {
  const el = document.getElementById(mountId);
  if (!el) return console.warn(`mountHeader: không tìm thấy #${mountId}`);

  const middleContent = middle !== undefined ? middle : renderTextBooking();

  el.classList.add("site-header");
  el.innerHTML = `
    ${renderBrand({ logoHref })}
    ${middleContent}
    ${renderGuestActions()}
    ${renderProfileActions()}
  `;

  initAvatarDropdown();
  updateLoginState();
}
