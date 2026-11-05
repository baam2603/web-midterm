# Admin: chạy và kiểm thử

## Runtime

PHP 8.1+ (khuyến nghị 8.3), extensions PDO MySQL, mbstring, cURL, fileinfo;
MariaDB 10.4+; Node để kiểm tra cú pháp JS. Chạy PHP/Apache, không dùng server tĩnh Python.

Ứng dụng lấy `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` từ biến môi trường.
Mặc định tương thích XAMPP cũ: 127.0.0.1:3308, threek_booking, root, mật khẩu rỗng.
Khi triển khai, dùng tài khoản DB riêng và cấu hình cookie HTTPS.

## Database

Sao lưu DB trước khi cập nhật. Với DB từ SQL_3K.sql đã có của nhóm, chỉ import:

```sh
mariadb -u root -p threek_booking < database/admin_migration.sql
mariadb -u root -p threek_booking < database/customer_migration.sql
mariadb -u root -p threek_booking < database/security_migration.sql
```

Migration chỉ bổ sung cột, bảng và index; không xóa đơn hoặc tài khoản; chạy lặp lại được trên MariaDB.

Với DB hoàn toàn mới, import theo thứ tự:

```sh
mariadb -u root -p -e 'CREATE DATABASE threek_booking CHARACTER SET utf8mb4'
mariadb -u root -p threek_booking < database/schema.sql
mariadb -u root -p threek_booking < database/seed.sql
mariadb -u root -p threek_booking < database/admin_migration.sql
mariadb -u root -p threek_booking < database/customer_migration.sql
mariadb -u root -p threek_booking < database/security_migration.sql
```

`schema.sql` chỉ chứa cấu trúc, không chứa thông tin tài khoản từ SQL người dùng.
Đăng ký tài khoản qua giao diện, sau đó người quản trị DB cấp role `admin` cho đúng ID.
Không có nút tự cấp quyền admin trong ứng dụng.

## Chạy website

Từ thư mục repository:

```sh
php -d upload_max_filesize=5M -d post_max_size=6M -S 127.0.0.1:8000
```

PHP cần quyền ghi thư mục `uploads/`. Upload chỉ nhận JPEG/PNG/WebP tối đa 5 MB;
không thực thi mã trong thư mục này khi dùng Apache/Nginx.

## OpenStreetMap

- Tìm chủ động bằng nút hoặc Enter; không tự gửi truy vấn mỗi lần gõ.
- Hỗ trợ tên có/không dấu, địa chỉ, URL OSM và ID `osm-N/W/R...`.
- Nominatim dùng giới hạn tối đa một request/giây trên cùng máy và cache.
- Chỉ dùng Overpass bổ sung khi chưa có kết quả lưu trú; kết quả gần vị trí lấy tags/center trực tiếp.
- Xác minh lại ID, quốc gia và vùng thành phố ở server trước khi thêm khách sạn.
- Giới hạn thành phố theo bán kính gần đúng, không phải kiểm tra ranh giới hành chính.
- Cần HTTPS tới `nominatim.openstreetmap.org`, `overpass-api.de`,
  `tile.openstreetmap.org`; giữ TLS verification và CA trust.
  Leaflet 1.9.4 được phục vụ từ `admin/vendor/leaflet/`, kèm giấy phép BSD-2-Clause.
- OSM không đảm bảo có mọi khách sạn; chọn địa chỉ không chứng minh cơ sở kinh doanh tồn tại.
- Không gọi Nominatim/Overpass thật trong test tự động; test dùng fixture ở cache của container kiểm thử.

## Nghiệp vụ

Tổng quan, danh mục, phòng, đơn, lịch trống, đánh giá, hỗ trợ và nhật ký admin đều đọc MySQL.
Khách sạn mới tạo ẩn cho tới khi bổ sung phòng/ảnh và công khai.
Đơn chuyển `pending → confirmed → checked_in → completed`; pending/confirmed có thể hủy.
Nhận phòng phải nằm trong kỳ lưu trú; hoàn tất từ ngày trả phòng. Đơn đã hủy/hoàn tất không mở lại.
Tồn phòng là tổng phòng trừ mức chiếm dụng cao nhất trong từng đêm của khoảng `[checkin,checkout)`.
Giá đã chốt ở đơn cũ giữ nguyên khi sửa giá phòng; giảm tồn/sức chứa bị chặn nếu ảnh hưởng đơn đang hoạt động.
Các thao tác admin ghi audit trong DB cùng transaction. Nhật ký không có API sửa/xóa từ admin UI.
Hỗ trợ yêu cầu đăng nhập để bảo vệ quyền xem phản hồi; chưa tích hợp gửi email.
Đánh giá chỉ tạo từ đơn của chính khách đã hoàn tất và chỉ công khai sau khi duyệt.
Xem docs/CUSTOMER_SETUP.md cho VNPay, Resend và đối soát hoàn tiền.

## Kiểm thử

Chạy trên DB/container kiểm thử riêng, không chạy fixture trên DB chứa dữ liệu người dùng.

```sh
docker exec web-midterm-admin-web php /app/tests/admin_units.php
ADMIN_TEST_URL=http://127.0.0.1:8001 ADMIN_TEST_DB_CONTAINER=web-midterm-admin-db python3 tests/admin_integration.py
ADMIN_TEST_URL=http://127.0.0.1:8001 python3 tests/admin_browser.py
python3 tests/admin_media.py
```

Python browser test cần Playwright và Chromium ở `/usr/bin/chromium`.
Integration test tạo tài khoản/dữ liệu riêng rồi dọn trong `finally`.
Các test JS cũ `smoke.js`, `flows.js`, `render_check.py` mô phỏng admin/auth bằng localStorage;
chúng chưa được chuyển sang mô hình API mới và không phải bộ nghiệm thu admin hiện tại.
