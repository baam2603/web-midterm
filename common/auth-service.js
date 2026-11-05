/* PHP session is authoritative. Browser storage is only an optional UI cache. */
(() => {
  "use strict";
  const KEY = "threek_demo_session_v1";
  const script = document.currentScript?.src || location.href;
  let user = null,
    generation = 0;
  try {
    const cached = JSON.parse(localStorage.getItem(KEY) || "null");
    if (cached?.id != null) user = cached;
  } catch {}
  const getApiUrl = (endpoint) => new URL("../api/" + endpoint, script).href;
  const getCurrentUser = () => user;
  function publish(value) {
    user = value;
    try {
      if (value) localStorage.setItem(KEY, JSON.stringify(value));
      else localStorage.removeItem(KEY);
    } catch {}
    window.dispatchEvent(new Event("threek:auth-updated"));
    return user;
  }
  function setSession(value) {
    if (!value || value.id == null)
      throw Error("Thông tin tài khoản không hợp lệ.");
    return publish(value);
  }
  function clearSession() {
    publish(null);
    try {
      sessionStorage.removeItem("threek_guest_access_v2");
    } catch {}
  }
  // Fetch a session-bound token immediately before each write (safe across login and tabs).
  async function apiFetch(input, options = {}) {
    const target = new URL(input, location.href);
    const apiRoot = new URL("../api/", script);
    const method = String(options.method || "GET").toUpperCase();
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      if (
        target.origin !== apiRoot.origin ||
        !target.pathname.startsWith(apiRoot.pathname)
      )
        throw Error("API không hợp lệ.");
      const tokenResponse = await fetch(getApiUrl("auth/csrf.php"), {
        credentials: "same-origin",
        cache: "no-store",
        signal: options.signal,
      });
      const tokenResult = await tokenResponse.json().catch(() => null);
      if (!tokenResponse.ok || !tokenResult?.data?.csrfToken) {
        const error = Error(
          tokenResult?.message ||
            "Không tải được phiên bảo vệ. Hãy kiểm tra PHP/API rồi tải lại trang.",
        );
        error.status = tokenResponse.status;
        error.code = tokenResult?.code || "csrf_unavailable";
        throw error;
      }
      const headers = new Headers(options.headers);
      headers.set("X-CSRF-Token", tokenResult.data.csrfToken);
      return fetch(target, { ...options, credentials: "same-origin", headers });
    }
    return fetch(target, options);
  }
  async function request(endpoint, method = "GET", data) {
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 12000);
    let response;
    try {
      response = await apiFetch(getApiUrl(endpoint), {
        method,
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      });
    } catch (e) {
      if (e.status) throw e;
      const error = Error(
        e.name === "AbortError"
          ? "Máy chủ phản hồi quá lâu. Vui lòng thử lại."
          : "Không kết nối được máy chủ. Hãy mở website bằng Apache/XAMPP, không dùng Live Server.",
      );
      error.code = "connection_error";
      throw error;
    } finally {
      clearTimeout(timer);
    }
    const json = await response.json().catch(() => null);
    if (!json) {
      const error = Error(
        "Không nhận được phản hồi PHP hợp lệ. Hãy chạy Apache/XAMPP và mở website bằng http://localhost/...; kiểm tra trang api/setup-status.php.",
      );
      error.status = response.status;
      error.code = "invalid_api_response";
      throw error;
    }
    if (!response.ok || json.status !== "success") {
      const error = Error(json.message || "Yêu cầu thất bại.");
      error.status = response.status;
      error.code = json.code;
      throw error;
    }
    return json.data || {};
  }
  async function loadProfile() {
    const started = generation;
    try {
      const data = await request("account/profile.php");
      if (started !== generation) return user;
      if (!data.user) throw Error("Máy chủ thiếu thông tin tài khoản.");
      return setSession(data.user);
    } catch (error) {
      if (started !== generation) return user;
      if (error.status === 401) clearSession();
      throw error;
    }
  }
  async function authenticate(endpoint, body) {
    const started = ++generation;
    const data = await request(endpoint, "POST", body);
    if (started !== generation)
      throw Error("Yêu cầu đăng nhập đã thay đổi. Vui lòng thử lại.");
    // Verify that the browser actually kept the PHP session before navigating.
    let profile;
    try {
      profile = await request("account/profile.php");
    } catch (error) {
      if (error.status === 401) {
        clearSession();
        throw Error(
          "Không giữ được phiên đăng nhập. Hãy bật cookie và dùng cùng một địa chỉ website (không đổi qua lại localhost và 127.0.0.1).",
        );
      }
      throw error;
    }
    if (!profile.user || String(profile.user.id) !== String(data.user?.id))
      throw Error(
        "Không xác minh được phiên tài khoản. Vui lòng đăng nhập lại.",
      );
    const verified = setSession(profile.user);
    window.authReady = Promise.resolve(verified);
    return verified;
  }
  const registerUser = (input) =>
    authenticate("auth/register.php", {
      fullName: String(input?.fullName || input?.name || "").trim(),
      email: String(input?.email || "")
        .trim()
        .toLowerCase(),
      password: String(input?.password || ""),
      phone: String(input?.phone || "").trim(),
      birthday: String(input?.birthday || ""),
    });
  const loginUser = (email, password) =>
    authenticate("auth/login.php", {
      email: String(email || "")
        .trim()
        .toLowerCase(),
      password: String(password || ""),
    });
  async function updateProfile(input) {
    const data = await request("account/update-profile.php", "POST", input);
    return setSession(data.user);
  }
  async function changePassword(current, next) {
    await request("account/change-password.php", "POST", {
      currentPassword: current,
      newPassword: next,
    });
    return true;
  }
  async function deleteCurrentAccount(password) {
    await request("account/delete-account.php", "POST", { password });
    generation++;
    clearSession();
    window.authReady = Promise.resolve(null);
    return true;
  }
  async function logout() {
    await request("account/logout.php", "POST", {});
    generation++;
    clearSession();
    window.authReady = Promise.resolve(null);
  }
  Object.assign(window, {
    getApiUrl,
    apiFetch,
    getCurrentUser,
    setSession,
    registerUser,
    loginUser,
    loadProfile,
    updateProfile,
    changePassword,
    deleteCurrentAccount,
    logout,
  });
  window.authReady = loadProfile().catch((error) => {
    if (error.status === 401) return null;
    window.authError = error;
    throw error;
  });
  // Pages that do not need a session should still render on a backend failure.
  window.authReady.catch(() => {});
  window.addEventListener("storage", (event) => {
    if (event.key !== KEY) return;
    generation++;
    const p = loadProfile().catch((error) => {
      if (error.status === 401) return null;
      throw error;
    });
    window.authReady = p;
    p.catch(() => {});
  });
})();
