/* Account UI demo, using shared local-only service. */
(async function () {
  "use strict";
  const $ = (id) => document.getElementById(id),
    user = await window.authReady.catch((error) => {
      document.getElementById("profile-error").textContent = error.message;
      document.getElementById("profile-error").classList.add("show");
      return undefined;
    });
  if (user === undefined) return;
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
  function fillProfile(profile) {
    $("fullname").value = profile.fullName || "";
    $("displayname").value = profile.displayName || "";
    $("birthday").value = profile.birthday || "";
    $("phone").value = profile.phone || "";
    $("email").value = profile.email || "";
  }
  fillProfile(user);
  document.querySelector('button[form="profile-form"]').disabled = false;
  /* Original local cache fallback */
  /* $("fullname").value = user.fullName || "";
  $("displayname").value = user.displayName || "";
  $("birthday").value = user.birthday || "";
  $("phone").value = user.phone || "";
  $("email").value = user.email || ""; */
  $("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    error("");
    try {
      const updated = await updateProfile({
        fullName: $("fullname").value,
        displayName: $("displayname").value,
        birthday: $("birthday").value,
        phone: $("phone").value,
      });
      fillProfile(updated);
      if (typeof updateLoginState === "function") {
        updateLoginState();
      }
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
  $("delete-account-btn").addEventListener("click", async () => {
    if (
      !confirm(
        "Đóng tài khoản vĩnh viễn và ẩn danh thông tin cá nhân? Lịch sử đơn vẫn được giữ để đối soát; đánh giá và nội dung hỗ trợ sẽ được gỡ.",
      )
    )
      return;
    const password = prompt(
      "Nhập mật khẩu hiện tại để xác nhận đóng tài khoản:",
    );
    if (password === null) return;
    try {
      await deleteCurrentAccount(password);
      location.href = "../index1.html";
    } catch (err) {
      error(err.message);
    }
  });
})();
