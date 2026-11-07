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

COMMIT;
