(function () {
  "use strict";

  /* ---------- Cấu hình ---------- */
  const CONFIG = {
    triggerId: "change-password-btn", // nút mở hộp thoại
    toastId: "toast", // phần tử toast của trang (nếu có)
    minLength: 8,
  };

  const MODAL_HTML = `
    <div class="pwm" id="pwm" hidden aria-hidden="true">
      <div class="pwm__backdrop" data-close></div>
      <div class="pwm__dialog" role="dialog" aria-modal="true" aria-labelledby="pwm-title">
        <h2 class="pwm__title" id="pwm-title">Đổi mật khẩu</h2>
        <p class="pwm__desc">Dùng mật khẩu mạnh, không trùng với mật khẩu ở các website khác.</p>
        <div class="pwm__error" id="pwm-error" role="alert"></div>

        <form class="pwm__form" id="pwm-form" novalidate>
          <div class="pwm__field">
            <label for="pwm-current">Mật khẩu hiện tại</label>
            <div class="pwm__wrap">
              <input type="password" id="pwm-current" autocomplete="current-password" />
              <button type="button" class="pwm__toggle" data-target="pwm-current">Hiện</button>
            </div>
          </div>

          <div class="pwm__field">
            <label for="pwm-new">Mật khẩu mới</label>
            <div class="pwm__wrap">
              <input type="password" id="pwm-new" autocomplete="new-password" />
              <button type="button" class="pwm__toggle" data-target="pwm-new">Hiện</button>
            </div>
            <div class="pwm__meter" aria-hidden="true"><span id="pwm-meter"></span></div>
            <span class="pwm__hint" id="pwm-hint"></span>
          </div>

          <div class="pwm__field">
            <label for="pwm-confirm">Nhập lại mật khẩu mới</label>
            <div class="pwm__wrap">
              <input type="password" id="pwm-confirm" autocomplete="new-password" />
              <button type="button" class="pwm__toggle" data-target="pwm-confirm">Hiện</button>
            </div>
          </div>

          <div class="pwm__actions">
            <button type="button" class="pwm__btn pwm__btn--cancel" data-close>Hủy</button>
            <button type="submit" class="pwm__btn pwm__btn--submit" id="pwm-submit">Cập nhật mật khẩu</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const $ = (id) => document.getElementById(id);
  let modal, form, errBox, submitBtn, newInput, meter, hint, lastFocus;

  /* ---------- Toast (dùng lại #toast của trang) ---------- */
  let toastTimer = null;
  function toast(msg) {
    const t = $(CONFIG.toastId);
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
  }

  function showError(msg) {
    errBox.textContent = msg;
    errBox.classList.toggle("show", !!msg);
  }

  /* ---------- Độ mạnh mật khẩu: 0 trống, 1 yếu, 2 vừa, 3 mạnh ---------- */
  function strength(pw) {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= CONFIG.minLength) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (pw.length >= 12) score++;
    return score <= 2 ? 1 : score <= 3 ? 2 : 3;
  }
  function updateMeter() {
    const lv = strength(newInput.value);
    const text = [
      "Tối thiểu " + CONFIG.minLength + " ký tự, gồm chữ và số.",
      "Mật khẩu yếu",
      "Mật khẩu trung bình",
      "Mật khẩu mạnh",
    ];
    meter.style.width = lv ? lv * 33.34 + "%" : "0";
    meter.dataset.level = lv;
    hint.textContent = text[lv];
  }

  /* ---------- Kiểm tra dữ liệu, trả về chuỗi lỗi hoặc "" ---------- */
  function validate(current, next, confirmPw) {
    if (!current) return "Vui lòng nhập mật khẩu hiện tại.";
    if (next.length < CONFIG.minLength)
      return "Mật khẩu mới phải có ít nhất " + CONFIG.minLength + " ký tự.";
    if (!/[A-Za-z]/.test(next) || !/\d/.test(next))
      return "Mật khẩu mới phải gồm cả chữ và số.";
    if (next === current)
      return "Mật khẩu mới không được trùng mật khẩu hiện tại.";
    if (next !== confirmPw) return "Mật khẩu nhập lại không khớp.";
    return "";
  }

  /* ---------- Mở / đóng ---------- */
  function open() {
    lastFocus = document.activeElement;
    form.reset();
    showError("");
    updateMeter();
    form.querySelectorAll("input").forEach((i) => (i.type = "password"));
    form
      .querySelectorAll(".pwm__toggle")
      .forEach((b) => (b.textContent = "Hiện"));
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $("pwm-current").focus();
  }
  function close() {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    form.reset();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- Gửi form ---------- */
  async function onSubmit(e) {
    e.preventDefault();
    showError("");

    const current = $("pwm-current").value;
    const next = newInput.value;
    const problem = validate(current, next, $("pwm-confirm").value);
    if (problem) return showError(problem);

    submitBtn.disabled = true;
    submitBtn.textContent = "Đang cập nhật...";
    try {
      if (typeof window.changePassword === "function") {
        await window.changePassword(current, next);
      } else {
        // MOCK: chưa có backend, chỉ giả lập chờ server
        await new Promise((r) => setTimeout(r, 600));
        console.log("[MOCK] đổi mật khẩu thành công (chưa gọi server thật)");
      }
      close();
      toast("Đã đổi mật khẩu thành công");
    } catch (err) {
      showError(
        (err && err.message) || "Đổi mật khẩu thất bại, vui lòng thử lại.",
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Cập nhật mật khẩu";
    }
  }

  /* ---------- Khởi tạo ---------- */
  function init() {
    document.body.insertAdjacentHTML("beforeend", MODAL_HTML);

    modal = $("pwm");
    form = $("pwm-form");
    errBox = $("pwm-error");
    submitBtn = $("pwm-submit");
    newInput = $("pwm-new");
    meter = $("pwm-meter");
    hint = $("pwm-hint");

    newInput.addEventListener("input", updateMeter);
    form.addEventListener("submit", onSubmit);

    // Đóng: nút Hủy, nền tối, phím Esc
    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) close();
    });

    // Nút Hiện/Ẩn
    form.querySelectorAll(".pwm__toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = $(btn.dataset.target);
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.textContent = show ? "Ẩn" : "Hiện";
      });
    });

    const trigger = $(CONFIG.triggerId);
    if (trigger) trigger.addEventListener("click", open);
    else console.warn("[doimatkhau] không tìm thấy nút #" + CONFIG.triggerId);
  }

  window.DoiMatKhau = { open, close };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
