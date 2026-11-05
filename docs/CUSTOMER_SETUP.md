# Customer + Admin: cài đặt và nghiệm thu

## Nâng cấp database đang có

Sao lưu DB trong phpMyAdmin trước. Giữ database từ SQL_3K.sql của nhóm;
import theo thứ tự `database/admin_migration.sql`, `database/customer_migration.sql`, rồi
`database/security_migration.sql`. Nếu đã chạy admin/customer, chỉ cần thêm migration security. Các migration chạy lặp lại được trên MariaDB 10.4+.
Không import schema.sql hoặc seed.sql đè lên DB đang dùng.

DB mới: tạo database utf8mb4, import schema.sql → seed.sql → admin_migration.sql → customer_migration.sql → security_migration.sql.
PHP 8.1+ (khuyến nghị 8.3), PDO MySQL, mbstring, cURL; cấu hình DB trong biến môi trường như docs/ADMIN_SETUP.md.
Không mở HTML bằng file:// và không dùng server tĩnh Python.

## Luồng đã kết nối SQL

- Đăng ký/đăng nhập bằng phiên PHP; hồ sơ, đổi mật khẩu, đăng xuất và thu hồi phiên khi đặt lại mật khẩu.
- Danh sách khách sạn chỉ lấy dữ liệu đang bán, giá và sức chứa từ MySQL.
  Nút Tìm kiếm kiểm tra tồn theo từng đêm; lọc tên/loại/tiện nghi và sắp xếp giữ bố cục hiện có.
- Chi tiết và checkout dùng được với khách sạn/phòng mới do admin thêm, không phụ thuộc mã phòng demo.
- Tiền phòng, coupon, thuế và tồn tính lại trên server. Mã request chống tạo đơn trùng khi thử lại.
  Nếu giá thay đổi so với báo giá đã xem, khách phải xác nhận báo giá mới.
- Thông tin khách nhận phòng, email, điện thoại, ghi chú, giá và điều kiện hủy được lưu theo đơn.
- Thành công/chi tiết/lịch sử/tra cứu chỉ đọc đơn thuộc phiên đăng nhập, tải lại trang vẫn giữ dữ liệu.
- Yêu thích, thông báo và trạng thái đã đọc lưu trong DB theo tài khoản.
- Đánh giá chỉ từ đơn đã hoàn tất, duyệt ở admin; hỗ trợ và phản hồi đồng bộ SQL.
- Thanh toán tại khách sạn hoạt động mà không cần merchant VNPay hoặc dịch vụ email.
- Website hiện yêu cầu đăng nhập để đặt/tra cứu; không cấp quyền bằng mã đơn + thông tin đoán được.

## VNPay: chưa bật giao dịch thật nếu chưa có merchant

`ONLINE_PAYMENTS_ENABLED=false` là mặc định. Cần đăng ký merchant VNPay và có website HTTPS công khai.
Thử trên sandbox trước, sau đó nhận cấu hình production từ VNPay. Không đưa khóa vào Git/chat hoặc JavaScript.
Cấu hình ở môi trường máy chủ hoặc Apache ngoài web root:

| Biến | Ý nghĩa |
| --- | --- |
| APP_BASE_URL | URL HTTPS gốc của ứng dụng, bao gồm thư mục con nếu có, không có dấu / cuối |
| VNPAY_TMN_CODE | Mã merchant do VNPay cấp |
| VNPAY_HASH_SECRET | Khóa HMAC thực trên server; không dùng placeholder của proxy HTTPS để ký |
| VNPAY_GATEWAY_URL | Sandbox: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html ; production theo merchant: https://pay.vnpay.vn/vpcpay.html |
| ONLINE_PAYMENTS_ENABLED | Chỉ đặt true sau khi cấu hình và kiểm thử merchant |

Đăng ký Return URL `APP_BASE_URL/api/payments/return.php`
và IPN URL `APP_BASE_URL/api/payments/ipn.php` với merchant VNPay.
IPN phải truy cập được từ Internet; localhost không nhận được IPN của VNPay.
Phiên thanh toán giữ phòng tối đa 15 phút. Server tạo chữ ký SHA-512 theo tham số VNPay 2.1.0.
IPN kiểm tra chữ ký, merchant, số tiền và mã đơn; xử lý lặp an toàn.
Browser return chỉ điều hướng, không được đánh dấu đã thanh toán.
Giao dịch trễ sau khi phòng đã được bán lại chuyển sang `paid_requires_review`, không tự xác nhận vượt tồn.
Đơn chờ quá hạn được loại khỏi tính tồn; thao tác mở lại VNPay sẽ báo hết hạn.
Thanh toán thất bại hủy đơn chờ và giải phóng phòng.
Khách hủy đơn đã trả tiền hợp lệ sẽ tạo yêu cầu hoàn tiền; admin thực hiện hoàn tiền trên cổng merchant,
sau đó ghi mã tham chiếu vào tab Thanh toán để đối soát. Ứng dụng chưa gọi API hoàn tiền tự động.
Dữ liệu kiểm thử có chữ ký không thay thế nghiệm thu một giao dịch sandbox/production thật với VNPay.

Tham khảo chính thức: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
Mạng cloud hiện chặn truy cập tài liệu này; cần đối chiếu cấu hình merchant/callback với VNPay khi kích hoạt.

## Resend: email thật và khôi phục mật khẩu

Cần tài khoản Resend, domain gửi đã xác minh DNS, `RESEND_API_KEY` và `MAIL_FROM` thuộc domain đó.
`APP_BASE_URL` phải là URL HTTPS thật để tạo liên kết khôi phục. Không dùng giá trị example.invalid của test.
Resend dùng HTTPS api.resend.com với TLS verification. Trong cloud có thể dùng binding khóa qua proxy HTTPS;
trên máy chủ riêng, cấu hình khóa trong biến môi trường. PHP nhận CA trust qua CURL_CA_BUNDLE nếu cần.

Email được ghi vào bảng mail_outbox rồi gửi bằng worker CLI (không có endpoint HTTP để gửi hàng loạt):

```sh
php scripts/mail-worker.php
```

Chạy worker mỗi phút bằng cron/Task Scheduler với đúng các biến môi trường và cùng database.
Worker gửi tối đa 20 email mỗi lần, thử lại tối đa 5 lần, cách nhau ít nhất 1 phút,
và dùng Idempotency-Key của Resend để tránh gửi trùng khi mạng lỗi.
Kiểm tra status/attempts/last_error trong mail_outbox; nội dung email được xóa sau khi gửi thành công.
Không bật worker trên DB kiểm thử chứa email giả.

Khôi phục mật khẩu gửi liên kết qua email, hiệu lực 30 phút, dùng một lần; bảng password_resets chỉ lưu hash token.
Liên kết nằm tạm trong hàng đợi email để worker gửi; nội dung hàng đợi được xóa sau khi gửi thành công.
Tối đa 3 yêu cầu trong 15 phút/tài khoản; phản hồi không tiết lộ email có tồn tại.
Thay mật khẩu làm mất hiệu lực các phiên cũ; liên kết khôi phục không trả token qua API công khai.
Không có chức năng hiển thị OTP công khai như bản demo cũ.

## Kiểm thử đã bổ sung

Chạy trên container/DB kiểm thử riêng, không chạy fixture trên DB của nhóm:

```sh
sh scripts/start-test-environment.sh
python3 tests/customer_integration.py
python3 tests/customer_browser.py
python3 tests/admin_integration.py
python3 tests/admin_browser.py
python3 tests/admin_media.py
```

Customer integration dùng VNPAY_TMN_CODE=TESTONLY và khóa giả chỉ kiểm thử,
APP_BASE_URL=https://example.invalid, ONLINE_PAYMENTS_ENABLED=true, Resend key giả để kiểm tra hàng đợi.
Không có giao dịch hoặc email thật được thực hiện trong các bài test.
Có thể chạy cùng bộ kiểm tra bằng `npm run test:prepare` rồi `npm test` trong môi trường Linux có Docker, Python 3, Playwright và Chromium.
Các test admin/demo cũ dùng localStorage không phải bộ nghiệm thu customer hiện tại.

## Chạy trên XAMPP và xử lý vòng đăng nhập

Website trong thư mục con được hỗ trợ, ví dụ:
`http://localhost:8083/3kbooking_midterm/`.
Chưa đăng nhập mà chọn phòng sẽ mở login với `next` chứa đúng phòng/ngày đã chọn;
sau đăng nhập thành công phải quay lại chính phòng đó.
Dùng nhất quán cùng hostname/cổng/thư mục, không đổi giữa localhost và 127.0.0.1.
Không mở trang bằng Live Server hoặc file:// vì các API PHP cần Apache.

Mở `api/setup-status.php` dưới URL gốc của project để kiểm tra PHP, pdo_mysql,
mbstring, kết nối DB và các cột/bảng còn thiếu. Kết quả `ready=true` xác nhận các
prerequisite được kiểm tra đã đủ; trang không trả mật khẩu hoặc dữ liệu tài khoản.
Nếu thiếu migration, sao lưu DB và import admin_migration.sql rồi customer_migration.sql.
Không xóa DB hoặc nhập schema.sql đè lên dữ liệu.
Nếu kết nối DB lỗi, đối chiếu port MySQL thực tế trong XAMPP với DB_PORT (mặc định 3308).
Tài khoản đăng nhập phải tồn tại trong bảng users; tài khoản chỉ có trong localStorage
của demo cũ không phải tài khoản SQL và không thể dùng để đăng nhập bản này.

PHP session dùng cookie riêng THREEKSESSID, giới hạn theo thư mục ứng dụng để tránh
lẫn phiên với project PHP khác. Sau lần cập nhật này, đăng nhập lại một lần.
JavaScript có phiên bản mới để tránh browser tiếp tục dùng bản cũ trong cache.
Lỗi API/migration không bị biến thành trạng thái chưa đăng nhập; nút chọn phòng chờ
server xác minh phiên. Phản hồi 401 cũ không được xóa phiên mới vừa đăng nhập.
Không cần localStorage để xác thực: cookie PHP vẫn là nguồn xác thực phía server.

Giai đoạn hiện tại dùng thanh toán tại khách sạn; chưa cần cấu hình VNPay hoặc email.
Các lựa chọn dịch vụ chưa kích hoạt được ẩn, khôi phục email chưa bật sẽ hướng dẫn liên hệ quản trị viên.
Kiểm thử hồi quy đăng nhập và triển khai thực dưới thư mục con: `npm run test:auth`.
Khi chưa cấu hình email, đặt phòng tại khách sạn không tạo hàng đợi email; email không phải điều kiện để lưu đơn.

## Giữ giao diện gốc cho đặt phòng, thanh toán và biên nhận

Các bố cục Booking, thanh toán, trang xác nhận và chi tiết đơn được khôi phục theo
bản trước khi tích hợp customer (commit 86d1214). Các tệp CSS giữ nguyên; thay đổi
chỉ ở lớp nạp dữ liệu, xử lý nút và thông báo trạng thái thực tế.

Thanh bước, thông tin khách, chính sách hủy, mã giảm giá, bảng chi tiết giá và tóm tắt
đặt phòng vẫn dùng giao diện cũ. Giá/tồn lấy từ API; tạo đơn, xem lại và hủy đọc/ghi SQL.
Trang thanh toán có thể tải lại bằng `payment/payment.html?code=...` để xem xác nhận
đã lưu mà không cần đơn trong localStorage. Trang biên nhận và nút In giữ bố cục cũ.

VNPay và email tạm hoãn. Các lựa chọn thẻ/chuyển khoản/MoMo/ZaloPay trong giao diện gốc
chỉ là mô phỏng; không thu tiền, không gửi số thẻ/CVV lên server và không ghi nhận đã trả tiền.
Chỉ nhập thẻ thử nghiệm 4111 1111 1111 1111 khi thử phần giao diện thẻ.
SQL lưu phương thức minh bạch `card_demo`, `bank_demo`, `momo_demo`, `zalopay_demo`,
trạng thái thanh toán vẫn `unpaid`. Trả tại khách sạn lưu `hotel`.
Không cần migration mới cho lần khôi phục UI này; vẫn cần các migration đã bàn giao.


## Điều hướng giữ thông tin thao tác

- Chi tiết khách sạn có nút về danh sách; URL mang theo ngày, số khách/phòng,
  từ khóa, sắp xếp và bộ lọc để khôi phục khi quay lại (không phụ thuộc history).
- Đặt phòng có nút về khách sạn; lưu bản nháp biểu mẫu trong sessionStorage.
  Thanh toán có nút sửa thông tin, giữ request key khi thông tin đơn không đổi.
  Không lưu số thẻ/CVV vào bản nháp.
- Sau khi xác nhận có đường dẫn trực tiếp đến chi tiết đơn.
- Biểu mẫu admin có nút về danh sách ở đầu; giữ từ khóa lọc khi đóng/chuyển tab
  hoặc lưu. Khi rời chỉnh sửa khách sạn/loại phòng có dữ liệu chưa lưu sẽ hỏi lại.
- Giữ CSS và cấu trúc trang hiện tại; không thay đổi SQL hoặc cấu hình email/VNPay.


## Cookie và phiên đăng nhập

THREEK đã dùng PHP session phía server, không dùng localStorage để cấp quyền.
`api/config/session.php` tập trung cấu hình cookie `THREEKSESSID`:

- Chỉ nhận ID phiên qua cookie; strict mode từ chối ID không tồn tại, không truyền ID qua URL.
- `HttpOnly`, `SameSite=Lax`, cookie host-only và Path theo thư mục cài đặt
  (ví dụ `/3kbooking_midterm/` trên XAMPP).
- `Secure` bật khi PHP nhận request HTTPS; HTTP local vẫn đăng nhập được.
- Cookie lifetime = 0 (session cookie), chưa có chức năng ghi nhớ đăng nhập dài hạn.
  Thời gian lưu session phía server do PHP/hosting quản lý; đây không phải tính năng
  tự đăng xuất sau một số phút cố định. Trình duyệt có thể khôi phục session cookie
  khi bật tính năng khôi phục phiên; dùng Đăng xuất để kết thúc phiên ngay.
- Đăng ký/đăng nhập đổi mã phiên và xóa trạng thái xác thực/CSRF của lần đăng nhập trước.
- Đăng xuất, xóa tài khoản và phát hiện session_version hết hiệu lực đều hủy dữ liệu phiên
  và xóa cookie với cùng Path/SameSite. Đổi mật khẩu giữ phiên hiện tại và vô hiệu phiên khác.
- API đăng nhập/đăng ký không cho cache phản hồi chứa thông tin người dùng.

Khi deploy sau reverse proxy kết thúc TLS, cần cấu hình web server/FastCGI để PHP
nhận đúng HTTPS từ proxy đáng tin cậy. Ứng dụng không tự tin các header forwarded
mà người dùng Internet có thể tự gửi. Giữ tất cả trang và API cùng origin;
không đổi qua lại `localhost`/`127.0.0.1` khi đang đăng nhập.

Bản sửa cookie/session trước đây không cần migration; bản bảo mật hiện tại cần
`database/security_migration.sql`. Kiểm thử: `npm run test:auth`, bao gồm HTTP API thực,
cấu hình PHP cho HTTPS và luồng chạy dưới thư mục con. Kiểm tra HTTPS end-to-end
trên hosting vẫn cần thực hiện sau khi bật SSL.


## Nhánh bảo mật bổ sung

Với bản `feat/security-hardening`, cần import thêm `database/security_migration.sql`
(chỉ bổ sung bảng bộ đếm; không xóa dữ liệu). Xem [SECURITY.md](SECURITY.md) để cấu hình
Apache, CSRF, giới hạn đăng nhập và chạy kiểm thử. Các ghi chú "không cần migration mới"
ở các phần UI/session phía trên chỉ áp dụng cho những bản sửa đó.
