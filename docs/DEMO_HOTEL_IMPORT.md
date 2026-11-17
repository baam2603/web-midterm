# Dùng bộ 20 khách sạn cố định cho demo

File cần import: **database/demo_hotels_ready.sql**. Đây là file dữ liệu trực tiếp
cho `hotels` và `room_types`, không phải bảng nháp. Không cần import
`real_hotels.sql` trước. File nháp vẫn giữ đầy đủ thông tin tham khảo và trẻ em.

1. Sao lưu database hiện tại bằng Export trong phpMyAdmin.
2. Code/schema cần ở phiên bản main đã có các migration admin, customer, OTP,
   account closure, public reviews và OSM (xem ADMIN_SETUP.md).
3. Chọn database đang dùng (`threek_booking`) → Import → chọn
   `database/demo_hotels_ready.sql` → Go. Không xóa database hoặc import lại seed/schema.
4. Mở trang Đà Lạt/Vũng Tàu, Ctrl+F5; mỗi nơi có 10 khách sạn. Đăng nhập bằng tài khoản
   hiện có, chọn ngày tương lai để thử đặt/hủy. Ảnh sẽ thêm sau trong admin.

File chỉ thêm khách sạn/phòng còn thiếu theo slug/mã phòng. Trên database lần đầu
nhận bộ này sẽ thêm 20 khách sạn, 60 loại phòng, tổng 1084 đơn vị quản lý. ID do SQL
tự cấp. Chạy lại không trùng, không ghi đè giá/tồn phòng hoặc sửa đổi đã lưu. Nếu một
slug/mã phòng đã tồn tại trước đó, bản ghi đó được giữ nguyên, không tự đồng bộ đè.

**Tất cả khách sạn ngoài danh sách 20 khách sạn sẽ bị ẩn**, kể cả bản ghi tự thêm.
Chúng vẫn còn trong admin với đơn hàng, đánh giá, ảnh và tài khoản nguyên vẹn. Có thể
mở lại bằng admin hoặc phục hồi backup. Không tắt khóa ngoại, không DELETE/TRUNCATE.
Dữ liệu cũ không bị xóa, vì vậy admin vẫn thấy chúng; danh sách công khai dùng bộ mới.

Giữ cơ chế hủy backend hiện tại. Không áp dụng mốc phí hủy 3/5/10 ngày, không thu cọc,
không hoàn tiền thật tự động. Phòng Presidential Suite của Best Western giữ quyền
không hoàn hủy khi đã thanh toán. Các phòng khác giữ quyền hoàn hủy như bộ dữ liệu
đã chốt. Mô tả công khai không đưa các điều khoản chưa thực thi vào cam kết.

Backend hiện chỉ có tổng số khách, nên giới hạn phòng demo dùng **số người lớn**
(đa số 2, Penthouse Fusion là 4), không cho phép thay suất trẻ em thành người lớn.
Thông tin 2 người lớn + trẻ em vẫn giữ trong bản nháp; chưa nhận đặt theo tuổi trẻ em.
Tồn phòng là số lượng cố định ban đầu, số còn trống vẫn trừ theo đơn SQL thực tế.

Không tạo ảnh giả, không chép đánh giá bên ngoài, không tự đánh dấu tọa độ đã xác minh
OSM. Tọa độ do người dùng cung cấp vẫn hiển thị theo SQL; nguồn mặc định legacy và
ngày xác minh để trống. Số điện thoại có sẵn lưu trong nội quy vì schema chưa có cột
điện thoại khách sạn. Tiện ích chưa có dữ liệu chắc chắn sẽ bổ sung sau trong admin.

Tái tạo file khi sửa bản nháp: `python3 scripts/data/build_demo_hotels.py`.
