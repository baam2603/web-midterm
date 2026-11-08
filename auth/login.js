/* THREEK.COM - Login: role-aware redirect with server-side Admin verification */
(function () {
  "use strict";

  const form = document.querySelector("form");
  if (!form) return;

  const status = document.createElement("p");
  status.setAttribute("role", "alert");
  status.id = "login-status";
  status.style.marginTop = "12px";
  status.style.color = "#b83b37";
  form.appendChild(status);

  const redirect = new URLSearchParams(location.search).get("next");
  const siteRoot = new URL("../", location.href);
  const adminUrl = new URL("../admin/index.html", location.href);
  const adminDir = new URL("../admin/", location.href);
  const customerUrl = new URL("../index1.html", location.href);

  // Redirects must be ordinary paths inside this project, never executable URLs.
  function safeCustomerDestination(next) {
    if (
      typeof next !== "string" ||
      !next.startsWith("/") ||
      next.startsWith("//") ||
      /[\u0000-\u0020\u007f\\]/.test(next)
    ) return null;

    try {
      const url = new URL(next, location.origin);
      const path = decodeURIComponent(url.pathname);
      const adminPath = adminDir.pathname.toLowerCase();
      // Reject ambiguous paths that another URL decoder could interpret differently.
      if (
        url.origin !== location.origin ||
        url.protocol !== location.protocol ||
        !path.startsWith(siteRoot.pathname) ||
        path.toLowerCase() === adminPath.slice(0, -1) ||
        path.toLowerCase().startsWith(adminPath) ||
        /[%\\\u0000-\u001f\u007f]/.test(path)
      ) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";

    const submitButton = form.querySelector(
      'button[type="submit"], input[type="submit"]',
    );
    if (submitButton) submitButton.disabled = true;

    try {
      const user = await loginUser(
        document.getElementById("email").value,
        document.getElementById("password").value,
      );

      if (user?.role === "admin") {
        // A role saved in JavaScript is not enough: PHP must confirm the session.
        const response = await fetch(
          new URL("../api/admin/me.php", location.href),
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          },
        );
        const result = await response.json().catch(() => null);

        if (
          !response.ok ||
          result?.status !== "success" ||
          result?.data?.admin?.role !== "admin"
        ) {
          throw new Error(
            result?.message ||
              "Không xác minh được phiên Admin trên máy chủ. Hãy kiểm tra api/admin/me.php.",
          );
        }

        location.replace(adminUrl.href);
        return;
      }

      if (user?.role === "customer") {
        // Invalid, external or admin destinations fall back to the customer homepage.
        location.replace(safeCustomerDestination(redirect) || customerUrl.href);
        return;
      }

      throw new Error(
        "Tài khoản chưa có quyền hợp lệ. Vui lòng liên hệ quản trị viên.",
      );
    } catch (error) {
      status.textContent = error?.message || "Đăng nhập không thành công.";
      if (
        ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) &&
        error?.status !== 401
      ) {
        const link = document.createElement("a");
        link.href = "../api/setup-status.php";
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = " Kiểm tra cài đặt PHP/MySQL";
        status.append(link);
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  document
    .querySelector(".btn-register")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      location.href =
        "register.html" +
        (redirect ? "?next=" + encodeURIComponent(redirect) : "");
    });

  document
    .querySelector(".btn-forgot-pass")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      location.href = "forgot.html";
    });

  // Toggle password visibility using the project's original eye PNG assets.
  function setupPasswordEye(inputId, imageId) {
    const input = document.getElementById(inputId);
    const img = document.getElementById(imageId);
    const button = img?.closest(".password-eye-button");
    if (!input || !img || !button) return;
    button.addEventListener("click", () => {
      const visible = input.type === "password";
      input.type = visible ? "text" : "password";
      img.src = visible ? "../sources/eye-open.png" : "../sources/eye-close.png";
      button.setAttribute("aria-label", visible ? "Ẩn mật khẩu" : "Hiện mật khẩu");
      button.setAttribute("aria-pressed", String(visible));
    });
  }
  setupPasswordEye("password", "eyeicon");
})();
