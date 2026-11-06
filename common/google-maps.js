/* Official Maps JavaScript SDK. Public browser key comes from the PHP environment. */
(() => {
  "use strict";
  const root = new URL("../", document.currentScript.src);
  let pending,
    rejected = false;
  window.gm_authFailure = () => {
    rejected = true;
    document.querySelectorAll("[data-threek-google-map]").forEach((box) => {
      box.textContent =
        "Google Maps từ chối key. Kiểm tra Maps JavaScript API, billing và giới hạn tên miền của key trình duyệt.";
    });
  };
  async function load() {
    if (pending) return pending;
    pending = (async () => {
      const response = await fetch(new URL("api/maps/config.php", root), {
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok || !result.data?.browserKey)
        throw Error(result.message || "Không tải được cấu hình Google Maps.");
      const config = result.data;
      if (!window.google?.maps?.importLibrary)
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          const timer = setTimeout(() => {
            delete window.__threekMapsReady;
            script.remove();
            reject(
              Error("Google Maps phản hồi quá lâu. Hãy thử tải lại trang."),
            );
          }, 20000);
          window.__threekMapsReady = () => {
            clearTimeout(timer);
            delete window.__threekMapsReady;
            resolve();
          };
          script.src =
            "https://maps.googleapis.com/maps/api/js?" +
            new URLSearchParams({
              key: config.browserKey,
              v: "weekly",
              loading: "async",
              callback: "__threekMapsReady",
              language: "vi",
              region: "VN",
            });
          script.async = true;
          script.onerror = () => {
            clearTimeout(timer);
            delete window.__threekMapsReady;
            reject(
              Error(
                "Không tải được Google Maps. Kiểm tra kết nối và quyền của key trình duyệt.",
              ),
            );
          };
          document.head.append(script);
        });
      const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
        google.maps.importLibrary("maps"),
        google.maps.importLibrary("marker"),
      ]);
      return { Map, AdvancedMarkerElement, mapId: config.mapId };
    })().catch((error) => {
      pending = null;
      throw error;
    });
    return pending;
  }
  async function create(element, center, zoom = 13) {
    element.dataset.threekGoogleMap = "1";
    const sdk = await load();
    if (rejected)
      throw Error("Google Maps chưa xác thực được key trình duyệt.");
    const map = new sdk.Map(element, {
      center,
      zoom,
      mapId: sdk.mapId,
      gestureHandling: "cooperative",
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    return { map, sdk };
  }
  function marker(ctx, position, title, onClick, options = {}) {
    const m = new ctx.sdk.AdvancedMarkerElement({
      map: ctx.map,
      position,
      title,
      ...options,
    });
    if (onClick) m.addListener("click", onClick);
    return m;
  }
  function fit(ctx, positions, maxZoom = 15) {
    if (!positions.length) return;
    if (positions.length === 1) {
      ctx.map.setCenter(positions[0]);
      ctx.map.setZoom(maxZoom);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    positions.forEach((p) => bounds.extend(p));
    ctx.map.fitBounds(bounds, 30);
    google.maps.event.addListenerOnce(ctx.map, "idle", () => {
      if (ctx.map.getZoom() > maxZoom) ctx.map.setZoom(maxZoom);
    });
  }
  function credits(container, attributions = []) {
    const row = document.createElement("div");
    const logo = document.createElement("img");
    logo.src =
      "https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png";
    logo.alt = "Powered by Google";
    logo.width = 144;
    logo.height = 18;
    row.append(logo);
    const seen = new Set();
    for (const a of attributions) {
      if (typeof a?.provider !== "string" || seen.has(a.provider)) continue;
      seen.add(a.provider);
      const label = document.createElement("span");
      label.textContent = " · " + a.provider;
      try {
        const url = new URL(a.providerUri);
        if (url.protocol === "https:") {
          const link = document.createElement("a");
          link.href = url.href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.append(label);
          row.append(link);
          continue;
        }
      } catch (_) {}
      row.append(label);
    }
    container.append(row);
  }
  window.ThreeKMaps = { load, create, marker, fit, credits };
})();
