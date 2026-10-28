(function () {
  "use strict";

  const API_URL = new URL(
    "../api/hotels/index.php",
    document.currentScript.src,
  );

  async function loadCity(cityKey) {
    const city = window.CITY_DATA?.[cityKey];

    if (!city || !Array.isArray(city.hotels)) {
      throw new Error("Thiếu dữ liệu CITY_DATA: " + cityKey);
    }

    const url = new URL(API_URL.href);
    url.searchParams.set("city", cityKey);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("API HTTP " + response.status);
    }

    const result = await response.json();

    if (result.status !== "success" || !Array.isArray(result.data)) {
      throw new Error("Dữ liệu API không hợp lệ");
    }

    // Giữ thông tin UI chưa được chuyển sang MySQL
    const originalHotels = new Map(
      city.hotels.map((hotel) => [String(hotel.id), hotel]),
    );

    const hotels = result.data.flatMap((item) => {
      const original = originalHotels.get(String(item.slug));

      if (!original) {
        console.warn("Khách sạn chưa có dữ liệu UI:", item.slug);
        return [];
      }

      const price = Number(item.price_per_night);
      const stars = Number(item.stars);

      return [
        {
          ...original,

          id: item.slug,
          name: item.name,
          type: item.type,
          address: item.address,

          stars: Number.isFinite(stars) ? stars : original.stars,

          price: Number.isFinite(price) ? price : original.price,
        },
      ];
    });

    if (result.data.length > 0 && hotels.length === 0) {
      throw new Error("Không khớp slug giữa MySQL và dữ liệu UI");
    }

    city.hotels = hotels;

    return hotels;
  }

  window.HotelAPI = { loadCity };
})();
