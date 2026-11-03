/* THREEK.COM - Admin-only header. No customer account dropdown. */
(function () {
  "use strict";

  function mountAdminHeader(mountId) {
    const header = document.getElementById(mountId);
    if (!header) {
      console.warn("mountAdminHeader: không tìm thấy #" + mountId);
      return;
    }

    header.classList.add("tk-admin-topbar");
    header.innerHTML = `
      <div class="tk-admin-topbar__inner">
        <a class="tk-admin-topbar__brand" href="./index.html#overview"
           aria-label="Về Tổng quan Admin THREEK.COM">
          <img src="../sources/3k5.jpg" alt="" class="tk-admin-topbar__logo" />
          <span>THREEK.COM</span>
        </a>
        <span class="tk-admin-topbar__section">
          <i class="ri-shield-check-line" aria-hidden="true"></i>
          Quản trị hệ thống
        </span>
        <div class="tk-admin-topbar__actions">
          <span id="tk-admin-header-user" class="tk-admin-topbar__user" hidden></span>
          <button id="tk-admin-header-logout"
                  class="tk-admin-topbar__logout" type="button" hidden>
            <i class="ri-logout-box-r-line" aria-hidden="true"></i>
            Đăng xuất
          </button>
        </div>
      </div>`;

    const logoutButton = document.getElementById("tk-admin-header-logout");
    logoutButton.addEventListener("click", async () => {
      if (logoutButton.disabled) return;
      logoutButton.disabled = true;
      try {
        if (typeof window.logout !== "function") {
          throw new Error("Không tìm thấy chức năng đăng xuất.");
        }
        await window.logout();
        const returnPath = new URL("./index.html", location.href).pathname;
        const nextUrl = new URL("../auth/login.html", location.href);
        nextUrl.searchParams.set("next", returnPath);
        location.replace(nextUrl.href);
      } catch (error) {
        console.error("Đăng xuất Admin thất bại:", error);
        alert("Chưa thể đăng xuất trên máy chủ. Vui lòng thử lại.");
        logoutButton.disabled = false;
      }
    });
  }

  // Only show admin identity after me.php verifies role === 'admin'.
  function setAdminHeaderUser(admin) {
    const userEl = document.getElementById("tk-admin-header-user");
    const logoutEl = document.getElementById("tk-admin-header-logout");
    if (!userEl || !logoutEl) return;

    const verified = admin && admin.role === "admin";
    userEl.hidden = !verified;
    logoutEl.hidden = !verified;
    userEl.textContent = verified
      ? (admin.fullName || admin.full_name || admin.email || "Quản trị viên")
      : "";
  }

  window.mountAdminHeader = mountAdminHeader;
  window.setAdminHeaderUser = setAdminHeaderUser;
})();
