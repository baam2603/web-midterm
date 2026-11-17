# Bộ lọc Đà Lạt và Vũng Tàu

Nhánh `fix/city-filter-data-and-rendering` sửa hai vấn đề:

- Các vùng trước đây lấy từ dữ liệu demo theo slug, nên khách sạn mới không có
  nhãn và khách sạn trùng slug có thể nhận vùng cũ. API nay trả vùng từ địa chỉ,
  mô tả vị trí rõ ràng hoặc nhãn do admin chọn. Không lấy vùng/đường phố demo.
- Tiện nghi trước đây chỉ đọc hotel_amenities. API nay bổ sung thuộc tính của các
  loại phòng thực sự đang bán/phù hợp tiêu chí tìm kiếm: breakfast_included và
  features_json. Chuẩn hóa mã, tiếng Việt có dấu và một số tên tiếng Anh thường
  gặp; không coi thuộc tính phủ định là tiện nghi có sẵn. Phòng hết tồn hoặc không
  đủ sức chứa không đóng góp tiện nghi vào kết quả tìm theo ngày/khách/phòng.

Bữa sáng và hồ bơi dùng nhãn chung, không tự tuyên bố miễn phí/vô cực nếu dữ liệu
không cung cấp điều đó. "Hạng sao khách sạn" lọc cột hotels.stars (1–5), khác điểm
đánh giá người dùng. Điểm người dùng hiển thị theo thang 5 sao của API.

Các lựa chọn trong loại chỗ ở/vị trí/hạng sao kết hợp OR trong nhóm, các nhóm kết
hợp AND. Chọn nhiều tiện nghi yêu cầu khách sạn có tất cả tiện nghi đã chọn.

## Giảm giật khi thao tác

Các sự kiện nhập/gạt liên tiếp gộp vào một requestAnimationFrame. Lọc tại client
không gọi lại catalog API. Thẻ khách sạn và ảnh được giữ lại nếu nội dung không
đổi, chỉ cập nhật chip hoặc thứ tự cần thiết; không chạy lại animation xuất hiện.
Bản đồ bỏ qua cập nhật khi marker không đổi, không chạy animation căn khung khi
lọc. Hover chỉ thay highlight khi thực sự chuyển sang khách sạn khác.
Request tìm kiếm bị hủy không được ghi đè danh sách từ request mới.

## Cập nhật hosting

Không có migration cấu trúc hoặc dependency mới. Từ checkout sạch qua SSH:

```sh
cd /home/threekbooking/www/web-midterm
git status --short
git remote set-branches --add origin fix/city-filter-data-and-rendering
git fetch origin
git switch fix/city-filter-data-and-rendering
git pull --ff-only origin fix/city-filter-data-and-rendering
```

Nếu có thay đổi cục bộ, giữ lại và xử lý trước, không reset/clean. Hard reload cả
hai trang thành phố. Tính năng chỉ có trên nhánh này cho tới khi merge vào main.

## Khi thông tin vị trí còn thiếu

Không thể xác định "gần" từ tên đường bất kỳ hoặc tọa độ chưa được xác minh. Các
mô tả khoảng cách/phủ định không được tự gán thành vùng gần. Với khách sạn chưa có
mô tả phù hợp, admin có thể gắn nhãn vị trí rõ ràng bằng các lựa chọn tiện nghi:

- location_center: Gần trung tâm / chợ.
- location_forest: Ven rừng / gần Hồ Tuyền Lâm (Đà Lạt).
- location_beach: Gần biển / bãi biển (Vũng Tàu).

File tùy chọn `database/city_filter_tags.sql` bổ sung ba lựa chọn này vào bảng
amenities, không gán nhãn cho bất kỳ khách sạn nào, không thay dữ liệu hiện có.
Chọn đúng database trong phpMyAdmin trước khi Import. Sau đó mở Admin → chỉnh
khách sạn → tiện nghi, chọn nhãn thực tế và lưu. Đây không phải file bắt buộc để
chạy bản sửa. Không import schema/seed lên database đang có dữ liệu.

## Kiểm thử

Chỉ chạy trên database Docker cô lập:

```sh
sh scripts/start-test-environment.sh
npm run test:filters
npm run test:customer
```

Kiểm tra hai thành phố, từng nhóm từ vị trí trở xuống, dữ liệu SQL khác demo,
phòng hết tồn, thuộc tính phủ định, nhãn admin, request bị hủy và 100 sự kiện gạt
giá không làm dựng lại thẻ khi kết quả không đổi. Trên hosting chọn một khách sạn
có thông tin phòng/tiện nghi đã nhập trong admin và đối chiếu từng checkbox,
reset, sắp xếp và giá; kiểm tra lại ngày lưu trú/số khách bằng nút Tìm kiếm.
