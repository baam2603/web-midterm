(function () {
  "use strict";

  async function sync() {
    const params = new URLSearchParams(location.search);
    const city = params.get("city") || "dalat";
    const slug = params.get("id");

    if (!slug) throw new Error("Thiếu mã khách sạn");

    const hotel = window.HOTELS?.[city]?.[slug];

    if (!hotel) {
      throw new Error("Không tìm thấy khách sạn trong UI");
    }

    const url = new URL("../api/hotels/detail.php", location.href);
    url.searchParams.set("slug", slug);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("API HTTP " + response.status);
    }

    const result = await response.json();
    const data = result.data;
    const h = data?.hotel;

    if (
      result.status !== "success" ||
      !h ||
      h.slug !== slug ||
      h.city !== city
    ) {
      throw new Error("Dữ liệu khách sạn không hợp lệ");
    }

    // Đồng bộ thông tin khách sạn
    hotel.name = h.name;
    hotel.address = h.address;
    hotel.stars = Number(h.stars);

    if (h.description) {
      hotel.intro = h.description;
    }

    // Đồng bộ hình ảnh
    if (Array.isArray(h.images) && h.images.length) {
      const images = h.images
        .map((img) => img.image_path)
        .filter(
          (path) =>
            typeof path === "string" &&
            /^sources\/[\w./-]+$/.test(path) &&
            !path.includes(".."),
        )
        .map((path) => "../" + path);

      if (images.length) {
        hotel.images = [
          ...images,
          ...hotel.images.filter((old) => !images.includes(old)),
        ];
      }
    }

    // Đồng bộ tiện nghi
    if (Array.isArray(h.amenities) && h.amenities.length) {
      hotel.amenities = h.amenities.map((a) => ({
        icon: a.icon || "check_circle",
        label: a.label,
      }));
    }

    // Đồng bộ loại phòng
    if (Array.isArray(data.rooms) && data.rooms.length) {
      const oldRooms = hotel.rooms || [];
      const oldByCode = new Map(oldRooms.map((r) => [String(r.id), r]));

      hotel.rooms = data.rooms.map((r) => {
        const old = oldByCode.get(String(r.code)) || {};

        return {
          ...old,
          id: String(r.code),
          name: r.name,
          price: Number(r.price_per_night),
          guests: Number(r.capacity),
          left: Number(r.total_rooms),
          area: old.area || 28,
          bed: old.bed || "Giường đôi",
          image: old.image || hotel.images[0] || "",
          features: old.features || [],
          breakfast: old.breakfast ?? false,
          refundable: old.refundable ?? true,
        };
      });

      hotel.priceFrom = Math.min(...hotel.rooms.map((r) => r.price));
    } else {
      console.warn("Chưa có loại phòng MySQL, giữ phòng demo.");
    }

    console.log(
      "[3K Booking] Chi tiết từ MySQL:",
      hotel.name,
      hotel.rooms.length,
      "loại phòng",
    );

    return hotel;
  }

  window.HotelDetailAPI = { sync };
})();
