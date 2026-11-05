let favoriteItems = [];
let favoriteOwner = null;
function getFavorites() {
  return favoriteItems.slice();
}
async function loadFavorites() {
  await window.authReady;
  const user = getCurrentUser();
  if (!user) {
    favoriteItems = [];
    favoriteOwner = null;
    syncFavButtons();
    return [];
  }
  const response = await window.apiFetch(getApiUrl("account/favorites.php"), {
    credentials: "same-origin",
    cache: "no-store",
  });
  const json = await response.json();
  if (!response.ok || json.status !== "success")
    throw Error(json.message || "Không tải được yêu thích.");
  favoriteOwner = user.id;
  favoriteItems = json.data;
  syncFavButtons();
  return getFavorites();
}
async function saveFavorite(item, saved) {
  await window.authReady;
  if (!getCurrentUser()) throw Error("Vui lòng đăng nhập để lưu khách sạn.");
  const response = await window.apiFetch(getApiUrl("account/favorites.php"), {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: item.id, city: item.city, saved }),
  });
  const json = await response.json();
  if (!response.ok || json.status !== "success")
    throw Error(json.message || "Không lưu được yêu thích.");
  favoriteItems = json.data;
  syncFavButtons();
  return getFavorites();
}
function isFavorite(id) {
  return favoriteItems.some((h) => h.id === id);
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
async function toggleFavorite(btn) {
  if (btn.disabled) return;
  btn.disabled = true;
  try {
    const saved = !isFavorite(btn.dataset.id);
    await saveFavorite(btn.dataset, saved);
    showFavToast((saved ? "Đã lưu " : "Đã bỏ lưu ") + btn.dataset.name, saved);
  } catch (e) {
    showFavToast(e.message, false);
  } finally {
    if (btn.isConnected) btn.disabled = false;
  }
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
  loadFavorites().catch((e) => showFavToast(e.message, false));

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

window.addEventListener("threek:auth-updated", () => {
  const owner = getCurrentUser()?.id ?? null;
  if (owner !== favoriteOwner) {
    favoriteItems = [];
    syncFavButtons();
    loadFavorites().catch(() => {});
  }
});
