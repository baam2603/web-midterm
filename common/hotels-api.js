(function () {
  "use strict";
  const API_URL = new URL(
    "../api/hotels/index.php",
    document.currentScript.src,
  );
  function safePath(p) {
    const s = String(p || "");
    return /^(sources|uploads)\/[\w./-]+$/.test(s) && !s.includes("..")
      ? "../" + s
      : "";
  }
  async function loadCity(cityKey) {
    const city = window.CITY_DATA?.[cityKey];
    if (!city || !Array.isArray(city.hotels))
      throw new Error("Không có cấu hình thành phố: " + cityKey);
    const url = new URL(API_URL);
    url.searchParams.set("city", cityKey);
    const response = await fetch(url, { cache: "no-store" });
    const json = await response.json().catch(() => null);
    if (
      !response.ok ||
      json?.status !== "success" ||
      !Array.isArray(json.data)
    ) {
      throw new Error(
        json?.message || `Lỗi API danh sách HTTP ${response.status}`,
      );
    }
    const old = new Map(city.hotels.map((h) => [String(h.id), h]));
    const results = json.data.map((h) => {
      const prev = old.get(String(h.slug)) || {};
      const lat =
        h.latitude == null || h.latitude === ""
          ? Number(prev.lat)
          : Number(h.latitude);
      const lng =
        h.longitude == null || h.longitude === ""
          ? Number(prev.lng)
          : Number(h.longitude);
      const knownAmenityCodes = (
        Array.isArray(h.amenities) ? h.amenities : []
      ).filter((x) =>
        Object.prototype.hasOwnProperty.call(window.AMENITIES || {}, x),
      );
      return {
        ...prev,
        id: String(h.slug),
        name: String(h.name),
        type: String(h.type),
        stars: Number(h.stars) || 0,
        address: String(h.address),
        price: Number(h.min_room_price || h.price_per_night) || 0,
        capacity: Number(h.max_capacity) || 0,
        amenities: knownAmenityCodes,
        streets: Array.isArray(prev.streets) ? prev.streets : [],
        zones: Array.isArray(prev.zones) ? prev.zones : [],
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        photo: prev.photo || "",
        coverImage: safePath(h.cover_image),
        score: typeof prev.score === "number" ? prev.score : null,
        reviews: Number(prev.reviews || 0),
        hidden: false,
      };
    });
    city.hotels = results;
    console.info(
      `[3K Customer] ${cityKey}: API trả ${json.data.length} khách sạn; đã đồng bộ ${results.length} vào danh sách`,
      results.map((h) => h.id),
    );
    return results;
  }
  window.HotelAPI = { loadCity };
})();
