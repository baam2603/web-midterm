/* =====================================================================
   common/city-data.js
   Dữ liệu dùng chung cho các trang thành phố (Đà Lạt, Vũng Tàu, ...).
   Muốn thêm thành phố mới: thêm một khóa mới vào CITY_DATA.
   Hiện tại hotels là DỮ LIỆU MẪU — sau này thay bằng fetch() từ backend.
   ===================================================================== */

/* Nhãn + icon của từng tiện nghi (dùng cho thẻ khách sạn và chip bộ lọc) */
window.AMENITIES = {
  breakfast: { label: "Bữa sáng", icon: "free_breakfast" },
  parking: { label: "Bãi đỗ xe", icon: "local_parking" },
  fireplace: { label: "Lò sưởi", icon: "fireplace" },
  valley: { label: "View thung lũng", icon: "landscape" },
  lake: { label: "View hồ", icon: "waves" },
  pool: { label: "Hồ bơi", icon: "pool" },
  sea: { label: "View biển", icon: "waves" },
  sunset: { label: "View hoàng hôn", icon: "bedtime" },
  wifi: { label: "Wifi miễn phí", icon: "wifi" },
  restaurant: { label: "Nhà hàng", icon: "restaurant" },
  checkin24: { label: "Nhận phòng 24h", icon: "gpp_good" },
  garden: { label: "Vườn riêng", icon: "yard" },
  shuttle: { label: "Đưa đón sân bay", icon: "local_taxi" },
};

window.CITY_DATA = {
  /* ============================ ĐÀ LẠT ============================ */
  dalat: {
    name: "Đà Lạt",
    lat: 11.9404,
    lng: 108.4583,
    zoom: 13,

    // Gợi ý khi bấm vào ô "Đường phố"
    streets: [
      { name: "Trung tâm", note: "Khu Hòa Bình, Chợ Đà Lạt" },
      { name: "Hồ Xuân Hương", note: "Quanh hồ trung tâm" },
      { name: "Chợ đêm Đà Lạt", note: "Đường Nguyễn Thị Minh Khai" },
      { name: "Trần Hưng Đạo", note: "Đường Trần Hưng Đạo" },
      { name: "Phan Đình Phùng", note: "Đường Phan Đình Phùng" },
      { name: "Hồ Tuyền Lâm", note: "Phường 5, ven rừng thông" },
      { name: "Đồi Cù", note: "Đường Phù Đổng Thiên Vương" },
      { name: "Khe Sanh", note: "Đường Khe Sanh, Phường 10" },
    ],

    // Cấu hình bộ lọc (render tự động ở sidebar)
    filters: {
      types: [
        { value: "hotel", label: "Khách sạn" },
        { value: "homestay", label: "Homestay / Lữ quán" },
        { value: "resort", label: "Resort / Khu nghỉ dưỡng" },
        { value: "villa", label: "Biệt thự / Villa nguyên căn" },
      ],
      zones: [
        { value: "center", label: "Gần trung tâm / Chợ đêm" },
        { value: "forest", label: "Ven rừng / Gần Hồ Tuyền Lâm" },
      ],
      amenities: ["breakfast", "parking", "fireplace", "valley", "lake"],
    },

    hotels: [
      {
        id: "grand-mercure", name: "Đồi Thông Retreat", type: "resort", stars: 5,
        address: "Phường 5, gần Hồ Tuyền Lâm", streets: ["Hồ Tuyền Lâm"],
        zones: ["forest"], price: 1250000, score: 9.1, reviews: 482, capacity: 4,
        amenities: ["parking", "fireplace", "breakfast", "valley"],
        photo: "pine", lat: 11.8975, lng: 108.4305,
      },
      {
        id: "lan-suong", name: "Làn Sương Boutique Hotel", type: "hotel", stars: 4,
        address: "Trung tâm, cạnh Hồ Xuân Hương", streets: ["Trung tâm", "Hồ Xuân Hương"],
        zones: ["center"], price: 980000, score: 8.7, reviews: 316, capacity: 3,
        amenities: ["wifi", "restaurant", "checkin24", "lake"],
        photo: "mist", lat: 11.9437, lng: 108.4425,
      },
      {
        id: "cao-nguyen", name: "Lữ Quán Cao Nguyên", type: "homestay", stars: 3,
        address: "Đường Trần Hưng Đạo", streets: ["Trần Hưng Đạo"],
        zones: ["center"], price: 760000, score: 8.4, reviews: 201, capacity: 4,
        amenities: ["garden", "breakfast", "shuttle", "valley"],
        photo: "valley", lat: 11.9402, lng: 108.4552,
      },
      {
        id: "thung-lung-xanh", name: "Thung Lũng Xanh Villa", type: "villa", stars: 5,
        address: "Đường Khe Sanh, Phường 10", streets: ["Khe Sanh"],
        zones: ["forest"], price: 3200000, score: 9.4, reviews: 128, capacity: 8,
        amenities: ["parking", "fireplace", "breakfast", "garden", "valley"],
        photo: "valley", lat: 11.9172, lng: 108.4768,
      },
      {
        id: "ho-xuan-huong-view", name: "Hồ Xuân Hương View Hotel", type: "hotel", stars: 4,
        address: "Quanh Hồ Xuân Hương, Phường 1", streets: ["Hồ Xuân Hương", "Trung tâm"],
        zones: ["center"], price: 1480000, score: 8.9, reviews: 540, capacity: 3,
        amenities: ["lake", "breakfast", "wifi", "restaurant", "parking"],
        photo: "mist", lat: 11.9421, lng: 108.4439,
      },
      {
        id: "cho-dem-homestay", name: "Chợ Đêm Homestay", type: "homestay", stars: 2,
        address: "Gần Chợ đêm, Nguyễn Thị Minh Khai", streets: ["Chợ đêm Đà Lạt", "Trung tâm"],
        zones: ["center"], price: 520000, score: 8.0, reviews: 359, capacity: 3,
        amenities: ["wifi", "checkin24"],
        photo: "pine", lat: 11.9429, lng: 108.4378,
      },
      {
        id: "tuyen-lam-resort", name: "Tuyền Lâm Lakeside Resort", type: "resort", stars: 5,
        address: "Ven Hồ Tuyền Lâm, Phường 4", streets: ["Hồ Tuyền Lâm"],
        zones: ["forest"], price: 2650000, score: 9.2, reviews: 274, capacity: 4,
        amenities: ["lake", "pool", "parking", "breakfast", "fireplace"],
        photo: "pine", lat: 11.8942, lng: 108.4262,
      },
      {
        id: "doi-cu-inn", name: "Đồi Cù Inn", type: "hotel", stars: 3,
        address: "Gần Đồi Cù, Phù Đổng Thiên Vương", streets: ["Đồi Cù", "Phan Đình Phùng"],
        zones: ["center"], price: 690000, score: 8.2, reviews: 190, capacity: 3,
        amenities: ["wifi", "breakfast", "parking"],
        photo: "valley", lat: 11.9506, lng: 108.4503,
      },
    ],
  },

  /* ============================ VŨNG TÀU ============================ */
  vungtau: {
    name: "Vũng Tàu",
    lat: 10.346,
    lng: 107.0843,
    zoom: 13,

    streets: [
      { name: "Bãi Sau", note: "Đường Thùy Vân" },
      { name: "Bãi Trước", note: "Đường Quang Trung / Hạ Long" },
      { name: "Thùy Vân", note: "Dọc bờ biển Bãi Sau" },
      { name: "Thi Sách", note: "Khu phố ẩm thực, trung tâm" },
      { name: "Trần Phú", note: "Ven biển Bãi Dâu" },
      { name: "Hạ Long", note: "Ven Bãi Trước" },
      { name: "Lê Hồng Phong", note: "Trục chính trung tâm" },
      { name: "Trung tâm", note: "Khu vực chợ, phố ẩm thực" },
    ],

    filters: {
      types: [
        { value: "hotel", label: "Khách sạn", icon: "hotel" },
        { value: "homestay", label: "Homestay / Lữ quán", icon: "cottage" },
        { value: "resort", label: "Resort / Khu nghỉ dưỡng", icon: "spa" },
        { value: "villa", label: "Căn hộ / Villa view biển", icon: "apartment" },
      ],
      zones: [
        { value: "beach", label: "Gần biển Bãi Sau", icon: "beach_access" },
        { value: "center", label: "Trung tâm thành phố", icon: "storefront" },
      ],
      amenities: ["breakfast", "parking", "pool", "sea", "sunset"],
    },

    hotels: [
      {
        id: "sample-vungtau", name: "Sóng Biển Resort", type: "resort", stars: 5,
        address: "Bãi Sau, sát bờ biển", streets: ["Bãi Sau", "Thùy Vân"],
        zones: ["beach"], price: 1450000, score: 9.0, reviews: 468, capacity: 4,
        amenities: ["parking", "pool", "breakfast", "sea", "sunset"],
        photo: "sea", lat: 10.3368, lng: 107.0872,
      },
      {
        id: "anh-duong", name: "Ánh Dương Boutique Hotel", type: "hotel", stars: 4,
        address: "Trung tâm, gần Bãi Trước", streets: ["Trung tâm", "Bãi Trước", "Hạ Long"],
        zones: ["center"], price: 890000, score: 8.6, reviews: 302, capacity: 3,
        amenities: ["wifi", "restaurant", "checkin24", "breakfast"],
        photo: "sand", lat: 10.3478, lng: 107.0753,
      },
      {
        id: "hai-au", name: "Hải Âu Homestay", type: "homestay", stars: 3,
        address: "Đường Thùy Vân", streets: ["Thùy Vân", "Bãi Sau"],
        zones: ["beach"], price: 650000, score: 8.3, reviews: 187, capacity: 4,
        amenities: ["garden", "breakfast", "shuttle"],
        photo: "sunset", lat: 10.3402, lng: 107.0891,
      },
      {
        id: "hoang-hon-villa", name: "Hoàng Hôn Sea Villa", type: "villa", stars: 5,
        address: "Đường Trần Phú, ven biển", streets: ["Trần Phú"],
        zones: ["beach"], price: 3600000, score: 9.3, reviews: 96, capacity: 8,
        amenities: ["sea", "sunset", "pool", "parking", "breakfast"],
        photo: "sunset", lat: 10.3331, lng: 107.0694,
      },
      {
        id: "bai-truoc-grand", name: "Bãi Trước Grand Hotel", type: "hotel", stars: 5,
        address: "Đường Quang Trung, Bãi Trước", streets: ["Bãi Trước", "Hạ Long", "Trung tâm"],
        zones: ["center"], price: 2100000, score: 8.9, reviews: 612, capacity: 3,
        amenities: ["sea", "pool", "parking", "breakfast", "restaurant", "wifi"],
        photo: "sea", lat: 10.3512, lng: 107.0722,
      },
      {
        id: "thi-sach-inn", name: "Thi Sách Inn", type: "hotel", stars: 3,
        address: "Đường Thi Sách, khu phố ẩm thực", streets: ["Thi Sách", "Trung tâm"],
        zones: ["center"], price: 560000, score: 8.0, reviews: 421, capacity: 3,
        amenities: ["wifi", "checkin24", "breakfast"],
        photo: "sand", lat: 10.3441, lng: 107.0785,
      },
      {
        id: "thuy-van-apartment", name: "Thùy Vân Sea Apartment", type: "villa", stars: 4,
        address: "Đường Thùy Vân, Bãi Sau", streets: ["Thùy Vân", "Bãi Sau"],
        zones: ["beach"], price: 1180000, score: 8.5, reviews: 233, capacity: 5,
        amenities: ["sea", "pool", "parking", "sunset"],
        photo: "sea", lat: 10.3389, lng: 107.0868,
      },
      {
        id: "lhp-homestay", name: "Lê Hồng Phong Homestay", type: "homestay", stars: 2,
        address: "Đường Lê Hồng Phong, trung tâm", streets: ["Lê Hồng Phong", "Trung tâm"],
        zones: ["center"], price: 480000, score: 7.9, reviews: 142, capacity: 3,
        amenities: ["wifi", "garden", "parking"],
        photo: "sunset", lat: 10.3575, lng: 107.0821,
      },
    ],
  },
};