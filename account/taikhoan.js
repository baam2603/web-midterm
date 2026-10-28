/* Account UI demo, using shared local-only service. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id),
    user = getCurrentUser();
  if (!user) {
    location.replace(
      "../auth/login.html?next=" +
        encodeURIComponent(location.pathname + location.search),
    );
    return;
  }
  const toast = (msg) => {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2400);
  };
  const error = (msg) => {
    const el = $("profile-error");
    el.textContent = msg;
    el.classList.toggle("show", !!msg);
  };
  $("fullname").value = user.fullName || "";
  $("displayname").value = user.displayName || "";
  $("birthday").value = user.birthday || "";
  $("phone").value = user.phone || "";
  $("email").value = user.email || "";
  $("profile-form").addEventListener("submit", (e) => {
    e.preventDefault();
    error("");
    try {
      updateProfile({
        fullName: $("fullname").value,
        displayName: $("displayname").value,
        birthday: $("birthday").value,
        phone: $("phone").value,
      });
      updateLoginState();
      toast("Đã lưu thay đổi");
    } catch (err) {
      error(err.message);
    }
  });
  document.querySelectorAll(".link-row[data-provider]").forEach((row) => {
    const b = row.querySelector(".link-btn");
    b.textContent = "Chưa hỗ trợ";
    b.disabled = true;
    b.title =
      "Liên kết Google/Facebook yêu cầu hệ thống OAuth và backend thực tế.";
  });
  $("delete-account-btn").addEventListener("click", () => {
    if (
      !confirm(
        "Xóa tài khoản demo cùng các đơn đặt phòng gắn với tài khoản này?",
      )
    )
      return;
    deleteCurrentAccount();
    location.href = "../index1.html";
  });
})();
