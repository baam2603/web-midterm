/* =====================================================================
   DỮ LIỆU KHÁCH SẠN — thêm thành phố / khách sạn mới chỉ cần sửa file này.
   URL mở trang:  hotel.html?city=dalat&id=grand-mercure
   - images: đường dẫn ảnh (tối thiểu 6 ảnh để lấp đủ ô; thiếu thì hiện nền màu)
   - Dữ liệu bên dưới là DỮ LIỆU MẪU, hãy thay bằng thông tin thật.
   ===================================================================== */
const CITIES = {
  dalat: {
    name: "Đà Lạt",
    listHref: "destinations/dalat.html",
    theme: "dalat",
  },
  vungtau: {
    name: "Vũng Tàu",
    listHref: "destinations/vungtau.html",
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
      /* Địa điểm lân cận — hiển thị tối đa 4 dòng (khoảng cách tham khảo từ các trang đặt phòng) */
      nearby: [
        { icon: "museum", name: "Bảo tàng Lâm Đồng", distance: "800 m" },
        { icon: "train", name: "Ga Đà Lạt", distance: "1 km" },
        { icon: "water", name: "Hồ Xuân Hương", distance: "1,6 km" },
        { icon: "flight", name: "Sân bay Liên Khương", distance: "30 km" },
      ],
      /* Loại phòng — price: giá/đêm; oldPrice, left là tuỳ chọn */
      rooms: [
        {
          id: "superior",
          name: "Phòng Superior hướng vườn",
          image: "sources/hotels/dalat/grand-mercure/rooms/superior.jpg",
          area: 32,
          bed: "1 giường đôi hoặc 2 giường đơn",
          guests: 2,
          features: [
            { icon: "yard", label: "View vườn" },
            { icon: "shower", label: "Vòi tắm đứng" },
            { icon: "wifi", label: "Wifi miễn phí" },
          ],
          breakfast: false,
          refundable: false,
          price: 1850000,
          oldPrice: 2300000,
          left: 3,
        },
        {
          id: "deluxe",
          name: "Phòng Deluxe ban công thung lũng",
          image: "sources/hotels/dalat/grand-mercure/rooms/deluxe.jpg",
          area: 40,
          bed: "1 giường king",
          guests: 3,
          features: [
            { icon: "landscape", label: "View thung lũng" },
            { icon: "balcony", label: "Ban công riêng" },
            { icon: "bathtub", label: "Bồn tắm" },
            { icon: "wifi", label: "Wifi miễn phí" },
          ],
          breakfast: true,
          refundable: true,
          price: 2450000,
        },
        {
          id: "family-suite",
          name: "Suite gia đình có lò sưởi",
          image: "sources/hotels/dalat/grand-mercure/rooms/family-suite.jpg",
          area: 68,
          bed: "1 giường king + 2 giường đơn",
          guests: 5,
          features: [
            { icon: "fireplace", label: "Lò sưởi" },
            { icon: "weekend", label: "Phòng khách riêng" },
            { icon: "kitchen", label: "Bếp nhỏ" },
            { icon: "landscape", label: "View thung lũng" },
          ],
          breakfast: true,
          refundable: true,
          price: 4200000,
          oldPrice: 4800000,
          left: 1,
        },
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
      /* Dữ liệu mẫu — thay bằng khoảng cách thật */
      nearby: [
        { icon: "beach_access", name: "Bãi Sau", distance: "50 m" },
        { icon: "light_mode", name: "Hải đăng Vũng Tàu", distance: "6 km" },
        { icon: "church", name: "Tượng Chúa Kitô", distance: "7 km" },
        { icon: "restaurant", name: "Khu hải sản Bãi Trước", distance: "5 km" },
      ],
      rooms: [
        {
          id: "standard",
          name: "Phòng Standard hướng phố",
          image: "",
          area: 24,
          bed: "1 giường đôi",
          guests: 2,
          features: [
            { icon: "ac_unit", label: "Điều hòa" },
            { icon: "shower", label: "Vòi tắm đứng" },
            { icon: "wifi", label: "Wifi miễn phí" },
          ],
          breakfast: false,
          refundable: false,
          price: 1100000,
        },
        {
          id: "ocean-deluxe",
          name: "Phòng Deluxe view biển",
          image: "",
          area: 32,
          bed: "1 giường king",
          guests: 3,
          features: [
            { icon: "waves", label: "View biển" },
            { icon: "balcony", label: "Ban công" },
            { icon: "wifi", label: "Wifi miễn phí" },
          ],
          breakfast: true,
          refundable: true,
          price: 1650000,
          oldPrice: 1900000,
          left: 2,
        },
        {
          id: "family",
          name: "Phòng gia đình 2 phòng ngủ",
          image: "",
          area: 55,
          bed: "1 giường king + 2 giường đơn",
          guests: 5,
          features: [
            { icon: "waves", label: "View biển" },
            { icon: "kitchen", label: "Bếp nhỏ" },
            { icon: "bathtub", label: "Bồn tắm" },
          ],
          breakfast: true,
          refundable: true,
          price: 2800000,
        },
      ],
    },
  },
};