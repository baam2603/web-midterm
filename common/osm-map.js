/* Shared OSM display: bundled Leaflet, public tiles, no Google key or billing. */
(() => {
  "use strict";
  const base = new URL("../admin/vendor/leaflet/", document.currentScript.src);
  let pending;
  function load() {
    if (window.L) return Promise.resolve(window.L);
    if (pending) return pending;
    pending = new Promise((resolve, reject) => {
      if (!document.querySelector("[data-osm-leaflet]")) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = new URL("leaflet.css", base);
        css.dataset.osmLeaflet = "1";
        document.head.append(css);
      }
      const script = document.createElement("script");
      script.src = new URL("leaflet.js", base);
      script.onload = () => resolve(window.L);
      script.onerror = () => {
        pending = null;
        reject(
          Error("Không tải được thư viện bản đồ. Vui lòng tải lại trang."),
        );
      };
      document.head.append(script);
    });
    return pending;
  }
  function map(element, position, zoom, L = window.L) {
    element.style.zIndex = "0";
    const m = L.map(element, { scrollWheelZoom: false }).setView(
      position,
      zoom,
    );
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(m);
    return m;
  }
  window.ThreeKOSM = { load, map };
})();
