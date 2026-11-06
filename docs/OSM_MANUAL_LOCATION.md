# OSM và vị trí do quản trị viên xác nhận

Nhánh `feat/osm-manual-location` được tạo từ main, giữ OTP, đóng tài khoản và nghiệp vụ
đang có. Chỉ sửa/push trên nhánh này; không tự merge main. Nhánh Google được giữ riêng,
không đưa Google SDK, Places API hoặc key/billing vào bản này.

## Cài đặt

1. Sao lưu database đang dùng.
2. Import `database/osm_location_migration.sql` sau các migration trên main.
3. Pull nhánh và Ctrl+F5. Không xóa/import lại schema/seed.

Migration chỉ thêm maps_provider và maps_verified_at, đánh dấu nguồn OSM cho các ID osm-*
cũ. Nếu đã chạy google_maps_migration.sql khi thử Google, các cột trùng tên được giữ;
không cần DROP cột hoặc xóa khách sạn. Dữ liệu Google nếu có không tự được coi là OSM:
admin phải xác nhận lại vị trí bằng thông tin cơ sở cung cấp trước khi hiển thị ghim OSM.
Các biến Google trong Apache không được code nhánh này đọc; không cần key hay billing.

## Thêm khách sạn

Hai chế độ trong form Thêm khách sạn:

- **Chọn cơ sở lưu trú có trên OSM**: tìm/chọn kết quả như trước. PHP tra lại ID, vùng
  thành phố và loại đối tượng. Chỉ lodging được coi là cơ sở lưu trú xác minh từ OSM.
- **Nhập và chọn ghim thủ công**: điền tên/địa chỉ thực tế, nhấn bản đồ/kéo ghim hoặc nhập
  vĩ độ, kinh độ; kiểm tra rồi tick xác nhận vị trí. Có thể dùng khi OSM thiếu khách sạn,
  không có kết quả hoặc dịch vụ tìm kiếm lỗi. Không cần gọi Nominatim/Overpass để lưu.

Kết quả đường phố/tòa nhà chỉ được chọn làm điểm tham khảo để nhập thủ công: không
điền nó thành tên khách sạn, không cấp nhãn khách sạn đã xác minh và không lưu ID OSM giả.
Địa chỉ chỉ xác minh vị trí, không chứng minh có một cơ sở kinh doanh tại đó.

Chỉnh tên/địa chỉ/tọa độ sẽ yêu cầu xác nhận lại ở chế độ thủ công. Đổi thành phố cần chọn
lại vị trí. Tọa độ kiểm tra hữu hạn, [-90,90]/[-180,180] và vùng Đà Lạt/Vũng Tàu (bán kính
30/25km đang dùng trên main), không chỉ tin JavaScript/checkbox từ trình duyệt.

Tất cả đường ghi vẫn yêu cầu session admin và CSRF. Dữ liệu nguồn thủ công:

```text
google_place_id = NULL       # Tên cột cũ; không sử dụng Google API
maps_provider = manual
maps_verified_at = thời điểm admin xác nhận
latitude / longitude = tọa độ đã kiểm tra
```

Nguồn OSM lodging có maps_provider=osm_lodging. Các bản ghi cũ giữ nhãn osm/legacy,
không được tự gán ngày xác minh mới. Checkbox thủ công là cam kết của admin, không phải
xác minh tự động từ OSM hay chứng nhận pháp lý cho cơ sở kinh doanh.

Khách sạn mới vẫn ẩn, cần thêm phòng/ảnh và công khai theo luồng hiện tại.

## Sửa vị trí khách sạn cũ

Khách sạn → Chỉnh sửa → Vị trí khách sạn → Chọn/nhập lại vị trí thủ công.
Nhập địa chỉ và tọa độ hoặc chỉnh ghim, xác nhận, rồi Lưu. Metadata và vị trí nằm cùng
transaction, lỗi vị trí không lưu một nửa thay đổi. Mặc định Giữ vị trí hiện tại để sửa
mô tả/giá mà không làm mất tọa độ hoặc đổi nguồn.

Xác nhận thủ công sẽ bỏ liên kết OSM/Google cũ của khách sạn đó; giữ nguyên ID khách sạn,
phòng, đơn và các khóa ngoại. Có thể có nhiều khách sạn thủ công mà không phải tạo một
provider ID giả để vượt unique index.

## Phía người dùng

Danh sách và chi tiết dùng Leaflet đóng gói sẵn trong repo với tile OSM có attribution.
Không dùng Google iframe, Maps SDK hoặc URL Google tile không key. Nút xem vị trí mở OSM.
Ghim được cập nhật theo dữ liệu SQL khi tìm/lọc lại, không lấy tọa độ mẫu khi dữ liệu SQL thiếu; không đoán theo tên khách
sạn hoặc gắn mặc định 0,0. Khi thiếu vị trí, hiển thị địa chỉ/thông báo để liên hệ cơ sở.

Điều này xử lý thiếu dữ liệu khách sạn và ghim sai. Không tự làm mới đường sá/công trình
của OSM; dữ liệu nền vẫn tùy vùng và do nhà cung cấp cập nhật. Giữ attribution, không tải
hàng loạt/offline hoặc gọi autocomplete Nominatim mỗi phím; chỉ dùng tìm kiếm chủ động.
Với lưu lượng production lớn cần dịch vụ tile/geocoding phù hợp thay vì coi endpoint
cộng đồng là tài nguyên không giới hạn.

## Kiểm thử

```sh
npm run test:prepare
npm run test:osm
npm run test:admin
npm run test:customer
npm run test:auth
```

Dùng database/container giả web-midterm-admin-*; không thao tác DB khách hàng thật.
Test browser dùng Leaflet thật, chặn ảnh tile bên ngoài và mock kết quả rỗng/lỗi/địa chỉ
để kiểm tra fallback. Test API kiểm tra quyền/CSRF, tọa độ sai, xác nhận sai kiểu, ID giả,
địa chỉ OSM không phải khách sạn, SQL thêm/sửa/giữ nguyên, cùng marker công khai theo SQL.
Luồng OSM có sẵn dùng provider fixtures; không tải Nominatim/Overpass thật trong tests.
