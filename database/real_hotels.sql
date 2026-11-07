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

-- 01. CICILIA Rouge Dalat: ba nhóm phòng tham khảo, tên hạng thực tế cần xác nhận.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('cicilia-rouge-dalat','{
  "slug": "cicilia-rouge-dalat",
  "name": "CICILIA Rouge Dalat",
  "city": "dalat",
  "type": "hotel",
  "address": "Số 15 Đường 3/4, Phường Xuân Hương (Phường 3 cũ), TP. Đà Lạt, Tỉnh Lâm Đồng",
  "contact_phone": "0263 3816 868",
  "stars": null,
  "latitude": null,
  "longitude": null,
  "description": "Khách sạn có thiết kế hiện đại, không gian sang trọng và vị trí thuận tiện di chuyển đến khu vực trung tâm Đà Lạt.",
  "nearby_notes": [
    "Ga Đà Lạt",
    "Chợ Đà Lạt",
    "Dinh 2",
    "Hồ Xuân Hương"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "external_rating_note": "Người dùng nêu điểm tham khảo khoảng 4.9/5; không nhập vào hạng sao hoặc bảng reviews.",
  "publication_status": "draft",
  "rooms": [
    {
      "code": "standard",
      "name": "Phòng Cơ bản",
      "source_name_candidates": "Standard / The Cosy Room",
      "actual_room_name": null,
      "description": "Không gian ấm cúng, thiết kế tối ưu cho nhu cầu lưu trú ngắn ngày.",
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
      "price_per_night": null,
      "capacity": null,
      "total_rooms": null,
      "area_m2": null,
      "bed_type": null,
      "breakfast_included": null,
      "free_cancellation": null,
      "cancellation_policy": null,
      "images": [],
      "is_active": false
    },
    {
      "code": "midrange",
      "name": "Phòng Trung cấp",
      "source_name_candidates": "Vintage Balcony Room / Gallery City View",
      "actual_room_name": null,
      "description": "Không gian thoáng, có thể có ban công hoặc cửa sổ hướng thành phố tùy hạng phòng thực tế.",
      "reported_features": [
        "TV thông minh",
        "Minibar",
        "Bàn ghế thư giãn"
      ],
      "reference_price_min_vnd": 1250000,
      "reference_price_max_vnd": 2000000,
      "price_per_night": null,
      "capacity": null,
      "total_rooms": null,
      "area_m2": null,
      "bed_type": null,
      "breakfast_included": null,
      "free_cancellation": null,
      "cancellation_policy": null,
      "images": [],
      "is_active": false,
      "unconfirmed_features": [
        "Giường King hoặc Queen",
        "Ban công riêng hoặc cửa sổ hướng thành phố",
        "Điều hòa hoặc hệ thống sưởi"
      ]
    },
    {
      "code": "premium",
      "name": "Phòng Cao cấp",
      "source_name_candidates": "Signature City/Hill View hoặc Suite Panorama",
      "actual_room_name": null,
      "description": "Không gian rộng rãi, nội thất cao cấp; hướng thành phố hoặc đồi núi tùy hạng phòng thực tế.",
      "reported_features": [
        "Nội thất cao cấp"
      ],
      "reference_price_min_vnd": 2000000,
      "reference_price_max_vnd": null,
      "price_per_night": null,
      "capacity": null,
      "total_rooms": null,
      "area_m2": null,
      "bed_type": null,
      "breakfast_included": null,
      "free_cancellation": null,
      "cancellation_policy": null,
      "images": [],
      "is_active": false,
      "unconfirmed_features": [
        "Giường cỡ lớn",
        "Không gian tiếp khách riêng",
        "Bồn tắm tùy hạng",
        "Đặc quyền đi kèm cần xác nhận"
      ]
    }
  ],
  "missing_for_publication": [
    "Hạng sao chính thức (không phải điểm đánh giá)",
    "Tên chính xác từng loại phòng; không gộp các hạng khác nhau",
    "Sức chứa và số lượng phòng mỗi loại",
    "Giá bán cụ thể mỗi loại và thời điểm áp dụng",
    "Bữa sáng, chính sách hủy",
    "Ảnh được phép sử dụng",
    "Vị trí bản đồ cần xác nhận"
  ]
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 02. MerPerle Dalat Hotel: dữ liệu người dùng, ba nhóm phòng tham khảo.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('merperle-dalat-hotel','{
  "slug": "merperle-dalat-hotel",
  "name": "MerPerle Dalat Hotel",
  "city": "dalat",
  "type": "hotel",
  "address": "Số 1 Đường Hùng Vương, Phường 10, Thành phố Đà Lạt, Tỉnh Lâm Đồng",
  "contact_phone": "0263 3553 789",
  "stars": 5,
  "latitude": null,
  "longitude": null,
  "description": "Khách sạn với kiến trúc châu Âu tân cổ điển trên đường Hùng Vương, thuận tiện di chuyển đến khu vực trung tâm Đà Lạt.",
  "nearby_notes": [
    "Ga Đà Lạt",
    "Chùa Linh Phước (Chùa Ve Chai)",
    "Vườn hoa thành phố"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "external_rating_note": "Người dùng nêu điểm tham khảo khoảng 4.9/5; không nhập vào bảng reviews. Hạng 5 sao theo thông tin người dùng cung cấp.",
  "publication_status": "draft",
  "rooms": [
    {
      "code": "deluxe",
      "name": "Phòng Deluxe",
      "source_name_candidates": "Deluxe Room",
      "actual_room_name": "Deluxe Room",
      "description": "Không gian ấm cúng, thiết kế sang trọng cho nhu cầu công tác hoặc nghỉ dưỡng ngắn ngày.",
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
      "unconfirmed_features": [
        "Giường King hoặc 2 giường đơn; cần xác nhận cấu hình từng phòng"
      ],
      "reference_price_min_vnd": 1500000,
      "reference_price_max_vnd": 2200000,
      "price_per_night": null,
      "capacity": null,
      "total_rooms": null,
      "area_m2": null,
      "bed_type": null,
      "breakfast_included": null,
      "free_cancellation": null,
      "cancellation_policy": null,
      "images": [],
      "is_active": false
    },
    {
      "code": "midrange",
      "name": "Phòng Trung cấp",
      "source_name_candidates": "Premier / Deluxe City View hoặc Executive Room",
      "actual_room_name": null,
      "description": "Không gian rộng hơn, có thể có hướng thành phố hoặc quang cảnh xung quanh và góc ngồi thư giãn tùy hạng.",
      "reported_features": [
        "Internet",
        "Trà/cà phê"
      ],
      "unconfirmed_features": [
        "Tên hạng phòng thực tế",
        "Giường cỡ lớn",
        "Điều hòa hoặc sưởi",
        "Sofa nhỏ hoặc bàn trà",
        "Bồn tắm hoặc khu tắm đứng tùy hạng"
      ],
      "reference_price_min_vnd": 2300000,
      "reference_price_max_vnd": 3800000,
      "price_per_night": null,
      "capacity": null,
      "total_rooms": null,
      "area_m2": null,
      "bed_type": null,
      "breakfast_included": null,
      "free_cancellation": null,
      "cancellation_policy": null,
      "images": [],
      "is_active": false
    },
    {
      "code": "suite",
      "name": "Phòng Cao cấp",
      "source_name_candidates": "Suite / President Suite hoặc Royal Suite",
      "actual_room_name": null,
      "description": "Nhóm phòng cao cấp, có thể có phòng ngủ và phòng khách riêng, hướng thành phố hoặc đồi thông tùy hạng Suite.",
      "reported_features": [
        "Nội thất cao cấp"
      ],
      "unconfirmed_features": [
        "Tên và cấu hình từng hạng Suite",
        "Phòng ngủ/phòng khách riêng",
        "Giường cỡ lớn",
        "Vật liệu nội thất",
        "Bồn tắm hướng cảnh quan",
        "Check-in riêng và đặc quyền cần xác nhận"
      ],
      "reference_price_min_vnd": 4500000,
      "reference_price_max_vnd": null,
      "price_per_night": null,
      "capacity": null,
      "total_rooms": null,
      "area_m2": null,
      "bed_type": null,
      "breakfast_included": null,
      "free_cancellation": null,
      "cancellation_policy": null,
      "images": [],
      "is_active": false,
      "reference_price_note": "Người dùng cung cấp mức từ 4.500.000 đến hơn 10.000.000 VNĐ/đêm tùy Suite; không có mức trần xác định."
    }
  ],
  "missing_for_publication": [
    "Tên chính xác từng hạng trung cấp/cao cấp; không gộp các loại phòng khác nhau",
    "Sức chứa và số lượng phòng mỗi loại",
    "Giá bán cụ thể và thời điểm áp dụng",
    "Diện tích và cấu hình giường",
    "Bữa sáng, chính sách hủy",
    "Ảnh được phép sử dụng",
    "Vị trí bản đồ cần xác nhận"
  ]
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 03. Best Western Premier Imperial Đà Lạt: ba nhóm phòng tham khảo.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('best-western-premier-imperial-dalat','{
  "slug": "best-western-premier-imperial-dalat",
  "name": "Best Western Premier Imperial Đà Lạt",
  "city": "dalat",
  "type": "hotel",
  "address": "Số 57 - 59 Đường Hùng Vương, Phường Lâm Viên, Thành phố Đà Lạt, Tỉnh Lâm Đồng",
  "contact_phone": "0263 3626 626 / 0263 7633 333",
  "contact_phones": [
    "0263 3626 626",
    "0263 7633 333"
  ],
  "stars": 5,
  "latitude": null,
  "longitude": null,
  "description": "Khách sạn trên đường Hùng Vương với kiến trúc châu Âu cổ điển kết hợp hiện đại, không gian sang trọng và vị trí thuận tiện tham quan Đà Lạt.",
  "nearby_notes": [
    "Ga Đà Lạt",
    "Quảng trường Lâm Viên",
    "Chùa Linh Phước"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "external_rating_note": "Người dùng nêu điểm tham khảo khoảng 4.7–4.8/5; không nhập vào bảng reviews. Hạng 5 sao theo thông tin người dùng cung cấp.",
  "publication_status": "draft",
  "rooms": [
    {
      "code": "deluxe",
      "name": "Phòng Deluxe",
      "source_name_candidates": "Deluxe Room",
      "actual_room_name": "Deluxe Room",
      "description": "Thiết kế ấm cúng, trang nhã, phù hợp nhu cầu công tác hoặc nghỉ dưỡng của cặp đôi.",
      "reported_features": [
        "TV truyền hình vệ tinh",
        "Bàn làm việc",
        "Két an toàn",
        "Minibar",
        "Trà/cà phê",
        "Vòi sen đứng",
        "Áo choàng tắm"
      ],
      "unconfirmed_features": [
        "Giường King hoặc 2 giường đơn; cần xác nhận cấu hình"
      ],
      "reference_price_min_vnd": 1800000,
      "reference_price_max_vnd": 2500000,
      "price_per_night": null,
      "capacity": null,
      "total_rooms": null,
      "area_m2": null,
      "bed_type": null,
      "breakfast_included": null,
      "free_cancellation": null,
      "cancellation_policy": null,
      "images": [],
      "is_active": false
    },
    {
      "code": "midrange",
      "name": "Phòng Trung cấp",
      "source_name_candidates": "Premier / Executive Room hoặc Deluxe City/Garden View",
      "actual_room_name": null,
      "description": "Không gian rộng rãi hơn, có thể hướng thành phố hoặc khu vườn tùy hạng phòng thực tế.",
      "reported_features": [
        "Nội thất cao cấp",
        "Internet"
      ],
      "unconfirmed_features": [
        "Tên hạng phòng thực tế",
        "Cửa sổ lớn hoặc ban công nhỏ",
        "Giường cỡ lớn",
        "Góc ngồi thư giãn",
        "Điều hòa hoặc sưởi",
        "Bồn tắm hoặc buồng tắm đứng tùy hạng"
      ],
      "reference_price_min_vnd": 2600000,
      "reference_price_max_vnd": 4200000,
      "price_per_night": null,
      "capacity": null,
      "total_rooms": null,
      "area_m2": null,
      "bed_type": null,
      "breakfast_included": null,
      "free_cancellation": null,
      "cancellation_policy": null,
      "images": [],
      "is_active": false
    },
    {
      "code": "suite",
      "name": "Phòng Cao cấp",
      "source_name_candidates": "Suite Room / Presidential Suite",
      "actual_room_name": null,
      "description": "Nhóm phòng cao cấp, có thể bố trí phòng ngủ và phòng khách riêng, hướng thành phố hoặc đồi thông tùy hạng Suite.",
      "reported_features": [
        "Nội thất cao cấp"
      ],
      "unconfirmed_features": [
        "Tên và cấu hình từng hạng Suite",
        "Phòng khách/phòng ngủ riêng",
        "Giường cỡ lớn",
        "Hướng nhìn Panorama",
        "Bồn tắm hướng cảnh quan",
        "Dịch vụ phòng ưu tiên, check-in riêng và đặc quyền cần xác nhận"
      ],
      "reference_price_min_vnd": 5000000,
      "reference_price_max_vnd": null,
      "price_per_night": null,
      "capacity": null,
      "total_rooms": null,
      "area_m2": null,
      "bed_type": null,
      "breakfast_included": null,
      "free_cancellation": null,
      "cancellation_policy": null,
      "images": [],
      "is_active": false,
      "reference_price_note": "Người dùng cung cấp mức từ 5.000.000 đến hơn 12.000.000 VNĐ/đêm tùy Suite; không có mức trần xác định."
    }
  ],
  "missing_for_publication": [
    "Tên chính xác từng hạng trung cấp/cao cấp; không gộp các loại phòng khác nhau",
    "Sức chứa và số lượng phòng mỗi loại",
    "Giá bán cụ thể và thời điểm áp dụng",
    "Diện tích và cấu hình giường",
    "Bữa sáng, chính sách hủy",
    "Ảnh được phép sử dụng",
    "Vị trí bản đồ cần xác nhận"
  ]
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

-- 04. Hôtel Colline Đà Lạt: ba nhóm phòng tham khảo.
INSERT INTO threek_hotel_data_drafts (hotel_slug,payload)
VALUES ('hotel-colline-dalat','{
  "slug": "hotel-colline-dalat",
  "name": "Hôtel Colline Đà Lạt",
  "city": "dalat",
  "type": "hotel",
  "address": "Số 10 Phan Bội Châu, Phường 1, Thành phố Đà Lạt, Tỉnh Lâm Đồng",
  "contact_phone": "0263 3665 588",
  "stars": 4,
  "latitude": null,
  "longitude": null,
  "description": "Khách sạn có thiết kế hiện đại với gam màu nâu trầm và trắng ấm áp, nằm gần chợ Đà Lạt, thuận tiện mua sắm, thưởng thức ẩm thực và đi dạo khu vực trung tâm.",
  "nearby_notes": [
    "Chợ Đà Lạt",
    "Trung tâm thương mại",
    "Hồ Xuân Hương"
  ],
  "source": "Thông tin do người dùng cung cấp; chưa xác minh độc lập",
  "external_rating_note": "Người dùng nêu điểm tham khảo khoảng 4.5/5; không nhập vào bảng reviews. Hạng 4 sao theo thông tin người dùng cung cấp.",
  "publication_status": "draft",
  "rooms": [
    {
      "code": "superior",
      "name": "Phòng Superior",
      "source_name_candidates": "Superior Room",
      "actual_room_name": "Superior Room",
      "description": "Không gian gọn gàng, ấm cúng; hướng cửa sổ hoặc khu vực nội bộ tùy cấu hình phòng thực tế.",
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
        "Giường Double hoặc Twin",
        "Điều hòa hoặc sưởi",
        "Không có cửa sổ hướng ngoài trời hoặc cửa sổ hướng nội bộ; cần xác nhận"
      ],
      "reference_price_min_vnd": 1200000,
      "reference_price_max_vnd": 1800000,
      "price_per_night": null,
      "capacity": null,
      "total_rooms": null,
      "area_m2": null,
      "bed_type": null,
      "breakfast_included": null,
      "free_cancellation": null,
      "cancellation_policy": null,
      "images": [],
      "is_active": false
    },
    {
      "code": "midrange",
      "name": "Phòng Trung cấp",
      "source_name_candidates": "Deluxe Room / Premier City View",
      "actual_room_name": null,
      "description": "Không gian rộng hơn, có thể có cửa sổ lớn hoặc hướng thành phố tùy hạng phòng.",
      "reported_features": [
        "TV thông minh",
        "Minibar",
        "Trà/cà phê",
        "Vòi sen",
        "Đồ dùng cá nhân"
      ],
      "unconfirmed_features": [
        "Tên hạng phòng thực tế",
        "Giường cỡ lớn",
        "Bàn làm việc hoặc sofa nhỏ",
        "Hướng nhìn và cấu hình cửa sổ"
      ],
      "reference_price_min_vnd": 1800000,
      "reference_price_max_vnd": 2800000,
      "price_per_night": null,
      "capacity": null,
      "total_rooms": null,
      "area_m2": null,
      "bed_type": null,
      "breakfast_included": null,
      "free_cancellation": null,
      "cancellation_policy": null,
      "images": [],
      "is_active": false
    },
    {
      "code": "suite",
      "name": "Phòng Cao cấp",
      "source_name_candidates": "Studio Suite / Signature Suite / Family Suite",
      "actual_room_name": null,
      "description": "Nhóm phòng Suite với không gian rộng rãi, có thể bố trí khu tiếp khách riêng hoặc không gian mở tùy hạng.",
      "reported_features": [
        "Nội thất cao cấp"
      ],
      "unconfirmed_features": [
        "Tên và cấu hình từng hạng Suite",
        "Giường King",
        "Phòng khách riêng hoặc không gian mở",
        "Hướng thành phố hoặc đồi thông",
        "Bồn tắm tùy hạng",
        "Dịch vụ ưu tiên và đặc quyền cần xác nhận"
      ],
      "reference_price_min_vnd": 3200000,
      "reference_price_max_vnd": null,
      "price_per_night": null,
      "capacity": null,
      "total_rooms": null,
      "area_m2": null,
      "bed_type": null,
      "breakfast_included": true,
      "free_cancellation": null,
      "cancellation_policy": null,
      "images": [],
      "is_active": false,
      "breakfast_note": "Theo người dùng, nhóm Suite bao gồm bữa sáng buffet tại nhà hàng; cần xác nhận theo hạng phòng và gói giá thực tế trước khi mở bán.",
      "reference_price_note": "Người dùng cung cấp mức từ 3.200.000 đến hơn 6.000.000 VNĐ/đêm tùy thời điểm và Suite; không có mức trần xác định."
    }
  ],
  "missing_for_publication": [
    "Tên chính xác từng hạng trung cấp/cao cấp; không gộp các loại phòng khác nhau",
    "Sức chứa và số lượng phòng mỗi loại",
    "Giá bán cụ thể và thời điểm áp dụng",
    "Diện tích và cấu hình giường",
    "Điều kiện bữa sáng theo gói giá và chính sách hủy",
    "Ảnh được phép sử dụng",
    "Vị trí bản đồ cần xác nhận"
  ]
}')
ON DUPLICATE KEY UPDATE payload=VALUES(payload);

COMMIT;
