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
  "stars": 4,
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
      "cancellation_policy": "Miễn phí hủy trước 5 ngày. Hủy muộn/no-show: ngày thường với phòng tiêu chuẩn tính 100% đêm đầu; cao điểm, Lễ/Tết hoặc hạng đặc biệt/Penthouse tính 100% toàn bộ kỳ nghỉ. Lịch và phân loại hạng đặc biệt cần chốt.",
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
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "cancellation_fee_rules": {
        "scope": "late_cancellation_or_no_show",
        "ordinary_standard": {
          "basis": "first_night",
          "percent": 100
        },
        "peak_holiday_or_special": {
          "basis": "entire_stay",
          "percent": 100
        },
        "peak_dates": null,
        "special_room_classification_confirmed": false,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Ảnh: người dùng sẽ bổ sung sau",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ và thông tin khách sạn trước khi công khai",
    "Đối chiếu cơ chế backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch cao điểm/Lễ/Tết và danh sách hạng đặc biệt áp dụng phí toàn kỳ nghỉ"
  ],
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "price_per_night": 1100000,
  "star_rating_note": "Hạng 4 sao theo xác nhận bổ sung của người dùng; chưa xác minh độc lập."
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
  "external_rating_note": "Người dùng nêu điểm tham khảo khoảng 4.7–4.8/5; không nhập vào bảng reviews.",
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
      "free_cancellation": false,
      "cancellation_policy": "Không hoàn hủy (Non-refundable). Không áp dụng hủy miễn phí.",
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
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "deposit_required": true,
      "deposit_policy_note": "Đặt cọc bảo đảm 100% giá trị tiền phòng, thanh toán đủ trong 24 giờ từ xác nhận giữ phòng. Người dùng đồng thời nêu ngay tại thời điểm xác nhận; cần phân biệt giữ chỗ chờ thanh toán và xác nhận bảo đảm.",
      "deposit_percent": 100,
      "deposit_basis": "room_total",
      "deposit_payment_deadline_hours": 24,
      "deposit_deadline_anchor": "booking_hold_confirmation",
      "deposit_ready_for_automatic_collection": false
    }
  ],
  "missing_for_publication": [
    "Ảnh: người dùng sẽ bổ sung sau",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ và thông tin khách sạn trước khi công khai",
    "Đối chiếu cơ chế backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Chốt trạng thái giữ chỗ/xác nhận bảo đảm, cách thanh toán và xử lý hết hạn 24 giờ; không tự kích hoạt thu cọc"
  ],
  "checkin_time": "15:00:00",
  "checkout_time": "12:00:00",
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "price_per_night": 2100000,
  "star_rating_note": "Hạng 5 sao theo xác nhận bổ sung của người dùng; chưa xác minh độc lập."
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

-- 05. Swiss-Belresort Tuyền Lâm - Đà Lạt: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('swiss-belresort-tuyen-lam-dalat','{
  "slug": "swiss-belresort-tuyen-lam-dalat",
  "name": "Swiss-Belresort Tuyền Lâm - Đà Lạt",
  "city": "dalat",
  "type": "resort",
  "address": "Phân khu chức năng 7.8, Khu du lịch Hồ Tuyền Lâm, Phường 3, Thành phố Đà Lạt, Tỉnh Lâm Đồng",
  "contact_phone": null,
  "stars": 5,
  "latitude": 11.8985,
  "longitude": 108.4282,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 1950000,
  "description": "Khu nghỉ dưỡng trong không gian thiên nhiên xanh mát thuộc Khu du lịch Hồ Tuyền Lâm, Đà Lạt.",
  "nearby_notes": [
    "Khu du lịch Hồ Tuyền Lâm"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "deluxe-golf-view",
      "name": "Deluxe Golf View",
      "source_name_candidates": "Deluxe Golf View",
      "actual_room_name": "Deluxe Golf View",
      "description": "Phòng Deluxe hướng sân golf, có lựa chọn giường King hoặc hai giường Twin.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1950000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 25,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m) hoặc 2 giường Twin",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng tiêu chuẩn quốc tế theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "grand-deluxe-mountain-view",
      "name": "Grand Deluxe Mountain View",
      "source_name_candidates": "Grand Deluxe Mountain View",
      "actual_room_name": "Grand Deluxe Mountain View",
      "description": "Phòng Grand Deluxe hướng núi, bố trí một giường King lớn.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 2850000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 30,
      "area_m2": null,
      "bed_type": "1 giường King lớn cao cấp",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng tiêu chuẩn quốc tế theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "premium-suite",
      "name": "Penthouse",
      "source_name_candidates": "Penthouse / Presidential Suite",
      "actual_room_name": "Penthouse",
      "description": "Phòng Penthouse có một giường King và khu vực phòng khách riêng.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 6200000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 6,
      "area_m2": null,
      "bed_type": "1 giường King thượng hạng; khu vực phòng khách riêng không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng tiêu chuẩn quốc tế theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 7,
      "cancellation_policy": "Miễn phí hủy trước 7 ngày; không hoàn tiền nếu hủy muộn.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Tên phòng theo xác nhận bổ sung của người dùng; mã ThreeK giữ nguyên để không mất liên kết bản nháp."
    }
  ],
  "missing_for_publication": [
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ và thông tin khách sạn trước khi công khai",
    "Đối chiếu cơ chế backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng"
  ],
  "star_rating_note": "Hạng 5 sao theo xác nhận bổ sung của người dùng; chưa xác minh độc lập.",
  "address_note": "Địa chỉ/phường theo xác nhận bổ sung của người dùng; chưa xác minh độc lập địa giới hành chính hiện hành."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 06. New Life Hotel Đà Lạt: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('new-life-hotel-dalat','{
  "slug": "new-life-hotel-dalat",
  "name": "New Life Hotel Đà Lạt",
  "city": "dalat",
  "type": "hotel",
  "address": "Số 6 Đường Đống Đa, Phường 3, Thành phố Đà Lạt, Tỉnh Lâm Đồng",
  "contact_phone": null,
  "stars": 3,
  "latitude": 11.9284,
  "longitude": 108.4351,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 850000,
  "description": "Khách sạn trên đồi Đống Đa, có tầm nhìn bao quát thung lũng và cửa ngõ vào thành phố theo thông tin người dùng cung cấp.",
  "nearby_notes": [
    "Đồi Đống Đa"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "superior",
      "name": "Superior Room",
      "source_name_candidates": "Superior Room",
      "actual_room_name": "Superior Room",
      "description": "Phòng Superior có lựa chọn một giường Double hoặc hai giường Twin.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 850000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 15,
      "area_m2": null,
      "bed_type": "1 giường Double (1.5m x 2m) hoặc 2 giường Twin",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 2,
      "cancellation_policy": "Miễn phí hủy trước 2 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "deluxe-valley-view",
      "name": "Deluxe Valley View Room",
      "source_name_candidates": "Deluxe Valley View Room",
      "actual_room_name": "Deluxe Valley View Room",
      "description": "Phòng Deluxe hướng thung lũng, bố trí một giường King.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1350000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 20,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m)",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "premium-suite",
      "name": "Suite Family",
      "source_name_candidates": "Suite Family / VIP Room",
      "actual_room_name": "Suite Family",
      "description": "Phòng Suite Family bố trí một giường King lớn và khu vực ghế sofa thư giãn.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 2500000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 5,
      "area_m2": null,
      "bed_type": "1 giường King lớn; khu vực ghế sofa thư giãn không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày. Hủy muộn/no-show: ngày thường với phòng tiêu chuẩn tính 100% đêm đầu; cao điểm, Lễ/Tết hoặc hạng đặc biệt/Penthouse tính 100% toàn bộ kỳ nghỉ. Lịch và phân loại hạng đặc biệt cần chốt.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Tên phòng theo xác nhận bổ sung của người dùng; mã ThreeK giữ nguyên để không mất liên kết bản nháp.",
      "cancellation_fee_rules": {
        "scope": "late_cancellation_or_no_show",
        "ordinary_standard": {
          "basis": "first_night",
          "percent": 100
        },
        "peak_holiday_or_special": {
          "basis": "entire_stay",
          "percent": 100
        },
        "peak_dates": null,
        "special_room_classification_confirmed": false,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ và thông tin khách sạn trước khi công khai",
    "Đối chiếu cơ chế backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch cao điểm/Lễ/Tết và danh sách hạng đặc biệt áp dụng phí toàn kỳ nghỉ"
  ],
  "star_rating_note": "Hạng 3 sao theo xác nhận bổ sung của người dùng; chưa xác minh độc lập."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 07. Khách sạn Ngọc Phát Đà Lạt: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('ngoc-phat-dalat','{
  "slug": "ngoc-phat-dalat",
  "name": "Khách sạn Ngọc Phát Đà Lạt",
  "city": "dalat",
  "type": "hotel",
  "address": "Số 10 Đường Hồ Tùng Mậu, Phường 1, Thành phố Đà Lạt, Tỉnh Lâm Đồng",
  "address_note": "Địa chỉ/phường theo xác nhận bổ sung của người dùng; chưa xác minh độc lập địa giới hành chính hiện hành.",
  "contact_phone": null,
  "stars": 4,
  "latitude": 11.9405,
  "longitude": 108.4388,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 1250000,
  "description": "Khách sạn tại đường Hồ Tùng Mậu, gần khu vực Hồ Xuân Hương và Quảng trường Lâm Viên theo thông tin người dùng cung cấp.",
  "nearby_notes": [
    "Hồ Xuân Hương",
    "Quảng trường Lâm Viên"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "superior-view",
      "name": "Superior Lake View",
      "source_name_candidates": "Superior Lake / City View",
      "actual_room_name": "Superior Lake View",
      "description": "Phòng Superior hướng hồ, có lựa chọn một giường Double hoặc hai giường Twin.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1250000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 25,
      "area_m2": null,
      "bed_type": "1 giường Double hoặc 2 giường Twin",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Người dùng xác nhận giữ hạng cơ bản và giá 1.250.000 VNĐ; phòng trung cấp vẫn là Deluxe Park View giá 1.850.000 VNĐ."
    },
    {
      "code": "deluxe-park-view",
      "name": "Deluxe Park View",
      "source_name_candidates": "Deluxe Park View",
      "actual_room_name": "Deluxe Park View",
      "description": "Phòng Deluxe hướng công viên, bố trí một giường King.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1850000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 35,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m)",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "premium-suite",
      "name": "Suite",
      "source_name_candidates": "Suite / VIP Room",
      "actual_room_name": "Suite",
      "description": "Phòng Suite có một giường King lớn và khu vực tiếp khách riêng.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 3400000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 8,
      "area_m2": null,
      "bed_type": "1 giường King lớn; khu vực tiếp khách riêng không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày. Hủy muộn/no-show: ngày thường với phòng tiêu chuẩn tính 100% đêm đầu; cao điểm, Lễ/Tết hoặc hạng đặc biệt/Penthouse tính 100% toàn bộ kỳ nghỉ. Lịch và phân loại hạng đặc biệt cần chốt.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Tên phòng theo xác nhận bổ sung của người dùng; mã ThreeK giữ nguyên để không mất liên kết bản nháp.",
      "cancellation_fee_rules": {
        "scope": "late_cancellation_or_no_show",
        "ordinary_standard": {
          "basis": "first_night",
          "percent": 100
        },
        "peak_holiday_or_special": {
          "basis": "entire_stay",
          "percent": 100
        },
        "peak_dates": null,
        "special_room_classification_confirmed": false,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ và thông tin khách sạn trước khi công khai",
    "Đối chiếu cơ chế backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch cao điểm/Lễ/Tết và danh sách hạng đặc biệt áp dụng phí toàn kỳ nghỉ"
  ],
  "star_rating_note": "Hạng 4 sao theo xác nhận bổ sung của người dùng; chưa xác minh độc lập."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 08. Khách sạn Golden Sun Đà Lạt: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('golden-sun-dalat','{
  "slug": "golden-sun-dalat",
  "name": "Khách sạn Golden Sun Đà Lạt",
  "city": "dalat",
  "type": "hotel",
  "address": "Số 1 Đường Bà Huyện Thanh Quan, Phường 10, Thành phố Đà Lạt, Tỉnh Lâm Đồng",
  "contact_phone": null,
  "stars": 3,
  "latitude": 11.9412,
  "longitude": 108.4485,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 950000,
  "description": "Khách sạn gần khu vực trung tâm Đà Lạt, thuận tiện di chuyển đến Hồ Xuân Hương và Quảng trường Lâm Viên theo thông tin người dùng cung cấp.",
  "nearby_notes": [
    "Hồ Xuân Hương",
    "Quảng trường Lâm Viên"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "standard-double",
      "name": "Standard Double Room",
      "source_name_candidates": "Standard Double Room",
      "actual_room_name": "Standard Double Room",
      "description": "Phòng Standard bố trí một giường Double.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 950000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 12,
      "area_m2": null,
      "bed_type": "1 giường Double (1.5m x 2m)",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 2,
      "cancellation_policy": "Miễn phí hủy trước 2 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "deluxe-balcony",
      "name": "Deluxe Balcony Room",
      "source_name_candidates": "Deluxe Balcony Room",
      "actual_room_name": "Deluxe Balcony Room",
      "description": "Phòng Deluxe có ban công, bố trí một giường King.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1450000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 18,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m)",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "premium-suite",
      "name": "Family Suite",
      "source_name_candidates": "Family Suite / VIP Room",
      "actual_room_name": "Family Suite",
      "description": "Phòng Family Suite có một giường King lớn và khu vực ghế sofa thư giãn.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 2650000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 4,
      "area_m2": null,
      "bed_type": "1 giường King lớn; khu vực ghế sofa thư giãn không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày. Hủy muộn/no-show: ngày thường với phòng tiêu chuẩn tính 100% đêm đầu; cao điểm, Lễ/Tết hoặc hạng đặc biệt/Penthouse tính 100% toàn bộ kỳ nghỉ. Lịch và phân loại hạng đặc biệt cần chốt.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Tên phòng theo xác nhận bổ sung của người dùng; mã ThreeK giữ nguyên để không mất liên kết bản nháp.",
      "cancellation_fee_rules": {
        "scope": "late_cancellation_or_no_show",
        "ordinary_standard": {
          "basis": "first_night",
          "percent": 100
        },
        "peak_holiday_or_special": {
          "basis": "entire_stay",
          "percent": 100
        },
        "peak_dates": null,
        "special_room_classification_confirmed": false,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ và thông tin khách sạn trước khi công khai",
    "Đối chiếu cơ chế backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch cao điểm/Lễ/Tết và danh sách hạng đặc biệt áp dụng phí toàn kỳ nghỉ"
  ],
  "star_rating_note": "Hạng 3 sao theo xác nhận bổ sung của người dùng; chưa xác minh độc lập."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 09. Khách sạn Len's Đà Lạt: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('lens-dalat','{
  "slug": "lens-dalat",
  "name": "Khách sạn Len''s Đà Lạt",
  "city": "dalat",
  "type": "hotel",
  "address": "Số 113 Đường Bùi Thị Xuân, Phường 2, Thành phố Đà Lạt, Tỉnh Lâm Đồng",
  "contact_phone": null,
  "stars": 4,
  "latitude": 11.9472,
  "longitude": 108.4361,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 1050000,
  "description": "Khách sạn trên đường Bùi Thị Xuân, gần khu vực trung tâm Hòa Bình và chợ đêm Đà Lạt, thuận tiện di chuyển và mua sắm theo thông tin người dùng cung cấp.",
  "nearby_notes": [
    "Trung tâm Hòa Bình",
    "Chợ đêm Đà Lạt"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "standard",
      "name": "Standard Room",
      "source_name_candidates": "Standard Room",
      "actual_room_name": "Standard Room",
      "description": "Phòng Standard bố trí một giường Double.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1050000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 15,
      "area_m2": null,
      "bed_type": "1 giường Double (1.5m x 2m)",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 2,
      "cancellation_policy": "Miễn phí hủy trước 2 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "superior-city-view",
      "name": "Superior City View",
      "source_name_candidates": "Superior City View",
      "actual_room_name": "Superior City View",
      "description": "Phòng Superior hướng thành phố, có lựa chọn giường King hoặc hai giường Twin.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1550000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 25,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m) hoặc 2 giường Twin",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "executive-suite",
      "name": "Executive Suite",
      "source_name_candidates": "Executive Suite",
      "actual_room_name": "Executive Suite",
      "description": "Phòng Executive Suite bố trí một giường King lớn và khu vực ghế sofa thư giãn.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 2950000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 6,
      "area_m2": null,
      "bed_type": "1 giường King lớn cao cấp; khu vực ghế sofa thư giãn không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày. Hủy muộn/no-show: ngày thường với phòng tiêu chuẩn tính 100% đêm đầu; cao điểm, Lễ/Tết hoặc hạng đặc biệt/Penthouse tính 100% toàn bộ kỳ nghỉ. Lịch và phân loại hạng đặc biệt cần chốt.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "cancellation_fee_rules": {
        "scope": "late_cancellation_or_no_show",
        "ordinary_standard": {
          "basis": "first_night",
          "percent": 100
        },
        "peak_holiday_or_special": {
          "basis": "entire_stay",
          "percent": 100
        },
        "peak_dates": null,
        "special_room_classification_confirmed": false,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ và thông tin khách sạn trước khi công khai",
    "Đối chiếu cơ chế backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch cao điểm/Lễ/Tết và danh sách hạng đặc biệt áp dụng phí toàn kỳ nghỉ"
  ],
  "star_rating_note": "Hạng 4 sao theo người dùng cung cấp; chưa xác minh độc lập."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 10. Khách sạn Olive Đà Lạt: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('olive-dalat','{
  "slug": "olive-dalat",
  "name": "Khách sạn Olive Đà Lạt",
  "city": "dalat",
  "type": "hotel",
  "address": "Số 6B Đường Đống Đa, Phường 3, Thành phố Đà Lạt, Tỉnh Lâm Đồng",
  "contact_phone": null,
  "stars": 3,
  "latitude": 11.9281,
  "longitude": 108.4355,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 900000,
  "description": "Khách sạn trên đồi Đống Đa, có tầm nhìn thoáng về thung lũng và cửa ngõ thành phố theo thông tin người dùng cung cấp.",
  "nearby_notes": [
    "Đồi Đống Đa",
    "Khu vực cửa ngõ thành phố"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "standard-double",
      "name": "Standard Double Room",
      "source_name_candidates": "Standard Double Room",
      "actual_room_name": "Standard Double Room",
      "description": "Phòng Standard bố trí một giường Double.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 900000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 10,
      "area_m2": null,
      "bed_type": "1 giường Double (1.5m x 2m)",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 2,
      "cancellation_policy": "Miễn phí hủy trước 2 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "deluxe-valley-view",
      "name": "Deluxe Valley View Room",
      "source_name_candidates": "Deluxe Valley View Room",
      "actual_room_name": "Deluxe Valley View Room",
      "description": "Phòng Deluxe hướng thung lũng, bố trí một giường King.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1400000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 20,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m)",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "suite-panorama-view",
      "name": "Suite Panorama View",
      "source_name_candidates": "Suite Panorama View",
      "actual_room_name": "Suite Panorama View",
      "description": "Phòng Suite có hướng nhìn toàn cảnh, bố trí một giường King lớn và khu vực ghế sofa thư giãn.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 2600000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 5,
      "area_m2": null,
      "bed_type": "1 giường King lớn cao cấp; khu vực ghế sofa thư giãn không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày. Hủy muộn/no-show: ngày thường với phòng tiêu chuẩn tính 100% đêm đầu; cao điểm, Lễ/Tết hoặc hạng đặc biệt/Penthouse tính 100% toàn bộ kỳ nghỉ. Lịch và phân loại hạng đặc biệt cần chốt.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "cancellation_fee_rules": {
        "scope": "late_cancellation_or_no_show",
        "ordinary_standard": {
          "basis": "first_night",
          "percent": 100
        },
        "peak_holiday_or_special": {
          "basis": "entire_stay",
          "percent": 100
        },
        "peak_dates": null,
        "special_room_classification_confirmed": false,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ và thông tin khách sạn trước khi công khai",
    "Đối chiếu cơ chế backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Đối chiếu địa chỉ/phường chính thức",
    "Lịch cao điểm/Lễ/Tết và danh sách hạng đặc biệt áp dụng phí toàn kỳ nghỉ"
  ],
  "star_rating_note": "Hạng 3 sao theo người dùng cung cấp; chưa xác minh độc lập.",
  "address_note": "Người dùng ghi khu vực Xuân Hương / đèo Prenn; cần đối chiếu phường chính thức trước khi công khai."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 11. The Imperial Hotel Vũng Tàu: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('the-imperial-hotel-vung-tau','{
  "slug": "the-imperial-hotel-vung-tau",
  "name": "The Imperial Hotel Vũng Tàu",
  "city": "vungtau",
  "type": "hotel",
  "address": "Số 159 Đường Thùy Vân, Phường Thắng Tam, Thành phố Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu",
  "contact_phone": null,
  "stars": 5,
  "latitude": 10.3458,
  "longitude": 107.0852,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "15:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 2500000,
  "description": "Khách sạn mang phong cách kiến trúc châu Âu cổ điển tại khu vực Bãi Sau. Theo thông tin người dùng, khách sạn có lối đi riêng ra biển và cầu vượt kết nối khu phức hợp giải trí biển.",
  "nearby_notes": [
    "Bãi Sau"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "deluxe",
      "name": "Deluxe King / Twin",
      "source_name_candidates": "Deluxe King / Twin",
      "actual_room_name": "Deluxe King / Twin",
      "description": "Phòng Deluxe có lựa chọn giường King hoặc hai giường Twin.",
      "reported_features": [],
      "unconfirmed_features": [
        "Xác nhận King/Twin là lựa chọn giường chung một hạng hay hai hạng có tồn phòng riêng; 25 phòng hiện là tổng người dùng cung cấp, không nhân đôi."
      ],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 2500000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 25,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m) hoặc 2 giường Twin",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng tiêu chuẩn 5 sao quốc tế theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "grand-deluxe-ocean-view",
      "name": "Grand Deluxe Ocean View",
      "source_name_candidates": "Grand Deluxe Ocean View",
      "actual_room_name": "Grand Deluxe Ocean View",
      "description": "Phòng Grand Deluxe hướng biển, bố trí một giường King lớn.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 3600000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 30,
      "area_m2": null,
      "bed_type": "1 giường King lớn cao cấp",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng tiêu chuẩn 5 sao quốc tế theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "imperial-suite",
      "name": "Imperial Suite",
      "source_name_candidates": "Imperial Suite",
      "actual_room_name": "Imperial Suite",
      "description": "Phòng Imperial Suite có một giường King và khu vực phòng khách riêng.",
      "reported_features": [],
      "unconfirmed_features": [
        "Nội dung đặc quyền Imperial Club theo gói phòng"
      ],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 7800000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 5,
      "area_m2": null,
      "bed_type": "1 giường King thượng hạng; khu vực phòng khách riêng không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Theo người dùng, gồm buffet sáng tiêu chuẩn 5 sao quốc tế và đặc quyền Imperial Club; cần xác nhận nội dung đặc quyền và điều kiện theo gói phòng.",
      "free_cancellation": true,
      "cancellation_free_before_days": 10,
      "cancellation_policy": "Miễn phí hủy trước 10 ngày. Hủy trong vòng 10 ngày: phí 100% đêm đầu hoặc 50% tổng booking tùy mùa (chưa chọn lịch áp dụng). Trong vòng 3 ngày trước nhận phòng: phí 100% toàn bộ kỳ nghỉ.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "cancellation_fee_rules": {
        "free_before_days": 10,
        "within_10_days": {
          "alternatives": [
            {
              "basis": "first_night",
              "percent": 100
            },
            {
              "basis": "entire_stay",
              "percent": 50
            }
          ],
          "season_mapping": null
        },
        "within_3_days": {
          "basis": "entire_stay",
          "percent": 100
        },
        "precedence_note": "Mức trong 3 ngày ưu tiên hơn mức trong 10 ngày. Chính sách riêng này ưu tiên quy tắc 100% chung.",
        "deadline_timezone": null,
        "deadline_boundary_inclusive": null,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Xác nhận Deluxe King/Twin quản lý chung hay tách riêng tồn phòng",
    "Nội dung đặc quyền Imperial Club và điều kiện áp dụng",
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ, địa chỉ và thông tin khách sạn trước khi công khai",
    "Đối chiếu backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch áp dụng phí 100% đêm đầu hay 50% tổng booking trong 10 ngày; mốc giờ và cách tính ranh giới 10/3 ngày"
  ],
  "star_rating_note": "Hạng 5 sao theo người dùng cung cấp; chưa xác minh độc lập."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 12. Fusion Suites Vũng Tàu: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('fusion-suites-vung-tau','{
  "slug": "fusion-suites-vung-tau",
  "name": "Fusion Suites Vũng Tàu",
  "city": "vungtau",
  "type": "hotel",
  "address": "Số 2 Đường Trương Công Định, Phường 2, Thành phố Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu",
  "contact_phone": null,
  "stars": 5,
  "latitude": 10.3475,
  "longitude": 107.0782,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "15:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 2400000,
  "description": "Khách sạn căn hộ nghỉ dưỡng với thiết kế hiện đại tại góc đường Trương Công Định và Hạ Long, gần Bãi Trước theo thông tin người dùng cung cấp.",
  "nearby_notes": [
    "Bãi Trước",
    "Đường Hạ Long"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "fusion-suite",
      "name": "Fusion Suite King / Twin",
      "source_name_candidates": "Fusion Suite King / Twin",
      "actual_room_name": "Fusion Suite King / Twin",
      "description": "Phòng Fusion Suite có lựa chọn giường King hoặc hai giường Twin.",
      "reported_features": [],
      "unconfirmed_features": [
        "Xác nhận King/Twin là lựa chọn giường chung một hạng hay hai hạng có tồn phòng riêng; 20 phòng hiện là tổng người dùng cung cấp, không nhân đôi."
      ],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 2400000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 20,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m) hoặc 2 giường Twin",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm bữa sáng linh hoạt theo thông tin người dùng; điều kiện dùng bất cứ lúc nào/ở đâu cần xác nhận theo gói.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và 1 trẻ em; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "deluxe-ocean-view-suite",
      "name": "Deluxe Ocean View Suite",
      "source_name_candidates": "Deluxe Ocean View Suite",
      "actual_room_name": "Deluxe Ocean View Suite",
      "description": "Phòng Deluxe Suite hướng biển, bố trí một giường King lớn.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 3500000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 25,
      "area_m2": null,
      "bed_type": "1 giường King lớn hướng biển",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm bữa sáng linh hoạt theo thông tin người dùng; cần xác nhận khung giờ, địa điểm và điều kiện gói giá.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và 1 trẻ em; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "premium-suite",
      "name": "Penthouse",
      "source_name_candidates": "Penthouse / Presidential Suite",
      "actual_room_name": "Penthouse",
      "description": "Phòng Penthouse. Cấu hình: Giường King thượng hạng; cần xác nhận số giường và phòng ngủ. Khu vực phòng khách và bếp nhỏ không mặc định là giường phụ.",
      "reported_features": [],
      "unconfirmed_features": [
        "Nội dung đặc quyền spa và dịch vụ theo gói",
        "Số phòng ngủ và số giường King cho 4 người lớn"
      ],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 7200000,
      "capacity": 6,
      "max_adults": 4,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 4,
      "area_m2": null,
      "bed_type": "Giường King thượng hạng; cần xác nhận số giường và phòng ngủ. Khu vực phòng khách và bếp nhỏ không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Theo người dùng, đã bao gồm bữa sáng cùng đặc quyền spa và dịch vụ cao cấp; cần xác nhận nội dung và điều kiện theo gói.",
      "free_cancellation": true,
      "cancellation_free_before_days": 10,
      "cancellation_policy": "Miễn phí hủy trước 10 ngày. Hủy trong vòng 10 ngày: phí 100% đêm đầu hoặc 50% tổng booking tùy mùa (chưa chọn lịch áp dụng). Trong vòng 3 ngày trước nhận phòng: phí 100% toàn bộ kỳ nghỉ.",
      "capacity_note": "Tổng số người theo giới hạn 4 người lớn và 2 trẻ em; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Người dùng chốt bán một hạng; giữ nguyên tổng tồn phòng và giá ban đầu. Phương án bán song song chưa kích hoạt.",
      "proposed_split_not_active": [
        {
          "name": "Penthouse",
          "total_rooms": 2,
          "price_per_night": 7200000
        },
        {
          "name": "Presidential Suite",
          "total_rooms": 2,
          "price_per_night": 8500000
        }
      ],
      "cancellation_fee_rules": {
        "free_before_days": 10,
        "within_10_days": {
          "alternatives": [
            {
              "basis": "first_night",
              "percent": 100
            },
            {
              "basis": "entire_stay",
              "percent": 50
            }
          ],
          "season_mapping": null
        },
        "within_3_days": {
          "basis": "entire_stay",
          "percent": 100
        },
        "precedence_note": "Mức trong 3 ngày ưu tiên hơn mức trong 10 ngày. Chính sách riêng này ưu tiên quy tắc 100% chung.",
        "deadline_timezone": null,
        "deadline_boundary_inclusive": null,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Xác nhận Fusion Suite King/Twin quản lý chung hay tách tồn phòng",
    "Số phòng ngủ, số giường và cấu hình phù hợp 4 người lớn của hạng cao cấp",
    "Điều kiện bữa sáng linh hoạt và đặc quyền spa; không mặc định mọi gói đều gồm spa",
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ, địa chỉ và thông tin khách sạn trước khi công khai",
    "Đối chiếu backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch áp dụng phí 100% đêm đầu hay 50% tổng booking trong 10 ngày; mốc giờ và cách tính ranh giới 10/3 ngày"
  ],
  "star_rating_note": "Hạng 5 sao theo người dùng cung cấp; chưa xác minh độc lập."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 13. Khách sạn New Wave Vũng Tàu: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('new-wave-vung-tau','{
  "slug": "new-wave-vung-tau",
  "name": "Khách sạn New Wave Vũng Tàu",
  "city": "vungtau",
  "type": "hotel",
  "address": "Số 151B Đường Thùy Vân, Phường Thắng Tam, Thành phố Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu",
  "contact_phone": null,
  "stars": 4,
  "latitude": 10.3442,
  "longitude": 107.0865,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 1150000,
  "description": "Khách sạn nghỉ dưỡng trên đường Thùy Vân tại khu vực Bãi Sau. Theo thông tin người dùng, khuôn viên có hồ bơi ngoài trời và lối đi riêng ra biển.",
  "nearby_notes": [
    "Bãi Sau"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "superior",
      "name": "Superior Room",
      "source_name_candidates": "Superior Room",
      "actual_room_name": "Superior Room",
      "description": "Phòng Superior có lựa chọn một giường Double hoặc hai giường Twin.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1150000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 25,
      "area_m2": null,
      "bed_type": "1 giường Double (1.6m x 2m) hoặc 2 giường Twin",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "deluxe-ocean-view",
      "name": "Deluxe Ocean View",
      "source_name_candidates": "Deluxe Ocean View",
      "actual_room_name": "Deluxe Ocean View",
      "description": "Phòng Deluxe hướng biển, bố trí một giường King.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1750000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 35,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m) hướng biển",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "premium-suite",
      "name": "Luxury Suite",
      "source_name_candidates": "Luxury Suite / VIP Room",
      "actual_room_name": "Luxury Suite",
      "description": "Phòng Luxury Suite. Cấu hình: 1 giường King cỡ lớn; khu vực ghế sofa tiếp khách không mặc định là giường phụ.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 3200000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 8,
      "area_m2": null,
      "bed_type": "1 giường King cỡ lớn; khu vực ghế sofa tiếp khách không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày. Hủy muộn/no-show: ngày thường với phòng tiêu chuẩn tính 100% đêm đầu; cao điểm, Lễ/Tết hoặc hạng đặc biệt/Penthouse tính 100% toàn bộ kỳ nghỉ. Lịch và phân loại hạng đặc biệt cần chốt.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Người dùng chốt bán một hạng; giữ nguyên tổng tồn phòng và giá ban đầu. Phương án bán song song chưa kích hoạt.",
      "proposed_split_not_active": [
        {
          "name": "Luxury Suite",
          "total_rooms": 5,
          "price_per_night": 3200000
        },
        {
          "name": "VIP Room",
          "total_rooms": 3,
          "price_per_night": 2800000
        }
      ],
      "cancellation_fee_rules": {
        "scope": "late_cancellation_or_no_show",
        "ordinary_standard": {
          "basis": "first_night",
          "percent": 100
        },
        "peak_holiday_or_special": {
          "basis": "entire_stay",
          "percent": 100
        },
        "peak_dates": null,
        "special_room_classification_confirmed": false,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Xác nhận tên hạng cao cấp: Luxury Suite hay VIP Room; không gộp hai loại phòng nếu khác nhau",
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ, địa chỉ và thông tin khách sạn trước khi công khai",
    "Đối chiếu backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch cao điểm/Lễ/Tết và danh sách hạng đặc biệt áp dụng phí toàn kỳ nghỉ"
  ],
  "star_rating_note": "Hạng 4 sao theo người dùng cung cấp; chưa xác minh độc lập."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 14. Pullman Vũng Tàu: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('pullman-vung-tau','{
  "slug": "pullman-vung-tau",
  "name": "Pullman Vũng Tàu",
  "city": "vungtau",
  "type": "hotel",
  "address": "Số 15 Đường Thi Sách, Phường Thắng Tam, Thành phố Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu",
  "contact_phone": null,
  "stars": 5,
  "latitude": 10.3512,
  "longitude": 107.0875,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 2700000,
  "description": "Khách sạn mang thương hiệu Pullman thuộc Accor, thiết kế đương đại và có không gian hội nghị lớn theo thông tin người dùng cung cấp. Vị trí gần khu vực Bãi Sau và các điểm ăn uống.",
  "nearby_notes": [
    "Khu vực Bãi Sau"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "superior",
      "name": "Superior Room",
      "source_name_candidates": "Superior Room",
      "actual_room_name": "Superior Room",
      "description": "Phòng Superior có lựa chọn một giường King hoặc hai giường Twin.",
      "reported_features": [],
      "unconfirmed_features": [
        "Xác nhận lựa chọn King/Twin dùng chung hay tách tồn phòng; 30 phòng là tổng do người dùng cung cấp, không nhân đôi."
      ],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 2700000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 30,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m) hoặc 2 giường Twin",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng tiêu chuẩn 5 sao quốc tế theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "deluxe-ocean-view",
      "name": "Deluxe Ocean View",
      "source_name_candidates": "Deluxe Ocean View",
      "actual_room_name": "Deluxe Ocean View",
      "description": "Phòng Deluxe hướng biển, bố trí một giường King lớn.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 3900000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 40,
      "area_m2": null,
      "bed_type": "1 giường King lớn cao cấp hướng biển",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng tiêu chuẩn 5 sao quốc tế theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "pullman-suite",
      "name": "Pullman Suite",
      "source_name_candidates": "Pullman Suite",
      "actual_room_name": "Pullman Suite",
      "description": "Phòng Pullman Suite bố trí một giường King và khu vực phòng khách riêng.",
      "reported_features": [],
      "unconfirmed_features": [
        "Nội dung và điều kiện sử dụng Executive Lounge theo gói"
      ],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 8200000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 8,
      "area_m2": null,
      "bed_type": "1 giường King thượng hạng; khu vực phòng khách riêng không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Theo người dùng, gồm buffet sáng và đặc quyền Executive Lounge; cần xác nhận nội dung đặc quyền, đối tượng và điều kiện theo gói giá.",
      "free_cancellation": true,
      "cancellation_free_before_days": 10,
      "cancellation_policy": "Miễn phí hủy trước 10 ngày. Hủy trong vòng 10 ngày: phí 100% đêm đầu hoặc 50% tổng booking tùy mùa (chưa chọn lịch áp dụng). Trong vòng 3 ngày trước nhận phòng: phí 100% toàn bộ kỳ nghỉ.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "cancellation_fee_rules": {
        "free_before_days": 10,
        "within_10_days": {
          "alternatives": [
            {
              "basis": "first_night",
              "percent": 100
            },
            {
              "basis": "entire_stay",
              "percent": 50
            }
          ],
          "season_mapping": null
        },
        "within_3_days": {
          "basis": "entire_stay",
          "percent": 100
        },
        "precedence_note": "Mức trong 3 ngày ưu tiên hơn mức trong 10 ngày. Chính sách riêng này ưu tiên quy tắc 100% chung.",
        "deadline_timezone": null,
        "deadline_boundary_inclusive": null,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Xác nhận lựa chọn giường King/Twin ở Superior quản lý chung hay tách tồn phòng",
    "Nội dung đặc quyền Executive Lounge và điều kiện áp dụng",
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ, địa chỉ và thông tin khách sạn trước khi công khai",
    "Đối chiếu backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch áp dụng phí 100% đêm đầu hay 50% tổng booking trong 10 ngày; mốc giờ và cách tính ranh giới 10/3 ngày"
  ],
  "star_rating_note": "Hạng 5 sao theo người dùng cung cấp; chưa xác minh độc lập.",
  "address_note": "Giữ địa chỉ theo thông tin người dùng cung cấp; địa giới hành chính hiện hành chưa được xác minh độc lập. Người dùng mô tả khu vực Bãi Thầy / Bãi Sau."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 15. Oyster Bay Vũng Tàu: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('oyster-bay-vung-tau','{
  "slug": "oyster-bay-vung-tau",
  "name": "Oyster Bay Vũng Tàu",
  "city": "vungtau",
  "type": "hotel",
  "address": "Số 82B Đường Trần Phú, Phường 5, Thành phố Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu",
  "contact_phone": null,
  "stars": 4,
  "latitude": 10.3542,
  "longitude": 107.0625,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 1350000,
  "description": "Khách sạn nghỉ dưỡng trên đường ven biển Trần Phú, có thiết kế hình vỏ sò và tầm nhìn hướng biển theo thông tin người dùng cung cấp.",
  "nearby_notes": [
    "Đường ven biển Trần Phú"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "deluxe-view",
      "name": "Deluxe City View",
      "source_name_candidates": "Deluxe City / Partial Sea View",
      "actual_room_name": "Deluxe City View",
      "description": "Phòng Deluxe City View. Cấu hình: 1 giường Double (1.6m x 2m) hoặc 2 giường Twin.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1350000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 20,
      "area_m2": null,
      "bed_type": "1 giường Double (1.6m x 2m) hoặc 2 giường Twin",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Người dùng chốt bán một hạng; giữ nguyên tổng tồn phòng và giá ban đầu. Phương án bán song song chưa kích hoạt.",
      "proposed_split_not_active": [
        {
          "name": "Deluxe City View",
          "total_rooms": 12,
          "price_per_night": 1350000
        },
        {
          "name": "Deluxe Partial Sea View",
          "total_rooms": 8,
          "price_per_night": 1500000
        }
      ]
    },
    {
      "code": "executive-ocean-view",
      "name": "Executive Ocean View",
      "source_name_candidates": "Executive Ocean View",
      "actual_room_name": "Executive Ocean View",
      "description": "Phòng Executive hướng biển trực diện, bố trí một giường King.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1950000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 30,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m) hướng biển trực diện",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng tiêu chuẩn theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "premium-suite",
      "name": "Oyster Suite",
      "source_name_candidates": "Oyster Suite / Presidential Suite",
      "actual_room_name": "Oyster Suite",
      "description": "Phòng Oyster Suite. Cấu hình: 1 giường King thượng hạng; khu vực ghế sofa tiếp khách không mặc định là giường phụ.",
      "reported_features": [],
      "unconfirmed_features": [
        "Nội dung đặc quyền cao cấp theo gói"
      ],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 3800000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 5,
      "area_m2": null,
      "bed_type": "1 giường King thượng hạng; khu vực ghế sofa tiếp khách không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Theo người dùng, gồm buffet sáng và các đặc quyền cao cấp; cần xác nhận nội dung và điều kiện theo gói giá.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày. Hủy muộn/no-show: ngày thường với phòng tiêu chuẩn tính 100% đêm đầu; cao điểm, Lễ/Tết hoặc hạng đặc biệt/Penthouse tính 100% toàn bộ kỳ nghỉ. Lịch và phân loại hạng đặc biệt cần chốt.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Người dùng chốt bán một hạng; giữ nguyên tổng tồn phòng và giá ban đầu. Phương án bán song song chưa kích hoạt.",
      "proposed_split_not_active": [
        {
          "name": "Oyster Suite",
          "total_rooms": 3,
          "price_per_night": 3800000
        },
        {
          "name": "Presidential Suite",
          "total_rooms": 2,
          "price_per_night": 5500000
        }
      ],
      "cancellation_fee_rules": {
        "scope": "late_cancellation_or_no_show",
        "ordinary_standard": {
          "basis": "first_night",
          "percent": 100
        },
        "peak_holiday_or_special": {
          "basis": "entire_stay",
          "percent": 100
        },
        "peak_dates": null,
        "special_room_classification_confirmed": false,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Xác nhận tên/hướng nhìn hạng cơ bản: Deluxe City View hay Partial Sea View; phân bổ giá/tồn phòng nếu là hai hạng khác nhau",
    "Nội dung đặc quyền cao cấp và điều kiện áp dụng",
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ, địa chỉ và mô tả khu vực bãi biển trước khi công khai",
    "Đối chiếu backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch cao điểm/Lễ/Tết và danh sách hạng đặc biệt áp dụng phí toàn kỳ nghỉ"
  ],
  "star_rating_note": "Hạng 4 sao theo người dùng cung cấp; chưa xác minh độc lập.",
  "location_note": "Người dùng mô tả hướng biển Bãi Trước; cần đối chiếu vị trí bãi biển và tọa độ trước khi công khai."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 16. Mercure Vũng Tàu: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('mercure-vung-tau','{
  "slug": "mercure-vung-tau",
  "name": "Mercure Vũng Tàu",
  "city": "vungtau",
  "type": "hotel",
  "address": "Số 03 Đường Hạ Long, Phường 2, Thành phố Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu",
  "contact_phone": null,
  "stars": 4,
  "latitude": 10.3395,
  "longitude": 107.0735,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 1850000,
  "description": "Khách sạn nghỉ dưỡng thuộc Accor, mang phong cách Địa Trung Hải trên đường ven biển Hạ Long, khu vực Bãi Dứa theo thông tin người dùng cung cấp.",
  "nearby_notes": [
    "Bãi Dứa",
    "Đường ven biển Hạ Long"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "superior-hill-view",
      "name": "Superior Hill View",
      "source_name_candidates": "Superior Hill View",
      "actual_room_name": "Superior Hill View",
      "description": "Phòng Superior hướng đồi, có lựa chọn giường Double hoặc hai giường Twin.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1850000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 20,
      "area_m2": null,
      "bed_type": "1 giường Double (1.6m x 2m) hoặc 2 giường Twin",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "deluxe-ocean-view",
      "name": "Deluxe Ocean View",
      "source_name_candidates": "Deluxe Ocean View",
      "actual_room_name": "Deluxe Ocean View",
      "description": "Phòng Deluxe hướng biển, bố trí một giường King.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 2650000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 30,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m) hướng biển",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng tiêu chuẩn quốc tế theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "executive-suite",
      "name": "Executive Suite",
      "source_name_candidates": "Executive Suite",
      "actual_room_name": "Executive Suite",
      "description": "Phòng Executive Suite bố trí một giường King và khu vực phòng khách riêng.",
      "reported_features": [],
      "unconfirmed_features": [
        "Nội dung đặc quyền cao cấp theo gói"
      ],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 5200000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 6,
      "area_m2": null,
      "bed_type": "1 giường King thượng hạng; khu vực phòng khách riêng không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Theo người dùng, gồm buffet sáng và các đặc quyền cao cấp; cần xác nhận nội dung và điều kiện theo gói giá.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày. Hủy muộn/no-show: ngày thường với phòng tiêu chuẩn tính 100% đêm đầu; cao điểm, Lễ/Tết hoặc hạng đặc biệt/Penthouse tính 100% toàn bộ kỳ nghỉ. Lịch và phân loại hạng đặc biệt cần chốt.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "cancellation_fee_rules": {
        "scope": "late_cancellation_or_no_show",
        "ordinary_standard": {
          "basis": "first_night",
          "percent": 100
        },
        "peak_holiday_or_special": {
          "basis": "entire_stay",
          "percent": 100
        },
        "peak_dates": null,
        "special_room_classification_confirmed": false,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Nội dung đặc quyền cao cấp và điều kiện áp dụng",
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ, địa chỉ và thông tin khách sạn trước khi công khai",
    "Đối chiếu backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch cao điểm/Lễ/Tết và danh sách hạng đặc biệt áp dụng phí toàn kỳ nghỉ"
  ],
  "star_rating_note": "Hạng 4 sao theo người dùng cung cấp; chưa xác minh độc lập."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 17. Mermaid Seaside Vũng Tàu: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('mermaid-seaside-vung-tau','{
  "slug": "mermaid-seaside-vung-tau",
  "name": "Mermaid Seaside Vũng Tàu",
  "city": "vungtau",
  "type": "hotel",
  "address": "Số 164 Đường Trần Phú, Phường 5, Thành phố Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu",
  "contact_phone": null,
  "stars": 4,
  "latitude": 10.3625,
  "longitude": 107.0512,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 1250000,
  "description": "Khách sạn nghỉ dưỡng ven biển trên đường Trần Phú, có không gian yên tĩnh và tầm nhìn hướng biển theo thông tin người dùng cung cấp.",
  "nearby_notes": [
    "Đường ven biển Trần Phú"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "superior-sea-view",
      "name": "Superior Sea View",
      "source_name_candidates": "Superior Sea View",
      "actual_room_name": "Superior Sea View",
      "description": "Phòng Superior hướng biển, có lựa chọn giường Double hoặc hai giường Twin.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1250000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 20,
      "area_m2": null,
      "bed_type": "1 giường Double (1.6m x 2m) hoặc 2 giường Twin",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "deluxe-ocean-front",
      "name": "Deluxe Ocean Front",
      "source_name_candidates": "Deluxe Ocean Front",
      "actual_room_name": "Deluxe Ocean Front",
      "description": "Phòng Deluxe trực diện biển, bố trí một giường King.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1850000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 30,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m) trực diện biển",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng tiêu chuẩn theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "premium-suite",
      "name": "Mermaid Suite",
      "source_name_candidates": "Mermaid Suite / Penthouse",
      "actual_room_name": "Mermaid Suite",
      "description": "Phòng Mermaid Suite. Cấu hình: 1 giường King thượng hạng; khu vực phòng khách không mặc định là giường phụ.",
      "reported_features": [
        "Ban công lớn"
      ],
      "unconfirmed_features": [
        "Nội dung đặc quyền cao cấp theo gói"
      ],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 3500000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 5,
      "area_m2": null,
      "bed_type": "1 giường King thượng hạng; khu vực phòng khách không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Theo người dùng, gồm buffet sáng và các đặc quyền cao cấp; cần xác nhận nội dung và điều kiện theo gói giá.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày. Hủy muộn/no-show: ngày thường với phòng tiêu chuẩn tính 100% đêm đầu; cao điểm, Lễ/Tết hoặc hạng đặc biệt/Penthouse tính 100% toàn bộ kỳ nghỉ. Lịch và phân loại hạng đặc biệt cần chốt.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Người dùng chốt bán một hạng; giữ nguyên tổng tồn phòng và giá ban đầu. Phương án bán song song chưa kích hoạt.",
      "proposed_split_not_active": [
        {
          "name": "Mermaid Suite",
          "total_rooms": 3,
          "price_per_night": 3500000
        },
        {
          "name": "Penthouse",
          "total_rooms": 2,
          "price_per_night": 4800000
        }
      ],
      "cancellation_fee_rules": {
        "scope": "late_cancellation_or_no_show",
        "ordinary_standard": {
          "basis": "first_night",
          "percent": 100
        },
        "peak_holiday_or_special": {
          "basis": "entire_stay",
          "percent": 100
        },
        "peak_dates": null,
        "special_room_classification_confirmed": false,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Nội dung đặc quyền cao cấp và điều kiện áp dụng",
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ, địa chỉ và thông tin khách sạn trước khi công khai",
    "Đối chiếu backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch cao điểm/Lễ/Tết và danh sách hạng đặc biệt áp dụng phí toàn kỳ nghỉ"
  ],
  "star_rating_note": "Hạng 4 sao theo người dùng cung cấp; chưa xác minh độc lập."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 18. The Cap Hotel Vũng Tàu: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('the-cap-hotel-vung-tau','{
  "slug": "the-cap-hotel-vung-tau",
  "name": "The Cap Hotel Vũng Tàu",
  "city": "vungtau",
  "type": "hotel",
  "address": "Số 01 Đường Thi Sách, Phường Thắng Tam, Thành phố Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu",
  "contact_phone": null,
  "stars": 4,
  "latitude": 10.3502,
  "longitude": 107.0868,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 1300000,
  "description": "Khách sạn nghỉ dưỡng kết hợp căn hộ dịch vụ trên đường Thi Sách, gần Bãi Sau. Theo thông tin người dùng, khách sạn có thiết kế hiện đại và hồ bơi vô cực.",
  "nearby_notes": [
    "Bãi Sau",
    "Đường Thi Sách",
    "Đường Thùy Vân"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "superior",
      "name": "Superior Room",
      "source_name_candidates": "Superior Room",
      "actual_room_name": "Superior Room",
      "description": "Phòng Superior có lựa chọn một giường Double hoặc hai giường Twin.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1300000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 25,
      "area_m2": null,
      "bed_type": "1 giường Double (1.6m x 2m) hoặc 2 giường Twin",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "deluxe-view",
      "name": "Deluxe Ocean View",
      "source_name_candidates": "Deluxe Ocean / Pool View",
      "actual_room_name": "Deluxe Ocean View",
      "description": "Phòng Deluxe hướng biển, bố trí một giường King.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1850000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 35,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m) hướng biển",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng tiêu chuẩn theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Người dùng chốt bán một hạng; giữ nguyên tổng tồn phòng và giá ban đầu. Phương án bán song song chưa kích hoạt.",
      "proposed_split_not_active": [
        {
          "name": "Deluxe Ocean View",
          "total_rooms": 20,
          "price_per_night": 1850000
        },
        {
          "name": "Deluxe Pool View",
          "total_rooms": 15,
          "price_per_night": 1650000
        }
      ]
    },
    {
      "code": "premium-suite",
      "name": "The Cap Suite",
      "source_name_candidates": "The Cap Suite / Presidential Suite",
      "actual_room_name": "The Cap Suite",
      "description": "Phòng The Cap Suite. Cấu hình: 1 giường King thượng hạng; khu vực phòng khách riêng không mặc định là giường phụ.",
      "reported_features": [],
      "unconfirmed_features": [
        "Nội dung đặc quyền cao cấp theo gói"
      ],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 3600000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 6,
      "area_m2": null,
      "bed_type": "1 giường King thượng hạng; khu vực phòng khách riêng không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Theo người dùng, gồm buffet sáng và các đặc quyền cao cấp; cần xác nhận nội dung và điều kiện theo gói giá.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày. Hủy muộn/no-show: ngày thường với phòng tiêu chuẩn tính 100% đêm đầu; cao điểm, Lễ/Tết hoặc hạng đặc biệt/Penthouse tính 100% toàn bộ kỳ nghỉ. Lịch và phân loại hạng đặc biệt cần chốt.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Người dùng chốt bán một hạng; giữ nguyên tổng tồn phòng và giá ban đầu. Phương án bán song song chưa kích hoạt.",
      "proposed_split_not_active": [
        {
          "name": "The Cap Suite",
          "total_rooms": 4,
          "price_per_night": 3600000
        },
        {
          "name": "Presidential Suite",
          "total_rooms": 2,
          "price_per_night": 5200000
        }
      ],
      "cancellation_fee_rules": {
        "scope": "late_cancellation_or_no_show",
        "ordinary_standard": {
          "basis": "first_night",
          "percent": 100
        },
        "peak_holiday_or_special": {
          "basis": "entire_stay",
          "percent": 100
        },
        "peak_dates": null,
        "special_room_classification_confirmed": false,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Nội dung đặc quyền cao cấp và điều kiện áp dụng",
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ, địa chỉ và thông tin khách sạn trước khi công khai",
    "Đối chiếu backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch cao điểm/Lễ/Tết và danh sách hạng đặc biệt áp dụng phí toàn kỳ nghỉ"
  ],
  "star_rating_note": "Hạng 4 sao theo người dùng cung cấp; chưa xác minh độc lập."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 19. Khách sạn Petro House Vũng Tàu: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('petro-house-vung-tau','{
  "slug": "petro-house-vung-tau",
  "name": "Khách sạn Petro House Vũng Tàu",
  "city": "vungtau",
  "type": "hotel",
  "address": "Số 63 Đường Trần Hưng Đạo, Phường 1, Thành phố Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu",
  "contact_phone": null,
  "stars": 3,
  "latitude": 10.3525,
  "longitude": 107.0785,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 850000,
  "description": "Khách sạn mang phong cách cổ điển, ấm cúng tại khu vực trung tâm Bãi Trước, thuận tiện di chuyển đến khu mua sắm, nhà hàng và các điểm tham quan theo thông tin người dùng cung cấp.",
  "nearby_notes": [
    "Khu vực Bãi Trước",
    "Trung tâm thành phố Vũng Tàu"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "standard",
      "name": "Standard Room",
      "source_name_candidates": "Standard Room",
      "actual_room_name": "Standard Room",
      "description": "Phòng Standard bố trí một giường Double.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 850000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 15,
      "area_m2": null,
      "bed_type": "1 giường Double (1.5m x 2m)",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 2,
      "cancellation_policy": "Miễn phí hủy trước 2 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "superior-city-view",
      "name": "Superior City View",
      "source_name_candidates": "Superior City View",
      "actual_room_name": "Superior City View",
      "description": "Phòng Superior hướng thành phố, có lựa chọn giường King hoặc hai giường Twin.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1250000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 25,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m) hoặc 2 giường Twin",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng tiêu chuẩn theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "premium-suite",
      "name": "Suite Room",
      "source_name_candidates": "Suite Room / VIP Room",
      "actual_room_name": "Suite Room",
      "description": "Phòng Suite Room. Cấu hình: 1 giường King cỡ lớn; khu vực tiếp khách riêng không mặc định là giường phụ.",
      "reported_features": [],
      "unconfirmed_features": [
        "Nội dung tiện ích đi kèm theo gói"
      ],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 2200000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 5,
      "area_m2": null,
      "bed_type": "1 giường King cỡ lớn; khu vực tiếp khách riêng không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Theo người dùng, gồm buffet sáng và các tiện ích đi kèm; cần xác nhận nội dung và điều kiện áp dụng.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày. Hủy muộn/no-show: ngày thường với phòng tiêu chuẩn tính 100% đêm đầu; cao điểm, Lễ/Tết hoặc hạng đặc biệt/Penthouse tính 100% toàn bộ kỳ nghỉ. Lịch và phân loại hạng đặc biệt cần chốt.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Người dùng chốt bán một hạng; giữ nguyên tổng tồn phòng và giá ban đầu. Phương án bán song song chưa kích hoạt.",
      "proposed_split_not_active": [
        {
          "name": "Suite Room",
          "total_rooms": 3,
          "price_per_night": 2200000
        },
        {
          "name": "VIP Room",
          "total_rooms": 2,
          "price_per_night": 1950000
        }
      ],
      "cancellation_fee_rules": {
        "scope": "late_cancellation_or_no_show",
        "ordinary_standard": {
          "basis": "first_night",
          "percent": 100
        },
        "peak_holiday_or_special": {
          "basis": "entire_stay",
          "percent": 100
        },
        "peak_dates": null,
        "special_room_classification_confirmed": false,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Nội dung tiện ích đi kèm và điều kiện áp dụng",
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ, địa chỉ và thông tin khách sạn trước khi công khai",
    "Đối chiếu backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch cao điểm/Lễ/Tết và danh sách hạng đặc biệt áp dụng phí toàn kỳ nghỉ"
  ],
  "star_rating_note": "Hạng 3 sao theo người dùng cung cấp; chưa xác minh độc lập."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 20. Vias Hotel Vũng Tàu: dữ liệu do người dùng cung cấp.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('vias-hotel-vung-tau','{
  "slug": "vias-hotel-vung-tau",
  "name": "Vias Hotel Vũng Tàu",
  "city": "vungtau",
  "type": "hotel",
  "address": "Số 179 Đường Thùy Vân, Phường 8, Thành phố Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu",
  "contact_phone": null,
  "stars": 4,
  "latitude": 10.3475,
  "longitude": 107.0862,
  "location_source": "Tọa độ do người dùng cung cấp, chưa đối chiếu bản đồ",
  "checkin_time": "14:00:00",
  "checkout_time": "12:00:00",
  "price_per_night": 1650000,
  "description": "Khách sạn nghỉ dưỡng phong cách hiện đại trên đường Thùy Vân, đối diện khu vực Bãi Sau. Theo người dùng, khách sạn có hồ bơi vô cực hướng biển.",
  "nearby_notes": [
    "Bãi Sau",
    "Đường ven biển Thùy Vân"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "publication_status": "draft_pending_policy_and_backend_mapping",
  "rooms": [
    {
      "code": "deluxe-view",
      "name": "Deluxe City View",
      "source_name_candidates": "Deluxe City / Garden View",
      "actual_room_name": "Deluxe City View",
      "description": "Phòng Deluxe City View. Cấu hình: 1 giường Double (1.6m x 2m) hoặc 2 giường Twin.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 1650000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": 6,
      "total_rooms": 25,
      "area_m2": null,
      "bed_type": "1 giường Double (1.6m x 2m) hoặc 2 giường Twin",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày so với ngày nhận phòng; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Người dùng chốt bán một hạng; giữ nguyên tổng tồn phòng và giá ban đầu. Phương án bán song song chưa kích hoạt.",
      "proposed_split_not_active": [
        {
          "name": "Deluxe City View",
          "total_rooms": 15,
          "price_per_night": 1650000
        },
        {
          "name": "Deluxe Garden View",
          "total_rooms": 10,
          "price_per_night": 1550000
        }
      ]
    },
    {
      "code": "executive-ocean-view",
      "name": "Executive Ocean View",
      "source_name_candidates": "Executive Ocean View",
      "actual_room_name": "Executive Ocean View",
      "description": "Phòng Executive trực diện biển, bố trí một giường King.",
      "reported_features": [],
      "unconfirmed_features": [],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 2450000,
      "capacity": 3,
      "max_adults": 2,
      "max_children": 1,
      "child_age_limit_exclusive": null,
      "total_rooms": 35,
      "area_m2": null,
      "bed_type": "1 giường King (1.8m x 2m) trực diện hướng biển",
      "breakfast_included": true,
      "breakfast_note": "Đã bao gồm buffet sáng theo thông tin người dùng cung cấp.",
      "free_cancellation": true,
      "cancellation_free_before_days": 3,
      "cancellation_policy": "Miễn phí hủy trước 3 ngày; hủy muộn tính phí 1 đêm.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false
    },
    {
      "code": "premium-suite",
      "name": "Vias Suite",
      "source_name_candidates": "Vias Suite / Presidential Suite",
      "actual_room_name": "Vias Suite",
      "description": "Phòng Vias Suite. Cấu hình: 1 giường King thượng hạng; khu vực phòng khách không mặc định là giường phụ.",
      "reported_features": [
        "Ban công lớn"
      ],
      "unconfirmed_features": [
        "Nội dung đặc quyền cao cấp theo gói"
      ],
      "reference_price_min_vnd": null,
      "reference_price_max_vnd": null,
      "price_per_night": 4800000,
      "capacity": 4,
      "max_adults": 2,
      "max_children": 2,
      "child_age_limit_exclusive": null,
      "total_rooms": 6,
      "area_m2": null,
      "bed_type": "1 giường King thượng hạng; khu vực phòng khách không mặc định là giường phụ",
      "breakfast_included": true,
      "breakfast_note": "Theo người dùng, gồm buffet sáng và các đặc quyền cao cấp; cần xác nhận nội dung và điều kiện theo gói giá.",
      "free_cancellation": true,
      "cancellation_free_before_days": 5,
      "cancellation_policy": "Miễn phí hủy trước 5 ngày. Hủy muộn/no-show: ngày thường với phòng tiêu chuẩn tính 100% đêm đầu; cao điểm, Lễ/Tết hoặc hạng đặc biệt/Penthouse tính 100% toàn bộ kỳ nghỉ. Lịch và phân loại hạng đặc biệt cần chốt.",
      "capacity_note": "Tổng số người theo giới hạn 2 người lớn và số trẻ em nêu trên; không cho phép tự đổi suất trẻ em thành người lớn. Backend hiện chỉ kiểm tra tổng khách nên chưa thể thực thi giới hạn tuổi/người lớn.",
      "stock_source": "Số lượng quản lý trên ThreeK do người dùng cung cấp, không suy ra từ tồn phòng OTA.",
      "price_source": "Giá bán cụ thể do người dùng cung cấp; chưa có ngày bắt đầu/kết thúc áp dụng.",
      "images": [],
      "is_active": false,
      "name_confirmation_note": "Người dùng chốt bán một hạng; giữ nguyên tổng tồn phòng và giá ban đầu. Phương án bán song song chưa kích hoạt.",
      "proposed_split_not_active": [
        {
          "name": "Vias Suite",
          "total_rooms": 4,
          "price_per_night": 4800000
        },
        {
          "name": "Presidential Suite",
          "total_rooms": 2,
          "price_per_night": 6800000
        }
      ],
      "cancellation_fee_rules": {
        "scope": "late_cancellation_or_no_show",
        "ordinary_standard": {
          "basis": "first_night",
          "percent": 100
        },
        "peak_holiday_or_special": {
          "basis": "entire_stay",
          "percent": 100
        },
        "peak_dates": null,
        "special_room_classification_confirmed": false,
        "ready_for_automatic_enforcement": false
      }
    }
  ],
  "missing_for_publication": [
    "Xác nhận địa chỉ/phường và địa giới hành chính hiện hành",
    "Nội dung đặc quyền cao cấp và điều kiện áp dụng",
    "Ảnh: người dùng sẽ bổ sung sau",
    "Số điện thoại liên hệ nếu cần",
    "Diện tích phòng nếu cần hiển thị",
    "Độ tuổi trẻ em cho các phòng chưa nêu; phụ thu trẻ em/giường phụ",
    "Ngày áp dụng giá và ngoại lệ lễ/tết nếu có",
    "Xác minh tọa độ và thông tin khách sạn trước khi công khai",
    "Đối chiếu backend với giới hạn người lớn/trẻ em và chính sách hủy theo từng loại phòng",
    "Lịch cao điểm/Lễ/Tết và danh sách hạng đặc biệt áp dụng phí toàn kỳ nghỉ"
  ],
  "star_rating_note": "Hạng 4 sao theo người dùng cung cấp; chưa xác minh độc lập.",
  "address_note": "Người dùng ghi Phường 8 và chú thích tên hành chính cũ thuộc Phường Thắng Tam, địa chỉ thuộc Bà Rịa - Vũng Tàu; giữ theo nguồn cung cấp, chưa xác minh độc lập địa giới hành chính hiện hành."
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

COMMIT;
