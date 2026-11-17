# THREEK.COM — Hướng dẫn nghiệm thu dành cho giảng viên

Website đặt phòng khách sạn tại Đà Lạt và Vũng Tàu, gồm giao diện khách hàng,
trang quản trị và API PHP/MariaDB. Tài khoản, đơn, bình luận, yêu thích và thông báo
được lưu trong database.

**Ưu tiên test website đã deploy ở phần A:** chỉ cần trình duyệt và Internet,
không cần tải source, cài PHP hay import SQL. **Phần B** bên dưới dành cho giảng viên
muốn cài và chạy lại từ đầu trên máy cá nhân.

| Môi trường | Địa chỉ | Tài khoản customer |
| --- | --- | --- |
| **Deploy — ưu tiên nghiệm thu** | **https://threekbooking.alwaysdata.net** | `vikiet25.duong@gmail.com` |
| Local — sau khi tự cài theo phần B | `http://127.0.0.1:8000` (hoặc cổng tự cấu hình) | `b@gmail.com` |

## A. Test trực tiếp trên website đã deploy

### A.1. Truy cập website

**Website:** https://threekbooking.alwaysdata.net

Mở website bằng Chrome/Edge/Firefox, chọn **Đăng nhập**. Nếu muốn sử dụng đồng thời
hai vai trò, dùng cửa sổ thường cho admin và cửa sổ ẩn danh cho customer.
Không cần chạy XAMPP, không cần import SQL khi dùng môi trường deploy.

### A.2. Tài khoản dành cho giảng viên trên môi trường deploy

| Vai trò | Email đăng nhập | Mật khẩu |
| --- | --- | --- |
| **Admin** | **`nguyentuankhoi2603@gmail.com`** | **`TKi@17022603`** |
| **Customer** | **`vikiet25.duong@gmail.com`** | **`kiet123456`** |

Nhập email đầy đủ, chú ý chữ hoa/thường của mật khẩu. Đây là tài khoản đăng nhập
**website**, không phải thông tin truy cập hộp thư Gmail. Đăng nhập tài khoản có sẵn
không cần OTP; OTP dùng cho đăng ký customer mới.

Các tài khoản trên được cung cấp để chấm trên website deploy. Không import
`grading_accounts.sql` lên hosting để thiết lập lại chúng. File SQL ở phần B phục vụ
bản local và tạo customer `b@gmail.com`, không tạo tài khoản deploy `vikiet25.duong@gmail.com`.

### A.3. Test với vai trò customer

1. Đăng nhập `vikiet25.duong@gmail.com` bằng mật khẩu ở mục A.2.
2. Chọn **Đà Lạt** hoặc **Vũng Tàu**, tìm kiếm/lọc khách sạn, chọn ngày trong tương lai,
   số khách và số phòng.
3. Mở **Xem phòng**, kiểm tra ảnh khách sạn/ảnh phòng, giá và số phòng còn trống.
4. Chọn loại phòng, nhập thông tin người nhận phòng, điện thoại và ghi chú.
5. Bấm **Tiếp tục thanh toán**. Giao diện chỉ có **VNPay Sandbox** và
   **thanh toán tại khách sạn**; thử từng phương thức bằng các đơn riêng.
6. Với **thanh toán tại khách sạn**, xác nhận rồi ghi lại mã đơn. Đơn được lưu,
   không thu tiền trực tuyến bằng phương thức này.
7. Mở **Đặt phòng của tôi**: xem chi tiết, tải lại để kiểm tra dữ liệu còn tồn tại,
   in biên nhận và hủy đơn nếu đủ điều kiện.
8. Thử yêu thích, cập nhật hồ sơ, đăng bình luận và gửi ticket ở **Hỗ trợ & FAQ**.
   Sau khi admin phản hồi, kiểm tra ticket/thông báo của customer.

**Kết quả mong đợi:** đơn và dữ liệu cá nhân được lưu phía server, customer chỉ xem
được đơn của mình. Các trạng thái đơn chỉ được thay đổi nếu thỏa điều kiện nghiệp vụ.

### A.4. Test đăng ký bằng email thật và nhận OTP

Giảng viên có thể **tự tạo tài khoản customer**, thay vì dùng tài khoản có sẵn:

1. Đăng xuất hoặc mở cửa sổ ẩn danh, chọn **Đăng ký**.
2. Điền họ tên, **email thật có quyền truy cập hộp thư**, mật khẩu 8–72 ký tự gồm chữ
   và số, cùng các thông tin form yêu cầu.
3. Gửi đăng ký và giữ cửa sổ nhập OTP trong cùng trình duyệt.
4. **Kiểm tra mục Spam / Thư rác của Gmail trước:** theo môi trường demo do nhóm cung
   cấp, email OTP có thể được Gmail chuyển vào thư rác. Nếu chưa thấy, kiểm tra thêm
   Hộp thư đến và tìm email THREEK; có thể đánh dấu “Không phải thư rác”.
5. Nhập OTP **6 chữ số**, hiệu lực **5 phút** từ lúc yêu cầu. Gửi lại cần chờ
   **60 giây** và chịu giới hạn số lần gửi/nhập sai.
6. OTP đúng mới tạo tài khoản và đăng nhập. Sau đó đăng xuất, đăng nhập lại để kiểm tra.
7. Nếu muốn thử **Quên mật khẩu**, dùng email vừa đăng ký và kiểm tra cả Spam.
   Link khôi phục có hiệu lực **5 phút**, chỉ dùng một lần.

Không dùng Gmail của tài khoản customer được chia sẻ để nhận OTP/quên mật khẩu nếu
không có quyền truy cập hộp thư đó. Muốn chấm email, hãy dùng địa chỉ của giảng viên.
Nếu thư chậm hoặc hết hạn, yêu cầu mã mới; OTP chỉ hoạt động khi mail worker và dịch vụ
email của môi trường deploy đang hoạt động. Không có endpoint công khai để đọc OTP.

### A.5. Test VNPay Sandbox trên môi trường deploy

1. Đăng nhập customer (tài khoản có sẵn hoặc tài khoản mới xác minh OTP).
2. Chọn phòng/ngày, nhập thông tin nhận phòng rồi chọn **VNPay Sandbox**.
3. Bấm **Tiếp tục thanh toán VNPay** để chuyển đến cổng sandbox.
4. Chỉ dùng **thông tin thanh toán thử nghiệm do VNPay cung cấp** theo hướng dẫn
   trên sandbox; không dùng thẻ thật hoặc chuyển tiền thật.
5. Hoàn tất giao dịch và quay về website. Vào **Đặt phòng của tôi** để kiểm tra
   trạng thái đơn và thanh toán; tải lại nếu kết quả xử lý chưa cập nhật ngay.
6. Có thể tạo đơn khác để thử hủy/thất bại ở cổng sandbox. Đơn này không được ghi nhận
   đã thanh toán thành công. Nếu cần thử lại liên kết VNPay của đơn chờ còn hiệu lực,
   hệ thống tiếp tục đơn đó thay vì tạo thêm đơn trùng.

**Kết quả mong đợi:** chỉ IPN có chữ ký, số tiền và dữ liệu đơn hợp lệ mới cập nhật
kết quả thanh toán; việc trình duyệt quay về website tự nó chưa chứng minh giao dịch
đã được xác nhận. Nếu đơn vẫn chờ, kiểm tra lại sau; nhóm cần kiểm tra cấu hình IPN
khi chấm mà không nhận được kết quả.

**Phân biệt:** email thật cần để nhận OTP/khôi phục mật khẩu. Bản thân VNPay Sandbox
không bắt buộc tài khoản website dùng email thật, nên có thể dùng customer có sẵn
để chấm thanh toán. Website vẫn là môi trường đồ án/sandbox, không phải giao dịch
đặt phòng khách sạn hay chuyển tiền thật.

### A.6. Test với vai trò admin và chuyển qua lại hai giao diện

1. Đăng nhập admin ở mục A.2, hệ thống chuyển đến dashboard quản trị.
2. Kiểm tra khách sạn, loại phòng, ảnh, giá/tồn phòng và các đơn vừa tạo.
3. Thử cập nhật trên dữ liệu demo, xem lịch phòng và nhật ký thao tác.
4. Thử xác nhận/hủy/nhận phòng/hoàn tất theo điều kiện. Đơn có ngày nhận phòng trong
   tương lai không thể nhận phòng hoặc hoàn tất ngay chỉ để demo.
5. Xem/xóa bình luận thử nghiệm; phản hồi ticket của customer và đối chiếu ở cửa sổ customer.
6. Bấm **Website khách hàng** để chuyển sang giao diện khách. Bấm avatar →
   **Trang quản trị** để quay về; không cần đăng nhập lại khi phiên còn hợp lệ.

Nếu muốn thử thay đổi mật khẩu, nên dùng tài khoản customer tự đăng ký để giữ nguyên
thông tin đăng nhập của hai tài khoản dùng chung cho các lần chấm sau.

### A.7. Lưu ý và minh chứng nghiệm thu

- Các bước trên là hướng dẫn và kết quả mong đợi; không thay cho biên bản xác nhận
  email thật/IPN của từng lần test trên hosting.
- Chụp mã đơn, trạng thái đơn, phản hồi hỗ trợ và kết quả sandbox làm minh chứng;
  không chia sẻ OTP hoặc token phiên trong ảnh báo cáo.
- Nếu giảng viên chỉ muốn thử luồng đặt phòng trước, chọn thanh toán tại khách sạn,
  sau đó chấm OTP và VNPay Sandbox riêng.
- Phần B mô tả cài lại ứng dụng từ source. Giảng viên không cần thực hiện phần B
  để dùng website đã deploy ở phần A.

## B. Test local — cài đặt lại từ source/ZIP

**Lộ trình:** chuẩn bị môi trường theo B.1 → tạo database/import SQL theo B.2 → chạy
PHP theo B.3 → đăng nhập tài khoản **local** ở B.4 → sử dụng theo B.5–B.6.
Local mặc định không bật VNPay và chưa có email; muốn tự đăng ký hoặc dùng cổng
thanh toán phải cấu hình thêm B.7–B.8. Các thao tác local không thay đổi dữ liệu hosting.

### B.1. Yêu cầu môi trường và source nộp bài

| Thành phần | Yêu cầu |
| --- | --- |
| PHP | 8.1+, khuyến nghị 8.3 |
| PHP extensions | `pdo_mysql`, `mbstring`, `curl`, `fileinfo`, `openssl` |
| Database | **MariaDB 10.4+**, khuyến nghị 10.11; migration dùng cú pháp MariaDB |
| Composer | 2.x, cần khi dùng Gmail SMTP/PHPMailer |
| Trình duyệt | Chrome, Edge hoặc Firefox phiên bản hiện hành |
| Kết nối Internet | CDN/font, bản đồ và email cần Internet |

Có thể dùng XAMPP có PHP/MariaDB phù hợp. Giải nén source, ví dụ vào
`C:\xampp\htdocs\web-midterm`. Mở terminal tại thư mục chứa `README.md`.
Kiểm tra `php -v`, `php -m`. Nếu Windows chưa nhận `php`, thêm `C:\xampp\php`
vào PATH rồi mở lại terminal.

Cài thư viện PHP theo lockfile:

```sh
composer install --no-dev --prefer-dist --optimize-autoloader
```

Không cần npm hoặc Python để chạy website thông thường. `requirement.txt` ghi
các yêu cầu môi trường; hai gói Python trong đó chỉ phục vụ kiểm thử, không thay
thế PHP/Composer/MariaDB.

Không dùng Live Server, `python -m http.server` hoặc mở HTML bằng `file://`:
các cách này không thực thi API PHP.

### B.2. Tạo database và import SQL đúng thứ tự

#### B.2.1. Cách dùng phpMyAdmin

1. Khởi động MariaDB trong XAMPP hoặc dịch vụ MariaDB đã cài.
2. Mở phpMyAdmin, tạo database **mới, trống** tên `threek_booking`, charset
   `utf8mb4`, collation `utf8mb4_general_ci`.
3. Chọn database `threek_booking`, mở tab **Import**, import từng file theo bảng.
   Chờ mỗi file báo thành công trước khi chuyển sang file tiếp theo.

| Thứ tự | File | Nội dung |
| --- | --- | --- |
| 1 | `database/schema.sql` | Cấu trúc cơ sở dữ liệu ban đầu |
| 2 | `database/seed.sql` | Dữ liệu mẫu nền |
| 3 | `database/admin_migration.sql` | Bảng/cột chức năng quản trị |
| 4 | `database/customer_migration.sql` | Tài khoản, đơn, thông báo, hỗ trợ và email |
| 5 | `database/registration_otp_migration.sql` | Đăng ký bằng OTP email |
| 6 | `database/account_closure_migration.sql` | Đóng tài khoản/ẩn danh |
| 7 | `database/public_reviews_migration.sql` | Bình luận công khai |
| 8 | `database/osm_location_migration.sql` | Vị trí OpenStreetMap |
| 9 | `database/demo_hotels_ready.sql` | 20 khách sạn và 60 loại phòng |
| 10 | `database/city_filter_tags.sql` | Các nhãn vị trí dùng cho bộ lọc/quản trị |
| 11 | `database/dalat_images.sql` | 50 ảnh tổng quan và 30 ảnh phòng Đà Lạt |
| 12 | `database/vungtau_images.sql` | 50 ảnh tổng quan và 30 ảnh phòng Vũng Tàu |
| 13 | **`database/grading_accounts.sql`** | **Tài khoản admin/customer để giảng viên đăng nhập** |

Trong quy trình nộp bài này **dùng `grading_accounts.sql`**, không dùng
`demo_accounts.sql` vì đó là bộ tài khoản demo cũ có mật khẩu khác. Không cần import
`real_hotels.sql`, `reviews_migration.sql` hoặc `rollback_demo_account_credentials.sql`.
Giữ nguyên thư mục `hotel_images/` đi kèm source để các đường dẫn SQL tải được ảnh.
Một số ảnh phòng chỉ có độ phân giải 60×60 nên khi phóng lớn sẽ mờ.

#### B.2.2. Cách thay thế bằng MariaDB CLI

Mở terminal tại thư mục source. Đăng nhập MariaDB; thay cổng/user theo máy:

```sh
mariadb -h 127.0.0.1 -P 3306 -u root -p
```

Tại dấu nhắc SQL, chạy lần lượt (nếu đã tạo database bằng phpMyAdmin thì bỏ lệnh CREATE):

```sql
CREATE DATABASE threek_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE threek_booking;
SOURCE database/schema.sql;
SOURCE database/seed.sql;
SOURCE database/admin_migration.sql;
SOURCE database/customer_migration.sql;
SOURCE database/registration_otp_migration.sql;
SOURCE database/account_closure_migration.sql;
SOURCE database/public_reviews_migration.sql;
SOURCE database/osm_location_migration.sql;
SOURCE database/demo_hotels_ready.sql;
SOURCE database/city_filter_tags.sql;
SOURCE database/dalat_images.sql;
SOURCE database/vungtau_images.sql;
SOURCE database/grading_accounts.sql;
```

Quy trình trên dành cho DB mới. Với DB đang có dữ liệu: sao lưu trước, chỉ chạy
migration còn thiếu; không import lại schema. File danh mục demo ẩn khách sạn ngoài
danh mục cố định. Các file ảnh thêm đường dẫn còn thiếu, không tạo trùng khi import lại.

Nếu đã có bộ tài khoản demo cũ, `grading_accounts.sql` tạo admin chấm bài nếu chưa có
và chuyển **riêng** `b@gmail.com/customer123` của bộ demo cũ sang `admin123`.
Nó không ghi đè mật khẩu người dùng đã tự đổi hoặc quyền của email đã tồn tại.
Nếu email bị trùng tài khoản cũ có thông tin khác, dùng DB chấm bài mới để làm đúng hướng dẫn.

### B.3. Cấu hình kết nối và chạy website

Code đọc **biến môi trường**, không tự nạp file `.env`. Ví dụ dưới đây dùng MariaDB
local cổng **3306**, user `root`, mật khẩu rỗng; thay bằng thông tin máy thực tế.
Mặc định trong code là **3308**, nên phải đặt `DB_PORT` nếu máy chạy 3306.

#### Windows PowerShell

Chạy tại thư mục gốc source:

```powershell
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3306"
$env:DB_NAME="threek_booking"
$env:DB_USER="root"
$env:DB_PASSWORD=""
$env:APP_BASE_URL="http://127.0.0.1:8000"
$env:ONLINE_PAYMENTS_ENABLED="false"
php -d upload_max_filesize=5M -d post_max_size=6M -S 127.0.0.1:8000 -t .
```

#### Linux/macOS — Bash

```bash
export DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=threek_booking
export DB_USER=root DB_PASSWORD=''
export APP_BASE_URL=http://127.0.0.1:8000 ONLINE_PAYMENTS_ENABLED=false
php -d upload_max_filesize=5M -d post_max_size=6M -S 127.0.0.1:8000 -t .
```

Giữ terminal chạy trong lúc sử dụng; dừng bằng Ctrl+C. PHP cần quyền ghi thư mục
`uploads/` nếu chấm upload ảnh. Không đặt quyền 777 cho toàn dự án.

Mở các URL sau để xác nhận:

| URL | Kết quả cần có |
| --- | --- |
| <http://127.0.0.1:8000/api/setup-status.php> | `data.ready: true`, `data.missing: []` |
| <http://127.0.0.1:8000/api/hotels/index.php> | `status: success`, có danh sách khách sạn |
| <http://127.0.0.1:8000/index1.html> | Trang chủ chọn Đà Lạt/Vũng Tàu |
| <http://127.0.0.1:8000/auth/login.html> | Trang đăng nhập |

Dùng thống nhất host/port trong cả phiên, không đổi giữa `localhost` và `127.0.0.1`.
Nếu dùng Apache/XAMPP thay PHP CLI server, phải đặt biến môi trường cho Apache riêng;
biến trong PowerShell không tự truyền vào Apache đang chạy. URL khi đặt source trong
`htdocs/web-midterm` thường là `http://localhost/web-midterm/index1.html`.
PHP built-in server chỉ dùng local, không public trực tiếp ra Internet.

### B.4. Tài khoản dành riêng cho bản local

Sau khi import `database/grading_accounts.sql` vào database local:

| Vai trò | Email đăng nhập | Mật khẩu |
| --- | --- | --- |
| **Quản trị viên** | **`nguyentuankhoi2603@gmail.com`** | **`TKi@17022603`** |
| **Khách hàng có sẵn** | **`b@gmail.com`** | **`admin123`** |

Nhập **email đầy đủ**, phân biệt chữ hoa/thường của mật khẩu. Không dùng `admin`
làm username. Admin đăng nhập được chuyển đến `/admin/index.html`; customer đến
`/index1.html`. Dùng cửa sổ thường và ẩn danh để đăng nhập hai vai trò cùng lúc.

Đây là thông tin **công khai phục vụ chấm local**, được tạo bởi SQL với mật khẩu đã băm.
Không dùng mật khẩu này cho email thật/tài khoản cá nhân hoặc hosting công khai.
Không cần quyền truy cập hộp thư Gmail để đăng nhập các tài khoản đã tạo sẵn.

Tài khoản customer local là `b@gmail.com`, khác tài khoản customer deploy ở mục A.2.
Giảng viên có thể tự đăng ký customer nếu đã cấu hình gửi email theo mục B.7;
nếu chưa cấu hình email, dùng `b@gmail.com` để chấm ngay. Không có chế độ bỏ qua OTP
trên trang đăng ký.

### B.5. Cách sử dụng với vai trò khách hàng

1. Đăng nhập `b@gmail.com` hoặc tài khoản đã tự đăng ký.
2. Tại trang chủ chọn **Đà Lạt** hoặc **Vũng Tàu**. Có thể dùng nút **Về trang chủ**
   để quay lại trang chọn thành phố.
3. Chọn ngày ở **trong tương lai**, số khách và số phòng. Dùng tìm kiếm/bộ lọc phù hợp.
4. Bấm **Xem phòng**, xem bộ ảnh khách sạn, ảnh từng loại phòng, giá và phòng còn trống.
5. Chọn loại phòng, nhập thông tin người nhận phòng, điện thoại và ghi chú.
6. Bấm **Tiếp tục thanh toán**: chuyển thẳng sang một trang chọn thanh toán, không
   có bước chọn phương thức lặp lại.
7. Chọn **Thanh toán tại khách sạn** để chấm local mà không cần cổng thanh toán.
   Xác nhận và ghi lại mã đơn. Đơn lưu trong DB, không có giao dịch thu tiền trực tuyến
   với lựa chọn này.
8. Vào menu tài khoản → **Đặt phòng của tôi**, xem chi tiết, in biên nhận hoặc hủy
   nếu đơn đủ điều kiện. Tải lại trang để kiểm tra dữ liệu vẫn tồn tại.
9. Dùng **Khách sạn yêu thích**, **Thông báo**, **Hồ sơ của tôi** để chấm các chức năng
   tương ứng. Đổi mật khẩu cần mật khẩu hiện tại.
10. Trên trang khách sạn, chọn điểm và đăng bình luận. Chỉ cần đăng nhập, không cần
    đặt phòng; tác giả hoặc admin có thể xóa bình luận.
11. Gửi yêu cầu ở **Hỗ trợ & FAQ**, sau đó chờ admin phản hồi và kiểm tra lại.

Chỉ có hai lựa chọn ở giao diện thanh toán: **VNPay Sandbox** và **thanh toán tại
khách sạn**. Không nhập thẻ thật, không chuyển tiền thật trong demo. Một số chức năng
như thay đổi ngày của đơn đã tạo cần liên hệ hỗ trợ, không phải chỉnh trực tiếp đơn.

### B.6. Cách sử dụng với vai trò quản trị viên

1. Đăng nhập bằng tài khoản quản trị ở mục B.4, chờ xác minh phiên/quyền từ server.
2. Xem **Tổng quan** và các khu vực quản lý khách sạn, phòng, đơn, đánh giá, hỗ trợ,
   thanh toán và nhật ký trong dashboard.
3. Với khách sạn/phòng: xem, thêm/sửa thông tin, giá, số lượng phòng và trạng thái
   bán; quản lý ảnh nếu môi trường cho phép ghi `uploads/`.
4. Ảnh đi kèm được lưu trong `hotel_images/`; database chỉ lưu đường dẫn.
   Upload mới từ giao diện quản trị lưu trong `uploads/`.
5. Kiểm tra đơn khách vừa tạo, cập nhật trạng thái theo quy tắc. Nhận phòng/hoàn tất
   phụ thuộc ngày lưu trú và trạng thái hiện tại, nên đơn tương lai không thể hoàn tất ngay.
6. Xem/xóa đánh giá, trả lời ticket hỗ trợ; đăng nhập customer để kiểm tra phản hồi.
7. Dùng **Website khách hàng** để chuyển sang giao diện khách. Muốn quay lại,
   bấm avatar → **Trang quản trị**. Không cần đăng nhập lại khi phiên còn hợp lệ.
8. Trong giao diện khách, admin cũng có thể mở hồ sơ cá nhân và đổi mật khẩu.

Đây không phải hệ thống quản lý nhân viên POS: chưa có link mời nhân viên 1 phút,
MSSV làm mật khẩu tạm hay bắt buộc đổi mật khẩu lần đầu. Vai trò được kiểm tra ở API,
không cấp quyền bằng cách sửa localStorage.

### B.7. Tự đăng ký customer và khôi phục mật khẩu — cấu hình email

Phần này cần thiết nếu giảng viên muốn **tự tạo tài khoản trên giao diện**, nhưng
không bắt buộc nếu dùng customer có sẵn.

#### B.7.1. Gmail SMTP

Chạy Composer ở mục B.1. Dùng email gửi do người cài đặt quản lý, bật xác minh hai bước
và tạo **mật khẩu ứng dụng Gmail**. Mật khẩu đăng nhập website ở mục B.4 không phải
mật khẩu SMTP và không tự cấp quyền gửi email.

Đặt thêm các biến sau **trước khi khởi động PHP server**:

| Biến | Giá trị |
| --- | --- |
| `MAIL_TRANSPORT` | `smtp` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_ENCRYPTION` | `tls` |
| `SMTP_USERNAME` | Email Gmail gửi thư của người cài đặt |
| `SMTP_PASSWORD` | Mật khẩu ứng dụng Gmail |
| `MAIL_FROM` | Cùng email gửi |
| `APP_BASE_URL` | URL đang chạy, ví dụ `http://127.0.0.1:8000` |

PowerShell dùng `$env:TEN_BIEN="gia_tri"`; Bash dùng `export TEN_BIEN='gia_tri'`.
Khởi động lại PHP server nếu vừa đổi môi trường. Mở `/api/health-config.php`:
`data.email` phải là `true` (chỉ xác nhận đủ cấu hình, chưa chứng minh gửi thư thành công).

Mở terminal thứ hai, đặt **cùng cấu hình DB và email**, chạy tại thư mục source:

```sh
php scripts/mail-worker.php
```

Worker xử lý một đợt thư rồi thoát, không chạy thường trực. Khi yêu cầu đăng ký và
popup OTP xuất hiện, chạy worker ngay; chạy lại sau mỗi yêu cầu/gửi lại mã.
Khi deploy, có thể đặt cron mỗi phút thay thao tác thủ công. Không đưa SMTP password
hoặc Resend key thật vào source/ZIP/Git.

#### B.7.2. Đăng ký và quên mật khẩu

1. Mở `/auth/register.html`, dùng **email người nhận mà giảng viên kiểm soát**.
2. Điền họ tên, email, mật khẩu 8–72 ký tự gồm chữ và số; các trường khác theo form.
3. Gửi đăng ký, chạy worker, kiểm tra hộp thư/thư rác và nhập OTP 6 số trong cùng trình duyệt.
4. OTP có hiệu lực **5 phút**; gửi lại cần chờ **60 giây**. Có giới hạn số lần gửi/nhập sai.
5. Xác minh thành công mới tạo tài khoản customer. Đăng xuất, đăng nhập lại để kiểm tra.
6. Khi thử quên mật khẩu, dùng email vừa đăng ký, chạy worker và mở link khôi phục.
   Link có hiệu lực **5 phút**, chỉ dùng một lần; đổi thành công thu hồi các phiên cũ.

Không thử nhận OTP/quên mật khẩu bằng `b@gmail.com` nếu không sở hữu hộp thư đó.
Có thể dùng Resend thay SMTP theo [docs/CUSTOMER_SETUP.md](docs/CUSTOMER_SETUP.md).

### B.8. VNPay Sandbox — tùy chọn

Để chấm toàn bộ luồng cổng thanh toán cần tài khoản merchant **sandbox** và cấu hình:

- `ONLINE_PAYMENTS_ENABLED=true`.
- `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`: thông tin sandbox được cấp.
- `VNPAY_GATEWAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`.
- `APP_BASE_URL`: URL **HTTPS** của ứng dụng mà VNPay truy cập được, gồm thư mục con nếu có.

Code hiện yêu cầu APP_BASE_URL HTTPS cho VNPay; URL local HTTP ở mục B.3 dành cho
luồng thanh toán tại khách sạn. `localhost` không tự truy cập được từ máy chủ VNPay.
Cần cấu hình return/IPN theo tài liệu nhà cung cấp và giữ kiểm tra chữ ký.
Không dùng mã merchant giả trong script test để chấm giao dịch thật với nhà cung cấp.

Thử chọn VNPay → tạo đơn chờ thanh toán → chuyển sang cổng sandbox. Đơn chỉ ghi nhận
thanh toán khi nhận IPN có chữ ký và dữ liệu hợp lệ; việc trình duyệt quay về chưa
đủ để kết luận đã thanh toán. Nếu chưa có cấu hình, việc chọn VNPay báo lỗi cấu hình
là dự kiến; dùng thanh toán tại khách sạn để chấm các luồng còn lại.

### B.9. Kiểm chứng bảo mật và kiểm thử tự động

Ứng dụng có các lớp phòng thủ đã bổ sung: PDO native prepared statements, escape
đầu ra/textContent, kiểm tra Origin/JSON/Fetch Metadata cho customer writes,
CSRF token cho admin writes, cookie HttpOnly/SameSite và security headers cho API.
Không coi đó là chứng nhận an toàn tuyệt đối cho mọi trang/môi trường.

Có thể chấm nhanh trên local: customer đăng bình luận chứa
`<img src=x onerror=alert(1)>`, tải lại và mở bằng người đọc khác; nội dung phải là chữ,
không thực thi. Với SQLi, dùng API JSON khi thử vì form email có validation HTML;
payload không được cấp phiên mới. Không phá/xóa dữ liệu để thử nghiệm.
Chi tiết cơ chế: [docs/security-hardening.md](docs/security-hardening.md).

Kiểm thử tự động là phần nâng cao, **không bắt buộc để chạy website**. Cần Docker,
Node/npm, Python 3.10+, các gói Python trong `requirement.txt`, Chromium. Browser tests
hiện đặt đường dẫn `/usr/bin/chromium`; phù hợp Linux/WSL đã cài Chromium đúng đường dẫn.
Playwright browser tải bằng lệnh cài mặc định không tự thay đổi đường dẫn này trong script.

```sh
python3 -m pip install -r requirement.txt
npm run test:prepare
npm run test:security
npm run test:navigation
npm test
```

Test dùng container `web-midterm-admin-*`, database riêng và HTTP cổng **8001**;
website giảng viên chạy thủ công ở cổng **8000**. Không chạy các test ghi dữ liệu trên
DB hosting/DB chấm bài. Test không gửi email hoặc thanh toán thật theo cấu hình fixture.

### B.10. Lỗi thường gặp và cách khắc phục

| Lỗi | Cách kiểm tra |
| --- | --- |
| Không nhận `php` | Thêm thư mục PHP vào PATH, mở lại terminal |
| Trang API hiện code/404 | Dùng PHP server/Apache có PHP, đứng đúng thư mục source |
| Không kết nối MySQL/MariaDB | Kiểm tra dịch vụ, DB_HOST/PORT/NAME/USER/PASSWORD; chú ý 3306 và 3308 |
| Thiếu bảng/cột | Kiểm tra thứ tự import, đọc `setup-status.php`; không import đè schema lên DB có dữ liệu |
| Không đăng nhập bằng tài khoản README | Import `grading_accounts.sql`, dùng email đầy đủ; kiểm tra DB đúng và email trùng bản cũ |
| Thiếu `pdo_mysql`, `mbstring` | Bật extension trong php.ini của PHP đang chạy, khởi động lại server |
| Email chưa cấu hình | Dùng b@gmail.com hoặc cấu hình SMTP/Resend và Composer |
| OTP/email không đến | Chạy worker với cùng môi trường; kiểm tra thư rác, Internet, SMTP/TLS và thời hạn OTP |
| VNPay báo chưa cấu hình | Chấm tại khách sạn hoặc cấu hình sandbox/HTTPS/IPN đúng mục B.8 |
| Ảnh không tải | Giữ `hotel_images/`, import đủ hai file ảnh, kiểm tra đúng chữ hoa/thường |
| Bản đồ/font không tải | Kiểm tra Internet, CDN, các host OpenStreetMap |
| Lỗi phiên/CSRF | Tải lại trang, đăng nhập lại, giữ thống nhất host/port |
| Upload ảnh thất bại | Quyền ghi uploads, JPEG/PNG/WebP tối đa 5 MB, giới hạn PHP |

### B.11. Cấu trúc và đóng gói ZIP nộp bài

| Thư mục/file | Vai trò |
| --- | --- |
| `index.html`, `index1.html`, `home/` | Trang chủ |
| `auth/`, `account/` | Đăng nhập/đăng ký/hồ sơ |
| `destinations/`, `hotel/` | Danh sách thành phố, khách sạn và đặt phòng |
| `payment/`, `booking/` | Thanh toán, xác nhận, quản lý đơn |
| `admin/`, `api/` | Quản trị và backend |
| `common/`, `sources/` | CSS/JS dùng chung và tài nguyên giao diện |
| `hotel_images/`, `uploads/` | Ảnh đi kèm, ảnh tải lên |
| `database/` | Cấu trúc, dữ liệu, migration và tài khoản chấm bài |
| `scripts/`, `tests/`, `docs/` | Worker, kiểm thử và tài liệu bổ sung |
| `requirement.txt`, `composer.json`, `composer.lock`, `package*.json` | Yêu cầu môi trường/thư viện |

Trong **bản sao để nén ZIP**, bỏ `node_modules/`, `vendor/` ở gốc, `target/` nếu có,
`.git/`, `.vscode/`, cache Python, log, backup và file chứa khóa thật. Giảng viên
khôi phục vendor bằng Composer. Không xóa bản làm việc gốc chỉ để đóng gói.

**Giữ `admin/vendor/leaflet/`** và giấy phép: bản đồ dùng trực tiếp thư viện frontend này.
Giữ `sources/`, `hotel_images/`, ảnh uploads cần cho demo và `.htaccess` nếu có.
Giữ `api/config/database.php` đọc biến môi trường, không đưa cấu hình bí mật cá nhân
vào file. Các file SQL/schema và README phải nằm trong ZIP.

Khi triển khai Internet, cần HTTPS, cấu hình server chặn file nội bộ/SQL và cấm
thực thi script trong uploads; PHP built-in server không thay thế cấu hình hosting.
