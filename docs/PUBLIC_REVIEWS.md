# Bình luận và đánh giá khách sạn không cần đặt phòng

Nhánh `feature/public-hotel-reviews` được tạo từ main. Chỉ cần tài khoản đăng nhập
đang hoạt động để chấm 1–5 sao và viết bình luận 1–1500 ký tự. Có thể đăng nhiều
nhận xét; không yêu cầu có đơn, trạng thái hoàn tất hoặc từng lưu trú. Khách chưa
đăng nhập vẫn đọc được và có link đăng nhập quay lại đúng trang khách sạn.

Đánh giá được công khai ngay. User xóa được đánh giá của chính mình; admin xóa được
mọi đánh giá, kể cả đánh giá không gắn đơn đặt phòng. Xóa sẽ gỡ cả nội dung và điểm
sao của dòng đó, không thể khôi phục. Điểm trung bình và số lượng được tính lại từ
các đánh giá công khai. Danh sách có phân trang 20 dòng, thống kê tính trên toàn bộ
đánh giá, không chỉ trang đang xem.

Không còn duyệt/từ chối hoặc bộ lọc chờ duyệt trong admin. API duyệt cũ trả 410;
API operations từ chối các thao tác đổi trạng thái duyệt. Quyền xóa được kiểm tra
trên server, không tin user_id/role từ client. Admin cần CSRF token khi xóa; thao
tác xóa của admin ghi audit không lưu lại nội dung bình luận. Bình luận render
bằng text đã escape, không cho chạy HTML/script. Tài khoản bị đóng không thể đăng
hoặc xóa tiếp bằng phiên cũ; luồng ẩn nội dung khi đóng tài khoản vẫn giữ nguyên.

## Cập nhật hosting khi muốn thử

Website đang chạy main không tự đổi theo nhánh này. Sao lưu database trước.
Qua SSH, trong checkout sạch:

```sh
cd /home/threekbooking/www/web-midterm
git status --short
git remote set-branches --add origin feature/public-hotel-reviews
git fetch origin
git switch feature/public-hotel-reviews
git pull --ff-only origin feature/public-hotel-reviews
```

Nếu git status có thay đổi cục bộ, giữ lại và xử lý trước, không reset/clean.
Không có dependency Composer/npm mới cho tính năng này.

Trong phpMyAdmin, **chọn database threekbooking_booking trước**, rồi Import file
`database/public_reviews_migration.sql` từ nhánh này. Không import ở cấp server.
File chạy lặp lại được trên MariaDB; không nhập lại schema.sql hoặc seed.sql.
Migration cần các migration trước của main, gồm account_closure_migration.sql.

Migration giữ dữ liệu cũ, cho phép reviews.booking_id=NULL, đổi trạng thái mặc
định thành approved và công khai những review đang pending của tài khoản hoạt
động. Những review rejected/đã ẩn trước đây vẫn ẩn để tránh đăng lại nội dung đã
bị gỡ; admin có thể xóa các dòng này. Liên kết booking_id cũ không bị xóa.

Mở /api/setup-status.php: cần ready=true và missing=[]. Nếu chưa import,
setup-status báo reviews.booking_id (nullable); API tạo review trả 503 với code reviews_migration_required, log chỉ rõ file cần import.
Hard reload trang hotel và admin để tải JS mới. Giữ nguyên DB, Gmail và cron.

## API hiện tại

- GET api/reviews/index.php?city=dalat&hotelId=slug&page=1: danh sách, count,
  average, page/pageSize và các cờ canReview/isAdmin/canDelete từ PHP session.
- POST api/reviews/create.php: {city, hotelId, score, comment}; cần đăng nhập.
  user_id, role, status hay booking code từ client không cấp quyền.
- POST api/reviews/delete.php: {id}; owner hoặc admin. Admin gửi X-CSRF-Token.
- Admin GET operations.php?section=reviews dùng LEFT JOIN booking nên review mới
  không cần đơn vẫn xuất hiện. POST {id, action:"delete"} để xóa với CSRF token.
- GET eligibility.php?city=...&hotelId=...: xác nhận eligible=true với user đăng
  nhập; không kiểm tra đơn và trả requiresBooking=false.

## Kiểm thử

Runtime test/database Docker cô lập, không chạy fixture trên hosting:

```sh
sh scripts/start-test-environment.sh
npm run test:reviews
npm test
```

Test API và Chromium/mobile kiểm tra không có booking vẫn đăng được, công khai
ngay, nhiều bình luận, phân quyền owner/admin/guest, chống giả mạo role/user_id,
CSRF, HTML không thực thi, xóa và cập nhật thống kê, legacy migration/phân trang.
Bộ hồi quy đóng tài khoản vẫn kiểm tra yêu cầu review chờ khóa user không ghi
được dữ liệu sau khi tài khoản đã đóng.

Nghiệm thu hosting bằng tài khoản thử: user A đăng review → guest thấy ngay →
user B không có nút xóa và bị chặn nếu gọi API → A xóa review của mình → admin
xóa review A tạo lại → reload kiểm tra điểm/số lượng. Giữ main cho tới khi chốt
nhánh này; chưa cần sửa bất kỳ cấu hình thanh toán nào.
