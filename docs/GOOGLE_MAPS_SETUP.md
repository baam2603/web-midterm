# Chuyển THREEK sang Google Maps và Places API (New)

Nhánh `feat/google-maps-places` dựa trên main đã có OTP và đóng tài khoản.
Không gộp nhánh bảo mật riêng vào đây. Không chứa key thật hoặc tự bật dịch vụ trả phí.

## 1. Bật dịch vụ trong Google Cloud

Trong cùng project Google Cloud, bật billing và hai API:

- **Maps JavaScript API**: hiển thị bản đồ ở admin, danh sách và chi tiết khách sạn.
- **Places API (New)**: PHP tìm tên/địa chỉ, tìm quanh vị trí và xác minh cơ sở lưu trú.

Chỉ enable JavaScript API chưa đủ để tìm kiếm khách sạn qua PHP. Các thư viện Google trên
GitHub cũng không thay thế việc bật dịch vụ/key. Kiểm tra quota và billing alerts trong
Google Cloud; FieldMask dùng có chủ đích, không dùng wildcard hoặc gọi mỗi lần gõ phím.
Google quyết định phí theo API/SKU của tài khoản; đây không phải chế độ miễn phí được bảo đảm.

## 2. Tạo hai key và giới hạn đúng cách

| Biến môi trường | Chức năng | Giới hạn trong Google Cloud |
| --- | --- | --- |
| GOOGLE_MAPS_BROWSER_KEY | SDK JavaScript; key này xuất hiện ở trình duyệt theo thiết kế | Website/HTTP referrers, chỉ Maps JavaScript API |
| GOOGLE_PLACES_API_KEY | Request Places từ PHP; không trả cho trình duyệt | IP máy chủ, chỉ Places API (New) |
| GOOGLE_MAPS_MAP_ID | Map ID cho Advanced Markers | Tạo trong Map Management; không phải API key |

Cho key trình duyệt khi chạy đường dẫn của bạn:

```text
http://localhost:8083/*
```

Chỉ thêm `http://127.0.0.1:8083/*` nếu thực sự dùng địa chỉ đó. Khi deploy, thêm đúng domain
HTTPS. Không để unrestricted chỉ để thử. Key server chạy XAMPP dùng IP public outbound của
máy/mạng, không phải 127.0.0.1; nếu IP thay đổi cần cập nhật restriction. Trên hosting/VPS,
dùng IP outbound tĩnh. Không dùng chung key HTTP-referrer cho PHP: Google sẽ từ chối request.

Ví dụ cấu hình trong Apache VirtualHost/local config **ngoài web root và ngoài Git**:

```apache
SetEnv GOOGLE_MAPS_BROWSER_KEY "THAY_BANG_BROWSER_KEY"
SetEnv GOOGLE_PLACES_API_KEY "THAY_BANG_SERVER_PLACES_KEY"
SetEnv GOOGLE_MAPS_MAP_ID "THAY_BANG_MAP_ID"
```

Khởi động lại Apache sau khi đổi. PHP đọc getenv; dự án không tự load .env.
`.env.example` chỉ mô tả tên biến. Không gửi key thật trong chat, không commit vào PHP/JS.
Nếu chưa có Map ID, bản local dùng DEMO_MAP_ID; dùng Map ID riêng cho production.
`api/maps/config.php` chỉ trả browser key và map ID, không trả Places key.

Các host cần truy cập: places.googleapis.com (PHP), maps.googleapis.com, maps.gstatic.com
và các host tài nguyên bản đồ do SDK chính thức sử dụng (trình duyệt).
Nếu cloud proxy chưa cho phép các host này, cập nhật quyền mạng bằng quy trình cấu hình môi
trường; không tắt TLS verification hoặc dùng endpoint khác để vượt chặn mạng.

## 3. Cập nhật SQL và chạy

Sao lưu DB, import **database/google_maps_migration.sql** sau các migration đang có trên main.
File chỉ bổ sung maps_provider/maps_verified_at và đánh dấu các ID osm-* đang có là nguồn OSM.
Không xóa khách sạn/phòng/đơn; không gọi Google hoặc phát sinh phí khi chạy migration.

Pull nhánh, cấu hình key, khởi động Apache và Ctrl+F5.

- Mở admin → Khách sạn → Thêm khách sạn: tìm tên/địa chỉ hoặc chọn tâm tìm quanh vị trí.
- Chỉ cơ sở lưu trú tại Việt Nam trong vùng thành phố được chọn mới được lưu. Đường phố
  hoặc địa chỉ chung có thể xuất hiện nhưng không được chọn thành khách sạn.
- PHP xác minh Place ID lại qua Place Details trước khi tạo/cập nhật. Tọa độ từ client
  không được tin; địa chỉ đã thay đổi phải chọn lại. Cột google_place_id nay lưu Google ID
  đối với địa điểm mới; ID osm-* cũ không bị đổi giả thành Google ID.
- Khách sạn mới vẫn ẩn cho đến khi admin hoàn tất phòng/ảnh và công khai như luồng cũ.
- Khách sạn cũ: bấm Chỉnh sửa → Cập nhật vị trí bằng Google Maps → chọn đúng kết quả → Lưu.
  Metadata và vị trí cập nhật chung transaction; trùng Place ID sẽ rollback toàn bộ edit.
- Google Maps phía khách dùng tọa độ SQL. Nếu chưa có tọa độ, hiển thị thông báo và liên kết
  tìm địa chỉ; không tự đoán khách sạn hoặc đặt marker tại 0,0 thay cho dữ liệu thiếu.

**Chuyển SDK không tự sửa tọa độ/địa chỉ cũ hoặc bảo đảm dữ liệu Google luôn mới.**
Hãy xác minh lại từng khách sạn có vị trí sai; không tự động khớp hàng loạt theo tên vì có thể
nhầm chi nhánh/cơ sở. Vùng Đà Lạt/Vũng Tàu dùng bán kính kiểm tra, không phải ranh giới hành chính.

## 4. Thay đổi kỹ thuật

- common/google-maps.js: nạp SDK chính thức một lần, Advanced Markers, lỗi thiếu/key bị từ chối.
- api/admin/places-service.php: REST v1 Search Text, Nearby Search, Place Details với FieldMask.
  Không lưu raw provider response vào cache đĩa; không forward URL/key từ người dùng.
- Các API tìm/xác minh vẫn yêu cầu session admin. Ghi SQL giữ CSRF token và transaction.
- Không còn dùng Google tile URL không có SDK hoặc tải Leaflet cho các bản đồ đang sử dụng.
- Giữ UI chung; nút ở bản đồ chi tiết được đẩy lên trên để không che attribution phía dưới.
- Nếu sau này merge nhánh CSP/security, bổ sung nguồn Google SDK/tài nguyên cần thiết trong
  CSP trước khi deploy. Không mở wildcard tất cả các nguồn script để xử lý lỗi CSP.

Place ID có chính sách lưu trữ riêng; business profile của khách sạn do quản trị viên chịu
trách nhiệm xác nhận. maps_verified_at giúp nhận biết lần xác minh, không tự động refresh.
Khi đưa vào sử dụng thật, áp dụng giới hạn cache/refresh của Google cho nội dung lấy từ API
(đặc biệt tọa độ), và các yêu cầu attribution; không xem metadata Google là dữ liệu được
phép sao chép/lưu vô hạn. Tham khảo chính sách chính thức trước khi deploy:
https://developers.google.com/maps/documentation/places/web-service/policies

## 5. Kiểm thử

```sh
npm run test:prepare
npm run test:maps
npm run test:admin
npm run test:customer
```

Môi trường test riêng dùng key giả và fixture loopback cho Google New contract; trình duyệt
mock SDK theo API đã dùng. Không gọi Google thật hoặc dịch vụ tính phí trong tests.
Endpoint fixture chỉ được dùng khi APP_ENV=test và địa chỉ khớp loopback cố định; production
luôn gọi https://places.googleapis.com/v1 với TLS verification và header key phía PHP.
Không deploy APP_ENV=test hoặc các biến test endpoint.

Đã kiểm tra: role/CSRF, field masks, search/nearby/details, street không thể chọn, tọa độ
ngoài vùng, browser config không lộ server key, SQL create/edit/rollback, nâng địa điểm OSM
cũ sang Google khi admin chọn lại, danh sách/chi tiết dùng SDK và tọa độ SQL, lỗi key/thiếu
vị trí và hồi quy nghiệp vụ. Chưa nghiệm thu key/billing/quota thật của bạn; việc này thực
hiện sau khi cấu hình hai key và bật các API trong project Google Cloud của bạn.
