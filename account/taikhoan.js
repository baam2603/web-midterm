/* taikhoan-extra.js — tên hiển thị + liên kết Google/Facebook
 * Hiện đang lưu bằng localStorage để chạy thử. Khi có backend,
 * thay các chỗ có dòng "TODO" bằng lời gọi API thật.
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const DISPLAY_KEY = "threek_display_name";
  const LINK_KEY = (p) => "threek_linked_" + p;

  /* ---------- Toast / lỗi ---------- */
  function showToast(msg) {
    const t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => t.classList.remove("show"), 2500);
  }
  function showError(msg) {
    const box = $("profile-error");
    if (!box) return;
    box.textContent = msg;
    box.classList.toggle("show", !!msg);
  }

  /* ---------- Tên hiển thị ---------- */
  const displayInput = $("displayname");
  if (displayInput) {
    let initial = localStorage.getItem(DISPLAY_KEY);
    if (!initial && typeof getCurrentUser === "function") {
      const u = getCurrentUser();
      if (u && u.name) initial = u.name;
    }
    displayInput.value = initial || "";
  }

  const form = $("profile-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      showError("");

      const name = (displayInput ? displayInput.value : "").trim();
      if (name.length < 2 || name.length > 30) {
        showError("Tên hiển thị phải từ 2 đến 30 ký tự.");
        displayInput && displayInput.focus();
        return;
      }

      // TODO: gọi API lưu hồ sơ (họ tên, tên hiển thị, ngày sinh, SĐT...)
      localStorage.setItem(DISPLAY_KEY, name);

      // Cập nhật ngay tên + chữ cái avatar ở header
      if (typeof updateLoginState === "function") updateLoginState();
      showToast("Đã lưu thay đổi");
    });
  }

  /* ---------- Liên kết Google / Facebook ---------- */
  const LABEL = { google: "Google", facebook: "Facebook" };

  function renderRow(row) {
    const p = row.dataset.provider;
    const linked = localStorage.getItem(LINK_KEY(p)) === "1";
    const btn = row.querySelector(".link-btn");
    row.classList.toggle("is-linked", linked);
    row.querySelector(".link-row__status").textContent = linked
      ? "Đã liên kết"
      : "Chưa liên kết";
    btn.textContent = linked ? "Hủy liên kết" : "Liên kết";
    btn.classList.toggle("link-btn--outline", linked);
    btn.disabled = false;
  }

  document.querySelectorAll(".link-row[data-provider]").forEach((row) => {
    const p = row.dataset.provider;
    const btn = row.querySelector(".link-btn");
    renderRow(row);

    btn.addEventListener("click", () => {
      const linked = localStorage.getItem(LINK_KEY(p)) === "1";

      if (linked) {
        if (!confirm("Hủy liên kết " + LABEL[p] + " khỏi tài khoản này?"))
          return;
        // TODO: gọi API hủy liên kết.
        // Lưu ý: chặn hủy nếu đây là cách đăng nhập duy nhất và chưa có mật khẩu.
        localStorage.removeItem(LINK_KEY(p));
        renderRow(row);
        showToast("Đã hủy liên kết " + LABEL[p]);
        return;
      }

      // TODO: thay bằng luồng OAuth thật (Google Identity / Facebook Login),
      // sau khi nhận token từ nhà cung cấp thì gửi lên server để liên kết.
      btn.disabled = true;
      btn.textContent = "Đang kết nối...";
      setTimeout(() => {
        localStorage.setItem(LINK_KEY(p), "1");
        renderRow(row);
        showToast("Đã liên kết " + LABEL[p]);
      }, 700);
    });
  });
})();
