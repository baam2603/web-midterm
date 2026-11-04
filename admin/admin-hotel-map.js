/* 3K Booking Admin: tìm cơ sở lưu trú quanh vị trí đã chọn trên Leaflet. */
(function () {
  "use strict";
  const CITY = {
    dalat: { lat: 11.9404, lng: 108.4583, zoom: 13 },
    vungtau: { lat: 10.346, lng: 107.0843, zoom: 13 },
  };
  let leafletPromise = null;
  let current = null;
  const byId = (id, el = document) => el.querySelector("#" + id);
  const slugify = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/g, "");

  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise((resolve, reject) => {
      if (!document.querySelector("link[data-admin-leaflet]")) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "vendor/leaflet/leaflet.css";
        css.dataset.adminLeaflet = "1";
        document.head.appendChild(css);
      }
      const script = document.createElement("script");
      script.src = "vendor/leaflet/leaflet.js";
      script.onload = () => resolve(window.L);
      script.onerror = () => {
        leafletPromise = null;
        reject(Error("Không tải được thư viện Leaflet."));
      };
      document.head.appendChild(script);
    });
    return leafletPromise;
  }

  function ui(form) {
    const mount = byId("tk-maps-results", form);
    if (!mount) return null;
    let shell = byId("tk-hotel-map-picker", form);
    if (!shell) {
      shell = document.createElement("section");
      shell.id = "tk-hotel-map-picker";
      shell.className = "tk-hotel-map-picker";
      shell.innerHTML = `
        <h4>Tìm khách sạn bằng bản đồ</h4>
        <p class="tk-map-tip">Nhấn lên bản đồ để đặt tâm tìm kiếm, sau đó nhấn “Tìm quanh vị trí”. Không tự động gửi request.</p>
        <div id="tk-admin-hotel-map" class="tk-admin-hotel-map" aria-label="Bản đồ chọn khách sạn"></div>
        <div class="tk-hotel-map-controls">
          <button type="button" class="tk-outline" id="tk-map-find-nearby">Tìm khách sạn quanh vị trí</button>
          <input type="search" id="tk-map-local-filter" placeholder="Lọc tên trong kết quả đã tải..." aria-label="Lọc tên khách sạn trên bản đồ">
        </div>
        <p class="tk-map-hotel-status" id="tk-map-hotel-status" aria-live="polite">Chọn một điểm trên bản đồ để bắt đầu.</p>
        <div id="tk-map-nearby-list" class="tk-hotel-map-results"></div>`;
      mount.insertAdjacentElement("afterend", shell);
    }
    return shell;
  }

  function disposeStale() {
    if (current && !current.form.isConnected) {
      current.map.remove();
      current = null;
    }
  }

  function showStatus(ctx, text) {
    if (ctx.shell.isConnected)
      byId("tk-map-hotel-status", ctx.shell).textContent = text;
  }

  function clearResults(ctx) {
    ctx.queryId++;
    ctx.controller?.abort();
    const placeId = ctx.form.elements.namedItem("google_place_id");
    const address = ctx.form.elements.namedItem("address");
    if (placeId) placeId.value = "";
    if (address) address.value = "";
    const mapLink = byId("tk-selected-maps", ctx.form);
    if (mapLink) {
      mapLink.hidden = true;
      mapLink.removeAttribute("href");
    }
    ctx.places = [];
    ctx.markers.clearLayers();
    byId("tk-map-nearby-list", ctx.shell).replaceChildren();
    byId("tk-map-local-filter", ctx.shell).value = "";
  }

  function drawPlaces(ctx) {
    const q = slugify(byId("tk-map-local-filter", ctx.shell).value);
    const filtered = ctx.places.filter(
      (p) => !q || slugify(p.name).includes(q),
    );
    const list = byId("tk-map-nearby-list", ctx.shell);
    list.replaceChildren();
    ctx.markers.clearLayers();
    const bounds = [];
    filtered.forEach((place) => {
      const marker = ctx.L.marker([place.lat, place.lng]).addTo(ctx.markers);
      const tooltip = document.createElement("span");
      tooltip.textContent = place.name;
      marker.bindTooltip(tooltip);
      marker.on("click", () => selectPlace(ctx, place));
      bounds.push([place.lat, place.lng]);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tk-hotel-map-choice";
      const title = document.createElement("strong");
      title.textContent = place.name;
      const desc = document.createElement("small");
      desc.textContent = `${place.distanceKm} km • ${place.addressPreview || "Địa chỉ xác minh sau khi chọn"}`;
      button.append(title, desc);
      button.addEventListener("click", () => selectPlace(ctx, place));
      list.append(button);
    });
    if (filtered.length > 0) {
      const cluster = ctx.L.latLngBounds(bounds);
      ctx.map.fitBounds(cluster, { padding: [35, 35], maxZoom: 15 });
      showStatus(
        ctx,
        `Có ${filtered.length} khách sạn phù hợp. Nhấn ghim hoặc tên để chọn.`,
      );
    } else {
      showStatus(
        ctx,
        ctx.places.length
          ? "Không có tên phù hợp. Hãy thử từ khóa khác."
          : "Chưa có kết quả. Nhấn “Tìm khách sạn quanh vị trí”.",
      );
    }
  }

  async function selectPlace(ctx, place) {
    if (!ctx.form.isConnected || ctx.busy) return;
    ctx.busy = true;
    const verificationCity = ctx.form.elements.namedItem("city").value;
    const queryId = ctx.queryId;
    showStatus(ctx, `Đang xác minh địa chỉ “${place.name}”...`);
    try {
      const url = new URL("../api/admin/places-verify.php", location.href);
      url.searchParams.set("place_id", place.placeId);
      url.searchParams.set("city", verificationCity);
      ctx.controller?.abort();
      ctx.controller = new AbortController();
      const response = await fetch(url, {
        credentials: "same-origin",
        cache: "no-store",
        signal: ctx.controller.signal,
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || json?.status !== "success") {
        throw Error(
          json?.message ||
            `Không xác minh được địa chỉ (HTTP ${response.status}).`,
        );
      }
      if (
        ctx !== current ||
        !ctx.form.isConnected ||
        verificationCity !== ctx.form.elements.namedItem("city").value ||
        queryId !== ctx.queryId
      )
        return;
      const p = json.data;
      if (!p?.address || p.address.length > 255) {
        throw Error("Địa chỉ quá dài hoặc bị thiếu. Hãy chọn địa điểm khác.");
      }
      const name = String(p.name || place.name);
      if (name.length < 3 || name.length > 150)
        throw Error("Tên khách sạn không hợp lệ.");
      ctx.form.elements.namedItem("google_place_id").value = p.placeId;
      ctx.form.elements.namedItem("name").value = name;
      ctx.form.elements.namedItem("address").value = p.address;
      const slug = ctx.form.elements.namedItem("slug");
      if (slug.dataset.userEdited !== "true") slug.value = slugify(name);
      const mapLink = byId("tk-selected-maps", ctx.form);
      if (mapLink) {
        mapLink.href = p.mapsUrl;
        mapLink.hidden = false;
      }
      ctx.map.setView([p.lat, p.lng], 16);
      showStatus(ctx, `Đã chọn “${name}”. Địa chỉ đã được xác minh từ OSM.`);
      // Không chỉnh giá, số sao, tiện nghi vì OSM không xác minh các thuộc tính thương mại này.
    } catch (error) {
      if (error.name === "AbortError") return;
      showStatus(ctx, error.message || "Không thể xác minh địa chỉ.");
      console.error("[3K Admin Map] verify:", error);
    } finally {
      ctx.busy = false;
    }
  }

  async function queryNearby(ctx) {
    if (!ctx.form.isConnected || ctx.busy) return;
    const button = byId("tk-map-find-nearby", ctx.shell);
    ctx.busy = true;
    button.disabled = true;
    showStatus(ctx, "Đang tìm khách sạn trong bán kính khoảng 1,8 km...");
    const city = ctx.form.elements.namedItem("city").value;
    const center = ctx.searchCenter;
    const queryId = ++ctx.queryId;
    try {
      const url = new URL("../api/admin/places-nearby.php", location.href);
      url.searchParams.set("city", city);
      url.searchParams.set("lat", center.lat);
      url.searchParams.set("lng", center.lng);
      ctx.controller?.abort();
      ctx.controller = new AbortController();
      const resp = await fetch(url, {
        credentials: "same-origin",
        cache: "no-store",
        signal: ctx.controller.signal,
      });
      const data = await resp.json().catch(() => null);
      if (
        !resp.ok ||
        data?.status !== "success" ||
        !Array.isArray(data.data?.places)
      ) {
        throw Error(data?.message || `Lỗi tìm bản đồ HTTP ${resp.status}.`);
      }
      if (
        ctx !== current ||
        !ctx.form.isConnected ||
        city !== ctx.form.elements.namedItem("city").value ||
        queryId !== ctx.queryId
      )
        return;
      ctx.places = data.data.places;
      drawPlaces(ctx);
      if (!ctx.places.length)
        showStatus(
          ctx,
          "Không thấy khách sạn nào có dữ liệu OSM quanh vị trí này. Hãy thử vị trí khác.",
        );
    } catch (error) {
      if (error.name === "AbortError") return;
      showStatus(ctx, error.message || "Không tìm được khách sạn.");
      console.error("[3K Admin Map] nearby:", error);
    } finally {
      ctx.busy = false;
      if (button.isConnected) button.disabled = false;
    }
  }

  async function mount() {
    disposeStale();
    const form = document.getElementById("tk-create-hotel-db");
    const panel = document.getElementById("tk-create-hotel-panel");
    if (!form || !panel || panel.hidden || (current && current.form === form)) {
      if (current?.map && current.form === form && !panel?.hidden) {
        current.map.invalidateSize();
      }
      return;
    }
    const shell = ui(form);
    if (!shell || !form.elements.namedItem("google_place_id")) return;
    try {
      const L = await loadLeaflet();
      if (!form.isConnected || panel.hidden || current?.form === form) return;
      const city = form.elements.namedItem("city").value;
      const location = CITY[city] || CITY.dalat;
      const map = L.map(byId("tk-admin-hotel-map", shell), {
        scrollWheelZoom: false,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      }).addTo(map);
      map.setView([location.lat, location.lng], location.zoom);
      const centerPin = L.marker([location.lat, location.lng], {
        draggable: true,
      }).addTo(map);
      const markers = L.layerGroup().addTo(map);
      const ctx = {
        form,
        shell,
        L,
        map,
        centerPin,
        markers,
        searchCenter: { lat: location.lat, lng: location.lng },
        places: [],
        busy: false,
        queryId: 0,
      };
      current = ctx;
      map.on("click", (event) => {
        ctx.searchCenter = event.latlng;
        centerPin.setLatLng(event.latlng);
        clearResults(ctx);
        showStatus(ctx, "Đã chọn vị trí. Nhấn “Tìm khách sạn quanh vị trí”.");
      });
      centerPin.on("dragend", () => {
        ctx.searchCenter = centerPin.getLatLng();
        clearResults(ctx);
        showStatus(
          ctx,
          "Đã di chuyển ghim. Nhấn “Tìm khách sạn quanh vị trí”.",
        );
      });
      byId("tk-map-find-nearby", shell).addEventListener("click", () =>
        queryNearby(ctx),
      );
      byId("tk-map-local-filter", shell).addEventListener("input", () =>
        drawPlaces(ctx),
      );
      form.elements.namedItem("city").addEventListener("change", () => {
        const pos = CITY[form.elements.namedItem("city").value] || CITY.dalat;
        map.setView([pos.lat, pos.lng], pos.zoom);
        ctx.searchCenter = { lat: pos.lat, lng: pos.lng };
        centerPin.setLatLng(ctx.searchCenter);
        clearResults(ctx);
        showStatus(ctx, "Đã đổi thành phố. Hãy tìm lại khách sạn.");
      });
      setTimeout(() => map.invalidateSize(), 30);
    } catch (error) {
      const message = byId("tk-map-hotel-status", shell);
      if (message) message.textContent = error.message;
      console.error("[3K Admin Map] load:", error);
    }
  }

  // Khối form Admin được render động; khởi tạo sau khi nút mở panel đã hoạt động.
  document.addEventListener("click", (event) => {
    setTimeout(disposeStale, 0);
    if (event.target.closest("#tk-open-create-hotel")) {
      setTimeout(mount, 0);
    }
  });
  document.addEventListener("DOMContentLoaded", mount);
})();
