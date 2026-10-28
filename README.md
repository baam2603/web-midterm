# THREEK.COM — bản sửa logic MVP UI

## Chạy website

Website dùng HTML/CSS/JS thuần; không cần cài npm, database hay server backend. Mở thư mục này trong VS Code và chọn **Open with Live Server** ở `index.html` hoặc `index1.html`.

Có thể chạy bằng Python 3 ở thư mục gốc:

```bash
python -m http.server 8000
```

Sau đó truy cập `http://localhost:8000/` (tự chuyển về trang chủ). **Không nên mở trực tiếp bằng file://** vì cơ chế bảo mật trình duyệt và Web Crypto có thể hạn chế tính năng tài khoản.

## Phạm vi đã sửa

- Giữ nguyên toàn bộ CSS gốc. Sửa đường dẫn CSS/JS, link chuyển trang và tên tệp có phân biệt chữ hoa.
- Đồng bộ 16 khách sạn ở danh sách thành phố sang trang chi tiết, phòng và mức giá mẫu; dùng ảnh đã có trong thư mục `sources/`.
- Chuyển thông tin ngày/khách/phòng từ danh sách → khách sạn → form đặt phòng → thanh toán.
- Thêm lớp `common/booking-store.js` cho đơn đặt phòng, đếm phòng trống theo khoảng ngày, tránh tạo đơn trùng, hủy đơn và cập nhật lịch sử.
- Form đặt phòng hỗ trợ số phòng, kiểm tra ngày, số khách, số phòng và tính giá, giảm giá, thuế theo từng đêm.
- Thanh toán **mô phỏng**, trang xác nhận động, xem chi tiết đơn, lịch sử đặt phòng, lịch `.ics`.
- Thêm `common/auth-service.js` cho đăng ký/đăng nhập/đăng xuất demo, lưu hồ sơ, đổi mật khẩu và xóa tài khoản demo; mật khẩu được băm bằng PBKDF2 trong trình duyệt (không phải hệ thống xác thực sản xuất).
- Thêm đường dẫn yêu thích trong menu tài khoản và hoàn thiện điều hướng từ các tấm chọn thành phố.

## Demo từng bước

1. Vào Đà Lạt hoặc Vũng Tàu, chọn ngày/khách/phòng, bấm **Xem phòng**.
2. Chọn một phòng, điền thông tin khách hàng, bấm **Tiếp tục**.
3. Chọn **Thanh toán tại khách sạn** (dễ thử nhất) rồi bấm **Tiếp tục thanh toán**.
4. Trong trang thanh toán demo bấm **Xác nhận đặt phòng**. Sẽ mở trang xác nhận với mã đơn thật trong localStorage.
5. Vào menu **Đặt phòng của tôi**, mở chi tiết hoặc hủy đơn, kiểm tra tab lịch sử.
6. Đăng ký bằng email thử nghiệm và mật khẩu có ít nhất 8 ký tự gồm chữ + số; đăng xuất rồi đăng nhập lại để kiểm tra trạng thái giao diện.
7. Có thể dùng mã ưu đãi `THREEK10` hoặc `WELCOME` trên form đặt phòng.

**Để thử thẻ:** chỉ sử dụng số thẻ kiểm thử 4111 1111 1111 1111, ngày hết hạn trong tương lai và CVV giả 123. Tuyệt đối không nhập thông tin thẻ thật.

## Giới hạn của bản MVP UI (quan trọng)

- Dữ liệu khách sạn, tồn phòng, giá và vị trí chỉ là **demo**, không lấy từ backend. Không có giữ phòng nguyên tử, xác nhận khách sạn, cập nhật phòng giữa người dùng hoặc đảm bảo tính nhất quán nhiều thiết bị.
- Tài khoản và đơn chỉ nằm trong localStorage của trình duyệt/máy đang dùng. Việc xóa dữ liệu trình duyệt làm mất dữ liệu; không có xác thực server hoặc khôi phục mật khẩu qua email.
- **Không có thanh toán tiền thật**; trạng thái thẻ/ví là mô phỏng, mã ngân hàng là giả; không gửi email, không thực sự xác nhận phòng. Đừng sử dụng website này để bán phòng ngoài đời.
- Liên kết Google/Facebook được vô hiệu hóa minh bạch vì chưa có backend OAuth. Bản đồ và font bên ngoài cần Internet.
- Đây là **UI MVP khách hàng**; chưa bổ sung dashboard quản trị khách sạn và hệ thống xử lý đơn server.

## Kiểm tra tự động

Chạy:

```bash
node tests/smoke.js
```

Kiểm tra dữ liệu 16 khách sạn, ảnh, tồn phòng/đơn hàng và quy trình demo tài khoản. Ngoài ra đã kiểm tra cú pháp JavaScript và mọi đường dẫn CSS/JS/ảnh tĩnh. Chưa có kiểm thử render trực tiếp trong Chromium do môi trường kiểm tra chặn điều hướng HTTP/file/data; nên bạn cần chạy thử trên máy cá nhân trước khi demo.

## Các file mới chính

`index.html`, `common/auth-service.js`, `common/booking-store.js`, `auth/login.js`, `booking/detail.html`, `booking/detail.js`, `payment/success.js`, `tests/smoke.js`.
