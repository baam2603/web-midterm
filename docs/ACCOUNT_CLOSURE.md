# Đóng tài khoản và giữ lịch sử đặt phòng

Nhánh `fix/account-closure-policy` dựa trên main (bao gồm đăng ký OTP/email hiện tại).
Không gộp nhánh `feat/security-hardening` vào thay đổi này.

## Cài đặt

Sao lưu database, sau đó import `database/account_closure_migration.sql` vào database
hiện tại. Migration chỉ thêm `users.deleted_at`, mặc định NULL cho tất cả tài khoản cũ;
không xóa dữ liệu, không đổi khóa ngoại hoặc bật DELETE CASCADE cho đơn.
MariaDB 10.4+; chạy lặp lại được.

Trước đó cần các migration trên main: admin → customer → registration_otp.
Không cần security_migration.sql cho nhánh này. Không import lại schema/seed lên DB đang dùng.
Khi chưa có cột mới, API chẩn đoán và lỗi DB sẽ hướng dẫn cập nhật.

## Quy tắc

Người dùng chọn Đóng tài khoản tại trang hồ sơ, đọc thông báo và xác nhận bằng mật khẩu
hiện tại. Bố cục và CSS giữ nguyên; chỉ đổi lời giải thích/nút để phản ánh đúng hành vi.

| Tình trạng | Quyết định |
| --- | --- |
| Chưa từng đặt phòng | Cho đóng, vẫn tạo dấu tài khoản đã đóng |
| Đơn pending/confirmed/checked_in | Chặn; cần hủy/hoàn tất hoặc nhờ hỗ trợ xử lý |
| Đã hủy, trả tại khách sạn, unpaid | Cho đóng |
| Đã hoàn tất, trả tại khách sạn, unpaid | Cho đóng; kết thúc lưu trú là mốc nghiệp vụ, hệ thống không tự giả lập ghi nhận thu tiền tại quầy |
| Đã hoàn tất, paid/refunded | Cho đóng nếu sổ giao dịch không còn mục chưa giải quyết |
| Đã hủy, failed/expired/refunded | Cho đóng nếu không còn giao dịch đang chờ |
| refund_requested, paid_requires_review, cancelled+paid | Chặn để đối soát/hoàn tiền |
| Sổ payments còn pending/review/refund_requested hoặc cancelled+paid | Chặn kể cả khi bảng bookings ghi unpaid/refunded |
| Đã hoàn tất nhưng thanh toán online còn unpaid/failed/expired | Chặn để đối soát |
| Tài khoản admin | Không tự đóng qua API này; cần xử lý quyền quản trị bằng người quản lý |

Đơn online pending+unpaid đã hết thời gian giữ chỗ được chuyển cancelled+expired trong
transaction trước khi kiểm tra. Không ghi đè trạng thái hoàn tiền/đối soát. Nếu đã có bản
ghi provider đang pending, vẫn cần hỗ trợ đối soát: hết giữ phòng không đồng nghĩa chắc chắn
không có thanh toán đến trễ. Trạng thái lạ/không rõ không được tự xem là đã giải quyết.
Nếu bị từ chối, transaction rollback, không xóa một phần dữ liệu hoặc thu hồi phiên.
API trả HTTP 409 và data.reason để phân biệt active_bookings/unsettled_payments/admin_account.

## Khi đóng thành công

- Giữ dòng users làm mốc liên kết, đặt deleted_at, tăng session_version, thay email bằng địa
  chỉ ngẫu nhiên @deleted.invalid và password_hash bằng bí mật ngẫu nhiên không cấp cho ai.
- Thay tên bằng “Tài khoản đã đóng”, xóa tên hiển thị/số điện thoại/ngày sinh.
- Giữ mã đơn, ngày ở, khách sạn/phòng, trạng thái, số tiền và bản ghi thanh toán. Ẩn danh
  guest_name/email và xóa guest_phone/note/request_hash trong đơn của tài khoản.
- Gỡ nội dung review, chuyển rejected để không công khai nữa; giữ ID, điểm và liên kết đơn.
- Đóng và gỡ nội dung/phản hồi hỗ trợ của tài khoản. Không giữ liên hệ tự do trong nội dung này.
- Xóa favorites, notifications, password reset và mail_outbox/challenge đăng ký của email cũ.
  Thư đã được nhà cung cấp gửi, bản sao bên ngoài hay backup không được API này thu hồi.
- Ghi audit account.close chỉ chứa ID và số đơn được giữ, không ghi mật khẩu/email cũ.
- Hủy PHP session/cookie của request hiện tại; các phiên khác bị từ chối ở cả auth gate
  người dùng và admin. Trình duyệt xóa cache phiên và bản nháp checkout chứa dữ liệu riêng.

Đây là đóng không khôi phục qua giao diện. Người dùng có thể đăng ký lại email cũ bằng
OTP, nhận user ID mới và không được kế thừa lịch sử/quyền truy cập của ID đã đóng.
Tombstone được giữ cả với tài khoản chưa có đơn; không dùng “đã xóa dòng users” để xác nhận
đóng tài khoản. Admin vẫn xem được lịch sử đơn dưới nhãn khách đã đóng tài khoản.
Nội dung audit vận hành và dữ liệu tài chính cần giữ không bị xóa dây chuyền.

## Tránh chạy đua dữ liệu

Đóng tài khoản và tạo đơn cùng khóa dòng users trước khi thao tác. Tạo đơn kiểm tra
`deleted_at IS NULL` **trong** transaction sau khi lấy khóa, không chỉ kiểm tra session
ở đầu request. Vì vậy:

- Đóng trước: request tạo đơn đã vượt qua xác thực cũ vẫn không thể insert sau khi đóng.
- Đặt trước: đóng chờ transaction tạo đơn, sau đó thấy đơn active và từ chối.

Đóng khóa các dòng đơn/giao dịch khi đánh giá nghĩa vụ. Nếu phát sinh deadlock/lock timeout,
rollback và trả thông báo thử lại, không bỏ qua kiểm tra. Cập nhật hồ sơ/mật khẩu và khôi
phục cũng không cập nhật lại tài khoản đã đóng. Tạo hỗ trợ/review và thay đổi yêu thích
cũng dùng khóa user để không ghi lại nội dung riêng tư sau khi đóng. Login và cả hai auth gate kiểm tra deleted_at.

## Kiểm thử

```sh
composer install --no-interaction
npm run test:prepare
npm run test:closure
npm test
```

Chỉ dùng container/database giả web-midterm-admin-*; không gửi email hoặc giao dịch thật.
Các ca chính: hủy đơn hotel qua UI rồi đóng; sai mật khẩu; đơn active; tiền chưa giải quyết;
OTP đăng ký lại cùng email; phiên trình duyệt khác; ẩn danh SQL; lịch sử admin không mất;
đua HTTP create/close với transaction SQL đang giữ khóa. Các kiểm thử session cũ đã được
cập nhật theo chính sách tombstone thay vì DELETE vật lý.


Lưu ý môi trường nghiệm thu: bộ kiểm thử OTP trên main có bước chạy worker email,
cần PHPMailer đã cài từ composer.lock kể cả khi chỉ dùng SMTP giả. Nếu proxy chặn tải
api.github.com, cần cấp quyền mạng/cài dependency hợp lệ trước khi chạy trọn npm test;
không dùng thư viện giả hoặc bỏ kiểm tra dependency để báo pass. Các ca đóng tài khoản,
race, browser và nghiệp vụ vẫn có thể chạy riêng như trên.
