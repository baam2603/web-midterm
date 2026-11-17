(function () {
  "use strict";
  const localPath = (p) => {
    const s = String(p || "").trim();
    if (!/^(?:sources|uploads)\/[A-Za-z0-9_./-]+$/.test(s) || s.includes(".."))
      return "";
    return "../" + s;
  };
  const toImagePath = (x) =>
    localPath(typeof x === "string" ? x : x?.image_path);
  const features = (list) =>
    Array.isArray(list)
      ? list
          .filter((x) => typeof x === "string" && x.trim())
          .map((label) => ({ icon: "check_circle", label }))
      : [];
  const time = (value) => (value ? String(value).slice(0, 5) : "");

  async function sync(draft) {
    const params = draft
      ? new URLSearchParams({
          city: draft.city,
          id: draft.hotelId,
          checkin: draft.checkin,
          checkout: draft.checkout,
        })
      : new URLSearchParams(location.search);
    const city = params.get("city") || "dalat";
    const slug = params.get("id") || "";
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      slug.length > 80 ||
      typeof CITIES === "undefined" ||
      !CITIES[city]
    ) {
      throw new Error("Địa chỉ khách sạn không hợp lệ.");
    }
    const url = new URL("../api/hotels/detail.php", location.href);
    url.searchParams.set("slug", slug);
    if (params.get("checkin"))
      url.searchParams.set("checkin", params.get("checkin"));
    if (params.get("checkout"))
      url.searchParams.set("checkout", params.get("checkout"));
    const response = await fetch(url, { cache: "no-store" });
    const body = await response.json().catch(() => null);
    if (
      !response.ok ||
      body?.status !== "success" ||
      body?.data?.hotel?.slug !== slug
    ) {
      throw new Error(
        body?.message || `Không thể tải khách sạn (HTTP ${response.status}).`,
      );
    }
    const h = body.data.hotel;
    if (h.city !== city) throw new Error("Thông tin thành phố không khớp.");
    // Giữ bố cục và dữ liệu UI cũ cho các khách sạn demo có sẵn trong project.
    // Khách sạn mới không có dữ liệu cũ, nên không kế thừa ảnh/review mẫu.
    const legacy = window.HOTELS?.[city]?.[slug] || null;
    const legacyRooms = new Map(
      (legacy?.rooms || []).map((r) => [String(r.id), r]),
    );
    const dbRooms = Array.isArray(body.data.rooms) ? body.data.rooms : [];
    const rooms = dbRooms.map((r) => ({
      ...(legacyRooms.get(String(r.code)) || {}),
      id: String(r.code),
      name: String(r.name || ""),
      desc: String(r.description || ""),
      price: Number(r.price_per_night || 0),
      oldPrice: null,
      guests: Number(r.capacity || 0),
      left: Number(r.available_rooms ?? 0),
      area:
        r.area_m2 === null
          ? legacyRooms.get(String(r.code))?.area || null
          : Number(r.area_m2),
      bed: String(r.bed_type || legacyRooms.get(String(r.code))?.bed || ""),
      breakfast: Boolean(r.breakfast_included),
      refundable: Boolean(r.free_cancellation),
      features: features(r.features),
      image:
        (Array.isArray(r.images) ? r.images : [])
          .map(toImagePath)
          .find(Boolean) ||
        legacyRooms.get(String(r.code))?.image ||
        "",
      images: (Array.isArray(r.images) ? r.images : [])
        .map(toImagePath)
        .filter(Boolean),
      closed: false,
    }));
    const dbImages = (Array.isArray(h.images) ? h.images : [])
      .map(toImagePath)
      .filter(Boolean);
    const images = dbImages;
    const facts = [];
    if (time(h.checkin_time))
      facts.push({
        icon: "login",
        label: "Nhận phòng",
        value: "Từ " + time(h.checkin_time),
      });
    if (time(h.checkout_time))
      facts.push({
        icon: "logout",
        label: "Trả phòng",
        value: "Trước " + time(h.checkout_time),
      });
    facts.push({
      icon: "meeting_room",
      label: "Loại phòng",
      value: rooms.length + " lựa chọn",
    });
    if (rooms.length)
      facts.push({
        icon: "group",
        label: "Sức chứa tham khảo",
        value: "Tối đa " + Math.max(...rooms.map((r) => r.guests)) + " khách",
      });
    const dbAmenities = (Array.isArray(h.amenities) ? h.amenities : []).map(
      (a) => ({
        icon: String(a.icon || "check_circle"),
        label: String(a.label || ""),
      }),
    );
    const dbRules = Array.isArray(h.rules)
      ? h.rules.filter((x) => typeof x === "string")
      : [];
    const hotel = {
      name: String(h.name || ""),
      stars: Number(h.stars || 0),
      address: String(h.address || ""),
      lat:
        h.maps_provider === "google" || h.latitude == null
          ? null
          : Number(h.latitude),
      lng:
        h.maps_provider === "google" || h.longitude == null
          ? null
          : Number(h.longitude),
      intro: String(h.description || ""),
      images,
      amenities: dbAmenities,
      facts,
      rules: dbRules,
      nearby: legacy?.nearby || [],
      rooms,
      priceFrom: rooms.length ? Math.min(...rooms.map((r) => r.price)) : 0,
      // Rating is computed from published community reviews in MySQL.
      rating: h.rating == null ? null : Number(h.rating),
      ratingLabel:
        h.rating == null ? "Chưa có đánh giá" : "Đánh giá từ cộng đồng",
      reviewCount: Number(h.review_count || 0),
      hidden: false,
    };
    window.HOTELS[city] ||= {};
    window.HOTELS[city][slug] = hotel;
    return hotel;
  }
  window.HotelDetailAPI = { sync };
})();
