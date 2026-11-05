# THREEK: bản bảo mật để nghiệm thu

Nhánh `feat/security-hardening` được tạo từ main sau bản sửa cookie/session.
Giữ nguyên bố cục, CSS và dữ liệu nghiệp vụ. Không tạo phiên bản có lỗ hổng trên nhánh này.
Không bật VNPay hay gửi email thật.

## Cài đặt bản này

1. Sao lưu database đang dùng.
2. Nếu đã chạy admin_migration.sql và customer_migration.sql, chỉ import thêm
   `database/security_migration.sql` vào đúng database hiện tại trong phpMyAdmin.
   Nếu chưa, chạy ba migration theo thứ tự admin → customer → security.
   Không xóa database, không import lại schema/seed lên dữ liệu đang dùng.
3. PHP 8.1+ với PDO MySQL, mbstring, cURL, fileinfo; MariaDB 10.4+.
4. Tải lại trang bằng Ctrl+F5; JavaScript đã có phiên bản cache mới.

Bảng mới `security_rate_limits` chỉ chứa khóa hash, số lần và mốc hết hạn.
Migration chạy lại được; không sửa người dùng, khách sạn hay đơn hiện có.
Nếu chưa có bảng này, đăng nhập/đăng ký trả thông báo cần nâng cấp DB thay vì bỏ qua giới hạn.

## Cơ chế và kiểm chứng

| Nhóm | Cơ chế | Bằng chứng kiểm thử |
| --- | --- | --- |
| SQL injection | PDO prepare/execute, tắt emulated prepares; identifier động được chọn qua whitelist | Đầu vào SQL không thể đăng nhập hoặc vượt kiểm tra slug; kiểm thử quyền sở hữu/giá/tồn giữ nguyên |
| CSRF | Token ngẫu nhiên 32 byte gắn với PHP session, gửi X-CSRF-Token; token mới sau đăng nhập/đăng ký; Origin được so cả scheme/host/port và chặn Fetch Metadata cross-site | Thiếu/sai/token của phiên khác/token trước đăng nhập bị 403, không đổi DB; Origin null/sai port/sai scheme bị chặn |
| Đăng nhập | JSON-only, giới hạn payload 64 KiB; bộ đếm SQL tồn tại qua việc đổi cookie | 10 lần thử/tài khoản/15 phút; 100 lần thử/IP/15 phút; quá hạn trả 429 và Retry-After; thành công reset bộ đếm tài khoản |
| Chống spam | Đăng ký và khôi phục tối đa 30 request/IP/15 phút, bổ sung giới hạn khôi phục theo tài khoản đã có | Dùng chung bộ đếm SQL, không tin X-Forwarded-For do client gửi |
| XSS | Escape theo ngữ cảnh tại nơi hiển thị, gán textContent/value; giữ nội dung người dùng như văn bản | Browser kiểm tra nội dung HTML trong tên khách sạn, review, hồ sơ, hỗ trợ không tạo phần tử thực thi |
| Phân quyền | Kiểm tra session_version, role từ DB và user_id trên truy vấn dữ liệu | Giả role admin trong localStorage vẫn bị từ chối; truy cập/hủy đơn người khác bị chặn |
| Upload | CSRF + quyền admin; giới hạn 5 MiB, kiểm tra MIME bằng fileinfo và getimagesize, tối đa 8000 mỗi chiều/40 triệu pixel; tên file ngẫu nhiên và phần mở rộng do server chọn | PHP/SVG giả đuôi PNG bị từ chối, không có ảnh mới trong SQL; ảnh hợp lệ vẫn upload/xem/đổi cover/xóa được |
| Cookie/session | Host-only, HttpOnly, SameSite=Lax, Secure trên HTTPS, cookie-only/strict mode, đổi ID khi đăng nhập; thu hồi khi đăng xuất/đổi mật khẩu | Kiểm thử session, replay ID cũ và đường dẫn thư mục con |
| HTTP/deploy | API no-store, nosniff, frame deny, referrer/permissions policy; Apache thêm CSP và chặn file nội bộ | Apache thật với file giả chứng minh SQL, .env, thư mục nội bộ và upload PHP không truy cập được; ảnh vẫn tải được |

Client dùng `apiFetch()` để lấy token trước khi ghi. API admin giữ token riêng đang có;
đây cũng là token gắn phiên, không thay thế kiểm tra quyền. Token không truyền trong URL
hoặc lưu localStorage. Không có CORS cho website khác.
API `api/db-check.php` chỉ dành cho admin và không trả tên database.
JSON lỗi/array thay vì object, payload quá lớn và đăng nhập qua form cross-site bị từ chối.
PHP lỗi nội bộ ghi log phía server, không in stack trace vào response.

## Cấu hình khi deploy

Dùng Apache 2.4, bật **mod_rewrite**, **mod_headers** và cho phép `.htaccess`
(AllowOverride phù hợp, thường All). Upload cả file ẩn `.htaccess` ở root và các thư mục
api/config, api/shared, database, scripts, tests, docs, uploads. Root sẽ từ chối truy cập
nếu thiếu mod_rewrite, tránh lộ các thư mục nội bộ.

Chỉ upload các file ứng dụng cần thiết. Không đưa .git, node_modules, SQL backup,
file chứa khóa hoặc thông tin thật vào document root. Dù có rule chặn, backup vẫn phải
lưu ngoài thư mục web. Chỉ cho PHP ghi uploads và thư mục session/cache cần thiết;
không dùng chmod 777 cho toàn dự án.

Bật SSL trên hosting và buộc HTTPS ở cấu hình hosting. Nếu qua reverse proxy,
chỉ web server tin cậy mới được truyền trạng thái HTTPS/IP thật đến PHP. Code không tự
sử dụng X-Forwarded-For để tránh giả IP vượt giới hạn; nếu nhiều người dùng bị gom IP
qua proxy, phải cấu hình REMOTE_ADDR tại web server. Không tự tin header từ Internet.
HSTS được bật khi server nhận HTTPS, không áp dụng cho localhost HTTP.

CSP hiện là **baseline tương thích UI cũ**: chặn object, framing, giới hạn nguồn script,
base-uri và form-action. UI còn inline script/event handler nên script-src vẫn có
unsafe-inline. Không coi CSP này là lớp chặn mọi XSS; escape tại nơi hiển thị là lớp chính.
Chuyển sang strict CSP bằng nonce/hash và gỡ inline handler là hướng nâng cấp tiếp,
không được tuyên bố đã hoàn tất trong bản này.

PHP built-in server bỏ qua `.htaccess`; chỉ dùng local/test, không public trực tiếp.
Nginx cũng không đọc `.htaccess`: phải chuyển rule vào cấu hình Nginx trước khi deploy.
`api/setup-status.php` dùng chẩn đoán cài đặt: trên server công khai hãy giới hạn bằng
web server/IP hoặc tắt sau nghiệm thu; nó không trả thông tin đăng nhập hay dữ liệu khách.
Tắt PHP display_errors và giữ log ở ngoài thư mục công khai (API cũng tắt display_errors).

Giới hạn thử theo tài khoản có thể gây khóa tạm nếu người khác cố tình thử sai; dùng khoảng
chờ 15 phút, không khóa vĩnh viễn hoặc tự đổi mật khẩu. Chưa triển khai MFA/CAPTCHA/WAF.

## Chạy kiểm thử

```sh
npm run test:prepare
npm test
```

Chỉ dùng các container/database thử nghiệm riêng `web-midterm-admin-*`, với thông tin
provider giả, không giao dịch/gửi mail thật. Nhóm test:security reset bộ đếm giới hạn trong
DB thử nghiệm để các lần chạy lặp không khóa nhầm fixture. Không chạy các script kiểm thử
này trên database sử dụng thật.

`tests/server_security.py` dùng image httpd:2.4, bind 127.0.0.1:8002 và chỉ mount file giả.
`tests/security_browser.py` áp CSP từ cấu hình Apache vào response HTML để kiểm tra luồng
đang dùng trên trình duyệt. Apache fixture kiểm chứng directive thực; nghiệm thu HTTPS,
quyền thư mục và cấu hình hosting vẫn thực hiện lại tại nơi deploy.

Đây là các kiểm thử cụ thể cho phạm vi đã liệt kê, không phải chứng nhận không còn mọi lỗ hổng.
Nhánh demo có lỗ hổng và database demo sẽ được tạo riêng sau khi duyệt bản này;
không merge code có lỗ hổng trở lại main.
