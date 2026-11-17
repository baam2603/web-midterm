# Đăng ký bằng OTP email 6 số

Nhánh phát triển: `feature/register-email-otp`, tạo từ `main`.
Tài khoản đã có giữ nguyên và đăng nhập như trước. Đăng ký mới chỉ tạo dòng `users`
sau khi OTP đúng; trước đó không có phiên đăng nhập mới. Không có OTP demo hiển thị
trên giao diện, trong response API hoặc localStorage.

## Cài trên hosting khi muốn thử nhánh

Sao lưu database và tạm dừng cron gửi mail trong panel. Kiểm tra Git working tree
trên hosting trước; giữ nguyên mọi thay đổi cục bộ. Với checkout sạch:

```sh
cd /home/threekbooking/www/web-midterm
git remote set-branches --add origin feature/register-email-otp
git fetch origin
git switch feature/register-email-otp
git pull --ff-only origin feature/register-email-otp
composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
```

Import **chỉ** `database/registration_otp_migration.sql` vào database đang dùng
bằng phpMyAdmin, hoặc dùng CLI với user/host database của hosting. File này thêm hai
bảng và cột expiry của hàng đợi, chạy lại được trên MariaDB; không xóa/sửa users,
đơn hàng hoặc mật khẩu hiện tại. Không import lại schema.sql/seed.sql.

Giữ nguyên DB_*, APP_BASE_URL và cấu hình Gmail SMTP ở cả website lẫn cron.
Mở `/api/setup-status.php`: cần ready=true, missing=[]. Mở
`/api/health-config.php`: cần email=true. Nếu thiếu migration, API phải báo lỗi
cập nhật database thay vì tự bỏ qua bước OTP. Bật lại đúng một cron, lệnh vẫn là:

```sh
php /home/threekbooking/www/web-midterm/scripts/mail-worker.php
```

Hard reload trang đăng ký để dùng JS mới. Không bật worker thật trên DB kiểm thử.
Không cần đổi tên miền hoặc tạo API key mới.

## Luồng và giới hạn

- Điền thông tin đăng ký → HTTP 202 → popup nhập OTP, chưa tạo tài khoản.
- OTP 6 chữ số được tạo ngẫu nhiên trên server, hiệu lực 5 phút **từ lúc yêu cầu**.
  Hãy chờ khoảng 1–2 phút cho cron/email, kiểm tra thư rác.
- Gửi lại sau 60 giây, tối đa 3 mã/email/15 phút. Chỉ mã mới nhất hợp lệ.
- Tối đa 5 lần nhập sai/email trong cửa sổ 15 phút; đổi trình duyệt, đăng ký lại
  hoặc gửi lại trong cùng cửa sổ không xóa bộ đếm. Sau 15 phút có thể yêu cầu mã mới.
- Giới hạn thêm 10 email OTP/IP/15 phút để giảm lạm dụng; chỉ dùng REMOTE_ADDR do
  máy chủ cung cấp, không tin header IP do khách gửi.
- Mã chỉ xác minh trong cùng PHP session đã yêu cầu. Reload trang mở lại popup;
  nếu đổi trình duyệt hoặc phiên đã mất cần đăng ký lại.
- Mã đúng → tạo tài khoản customer, đổi ID phiên, xác nhận session rồi quay về URL
  khách hàng đã chọn. Link ngoài project hoặc admin không được dùng làm return URL.
- Tắt email/missing Composer sẽ chặn đăng ký mới; không có nhánh bỏ qua OTP.

## Lưu trữ và gửi thư

Bảng đăng ký tạm chỉ giữ mật khẩu/OTP đã băm. Mã gốc tồn tại tạm trong nội dung
email để worker gửi, không dùng để xác thực trực tiếp từ DB. Worker xóa nội dung
sau gửi thành công; bỏ thư quá hạn trước khi gửi. Gửi lại hoặc xác minh thành công
xóa thư OTP cũ khỏi hàng đợi. Khi thành công dữ liệu hồ sơ tạm/OTP hash được xóa.
Worker xóa dữ liệu hồ sơ tạm sau 15 phút kể từ lần gửi mã gần nhất và dọn bản ghi giới hạn cũ sau 1 ngày.
OTP không được dùng để đăng nhập, khôi phục mật khẩu hoặc cấp quyền admin.

## Kiểm thử

Trên runtime Docker cô lập (không chạy các test trên database hosting):

```sh
sh scripts/start-test-environment.sh
npm run test:registration
npm test
npm run test:mail
```

Fixture đọc OTP từ **hàng đợi test** để xác minh qua API thật; production không có
endpoint đọc mã và không có biến môi trường tắt xác minh. Kiểm thử kiểm tra chưa
xác minh không tạo user, cookie phiên, mã sai/hết hạn/đã dùng, cooldown/gửi lại,
giới hạn theo email/IP, popup desktop/360px, reload và URL quay lại.

Trên hosting dùng email người nhận do bạn kiểm soát: kiểm tra popup → nhận thư →
nhập sai → nhập đúng → đăng nhập lại; thử resend và mã cũ, chờ hơn 5 phút thử mã
hết hạn. Đăng nhập admin/customer cũ và thử đặt phòng để kiểm tra hồi quy.
Trước khi merge vào main, nghiệm thu email thật trên nhánh này.
