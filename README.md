# THREEK.COM — Website đặt phòng khách sạn

Đồ án website đặt phòng tại Đà Lạt và Vũng Tàu, gồm giao diện khách hàng,
trang quản trị và API PHP kết nối MariaDB. Tài khoản, đơn đặt phòng, yêu thích,
bình luận và thông báo được lưu trong database; không chỉ lưu ở trình duyệt.

## 1. Chức năng và công nghệ

- Khách hàng: tìm khách sạn, xem phòng, chọn ngày/khách/số phòng, đặt phòng,
  xem và hủy đơn theo điều kiện, yêu thích, bình luận, hồ sơ và hỗ trợ.
- Tài khoản: đăng ký qua OTP email, đăng nhập, đổi/quên mật khẩu, đóng tài khoản.
- Quản trị: khách sạn, phòng, giá/tồn phòng, đơn đặt, đánh giá, hỗ trợ và nhật ký.
- Frontend: HTML, CSS, JavaScript; bản đồ Leaflet/OpenStreetMap.
- Backend: PHP, PDO native prepared statements; MariaDB.
- Email: Gmail SMTP qua PHPMailer hoặc Resend, gửi bằng mail worker.
- VNPay là tích hợp tùy chọn. Chấm bài cơ bản dùng thanh toán tại khách sạn,
  không cần tài khoản cổng thanh toán và không chuyển tiền thật.

## 2. Yêu cầu máy chạy

| Thành phần | Yêu cầu |
| --- | --- |
| PHP | 8.1 trở lên, khuyến nghị 8.3 |
| PHP extensions | pdo_mysql, mbstring, curl, fileinfo, openssl |
| Database | MariaDB 10.4 trở lên, khuyến nghị 10.11 |
| Composer | 2.x, để cài PHPMailer khi dùng SMTP |
| Trình duyệt | Chrome/Edge/Firefox phiên bản hiện hành |
| Internet | Cần cho CDN/font, bản đồ và gửi email |

Có thể dùng PHP/MariaDB trong XAMPP. Kiểm tra đúng phiên bản MariaDB;
SQL migration dùng cú pháp MariaDB, không mặc định coi MySQL là tương đương.
Không dùng Live Server, `python -m http.server` hoặc mở file HTML trực tiếp
để chạy ứng dụng: các cách đó không thực thi PHP.

## 3. Cài source và thư viện

Giải nén source vào một thư mục, ví dụ `C:\xampp\htdocs\web-midterm`.
Mở terminal tại thư mục chứa `README.md`, `composer.json` và `index1.html`:

```sh
php -v
php -m
composer install --no-dev --prefer-dist --optimize-autoloader
```

Nếu Windows chưa nhận lệnh `php`, thêm `C:\xampp\php` vào PATH rồi mở lại
terminal. Composer cài lại thư mục `vendor/` từ `composer.lock`.
Không cần `npm install` để chạy giao diện; Node/npm chỉ cần khi chạy các lệnh test.

## 4. Tạo database và import SQL

Khởi động MariaDB. Mở phpMyAdmin, tạo database `threek_booking` với charset
`utf8mb4`, sau đó **chọn database này** và import lần lượt:

| Thứ tự | File | Mục đích |
| --- | --- | --- |
| 1 | `database/schema.sql` | Cấu trúc ban đầu |
| 2 | `database/seed.sql` | Dữ liệu mẫu nền |
| 3 | `database/admin_migration.sql` | Bảng/cột quản trị |
| 4 | `database/customer_migration.sql` | Đơn, tài khoản, thông báo, email |
| 5 | `database/registration_otp_migration.sql` | Đăng ký qua OTP |
| 6 | `database/account_closure_migration.sql` | Đóng tài khoản/ẩn danh |
| 7 | `database/public_reviews_migration.sql` | Bình luận công khai |
| 8 | `database/osm_location_migration.sql` | Vị trí OpenStreetMap |
| 9 | `database/demo_hotels_ready.sql` | Danh mục cố định 20 khách sạn/60 loại phòng |

File số 9 ẩn khách sạn ngoài danh mục demo nhưng giữ lại bản ghi cũ.
Không import thêm `real_hotels.sql`; đây là dữ liệu tham khảo khác.
Không có `security_migration.sql` trong bản main này, không cần tìm/import file đó.

Có thể import bằng CLI MariaDB thay phpMyAdmin: đăng nhập bằng
`mariadb -h 127.0.0.1 -P 3306 -u root -p`, sau đó:

```sql
CREATE DATABASE threek_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE threek_booking;
SOURCE database/schema.sql;
SOURCE database/seed.sql;
SOURCE database/admin_migration.sql;
SOURCE database/customer_migration.sql;
SOURCE database/registration_otp_migration.sql;
SOURCE database/account_closure_migration.sql;
SOURCE database/public_reviews_migration.sql;
SOURCE database/osm_location_migration.sql;
SOURCE database/demo_hotels_ready.sql;
```

Chạy CLI tại thư mục source để đường dẫn `SOURCE` đúng. Thay port/user theo máy.
Các bước trên dành cho **database mới, trống**. Nếu đã có dữ liệu, sao lưu trước
và chỉ import migration còn thiếu; không chạy lại `schema.sql` lên database đó.

## 5. Cấu hình và chạy website

Code đọc cấu hình từ **biến môi trường**, không tự động đọc file `.env`.
Ví dụ MariaDB local ở cổng 3306, user root không mật khẩu:

**Windows PowerShell:**

```powershell
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3306"
$env:DB_NAME="threek_booking"
$env:DB_USER="root"
$env:DB_PASSWORD=""
$env:APP_BASE_URL="http://127.0.0.1:8000"
$env:ONLINE_PAYMENTS_ENABLED="false"
php -d upload_max_filesize=5M -d post_max_size=6M -S 127.0.0.1:8000 -t .
```

**Linux/macOS — Bash:**

```bash
export DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=threek_booking
export DB_USER=root DB_PASSWORD=''
export APP_BASE_URL=http://127.0.0.1:8000 ONLINE_PAYMENTS_ENABLED=false
php -d upload_max_filesize=5M -d post_max_size=6M -S 127.0.0.1:8000 -t .
```

Thay `DB_PORT`, user và mật khẩu theo MariaDB thực tế. Mặc định trong code là
**3308**, nên cần đặt `DB_PORT=3306` nếu máy dùng cổng phổ biến 3306.
Để terminal này chạy trong lúc sử dụng. Dừng bằng Ctrl+C.
PHP cần quyền ghi `uploads/`; không đặt quyền 777 cho toàn dự án.

Mở lần lượt:

1. <http://127.0.0.1:8000/api/setup-status.php>: `data.ready` phải là `true`,
   `data.missing` là `[]`.
2. <http://127.0.0.1:8000/api/hotels/index.php>: `status` là `success`, có dữ liệu.
3. <http://127.0.0.1:8000/index1.html>: trang chủ.

Dùng thống nhất `127.0.0.1:8000`; không đổi qua lại `localhost` trong cùng phiên.
Nếu chạy bằng Apache/XAMPP thay PHP built-in server, phải cấu hình biến môi trường
cho Apache riêng; biến trong PowerShell không tự truyền vào Apache đang chạy.

## 6. Tạo tài khoản để giảng viên chấm bài (không cần email)

Sau khi import đủ SQL ở mục 4, chọn database `threek_booking` trong phpMyAdmin
và import thêm [database/demo_accounts.sql](database/demo_accounts.sql).
Hoặc trong CLI MariaDB đã chọn database:

```sql
SOURCE database/demo_accounts.sql;
```

| Vai trò | Email đăng nhập | Mật khẩu |
| --- | --- | --- |
| Admin | `admin@gmail.com` | `admin123` |
| Khách hàng A | `a@gmail.com` | `customer123` |
| Khách hàng B | `b@gmail.com` | `customer123` |

Đăng nhập tại `/auth/login.html`. Admin được chuyển vào trang quản trị.
Mật khẩu trong bảng users được băm bằng PHP `password_hash()`.
File có thể import lại: email đã tồn tại được giữ nguyên, không đổi mật khẩu hay quyền.
Nếu email trùng tài khoản cũ, thông tin đăng nhập trong bảng trên chỉ áp dụng khi
bản ghi đó do file này tạo mới. Dùng database local mới để chấm theo hướng dẫn.

Đây là tài khoản **chỉ dùng local để chấm**, không import trên hosting công khai
hoặc database có tài khoản thật. Tạo tài khoản bằng SQL không sửa hoặc bỏ qua
cơ chế OTP của giao diện đăng ký.

## 7. Bật đăng ký OTP và quên mật khẩu qua email (tùy chọn)

Để chấm đăng ký/khôi phục thật, cần địa chỉ gửi email và cấu hình worker.
Nếu chưa cấu hình, đăng ký mới bị chặn; vẫn dùng tài khoản local ở mục 6 để chấm
đặt phòng, quản trị và các chức năng không cần email.

Ví dụ Gmail SMTP: bật xác minh hai bước và tạo mật khẩu ứng dụng cho tài khoản gửi.
Trước khi khởi động PHP server, cấu hình các biến sau trong terminal:

| Biến | Giá trị ví dụ |
| --- | --- |
| `MAIL_TRANSPORT` | `smtp` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_ENCRYPTION` | `tls` |
| `SMTP_USERNAME` | Email Gmail gửi thư |
| `SMTP_PASSWORD` | Mật khẩu ứng dụng, không phải mật khẩu Gmail thông thường |
| `MAIL_FROM` | Cùng email gửi thư |
| `APP_BASE_URL` | `http://127.0.0.1:8000` |

PowerShell đặt từng biến theo mẫu `$env:MAIL_TRANSPORT="smtp"`; Bash dùng
`export MAIL_TRANSPORT=smtp`. Không lưu thông tin bí mật vào source nộp bài.
Kiểm tra `/api/health-config.php`: `data.email` phải là `true`.

Mở terminal thứ hai ở thư mục dự án, đặt **cùng cấu hình DB và email**, rồi chạy:

```sh
php scripts/mail-worker.php
```

Worker xử lý một đợt thư rồi thoát, không tự chạy liên tục. Khi đăng ký và popup OTP
xuất hiện, chạy lệnh worker ngay để gửi thư; chạy lại sau mỗi lần yêu cầu/gửi lại mã.
OTP và link khôi phục hết hạn sau 5 phút. Giữ cùng trình duyệt khi xác minh OTP.
Xem thêm [hướng dẫn OTP](docs/REGISTRATION_OTP_SETUP.md).

## 8. Kịch bản chạy thử/nghiệm thu

1. Đăng nhập customer; mở Đà Lạt/Vũng Tàu, chọn ngày tương lai, số khách và phòng.
2. Chọn khách sạn/phòng còn trống, điền thông tin, chọn **thanh toán tại khách sạn**,
   hoàn thành đặt phòng; ghi lại mã đơn.
3. Vào **Đặt phòng của tôi**, tải lại trang và mở chi tiết: đơn phải còn trong DB.
4. Thử yêu thích, đăng bình luận, cập nhật hồ sơ và gửi yêu cầu hỗ trợ.
5. Đăng xuất, đăng nhập admin; kiểm tra đơn, khách sạn, phòng và phản hồi hỗ trợ.
6. Đăng nhập lại customer để kiểm tra phản hồi; thử hủy đơn đúng điều kiện.
7. Nếu đã bật email, thử đăng ký OTP và quên mật khẩu với email mình sở hữu.

Danh mục demo là dữ liệu học tập, không chứng minh tồn phòng thực tế. Một số khách sạn
chưa có ảnh. Các lựa chọn thanh toán mô phỏng không chuyển tiền; không nhập thẻ thật.
VNPay/hoàn tiền thật cần cấu hình và nghiệm thu nhà cung cấp riêng.

## 9. Đóng gói để nộp

Giữ source ứng dụng, `database/` chứa SQL, `README.md`, `docs/`, `sources/`,
`composer.json`, `composer.lock`, `package.json`, `package-lock.json` và các file test.

Trong **bản sao thư mục nộp bài**, loại bỏ `node_modules/`, `vendor/` ở gốc,
`target/` nếu có, `.git/`, `.vscode/`, `__pycache__/`, log, file tạm, backup,
`.env` và file chứa khóa/mật khẩu thật. Giảng viên khôi phục `vendor/` bằng Composer.
Không xóa bản làm việc đang dùng khi chỉ cần tạo gói nộp.

**Giữ `admin/vendor/leaflet/` và giấy phép đi kèm**: đây là tài nguyên frontend
website tải trực tiếp, khác với `vendor/` Composer ở gốc. Giữ thư mục `uploads/`
nhưng bỏ ảnh cá nhân/ảnh thử không cần thiết. Giữ `api/config/database.php`
(kết nối qua biến môi trường), không đưa cấu hình bí mật từ máy cá nhân vào đó.

## 10. Xử lý lỗi thường gặp

| Hiện tượng | Kiểm tra |
| --- | --- |
| PHP hiện như văn bản/API không chạy | Dùng PHP server/Apache có PHP, không dùng server tĩnh |
| Không kết nối database | MariaDB đã chạy; DB_HOST/PORT/NAME/USER/PASSWORD đúng |
| Thiếu bảng/cột | Import đủ SQL theo đúng thứ tự; xem setup-status |
| `could not find driver` hoặc thiếu mbstring | Bật pdo_mysql/mbstring trong php.ini của PHP đang chạy; khởi động lại |
| Email chưa được cấu hình | Composer, SMTP, MAIL_FROM; hoặc dùng tài khoản local mục 6 |
| OTP không đến | Chạy worker với cùng môi trường, kiểm tra thư rác/TLS/kết nối SMTP |
| Không tải bản đồ/font | Kiểm tra Internet/CDN; không tắt xác minh TLS |
| CSRF/phiên không hợp lệ | Tải lại trang, đăng nhập lại, giữ cùng host/port |
| Upload thất bại | Quyền ghi uploads, ảnh JPEG/PNG/WebP ≤ 5 MB và giới hạn PHP |

## 11. Kiểm thử tự động (dành cho người phát triển)

Cần Docker, Node/npm, Python 3 và Playwright/Chromium theo các test của dự án.
Chạy tại thư mục gốc:

```sh
npm run test:prepare
npm run test:security
npm test
```

Các script dùng container `web-midterm-admin-*` và database thử nghiệm riêng.
Không chạy trên database đang chấm hoặc có dữ liệu thật. Không cần chạy bộ test
để mở website theo các bước 1–8. Chi tiết bảo mật và giới hạn:
[docs/security-hardening.md](docs/security-hardening.md).
