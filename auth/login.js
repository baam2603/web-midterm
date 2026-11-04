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

  // Only allow a return URL inside this project, never an external URL or Admin page.
  function safeCustomerDestination(next) {
    if (
      !next ||
      !next.startsWith("/") ||
      next.startsWith("//") ||
      next.includes("\\")
    ) {
      return null;
    }

    const url = new URL(next, location.origin);
    if (
      url.origin !== location.origin ||
      !url.pathname.startsWith(siteRoot.pathname)
    ) {
      return null;
    }
    if (url.pathname.startsWith(adminDir.pathname)) {
      return null;
    }
    return url.href;
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
        // Do not send Customer into the Admin area, even when ?next points there.
        const wantsAdmin =
          redirect &&
          new URL(redirect, location.origin).pathname.startsWith(
            adminDir.pathname,
          );
        if (wantsAdmin) {
          throw new Error(
            "Tài khoản này không có quyền quản trị. Vui lòng đăng nhập bằng tài khoản Admin.",
          );
        }

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
})();
