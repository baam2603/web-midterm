
/* THREEK.COM - Auth service (PHP sessions + MySQL account APIs) */
(function () {
  "use strict";

  const SESSION = "threek_demo_session_v1";
  const GUEST = "threek_guest_access_v2";
  const SCRIPT_URL = document.currentScript?.src || location.href;

  function getApiUrl(endpoint) {
    return new URL("../api/" + endpoint, SCRIPT_URL).href;
  }

  function getCurrentUser() {
    try {
      const user = JSON.parse(localStorage.getItem(SESSION) || "null");
      return user && user.id != null ? user : null;
    } catch {
      return null;
    }
  }

  function setSession(user) {
    if (!user || user.id == null) {
      throw new Error("Thông tin tài khoản không hợp lệ.");
    }

    localStorage.setItem(SESSION, JSON.stringify(user));
    window.dispatchEvent(new Event("threek:auth-updated"));
    return user;
  }

  function clearSession() {
    localStorage.removeItem(SESSION);
    sessionStorage.removeItem(GUEST);
    window.dispatchEvent(new Event("threek:auth-updated"));
  }

  // ========================
  // API REQUEST
  // ========================

  async function apiRequest(endpoint, method = "GET", data) {
    let response;

    try {
      response = await fetch(getApiUrl(endpoint), {
        method,
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        ...(data === undefined
          ? {}
          : { body: JSON.stringify(data) })
      });
    } catch {
      throw new Error(
        "Không thể kết nối máy chủ. Kiểm tra Apache và đường dẫn API."
      );
    }

    let json;

    try {
      json = await response.json();
    } catch {
      throw new Error(
        "API không trả về JSON hợp lệ (HTTP " +
        response.status + ")."
      );
    }

    if (!response.ok || json.status !== "success") {
      throw new Error(
        json.message ||
        "Yêu cầu thất bại (HTTP " + response.status + ")."
      );
    }

    return json.data || {};
  }

  // ========================
  // REGISTER
  // ========================

  async function registerUser(input) {
    const data = await apiRequest("auth/register.php", "POST", {
      fullName: String(
        input?.fullName || input?.name || ""
      ).trim(),

      email: String(input?.email || "")
        .trim()
        .toLowerCase(),

      password: String(input?.password || ""),
      phone: String(input?.phone || "").trim(),
      birthday: String(input?.birthday || "")
    });

    if (!data.user) {
      throw new Error("API đăng ký thiếu dữ liệu user.");
    }

    sessionStorage.removeItem(GUEST);

    return setSession(data.user);
  }

  // ========================
  // LOGIN
  // ========================

  async function loginUser(email, password) {
    const data = await apiRequest("auth/login.php", "POST", {
      email: String(email || "")
        .trim()
        .toLowerCase(),

      password: String(password || "")
    });

    if (!data.user) {
      throw new Error("API đăng nhập thiếu dữ liệu user.");
    }

    sessionStorage.removeItem(GUEST);

    return setSession(data.user);
  }

  // ========================
  // LOAD PROFILE
  // ========================

  async function loadProfile() {
    try {
      const data = await apiRequest("account/profile.php");

      if (!data.user) {
        throw new Error("API hồ sơ thiếu dữ liệu user.");
      }

      return setSession(data.user);
    } catch (err) {
      if (
        /đăng nhập lại|phiên đăng nhập|không còn hợp lệ/i
          .test(err.message)
      ) {
        clearSession();
      }

      throw err;
    }
  }

  // ========================
  // UPDATE PROFILE
  // ========================

  async function updateProfile(input) {
    const data = await apiRequest(
      "account/update-profile.php",
      "POST",
      {
        fullName: String(input?.fullName || "").trim(),
        displayName: String(input?.displayName || "").trim(),
        birthday: String(input?.birthday || ""),
        phone: String(input?.phone || "").trim()
      }
    );

    if (!data.user) {
      throw new Error("API cập nhật thiếu dữ liệu user.");
    }

    return setSession(data.user);
  }

  // ========================
  // CHANGE PASSWORD
  // ========================

  async function changePassword(current, next) {
    await apiRequest(
      "account/change-password.php",
      "POST",
      {
        currentPassword: String(current || ""),
        newPassword: String(next || "")
      }
    );

    return true;
  }

  // ========================
  // DELETE ACCOUNT
  // ========================

  async function deleteCurrentAccount(password) {
    await apiRequest(
      "account/delete-account.php",
      "POST",
      {
        password: String(password || "")
      }
    );

    const user = getCurrentUser();

    if (user) {
      localStorage.removeItem(
        "threek_favorites_user_" + user.id
      );
    }

    clearSession();
    return true;
  }

  // ========================
  // LOGOUT
  // ========================

  async function logout() {
    try {
      await apiRequest("account/logout.php", "POST", {});
    } finally {
      clearSession();
    }
  }

  // ========================
  // PASSWORD RECOVERY
  // ========================

  function startDemoRecovery() {
    throw new Error(
      "Quên mật khẩu qua email chưa được triển khai trên máy chủ."
    );
  }

  async function finishDemoRecovery() {
    throw new Error(
      "Đặt lại mật khẩu qua email chưa được triển khai trên máy chủ."
    );
  }

  // ========================
  // GLOBAL FUNCTIONS
  // ========================

  Object.assign(window, {
    getCurrentUser,
    setSession,
    getApiUrl,
    registerUser,
    loginUser,
    loadProfile,
    updateProfile,
    changePassword,
    deleteCurrentAccount,
    logout,
    startDemoRecovery,
    finishDemoRecovery
  });

})();
