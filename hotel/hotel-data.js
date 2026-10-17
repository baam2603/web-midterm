/* =====================================================================
   DỮ LIỆU KHÁCH SẠN — thêm thành phố / khách sạn mới chỉ cần sửa file này.
   URL mở trang:  hotel.html?city=dalat&id=grand-mercure
   - images: đường dẫn ảnh (tối thiểu 6 ảnh để lấp đủ ô; thiếu thì hiện nền màu)
   - Dữ liệu bên dưới là DỮ LIỆU MẪU, hãy thay bằng thông tin thật.
   ===================================================================== */
const CITIES = {
  dalat: {
    name: "Đà Lạt",
    listHref: "dalat.html",
    theme: "dalat",
  },
  vungtau: {
    name: "Vũng Tàu",
    listHref: "vungtau.html",
    theme: "vungtau",
  },
};

const HOTELS = {
  dalat: {
    "grand-mercure": {
      name: "Khu nghỉ dưỡng Grand Mercure Đà Lạt (Mercure Đà Lạt cũ)",
      stars: 5,
      address: "03 Nguyễn Du, Phường 9, Đà Lạt",
      rating: 9.7,
      ratingLabel: "Tuyệt hảo",
      reviewCount: 523,
      priceFrom: 2150000,
      images: [
        "sources/hotels/dalat/grand-mercure/1.jpg",
        "sources/hotels/dalat/grand-mercure/2.jpg",
        "sources/hotels/dalat/grand-mercure/3.jpg",
        "sources/hotels/dalat/grand-mercure/4.jpg",
        "sources/hotels/dalat/grand-mercure/5.jpg",
        "sources/hotels/dalat/grand-mercure/6.jpg",
        "sources/hotels/dalat/grand-mercure/7.jpg",
        "sources/hotels/dalat/grand-mercure/8.jpg",
      ],
      intro:
        "Khu nghỉ dưỡng nằm giữa đồi thông, cách Hồ Xuân Hương vài phút đi xe. Phòng có ban công nhìn ra thung lũng, phù hợp cho cặp đôi và gia đình muốn nghỉ ngơi giữa không khí se lạnh của cao nguyên.",
      facts: [
        { icon: "login", label: "Nhận phòng", value: "Từ 14:00" },
        { icon: "logout", label: "Trả phòng", value: "Trước 12:00" },
        { icon: "meeting_room", label: "Số phòng", value: "120 phòng" },
        { icon: "layers", label: "Số tầng", value: "8 tầng" },
        { icon: "calendar_month", label: "Năm xây dựng", value: "2005" },
        { icon: "social_distance", label: "Cách trung tâm", value: "1,5 km" },
      ],
      amenities: [
        { icon: "wifi", label: "Wifi miễn phí" },
        { icon: "local_parking", label: "Bãi đỗ xe ô tô" },
        { icon: "free_breakfast", label: "Bữa sáng" },
        { icon: "pool", label: "Hồ bơi" },
        { icon: "spa", label: "Spa & massage" },
        { icon: "restaurant", label: "Nhà hàng" },
        { icon: "fireplace", label: "Lò sưởi / BBQ" },
        { icon: "landscape", label: "View thung lũng" },
        { icon: "local_taxi", label: "Đưa đón sân bay" },
        { icon: "room_service", label: "Lễ tân 24h" },
      ],
      rules: [
        "Thú cưng: không được phép mang vào khách sạn.",
        "Trẻ em dưới 6 tuổi ở miễn phí khi dùng giường có sẵn.",
        "Giờ yên tĩnh: 22:00 – 06:00.",
        "Hủy phòng miễn phí trước 3 ngày so với ngày nhận phòng.",
      ],
    },
  },

  vungtau: {
    /* Khách sạn mẫu — thay bằng dữ liệu thật của Vũng Tàu */
    "sample-vungtau": {
      name: "Khách sạn mẫu Vũng Tàu",
      stars: 4,
      address: "01 Thùy Vân, Phường Thắng Tam, Vũng Tàu",
      rating: 8.9,
      ratingLabel: "Rất tốt",
      reviewCount: 214,
      priceFrom: 1350000,
      images: [],
      intro:
        "Khách sạn sát biển Bãi Sau, phòng hướng biển, gần các quán hải sản và khu vui chơi. Phù hợp cho kỳ nghỉ cuối tuần cùng gia đình.",
      facts: [
        { icon: "login", label: "Nhận phòng", value: "Từ 14:00" },
        { icon: "logout", label: "Trả phòng", value: "Trước 12:00" },
        { icon: "meeting_room", label: "Số phòng", value: "80 phòng" },
        { icon: "waves", label: "Cách biển", value: "50 m" },
      ],
      amenities: [
        { icon: "wifi", label: "Wifi miễn phí" },
        { icon: "local_parking", label: "Bãi đỗ xe" },
        { icon: "free_breakfast", label: "Bữa sáng" },
        { icon: "pool", label: "Hồ bơi" },
        { icon: "waves", label: "View biển" },
      ],
      rules: [
        "Hủy phòng miễn phí trước 2 ngày.",
        "Không hút thuốc trong phòng.",
      ],
    },
  },
};
