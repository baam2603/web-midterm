const FOOTER_INFO = {
  brand: "THREEK.COM",
  tagline: "Đặt phòng khách sạn nhanh gọn tại Đà Lạt và Vũng Tàu.",
  email: "nguyentuankhoi2603@gmail.com",
  phone: "0824343474",
  address: "Việt Nam",
  note: "Đồ án môn học",
  socials: [
    { label: "Facebook", icon: "ri-facebook-fill", href: "#" },
    { label: "Instagram", icon: "ri-instagram-line", href: "#" },
    { label: "TikTok", icon: "ri-tiktok-line", href: "#" },
  ],
};

const FOOTER_COLUMNS = [
  {
    title: "Khám phá",
    links: [
      { label: "Trang chủ", to: "home" },
      { label: "Khách sạn Đà Lạt", to: "dalat" },
      { label: "Khách sạn Vũng Tàu", to: "vungtau" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { label: "Hồ sơ của tôi", to: "account" },
      { label: "Đặt phòng của tôi", to: "bookings" },
      { label: "Đăng nhập", to: "login" },
      { label: "Đăng ký", to: "register" },
    ],
  },
];
function renderFooterBrand() {
  const socials = FOOTER_INFO.socials
    .map(
      (s) =>
        `<a href="${s.href}" aria-label="${s.label}"><i class="${s.icon}"></i></a>`,
    )
    .join("");

  return `
    <div class="site-footer__col site-footer__col--brand">
      <a class="site-footer__brand" href="${route("home")}">
        <img class="site-footer__logo" src="${siteUrl("sources/3k5.jpg")}" alt="" onerror="this.style.display='none'" />${FOOTER_INFO.brand}
      </a>
      <p class="site-footer__tagline">${FOOTER_INFO.tagline}</p>
      <div class="site-footer__socials">${socials}</div>
    </div>
  `;
}
function renderFooterColumns() {
  return FOOTER_COLUMNS.map(
    (col) => `
      <nav class="site-footer__col" aria-label="${col.title}">
        <h3 class="site-footer__title">${col.title}</h3>
        <ul class="site-footer__links">
          ${col.links.map((l) => `<li><a href="${l.to ? route(l.to) : l.href}">${l.label}</a></li>`).join("")}
        </ul>
      </nav>
    `,
  ).join("");
}
function renderFooterContact() {
  return `
    <div class="site-footer__col">
      <h3 class="site-footer__title">Liên hệ</h3>
      <ul class="site-footer__links site-footer__links--contact">
        <li><i class="ri-mail-line"></i><a href="mailto:${FOOTER_INFO.email}">${FOOTER_INFO.email}</a></li>
        <li><i class="ri-phone-line"></i><a href="tel:${FOOTER_INFO.phone.replace(/\s/g, "")}">${FOOTER_INFO.phone}</a></li>
        <li><i class="ri-map-pin-line"></i><span>${FOOTER_INFO.address}</span></li>
      </ul>
    </div>
  `;
}
function renderFooterBottom({ note = FOOTER_INFO.note } = {}) {
  const year = new Date().getFullYear();
  return `
    <div class="site-footer__bottom">
      <span>© ${year} ${FOOTER_INFO.brand}</span>
      <span>${note}</span>
    </div>
  `;
}

function mountFooter(mountId, { note } = {}) {
  const el = document.getElementById(mountId);
  if (!el) return console.warn(`mountFooter: không tìm thấy #${mountId}`);

  el.classList.add("site-footer");
  el.innerHTML = `
    <div class="site-footer__inner">
      ${renderFooterBrand()}
      ${renderFooterColumns()}
      ${renderFooterContact()}
    </div>
    ${renderFooterBottom({ note })}
  `;
}
