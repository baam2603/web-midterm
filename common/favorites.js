const FAV_KEY = "threek_favorites"; // legacy guest data
function favoriteKey() {
  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  return user ? "threek_favorites_user_" + user.id : FAV_KEY;
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(favoriteKey())) || [];
  } catch {
    return [];
  }
}

function setFavorites(list) {
  localStorage.setItem(favoriteKey(), JSON.stringify(list));
}

function isFavorite(id) {
  return getFavorites().some((h) => h.id === id);
}

/* ---------- Toast: tự mất sau 3 giây ---------- */
let favToastTimer = null;

function showFavToast(message, saved = true) {
  let el = document.getElementById("fav-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "fav-toast";
    el.className = "fav-toast";
    el.setAttribute("role", "status");
    el.innerHTML = `<i class="material-symbols-rounded">favorite</i><span></span>`;
    document.body.appendChild(el);
  }

  el.querySelector("span").textContent = message;
  el.classList.toggle("fav-toast--remove", !saved);

  void el.offsetWidth; // chạy lại animation khi bấm liên tục
  el.classList.add("is-show");

  clearTimeout(favToastTimer);
  favToastTimer = setTimeout(() => el.classList.remove("is-show"), 3000);
}

/* ---------- Đồng bộ trạng thái tim ---------- */
function syncFavButtons() {
  document.querySelectorAll(".btn-fav").forEach((btn) => {
    const saved = isFavorite(btn.dataset.id);
    btn.classList.toggle("is-saved", saved);
    btn.setAttribute("aria-pressed", saved);
    btn.setAttribute(
      "aria-label",
      saved ? "Bỏ lưu khách sạn" : "Lưu khách sạn",
    );
  });
}

/* ---------- Bấm tim: lưu / bỏ lưu ---------- */
function toggleFavorite(btn) {
  const { id, name, city } = btn.dataset;
  let list = getFavorites();

  if (list.some((h) => h.id === id)) {
    list = list.filter((h) => h.id !== id);
    setFavorites(list);
    showFavToast(`Đã bỏ lưu "${name}"`, false);
  } else {
    list.push({ id, name, city, savedAt: Date.now() });
    setFavorites(list);
    showFavToast(`Đã lưu "${name}" vào danh sách yêu thích`, true);
  }
  syncFavButtons();
}

/* ---------- Tự chèn tim vào mọi .hotel-card (kể cả card render bằng JS) ---------- */
function slugify(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function detectCity() {
  const m = location.pathname.match(/(dalat|vungtau)/i);
  return m ? m[1].toLowerCase() : "";
}

function detectHotelId(card, name) {
  if (card.dataset.id) return card.dataset.id;

  // thử lấy id=... từ onclick hoặc href của nút "Xem phòng"
  const candidates = card.querySelectorAll("[onclick], a[href], [data-href]");
  for (const el of candidates) {
    const src =
      el.getAttribute("onclick") ||
      el.getAttribute("href") ||
      el.getAttribute("data-href") ||
      "";
    const m = src.match(/[?&]id=([^&'"\s]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return slugify(name);
}

function injectFavButtons() {
  document.querySelectorAll(".hotel-card").forEach((card) => {
    if (card.querySelector(".btn-fav")) return;

    const name = (card.querySelector("h3")?.textContent || "").trim();
    if (!name) return;

    const photo = card.querySelector(".hotel-card__photo");
    const host = photo && photo.tagName !== "IMG" ? photo : card;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-fav";
    btn.dataset.id = detectHotelId(card, name);
    btn.dataset.name = name;
    btn.dataset.city = detectCity();
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "Lưu khách sạn");
    btn.innerHTML = `<i class="material-symbols-rounded">favorite</i>`;
    host.appendChild(btn);
  });
  syncFavButtons();
}

function initFavorites() {
  // Bấm tim (event delegation)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-fav");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(btn);
  });

  injectFavButtons();

  // Theo dõi khi city-page.js vẽ lại danh sách (lọc, sắp xếp, tải dữ liệu...)
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      injectFavButtons();
    });
  }).observe(document.body, { childList: true, subtree: true });
}
