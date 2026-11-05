# Deploy bản thử PHP + MariaDB và email quên mật khẩu

## 1. Chọn hosting

Với bản demo này, cách ít vận hành nhất là shared hosting có cPanel hoặc DirectAdmin.
Trước khi mua, xác nhận gói có PHP 8.1+ (khuyến nghị 8.3), MariaDB 10.4+,
PDO MySQL, mbstring, cURL, fileinfo, HTTPS, cron mỗi phút và cho phép HTTPS ra api.resend.com.
Cần cấu hình biến môi trường cho cả PHP web và PHP CLI/cron. Không dùng hosting chỉ phục vụ HTML tĩnh.
Resend chỉ gửi email, không lưu/chạy website hoặc database.

### Nếu ưu tiên miễn phí

Ứng viên để kiểm tra trước là alwaysdata, vì mô hình shared hosting phù hợp với PHP + MariaDB của dự án. Chưa xác minh được điều kiện gói hiện hành: trong phiên làm việc này proxy trả 403 khi đọc trang giá/tài liệu chính thức. Không coi tên gói hoặc các giới hạn dung lượng, cron và outbound HTTPS là đã được xác nhận.

Trước khi đăng ký, kiểm tra tại https://www.alwaysdata.com/en/pricing/ và trong panel:

- Gói miễn phí có PHP 8.1+ và MariaDB tương thích migration `ADD COLUMN IF NOT EXISTS` hay không.
- Có HTTPS cho subdomain được cấp và task định kỳ mỗi phút hay không.
- PHP web và CLI/task có đọc được cấu hình môi trường và gọi HTTPS tới api.resend.com hay không.
- Dung lượng có tính chung database, email và log không. Tài nguyên website được theo dõi hiện khoảng 38 MiB, chưa tính database và ảnh upload; không upload .git.
- Điều kiện sử dụng cá nhân/phi thương mại, thời hạn và chính sách ngủ/ngừng tài khoản.

Nếu gói thiếu cron hoặc chặn HTTPS tới Resend, chưa dùng gói đó để nghiệm thu quên mật khẩu. Có thể deploy luồng đăng nhập/đặt phòng trước với email tắt, rồi đổi phương án email sau.

Resend không thay thế hosting. Khi chưa có domain gửi đã xác minh, có thể thử luồng email với địa chỉ nhận của chính chủ tài khoản theo giới hạn test hiện hành của Resend; đó chưa phải gửi email quên mật khẩu cho mọi người dùng. Subdomain website do hosting cấp không tự động cấp quyền DNS để xác minh domain gửi trên Resend. Không tạo API key hoặc trả phí trước khi xác nhận các điều kiện này.

## 2. Đưa ứng dụng lên bản thử

- Dùng nhánh đã kiểm thử. Upload source và tài nguyên cần cho website, bao gồm các thư viện frontend đang được dự án sử dụng.
- Không upload .git, file SQL sao lưu, log, file chứa khóa hoặc cấu hình database từ máy khác vào thư mục công khai.
- Cấu hình web server chặn truy cập trực tiếp thư mục database/, docs/, tests/, scripts/ và các tệp ẩn. Cron vẫn cần truy cập scripts/ từ filesystem.
- Tạo database và user riêng, chỉ cấp quyền cho database của ứng dụng. Không dùng root/mật khẩu rỗng của runtime test.
- Với DB mới: nhập database/schema.sql, seed.sql, admin_migration.sql rồi customer_migration.sql. Với DB đã có dữ liệu: sao lưu và chỉ chạy các migration còn thiếu; không nhập lại schema/seed.
- Cấu hình DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD theo hosting; DB_PORT mặc định của code là 3308 nên phải đặt đúng cổng nhà cung cấp.
- Bật HTTPS. Cấu hình uploads/ cho PHP ghi được và cấm thực thi PHP/script trong đó. Không dùng quyền 777.
- Đặt ONLINE_PAYMENTS_ENABLED=false; chưa cần merchant VNPay.
- Mở /api/setup-status.php: phải có data.ready=true và missing=[]. Kiểm tra /api/hotels/index.php trả status=success.

Không dùng scripts/start-test-environment.sh hoặc các khóa fixture để cấu hình hosting.
Không chạy npm test trên database deploy: test dành cho database/container cô lập.

## 3. Bật Resend

- Thêm domain gửi email vào Resend và tạo các bản ghi DNS do Resend cung cấp. Chờ domain được xác minh.
- Tạo API key chỉ đủ quyền gửi email. Lưu an toàn ở môi trường hosting, không đưa vào Git, JavaScript hoặc chat.
- Cấu hình RESEND_API_KEY và MAIL_FROM (địa chỉ thuộc domain đã xác minh).
- Đặt APP_BASE_URL là URL HTTPS thật, gồm thư mục con nếu có và không có dấu / cuối.
- Cấu hình cron mỗi phút chạy PHP CLI với đường dẫn tuyệt đối tới scripts/mail-worker.php. Ví dụ cú pháp: `* * * * * /duong-dan/php /duong-dan-project/scripts/mail-worker.php`.
- Thay đường dẫn theo hosting; PHP CLI phải có cùng cấu hình DB, email và APP_BASE_URL như PHP web. Không viết khóa trực tiếp vào dòng cron hoặc log.
- Giữ xác minh TLS. Không chạy worker trên DB kiểm thử chứa email giả.

## 4. Nghiệm thu bản deploy

Dùng tài khoản/email thử do bạn sở hữu:

1. Đăng ký, đăng xuất, đăng nhập sai rồi đúng; tải lại vẫn giữ phiên.
2. Chọn phòng khi chưa đăng nhập: sau đăng nhập phải quay lại đúng phòng/ngày.
3. Cấp role admin cho tài khoản được chỉ định qua quản trị DB; đăng nhập phải vào dashboard. Customer không được truy cập API admin.
4. Yêu cầu quên mật khẩu: nhận email, mở link HTTPS đúng domain, đặt mật khẩu mới.
5. Mật khẩu cũ không đăng nhập được; mật khẩu mới được; phiên đăng nhập trước đó bị thu hồi.
6. Link đã dùng bị từ chối. Kiểm tra link hết hạn bằng cách chờ hơn 5 phút; không sửa trực tiếp DB đang dùng để giả lập.
7. Kiểm tra đăng nhập trên điện thoại và giao diện khi CDN ngoài không tải được.
8. Đặt phòng thanh toán tại khách sạn, tải lại trang xác nhận, xem đơn và hủy theo quyền.

Nếu email không đến, kiểm tra cron/PHP CLI trước, rồi xem status, attempts, last_error trong mail_outbox và sự kiện gửi trên Resend. Không chia sẻ nội dung email chứa token hoặc API key.

VNPay sandbox là bước sau, chỉ làm khi các luồng trên đã ổn. Xem docs/CUSTOMER_SETUP.md để biết cấu hình nhà cung cấp.

## Chuyển hosting từ nhánh API sang main sau khi merge

Đảm bảo merge đã được push lên main. Qua SSH:

```sh
cd /home/threekbooking/www/web-midterm
git status --short
```

Chỉ tiếp tục khi không có thay đổi tracked chưa lưu; nếu có, giữ lại và xử lý
trước, không reset/clean. Checkout ban đầu được clone --single-branch nên cần đổi
nhánh được fetch:

```sh
git remote set-branches origin main
git fetch origin
git switch main
git pull --ff-only origin main
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
git branch --show-current
```

Kết quả cuối phải là main. Dừng nếu bất kỳ lệnh nào báo lỗi. Các biến môi trường
website/cron và dữ liệu database giữ nguyên; không chạy schema/seed hoặc migration
cho lần chuyển này. Sau cập nhật kiểm tra setup-status, đăng nhập admin/customer,
đặt phòng và email khôi phục trên HTTPS. Hạn link mới là 5 phút từ lúc yêu cầu.
