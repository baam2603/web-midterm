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

---

# BẢN MỞ RỘNG FULL UI (DÀNH CHO GIAI ĐOẠN BACKEND)

**Vẫn giữ `index1.html` và 17 tệp CSS gốc**; thêm riêng `common/extension.css` phục vụ các màn hình mới. Không đổi framework hay xây backend.

## Trang mới

- `admin/index.html`: truy cập Admin demo (bằng nút, không có đăng nhập bảo mật), dashboard, thêm/ẩn/sửa khách sạn, giá và tồn phòng, lịch trống, trạng thái đặt phòng, duyệt review, hỗ trợ và nhật ký.
- `auth/forgot.html`: khôi phục mật khẩu bằng OTP **hiển thị tại chỗ trong trình duyệt** để test (không gửi email, không bảo mật production).
- `booking/lookup.html`: khách chưa đăng nhập tra cứu bằng mã đặt phòng + email + điện thoại; các quyền truy cập guest tạm lưu trong **sessionStorage** (hết khi kết thúc phiên/trình duyệt).
- `account/notifications.html`: cập nhật liên quan đến tài khoản, đọc/chưa đọc.
- `support/index.html`: FAQ, gửi yêu cầu và nhận phản hồi hỗ trợ trên cùng trình duyệt; không gửi mail.
- `info/policies.html`: mô tả điều kiện hủy, dữ liệu và thanh toán demo.
- `hotel/reviews.js`: khách đã hoàn thành kỳ lưu trú có thể gửi đánh giá, Admin duyệt để hiển thị.
- `booking/detail.html`: in biên nhận từ trình duyệt; yêu cầu hoàn tiền **mô phỏng** nếu có điều kiện.

## Luồng demo đề xuất

1. Truy cập `index1.html`, chọn Đà Lạt/Vũng Tàu, chọn ngày ở, xem khách sạn, chọn phòng, điền thông tin, hoàn thành checkout demo.
2. Tài khoản đăng nhập chỉ thấy **đơn của chính mình** ở `booking/myBooking.html`; khách vãng lai có thể xem đơn trong phiên đặt hoặc tra cứu lại bằng thông tin đối chiếu.
3. Mở `admin/index.html` và chọn **Vào Admin demo**. Ở các tab Khách sạn/Phòng, sửa tồn kho hoặc giá; mở lại trang danh sách khách sạn để kiểm tra.
4. Ở tab Đặt phòng, xác nhận/nhận phòng/hoàn tất/hủy đơn. Sau hoàn tất, tài khoản đặt phòng có thể gửi đánh giá tại chi tiết khách sạn; Admin duyệt trong tab Đánh giá.
5. Khách gửi yêu cầu qua Hỗ trợ; Admin trả lời; người dùng đăng nhập xem phản hồi và thông báo.
6. Kiểm tra hủy đơn và hoàn tiền demo (không có giao dịch thật), in biên nhận.

## Cấu trúc để kết nối backend

Xem **`docs/BACKEND_HANDOFF.md`** để lấy danh sách API đề xuất, database tables, quy tắc chống đặt trùng, user/admin permissions, trạng thái đơn và quy tắc bảo mật. Các adapter demo trong `common/auth-service.js`, `common/booking-store.js`, `common/domain-store.js` là vị trí cần thay khi viết API.

## Kiểm thử bổ sung

```bash
node tests/flows.js
```

Bài kiểm thử mở rộng có các kịch bản: admin CRUD khách sạn, quản lý giá/tồn kho, tài khoản xem đúng đơn, guest lookup, hoàn tiền demo, đánh giá sau lưu trú, duyệt review, ticket và thông báo. `python tests/render_check.py` thực hiện smoke render trên Chromium bằng cách nạp script nội bộ trực tiếp vì môi trường hiện tại không cho phép điều hướng HTTP nội bộ. **Không phải full E2E test**, hãy thử lại luồng click trên Chrome/Edge của bạn bằng Live Server.

### Những gì chưa phải tính năng thật

- Không có xác thực admin, kết nối cơ sở dữ liệu, thanh toán hoặc hoàn tiền thật, gửi email/OTP, đồng bộ đa trình duyệt, giữ phòng với concurrency, audit tin cậy. Không sử dụng dữ liệu thật hoặc thẻ ngân hàng thật trong bản demo.
- Các lựa chọn như Google/Facebook login, quên mật khẩu gửi email, sửa lịch đặt phòng tự động, payment webhooks được để dành cho backend; giao diện cung cấp hướng dẫn minh bạch thay vì mô phỏng hoạt động thật.
