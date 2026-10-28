/* THREEK UI demo auth: localStorage only. NOT production authentication. */
(function () {
  "use strict";
  const USERS = "threek_demo_users_v1";
  const SESSION = "threek_demo_session_v1";
  const read = () => {
    try {
      const v = JSON.parse(localStorage.getItem(USERS) || "[]");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  };
  const save = (v) => localStorage.setItem(USERS, JSON.stringify(v));
  const clean = (user) =>
    user
      ? {
          id: user.id,
          name: user.fullName,
          fullName: user.fullName,
          displayName: user.displayName || user.fullName,
          email: user.email,
          phone: user.phone || "",
          birthday: user.birthday || "",
        }
      : null;
  const normalized = (v) =>
    String(v || "")
      .trim()
      .toLowerCase();
  const bytes = (hex) =>
    new Uint8Array((hex.match(/.{2}/g) || []).map((v) => parseInt(v, 16)));
  const hex = (buf) =>
    [...new Uint8Array(buf)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("");
  async function digest(password, salt) {
    if (!crypto.subtle)
      throw new Error(
        "Hãy mở website bằng http://localhost để dùng đăng nhập demo.",
      );
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    return hex(
      await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: bytes(salt),
          iterations: 120000,
          hash: "SHA-256",
        },
        key,
        256,
      ),
    );
  }
  function getCurrentUser() {
    const id = localStorage.getItem(SESSION);
    return clean(read().find((u) => u.id === id));
  }
  async function registerUser(data) {
    const email = normalized(data.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw Error("Email không hợp lệ.");
    if (
      String(data.password || "").length < 8 ||
      !/[A-Za-z]/.test(data.password) ||
      !/\d/.test(data.password)
    )
      throw Error("Mật khẩu cần ít nhất 8 ký tự, gồm chữ và số.");
    if (read().some((u) => u.email === email))
      throw Error("Email đã được đăng ký.");
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const record = {
      id:
        "U" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      email,
      fullName: String(data.fullName || "").trim(),
      displayName: String(data.fullName || "").trim(),
      phone: String(data.phone || "").trim(),
      birthday: data.birthday || "",
      salt,
      hash: await digest(data.password, salt),
    };
    if (record.fullName.length < 2) throw Error("Vui lòng nhập họ tên hợp lệ.");
    const list = read();
    list.push(record);
    save(list);
    localStorage.setItem(SESSION, record.id);
    sessionStorage.removeItem("threek_guest_access_v2");
    return clean(record);
  }
  async function loginUser(email, password) {
    const u = read().find((x) => x.email === normalized(email));
    if (!u || (await digest(password, u.salt)) !== u.hash)
      throw Error("Email hoặc mật khẩu không đúng.");
    localStorage.setItem(SESSION, u.id);
    sessionStorage.removeItem("threek_guest_access_v2");
    return clean(u);
  }
  function updateProfile(input) {
    const id = localStorage.getItem(SESSION),
      users = read(),
      u = users.find((x) => x.id === id);
    if (!u) throw Error("Vui lòng đăng nhập để cập nhật hồ sơ.");
    const fullName = String(input.fullName || "").trim(),
      displayName = String(input.displayName || "").trim(),
      phone = String(input.phone || "").trim();
    if (
      fullName.length < 2 ||
      displayName.length < 2 ||
      displayName.length > 30
    )
      throw Error(
        "Họ tên và tên hiển thị phải hợp lệ (tên hiển thị 2–30 ký tự).",
      );
    if (phone && !/^(0|\+84)\d{9,10}$/.test(phone.replace(/[\s.-]/g, "")))
      throw Error("Số điện thoại không hợp lệ.");
    Object.assign(u, {
      fullName,
      displayName,
      phone,
      birthday: input.birthday || "",
    });
    save(users);
    return clean(u);
  }
  async function changePassword(current, next) {
    const users = read(),
      u = users.find((x) => x.id === localStorage.getItem(SESSION));
    if (!u) throw Error("Vui lòng đăng nhập.");
    if ((await digest(current, u.salt)) !== u.hash)
      throw Error("Mật khẩu hiện tại không đúng.");
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next))
      throw Error("Mật khẩu mới cần ít nhất 8 ký tự gồm chữ và số.");
    u.salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    u.hash = await digest(next, u.salt);
    save(users);
  }
  const RESET = "threek_demo_reset_v1";
  function startDemoRecovery(email) {
    email = normalized(email);
    const exists = read().some((u) => u.email === email);
    if (!exists) throw Error("Email này chưa đăng ký trong trình duyệt demo.");
    const otp = String(
      crypto.getRandomValues(new Uint32Array(1))[0] % 1000000,
    ).padStart(6, "0");
    sessionStorage.setItem(
      RESET,
      JSON.stringify({ email, otp, expires: Date.now() + 10 * 60 * 1000 }),
    );
    return otp;
  }
  async function finishDemoRecovery(email, otp, newPassword) {
    email = normalized(email);
    let data;
    try {
      data = JSON.parse(sessionStorage.getItem(RESET) || "null");
    } catch {}
    if (
      !data ||
      data.email !== email ||
      data.otp !== String(otp || "").trim() ||
      Date.now() > data.expires
    )
      throw Error("Mã thử nghiệm không đúng hoặc đã hết hạn.");
    if (
      String(newPassword || "").length < 8 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    )
      throw Error("Mật khẩu mới phải từ 8 ký tự, có chữ và số.");
    const users = read(),
      u = users.find((x) => x.email === email);
    if (!u) throw Error("Không tìm thấy tài khoản.");
    u.salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    u.hash = await digest(newPassword, u.salt);
    save(users);
    sessionStorage.removeItem(RESET);
    if (localStorage.getItem(SESSION) === u.id)
      localStorage.removeItem(SESSION);
    return true;
  }
  function deleteCurrentAccount() {
    const id = localStorage.getItem(SESSION);
    if (!id) throw Error("Bạn chưa đăng nhập.");
    save(read().filter((u) => u.id !== id));
    localStorage.removeItem(SESSION);
    localStorage.removeItem("threek_favorites_user_" + id);
    try {
      const key = "threek_domain_v2",
        db = JSON.parse(localStorage.getItem(key) || "{}");
      for (const k of ["reviews", "tickets", "notifications"])
        if (Array.isArray(db[k])) db[k] = db[k].filter((x) => x.userId !== id);
      localStorage.setItem(key, JSON.stringify(db));
    } catch {}
    // In this single-browser demo orders are also local and removed on deletion.
    try {
      const all = JSON.parse(localStorage.getItem("threek_bookings") || "[]");
      localStorage.setItem(
        "threek_bookings",
        JSON.stringify(all.filter((b) => b.userId !== id)),
      );
    } catch {}
  }
  function logout() {
    localStorage.removeItem(SESSION);
    sessionStorage.removeItem("threek_guest_access_v2");
  }
  Object.assign(window, {
    getCurrentUser,
    registerUser,
    loginUser,
    updateProfile,
    changePassword,
    deleteCurrentAccount,
    logout,
    startDemoRecovery,
    finishDemoRecovery,
  });
})();
