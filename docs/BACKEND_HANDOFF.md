# THREEK.COM — FRONTEND MVP → BACKEND HANDOFF

## 1. Phạm vi hiện tại

Ứng dụng HTML/CSS/JavaScript thuần, có các luồng UI khách hàng và quản trị mô phỏng. Các mục dưới đây **chưa** là API thật. `localStorage`/`sessionStorage` chỉ để demo một máy, không bảo mật, không có đồng bộ, không thể dùng bán phòng thật.

### Trang đã có

| Nhóm | UI |
|---|---|
| Khách hàng | `index1.html`, `destinations/*.html`, `hotel/hotel.html`, `hotel/Booking.html`, `payment/payment.html`, `payment/success.html` |
| Tài khoản | `auth/login.html`, `auth/register.html`, `auth/forgot.html`, `account/taikhoan.html`, `account/favorites.html`, `account/notifications.html` |
| Đặt phòng | `booking/myBooking.html`, `booking/detail.html` (có request đổi ngày), `booking/lookup.html` |
| Hỗ trợ | `support/index.html`, `info/policies.html` |
| Quản trị UI demo | `admin/index.html`: Tổng quan, khách sạn, phòng & giá, lịch trống, đặt phòng, duyệt đánh giá, hỗ trợ, nhật ký |

### Code cần thay bằng API adapter

| JavaScript hiện tại | Trách nhiệm | Backend |
|---|---|---|
| `common/auth-service.js` | Đăng ký, đăng nhập, hồ sơ, đổi mật khẩu | Auth APIs + httpOnly cookie/token + role checks |
| `common/booking-store.js` | Lưu đơn, trạng thái, tồn phòng, hủy, hoàn tiền, tra cứu | Bookings + Inventory transactions |
| `common/domain-store.js` | Hotels/rooms override, reviews, support, notifications, audit | Hotels, rooms, reviews, tickets, notifications APIs |
| `common/favorites.js` | Lưu yêu thích | User favorites |
| `common/city-data.js` + `hotel/hotel-data.js` | Dữ liệu tĩnh 16 khách sạn demo | Catalog APIs, pagination, search, cache |

**Khuyến nghị:** Tạo `common/api-client.js` và các repository (`auth-api.js`, `hotel-api.js`, `booking-api.js`, `review-api.js`) giữ tên nghiệp vụ giống bản demo. Các trang đang gọi hàm đồng bộ; khi đổi sang `fetch` phải chuyển handler sang `async/await` và bổ sung loading/error states. Không hoán đổi `BookingStore.save()` thành `POST` mà quên tính nguyên tử phòng trống.

## 2. REST API tham khảo (chưa triển khai)

| Method | Endpoint | Công dụng | Vai trò |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Tạo tài khoản | public |
| POST | `/api/v1/auth/login` | Đăng nhập | public |
| POST | `/api/v1/auth/logout` | Đăng xuất | customer/admin |
| POST | `/api/v1/auth/forgot-password` | Gửi link/token khôi phục | public |
| POST | `/api/v1/auth/reset-password` | Đặt lại mật khẩu | reset token |
| GET / PATCH | `/api/v1/users/me` | Hồ sơ | owner |
| PATCH | `/api/v1/users/me/password` | Đổi mật khẩu | owner |
| GET | `/api/v1/hotels?city=&checkin=&checkout=&guests=&rooms=&page=` | Tìm kiếm, filter, pagination | public |
| GET | `/api/v1/hotels/:id` | Chi tiết, phòng, tiện nghi | public |
| GET | `/api/v1/hotels/:id/availability?from=&to=&rooms=&guests=` | Giá và tồn phòng theo ngày | public |
| POST | `/api/v1/bookings/quote` | Báo giá snapshot (ngày, thuế, ưu đãi) | public |
| POST | `/api/v1/bookings/holds` | Tạm giữ phòng có hết hạn | customer/guest |
| POST | `/api/v1/bookings` | Xác nhận đặt bằng idempotency key | customer/guest |
| GET | `/api/v1/bookings/me` | Chỉ đơn thuộc user hiện tại | customer |
| GET | `/api/v1/bookings/:id` | Chi tiết có check quyền | owner/admin |
| POST | `/api/v1/bookings/lookup` | Xác minh guest bằng mã + OTP/email/phone | guest |
| POST | `/api/v1/bookings/:id/cancel` | Hủy theo chính sách, tạo refund nếu cần | owner/admin |
| POST | `/api/v1/bookings/:id/change-request` | Yêu cầu đổi ngày | owner/guest-verified |
| POST | `/api/v1/payments/intents` | Tạo payment intent với nhà cung cấp | owner/guest-verified |
| POST | `/api/v1/payments/webhooks/:provider` | Webhook có xác thực chữ ký | provider |
| GET / POST | `/api/v1/hotels/:id/reviews` | Xem & gửi đánh giá sau lưu trú | public/customer |
| GET / POST | `/api/v1/support/tickets` | Yêu cầu hỗ trợ | guest/customer |
| GET / PATCH | `/api/v1/notifications` | Thông báo của tôi, đã đọc | owner |
| GET / POST / PATCH | `/api/v1/admin/hotels` | Quản lý khách sạn | admin |
| GET / PATCH | `/api/v1/admin/hotels/:id/rooms/:roomId` | Giá / tồn kho / lịch phòng | admin |
| GET / PATCH | `/api/v1/admin/bookings` | Danh sách và xử lý trạng thái | admin |
| GET / PATCH | `/api/v1/admin/reviews` | Duyệt đánh giá | admin |
| GET / PATCH | `/api/v1/admin/support/tickets` | Hỗ trợ | admin |
| GET | `/api/v1/admin/audit-logs` | Nhật ký bất biến phía server | admin |

## 3. Mô hình database gợi ý

- `users(id, email UNIQUE, password_hash, full_name, phone, role, created_at)`
- `hotels(id, city, name, address, lat, lng, status, description, owner_id)`
- `room_types(id, hotel_id FK, name, capacity, amenities, base_price, refundable, status)`
- `room_inventory(room_type_id FK, stay_date, total_units, reserved_units, held_units, PRIMARY KEY(room_type_id, stay_date))`
- `bookings(id, code UNIQUE, user_id NULL, guest_email, guest_phone, checkin, checkout, status, total_amount, currency, created_at, version)`
- `booking_items(id, booking_id FK, room_type_id FK, quantity, nightly_price_snapshot, nights, subtotal)`
- `holds(id, quote_id, room_type_id, from_date, to_date, units, expires_at, status)`
- `payments(id, booking_id FK, provider, provider_ref UNIQUE, amount, status, created_at)`
- `refunds(id, payment_id FK, amount, status, provider_ref, created_at)`
- `reviews(id, booking_id UNIQUE FK, author_user_id, score, comment, status, created_at)`
- `support_tickets(id, user_id NULL, guest_contact, topic, message, status, created_at)`
- `support_messages(id, ticket_id FK, sender_role, body, created_at)`
- `notifications(id, user_id FK, type, title, body, read_at, created_at)`
- `favorites(user_id, hotel_id, PRIMARY KEY(user_id,hotel_id))`
- `audit_logs(id, actor_id, action, entity_id, before_json, after_json, timestamp)`

**Tồn phòng:** mọi đêm từ `checkin` (bao gồm) đến `checkout` (không bao gồm) phải có `available >= quantity`. Sử dụng transaction/row locking hoặc optimistic versioning cho **tất cả** ngày và không bao giờ trừ phòng bằng phép tính chỉ ở frontend. Giữ phòng có TTL, giải phóng khi hết hạn/hủy/thất bại thanh toán. Đơn phải idempotent qua khóa riêng từ client/request. Tránh `double booking` khi hai khách đặt cùng lúc.

## 4. Luồng chính

### Khách có tài khoản

`register/login → search → hotel detail → room selection → quote → hold → guest form → payment provider/cash at hotel → booking confirmation → My Bookings → cancel/change request → completed → review`.

### Khách vãng lai

`search → checkout → payment → confirmation → lookup by code + verified contact → booking details/cancellation`. Không chỉ dùng mã đơn đoán được để cho phép truy cập thông tin cá nhân; phải có OTP/email verification hoặc token dài random riêng.

### Admin

`admin login + RBAC → manage hotels/rooms/inventory → booking processing → payment/refund state from provider → moderated reviews → support → audit`.

### Trạng thái đơn (đề xuất)

- `pending_payment → confirmed | expired | cancelled`
- `confirmed → checked_in | cancelled | no_show`
- `checked_in → completed`
- `cancelled → refund_pending → refunded | refund_failed` (tình trạng hoàn tiền nên là entity riêng, **không** thay booking status)

Ở UI demo, `pending`, `confirmed`, `checked_in`, `completed`, `cancelled` cùng `refundStatus` được dùng giản lược. Phần frontend demo có thể đánh dấu hoàn tất sớm để kiểm thử review; backend thực phải tuân theo ngày ở và role.

## 5. Quy tắc bảo mật bắt buộc khi dựng backend

1. **Không** dùng cờ sessionStorage `threek_demo_admin_mode` để cấp quyền admin. Tất cả admin endpoints bắt buộc xác thực role server.
2. Không dùng PBKDF2 trong localStorage làm đăng nhập sản xuất. Dùng password hash Argon2id/bcrypt phía server, rate limiting, password reset one-time expiring token, MFA tùy mục tiêu.
3. Không nhận `total`, `userId`, `price`, `status` từ frontend làm nguồn tin cậy. Server tự tính giá và lấy userId từ access token/session.
4. Không đọc và lưu số thẻ/CVV trên server riêng nếu chưa có phạm vi tuân thủ PCI. Tích hợp hosted payment page và webhook chữ ký hợp lệ, idempotent.
5. Đơn đặt phòng và ticket chỉ hiển thị khi là owner, guest đã xác minh hoặc admin hợp lệ. Audit tất cả admin mutations.
6. CORS, CSRF, XSS escaping, secure cookies, input validation, server audit, secrets, backups, monitoring, timezone (`Asia/Ho_Chi_Minh`), cache invalidation.
7. Bộ đánh giá chỉ được tạo bởi đơn đã `completed`, mỗi `booking_id` tối đa 1 đánh giá (unique constraint).

## 6. Kiểm tra và demo

```bash
python -m http.server 8000
node tests/smoke.js
node tests/flows.js
python tests/render_check.py   # chỉ nếu đã có playwright và Chromium
```

Tất cả thay đổi trong Admin local chỉ phản ánh trong cùng **trình duyệt + origin**. Để demo: vào `admin/index.html`, bấm nút vào chế độ Admin demo, chỉnh giá/phòng; sang khách hàng reload trang và đặt thử. Đăng nhập 2 tài khoản khác nhau để kiểm tra đơn không lẫn. Guest tra cứu qua `booking/lookup.html` với mã + email + điện thoại đã đặt.
