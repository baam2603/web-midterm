-- DỮ LIỆU KHÁCH SẠN THREEK DO NGƯỜI DÙNG CUNG CẤP
-- File riêng: database/real_hotels.sql. Bổ sung khách sạn tiếp theo vào file này.
-- Không bao gồm bộ 20 khách sạn trích từ danh sách iVIVU.
-- Chưa xác minh độc lập; thông tin thiếu được giữ NULL, không suy đoán.
-- Mã slug/phòng do ThreeK đặt; không dùng mã iVIVU.
-- CHỈ lưu bản nháp, chưa đưa vào hotels/room_types hoặc mở bán.
-- Import trong database threek_booking sau khi sao lưu.
-- Chạy lại cập nhật nội dung bản nháp cùng slug; không sửa tài khoản/đơn/dữ liệu đang bán.
SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS threek_hotel_data_drafts (
 hotel_slug varchar(80) NOT NULL PRIMARY KEY,
 payload longtext NOT NULL CHECK (JSON_VALID(payload)),
 updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
START TRANSACTION;

-- 01. CICILIA Rouge Dalat: ba loại phòng theo thông tin bổ sung của người dùng, tên hạng thực tế cần xác nhận.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('cicilia-rouge-dalat','{
  "slug": "cicilia-rouge-dalat",
  "name": "CICILIA Rouge Dalat",
  "city": "dalat",
  "type": "hotel",
  "address": "Số 15 Đường 3/4, Phường Xuân Hương (Phường 3 cũ), TP. Đà Lạt, Tỉnh Lâm Đồng",
  "contact_phone": "0263 3816 868",
  "stars": null,
  "latitude": 11.9335,
  "longitude": 108.4412,
  "description": "Khách sạn có thiết kế hiện đại, không gian sang trọng và vị trí thuận tiện di chuyển đến khu vực trung tâm Đà Lạt.",
  "nearby_notes": [
    "Ga Đà Lạt",
    "Chợ Đà Lạt",
    "Dinh 2",
    "Hồ Xuân Hương"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "external_rating_note": "Người dùng nêu điểm tham khảo khoảng 4.9/5; không nhập vào hạng sao hoặc bảng reviews.",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "standard",
      "name": "The Cosy Room",
      "source_name_candidates": "Standard / The Cosy Room",
      "actual_room_name": "The Cosy Room",
      "description": "Phòng có không gian ấm cúng, bố trí một giường Double.",
      "reported_features": [
        "TV màn hình phẳng",
        "Tủ để đồ",
        "Phòng tắm riêng",
        "Máy sấy tóc",
        "Đồ dùng cá nhân",
        "Wi-Fi"
      ],
      "reference_price_min_vnd": 900000,
      "reference_price_max_vnd": 1250000,
      "price_per_night": 1100000,
      "capacity": 3,
      "total_rooms": 10,
      "area_m2": null,
      "bed_type": "1 giường Double (1.6m x 2m)",
      "breakfast_included": true,
      "free_cancellation": true,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "images": [],
      "is_active": false,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "cancellation_free_before_days": 3,
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "unconfirmed_features": []
    },
    {
      "code": "midrange",
      "name": "Vintage Balcony Room",
      "source_name_candidates": "Vintage Balcony Room / Gallery City View",
      "actual_room_name": "Vintage Balcony Room",
      "description": "Phòng có ban công, bố trí một giường King.",
      "reported_features": [
        "TV thông minh",
        "Minibar",
        "Bàn ghế thư giãn"
      ],
      "reference_price_min_vnd": 1250000,
      "reference_price_max_vnd": 2000000,
      "price_per_night": 1650000,
      "capacity": 3,
      "total_rooms": 15,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m)",
      "breakfast_included": true,
      "free_cancellation": true,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy muộn tính phí 1 đêm.",
      "images": [],
      "is_active": false,
      "unconfirmed_features": [
        "Ban công riêng hoặc cửa sổ hướng thành phố",
        "Điều hòa hoặc hệ thống sưởi"
      ],
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "cancellation_free_before_days": 3,
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng."
    },
    {
      "code": "premium",
      "name": "Signature Suite",
      "source_name_candidates": "Signature City/Hill View hoặc Suite Panorama",
      "actual_room_name": "Signature Suite",
      "description": "Phòng Suite bố trí một giường King lớn.",
      "reported_features": [
        "Nội thất cao cấp"
      ],
      "reference_price_min_vnd": 2000000,
      "reference_price_max_vnd": null,
      "price_per_night": 2800000,
      "capacity": 3,
      "total_rooms": 5,
      "area_m2": null,
      "bed_type": "1 giường King lớn cao cấp",
      "breakfast_included": true,
      "free_cancellation": true,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày; hủy muộn tính phí 100% tiền lưu trú.",
      "images": [],
      "is_active": false,
      "unconfirmed_features": [
        "Không gian tiếp khách riêng",
        "Bồn tắm tùy hạng",
        "Đặc quyền đi kèm cần xác nhận"
      ],
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "cancellation_free_before_days": 5,
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng."
    }
  ],
  "missing_for_publication": [
    "Ảnh: người dùng sẽ bổ sung sau",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ và thông tin khách sạn trước khi công khai",
    "Đối chiếu cơ chế backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Hạng sao chính thức của khách sạn (khác điểm đánh giá)"
  ],
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "price_per_night": 1100000
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 02. MerPerle Dalat Hotel: dữ liệu người dùng, ba loại phòng theo thông tin bổ sung của người dùng.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('merperle-dalat-hotel','{
  "slug": "merperle-dalat-hotel",
  "name": "MerPerle Dalat Hotel",
  "city": "dalat",
  "type": "hotel",
  "address": "Số 1 Đường Hùng Vương, Phường 10, Thành phố Đà Lạt, Tỉnh Lâm Đồng",
  "contact_phone": "0263 3553 789",
  "stars": 5,
  "latitude": 11.9421,
  "longitude": 108.455,
  "description": "Khách sạn với kiến trúc châu Âu tân cổ điển trên đường Hùng Vương, thuận tiện di chuyển đến khu vực trung tâm Đà Lạt.",
  "nearby_notes": [
    "Ga Đà Lạt",
    "Chùa Linh Phước (Chùa Ve Chai)",
    "Vườn hoa thành phố"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "external_rating_note": "Người dùng nêu điểm tham khảo khoảng 4.9/5; không nhập vào bảng reviews. Hạng 5 sao theo thông tin người dùng cung cấp.",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "deluxe",
      "name": "Deluxe Room",
      "source_name_candidates": "Deluxe Room",
      "actual_room_name": "Deluxe Room",
      "description": "Phòng Deluxe có lựa chọn giường King hoặc hai giường Twin.",
      "reported_features": [
        "TV thông minh",
        "Bàn làm việc",
        "Két an toàn",
        "Minibar",
        "Tủ quần áo",
        "Phòng tắm riêng",
        "Vòi sen đứng",
        "Đồ dùng cá nhân"
      ],
      "unconfirmed_features": [],
      "reference_price_min_vnd": 1500000,
      "reference_price_max_vnd": 2200000,
      "price_per_night": 1800000,
      "capacity": 2,
      "total_rooms": 20,
      "area_m2": null,
      "bed_type": "1 giường King hoặc 2 giường Twin",
      "breakfast_included": true,
      "free_cancellation": true,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày; hủy muộn tính phí đêm đầu tiên.",
      "images": [],
      "is_active": false,
      "max_adults": 2,
      "max_children": 0,
      "child_age_limit_exclusive": null,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "cancellation_free_before_days": 5,
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng."
    },
    {
      "code": "midrange",
      "name": "Premier City View Room",
      "source_name_candidates": "Premier / Deluxe City View hoặc Executive Room",
      "actual_room_name": "Premier City View Room",
      "description": "Phòng Premier hướng thành phố, bố trí một giường King.",
      "reported_features": [
        "Internet",
        "Trà/cà phê"
      ],
      "unconfirmed_features": [
        "Điều hòa hoặc sưởi",
        "Sofa nhỏ hoặc bàn trà",
        "Bồn tắm hoặc khu tắm đứng tùy hạng"
      ],
      "reference_price_min_vnd": 2300000,
      "reference_price_max_vnd": 3800000,
      "price_per_night": 2850000,
      "capacity": 3,
      "total_rooms": 25,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m)",
      "breakfast_included": true,
      "free_cancellation": true,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày; hủy muộn tính phí đêm đầu tiên.",
      "images": [],
      "is_active": false,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "cancellation_free_before_days": 5,
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng."
    },
    {
      "code": "suite",
      "name": "MerPerle Suite",
      "source_name_candidates": "Suite / President Suite hoặc Royal Suite",
      "actual_room_name": "MerPerle Suite",
      "description": "Phòng Suite bố trí một giường Super King.",
      "reported_features": [
        "Nội thất cao cấp"
      ],
      "unconfirmed_features": [
        "Phòng ngủ/phòng khách riêng",
        "Vật liệu nội thất",
        "Bồn tắm hướng cảnh quan",
        "Check-in riêng và đặc quyền cần xác nhận"
      ],
      "reference_price_min_vnd": 4500000,
      "reference_price_max_vnd": null,
      "price_per_night": 5200000,
      "capacity": 4,
      "total_rooms": 8,
      "area_m2": null,
      "bed_type": "1 giường Super King size",
      "breakfast_included": true,
      "free_cancellation": true,
      "cancellation_policy": "Miễn phí hủy trước 7 ngày; không hoàn tiền nếu hủy muộn.",
      "images": [],
      "is_active": false,
      "reference_price_note": "Người dùng cung cấp mức từ 4.500.000 đến hơn 10.000.000 VNĐ/đêm tùy Suite; không có mức trần xác định.",
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "cancellation_free_before_days": 7,
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng."
    }
  ],
  "missing_for_publication": [
    "Ảnh: người dùng sẽ bổ sung sau",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ và thông tin khách sạn trước khi công khai",
    "Đối chiếu cơ chế backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng"
  ],
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "price_per_night": 1800000
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 03. Best Western Premier Imperial Đà Lạt: ba loại phòng theo thông tin bổ sung của người dùng.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('best-western-premier-imperial-dalat','{
  "slug": "best-western-premier-imperial-dalat",
  "name": "Best Western Premier Imperial Đà Lạt",
  "city": "dalat",
  "type": "hotel",
  "address": "Số 57 - 59 Đường Hùng Vương, Phường Lâm Viên (Phường 10), TP. Đà Lạt, Lâm Đồng",
  "contact_phone": "0263 3626 626 / 0263 7633 333",
  "contact_phones": [
    "0263 3626 626",
    "0263 7633 333"
  ],
  "stars": 5,
  "latitude": 11.9432,
  "longitude": 108.4568,
  "description": "Khách sạn trên đường Hùng Vương với kiến trúc châu Âu cổ điển kết hợp hiện đại, không gian sang trọng và vị trí thuận tiện tham quan Đà Lạt.",
  "nearby_notes": [
    "Ga Đà Lạt",
    "Quảng trường Lâm Viên",
    "Chùa Linh Phước"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "external_rating_note": "Người dùng nêu điểm tham khảo khoảng 4.7–4.8/5; không nhập vào bảng reviews. Hạng 5 sao theo thông tin người dùng cung cấp.",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "deluxe",
      "name": "Superior Room",
      "source_name_candidates": "Deluxe Room",
      "actual_room_name": "Superior Room",
      "description": "Phòng Superior có lựa chọn giường đôi hoặc hai giường đơn.",
      "reported_features": [
        "TV truyền hình vệ tinh",
        "Bàn làm việc",
        "Két an toàn",
        "Minibar",
        "Trà/cà phê",
        "Vòi sen đứng",
        "Áo choàng tắm"
      ],
      "unconfirmed_features": [],
      "reference_price_min_vnd": 1800000,
      "reference_price_max_vnd": 2500000,
      "price_per_night": 2100000,
      "capacity": 2,
      "total_rooms": 15,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m) hoặc 2 giường đơn",
      "breakfast_included": true,
      "free_cancellation": true,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy trong vòng 3 ngày tính phí đêm đầu tiên.",
      "images": [],
      "is_active": false,
      "max_adults": 2,
      "max_children": 0,
      "child_age_limit_exclusive": null,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "cancellation_free_before_days": 3,
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng."
    },
    {
      "code": "midrange",
      "name": "Executive Room",
      "source_name_candidates": "Premier / Executive Room hoặc Deluxe City/Garden View",
      "actual_room_name": "Executive Room",
      "description": "Phòng Executive bố trí một giường King cỡ lớn.",
      "reported_features": [
        "Nội thất cao cấp",
        "Internet"
      ],
      "unconfirmed_features": [
        "Cửa sổ lớn hoặc ban công nhỏ",
        "Điều hòa hoặc sưởi",
        "Bồn tắm hoặc buồng tắm đứng tùy hạng"
      ],
      "reference_price_min_vnd": 2600000,
      "reference_price_max_vnd": 4200000,
      "price_per_night": 3500000,
      "capacity": 3,
      "total_rooms": 20,
      "area_m2": null,
      "bed_type": "1 giường King cỡ lớn",
      "breakfast_included": true,
      "free_cancellation": true,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày; hủy muộn tính phí 1 đêm.",
      "images": [],
      "is_active": false,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "cancellation_free_before_days": 5,
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng."
    },
    {
      "code": "suite",
      "name": "Presidential Suite",
      "source_name_candidates": "Suite Room / Presidential Suite",
      "actual_room_name": "Presidential Suite",
      "description": "Phòng Suite bố trí một giường King và sofa bed.",
      "reported_features": [
        "Nội thất cao cấp"
      ],
      "unconfirmed_features": [
        "Phòng khách/phòng ngủ riêng",
        "Hướng nhìn Panorama",
        "Bồn tắm hướng cảnh quan",
        "Dịch vụ phòng ưu tiên, check-in riêng và đặc quyền cần xác nhận"
      ],
      "reference_price_min_vnd": 5000000,
      "reference_price_max_vnd": null,
      "price_per_night": 7500000,
      "capacity": 4,
      "total_rooms": 4,
      "area_m2": null,
      "bed_type": "1 giường King thượng hạng + Sofa bed",
      "breakfast_included": true,
      "free_cancellation": null,
      "cancellation_policy": "Chưa chọn: không hoàn hủy (Non-refundable) hoặc linh hoạt trước 7 ngày.",
      "images": [],
      "is_active": false,
      "reference_price_note": "Người dùng cung cấp mức từ 5.000.000 đến hơn 12.000.000 VNĐ/đêm tùy Suite; không có mức trần xác định.",
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "cancellation_free_before_days": null,
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng."
    }
  ],
  "missing_for_publication": [
    "Ảnh: người dùng sẽ bổ sung sau",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ và thông tin khách sạn trước khi công khai",
    "Đối chiếu cơ chế backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Chọn một chính sách áp dụng cho Presidential Suite: không hoàn hủy hay linh hoạt trước 7 ngày"
  ],
  "checkin_time": "15:00:00",
  "checkout_time": "12:00:00",
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "price_per_night": 2100000
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 04. Hôtel Colline Đà Lạt: ba loại phòng theo thông tin bổ sung của người dùng.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('hotel-colline-dalat','{
  "slug": "hotel-colline-dalat",
  "name": "Hôtel Colline Đà Lạt",
  "city": "dalat",
  "type": "hotel",
  "address": "Số 10 Phan Bội Châu, Phường 1, Thành phố Đà Lạt, Tỉnh Lâm Đồng",
  "contact_phone": "0263 3665 588",
  "stars": 4,
  "latitude": 11.9423,
  "longitude": 108.4385,
  "description": "Khách sạn có thiết kế hiện đại với gam màu nâu trầm và trắng ấm áp, nằm gần chợ Đà Lạt, thuận tiện mua sắm, thưởng thức ẩm thực và đi dạo khu vực trung tâm.",
  "nearby_notes": [
    "Chợ Đà Lạt",
    "Trung tâm thương mại",
    "Hồ Xuân Hương"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "external_rating_note": "Người dùng nêu điểm tham khảo khoảng 4.5/5; không nhập vào bảng reviews. Hạng 4 sao theo thông tin người dùng cung cấp.",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "superior",
      "name": "Superior Room",
      "source_name_candidates": "Superior Room",
      "actual_room_name": "Superior Room",
      "description": "Phòng Superior có lựa chọn giường đôi hoặc hai giường đơn.",
      "reported_features": [
        "TV màn hình phẳng",
        "Két an toàn",
        "Minibar",
        "Trà/cà phê",
        "Phòng tắm riêng",
        "Vòi sen đứng",
        "Máy sấy tóc"
      ],
      "unconfirmed_features": [
        "Điều hòa hoặc sưởi",
        "Không có cửa sổ hướng ngoài trời hoặc cửa sổ hướng nội bộ; cần xác nhận"
      ],
      "reference_price_min_vnd": 1200000,
      "reference_price_max_vnd": 1800000,
      "price_per_night": 1450000,
      "capacity": 2,
      "total_rooms": 30,
      "area_m2": null,
      "bed_type": "1 giường Double (1.5m) hoặc 2 giường Twin",
      "breakfast_included": true,
      "free_cancellation": true,
      "cancellation_policy": "Miễn phí hủy trước 2 ngày; hủy muộn tính phí đêm đầu tiên.",
      "images": [],
      "is_active": false,
      "max_adults": 2,
      "max_children": 0,
      "child_age_limit_exclusive": null,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "cancellation_free_before_days": 2,
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng."
    },
    {
      "code": "midrange",
      "name": "Deluxe City View Room",
      "source_name_candidates": "Deluxe Room / Premier City View",
      "actual_room_name": "Deluxe City View Room",
      "description": "Phòng Deluxe hướng thành phố, có lựa chọn giường King hoặc hai giường đơn.",
      "reported_features": [
        "TV thông minh",
        "Minibar",
        "Trà/cà phê",
        "Vòi sen",
        "Đồ dùng cá nhân"
      ],
      "unconfirmed_features": [
        "Bàn làm việc hoặc sofa nhỏ"
      ],
      "reference_price_min_vnd": 1800000,
      "reference_price_max_vnd": 2800000,
      "price_per_night": 2200000,
      "capacity": 3,
      "total_rooms": 40,
      "area_m2": null,
      "bed_type": "1 giường King hoặc 2 giường đơn",
      "breakfast_included": true,
      "free_cancellation": true,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy muộn tính phí đêm đầu tiên.",
      "images": [],
      "is_active": false,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "cancellation_free_before_days": 3,
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng."
    },
    {
      "code": "suite",
      "name": "Studio Suite",
      "source_name_candidates": "Studio Suite / Signature Suite / Family Suite",
      "actual_room_name": "Studio Suite",
      "description": "Phòng Studio Suite bố trí một giường King và khu vực tiếp khách.",
      "reported_features": [
        "Nội thất cao cấp"
      ],
      "unconfirmed_features": [
        "Phòng khách riêng hoặc không gian mở",
        "Hướng thành phố hoặc đồi thông",
        "Bồn tắm tùy hạng",
        "Dịch vụ ưu tiên và đặc quyền cần xác nhận"
      ],
      "reference_price_min_vnd": 3200000,
      "reference_price_max_vnd": null,
      "price_per_night": 3900000,
      "capacity": 4,
      "total_rooms": 10,
      "area_m2": null,
      "bed_type": "1 giường King rộng rãi + khu vực tiếp khách (không mặc định là giường phụ)",
      "breakfast_included": true,
      "free_cancellation": true,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày; hủy muộn tính phí toàn bộ thời gian lưu trú.",
      "images": [],
      "is_active": false,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "reference_price_note": "Người dùng cung cấp mức từ 3.200.000 đến hơn 6.000.000 VNĐ/đêm tùy thời điểm và Suite; không có mức trần xác định.",
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "cancellation_free_before_days": 5,
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng."
    }
  ],
  "missing_for_publication": [
    "Ảnh: người dùng sẽ bổ sung sau",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ và thông tin khách sạn trước khi công khai",
    "Đối chiếu cơ chế backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng"
  ],
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "price_per_night": 1450000
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

COMMIT;
