# THREEK.COM — Booking Demo: Common Website Attacks and Countermeasures

> Đồ án môn học minh họa các lỗ hổng bảo mật web phổ biến (XSS, SQL Injection, CSRF, Phishing) trên một ứng dụng đặt phòng khách sạn thật, kèm bản vá tương ứng. Yêu cầu chính của đề bài là **phần demo tấn công và khắc phục** — các mục dưới đây được sắp xếp để phục vụ đúng trọng tâm đó.

---

## 1. Yêu cầu đề bài (trọng tâm)

| Hạng mục | Nội dung |
| --- | --- |
| **Loại tấn công cần trình bày** | XSS, SQL Injection, CSRF, Phishing |
| **Ví dụ minh họa** | Kịch bản thực tế cho thấy thiệt hại khi bị tấn công |
| **Biện pháp khắc phục** | Input validation, escaping, security headers |
| **Yêu cầu demo** | Xây dựng ứng dụng có phòng thủ chống XSS/SQLi + mô phỏng một kịch bản tấn công có kiểm soát, cho thấy cả lỗ hổng lẫn bản vá |

Phần còn lại của README (cài đặt, cấu trúc thư mục...) chỉ là **phụ**, phục vụ cho việc chạy được phần demo ở Mục 4.

---

## 2. Cài đặt database

### 2.1. Thứ tự import file SQL (bắt buộc đúng thứ tự)

| Thứ tự | File | Mục đích |
| --- | --- | --- |
| 1 | `database/schema.sql` | Cấu trúc ban đầu |
| 2 | `database/seed.sql` | Dữ liệu mẫu nền |
| 3 | `database/admin_migration.sql` | Bảng/cột quản trị |
| 4 | `database/customer_migration.sql` | Đơn, tài khoản, thông báo, email |
| 5 | `database/registration_otp_migration.sql` | Đăng ký qua OTP |
| 6 | `database/account_closure_migration.sql` | Đóng tài khoản/ẩn danh |
| 7 | `database/public_reviews_migration.sql` | Bình luận công khai |
| 8 | `database/osm_location_migration.sql` | Vị trí OpenStreetMap |
| 9 | `database/demo_hotels_ready.sql` | Danh mục cố định 20 khách sạn/60 loại phòng |
| 10 | `database/demo_accounts.sql` | 3 tài khoản demo (1 admin, 2 customer) |

Import lần lượt bằng phpMyAdmin hoặc dòng lệnh:

```bash
mysql -u root -p ten_database < database/schema.sql
mysql -u root -p ten_database < database/seed.sql
mysql -u root -p ten_database < database/admin_migration.sql
mysql -u root -p ten_database < database/customer_migration.sql
mysql -u root -p ten_database < database/registration_otp_migration.sql
mysql -u root -p ten_database < database/account_closure_migration.sql
mysql -u root -p ten_database < database/public_reviews_migration.sql
mysql -u root -p ten_database < database/osm_location_migration.sql
mysql -u root -p ten_database < database/demo_hotels_ready.sql
mysql -u root -p ten_database < database/demo_accounts.sql
```

### 2.2. Tài khoản demo sẵn có

| Vai trò | Email | Mật khẩu | Truy cập qua |
| --- | --- | --- | --- |
| Admin | `admin@gmail.com` | `admin123` | `admin/index.html` |
| Customer | `a@gmail.com` | `customer123` | `index.html` |
| Customer | `b@gmail.com` | `customer123` | `index.html` |

---

## 3. Chạy ứng dụng

- **Khách hàng:** mở `index.html`
- **Quản trị:** mở `admin/index.html`
- Yêu cầu máy chủ PHP + MySQL đang chạy (ví dụ XAMPP/Laragon), đặt project trong thư mục web server, chạy qua `http://localhost:<port>/...` (không mở trực tiếp file `.html` bằng `file://`, vì các request API cần cùng origin).

---

## 4. Kiểm thử tấn công trên bản hoàn thiện (đã vá) và kết quả mong đợi

> Mục đích của phần này là **chứng minh các bản vá đang hoạt động đúng** trên bản hoàn thiện — không tắt/sửa bất kỳ phòng thủ nào. Mỗi mục liệt kê payload thử nghiệm và kết quả **mong đợi là bị chặn**, kèm giải thích cơ chế chặn nằm ở đâu trong code.

### 4.1. Thử Reflected XSS — Trang tra cứu đơn đặt phòng

|  | Nội dung |
| --- | --- |
| **Vị trí** | `booking/lookup.html` + `booking/lookup.js` (yêu cầu đăng nhập, dùng tài khoản customer ở Mục 2.2) |
| **Payload thử nghiệm** | `<img src=x onerror=alert('Reflected XSS Demo')>` (47 ký tự) |
| **Cách thực hiện** | Đăng nhập → vào `lookup.html` → dán payload vào ô "Mã đặt phòng" → bấm "Tra cứu đơn" |
| **Kết quả thực tế quan sát được** | **Không có popup — kết quả âm tính.** API trả về `404` kèm thông báo **cố định** "Không tìm thấy đơn thuộc tài khoản này." — payload không hề bị phản chiếu lại trong response |
| **Cơ chế thật trong code** | `booking/lookup.js` gán kết quả lỗi bằng `out.textContent = e.message;` — dùng `textContent`, không phải `innerHTML`, nên dù có chèn gì vào cũng chỉ hiển thị như chữ thường chứ không liên quan đến việc có escape hay không |
| **Kết luận đúng về bản chất** | Đây là **phép thử Reflected XSS cho kết quả âm tính** (không phát hiện lỗ hổng) — khác với việc "khai thác thành công rồi bị chặn", vì API không hề phản chiếu payload vào response để có cơ hội bị diễn giải thành HTML. Cần nêu rõ sự khác biệt này khi trình bày, tránh mô tả thành "demo tấn công reflected rồi bản vá chặn được" |

**Cách ngăn chặn Reflected XSS (nguyên tắc chung, áp dụng cho mọi điểm tương tự trong ứng dụng):**

| Biện pháp | Giải thích |
| --- | --- |
| **Không phản chiếu input thô vào response** | Cách chặn triệt để nhất: nếu API không cần trả lại giá trị người dùng đã nhập (như ở `detail.php` hiện tại — chỉ trả thông báo cố định), không có gì để kẻ tấn công lợi dụng |
| **Nếu bắt buộc phải phản chiếu dữ liệu** | Luôn escape ký tự `& < > " '` thành HTML entity trước khi chèn vào `innerHTML` (như hàm `safe()`/`esc()` đã dùng ở Mục 4.2–4.3) |
| **Ưu tiên `textContent` thay vì `innerHTML`** | Khi chỉ cần hiển thị văn bản thuần, `textContent` ép trình duyệt hiểu dữ liệu là chữ, không bao giờ diễn giải thành thẻ HTML — đây chính là cách `lookup.js` đang làm |
| **Input validation phía server** | Giới hạn độ dài, định dạng input (ví dụ mã đơn chỉ gồm chữ/số theo pattern cố định) để giảm diện tích tấn công, dù đây là lớp phòng thủ bổ sung, không thay thế việc escape output |
| **Content-Security-Policy** | Thêm lớp chặn dự phòng — dù lỡ sót một điểm chèn không escape, CSP có thể ngăn script inline thực thi (xem Mục 6 về phạm vi CSP hiện tại) |

### 4.2. Thử DOM-based XSS — Redirect sau đăng nhập qua tham số `next`

|  | Nội dung |
| --- | --- |
| **Vị trí** | `auth/login.html` |
| **Payload thử nghiệm** | `javascript:alert('DOM-XSS')` |
| **URL thử nghiệm** | `auth/login.html?next=javascript%3Aalert%28%27DOM-XSS%27%29` |
| **Cách thực hiện** | Mở URL trên → đăng nhập bằng tài khoản customer thật (`a@gmail.com` / `customer123`) |
| **Kết quả mong đợi (đã vá)** | **Không có popup.** Sau khi đăng nhập thành công, hệ thống chuyển thẳng đến trang chủ khách hàng (`index1.html`) thay vì thực thi `next` |
| **Cơ chế chặn** | Hàm `safeCustomerDestination()` áp dụng allowlist: chỉ chấp nhận `next` là đường dẫn nội bộ bắt đầu bằng `/`, từ chối mọi scheme khác (`javascript:`, `data:`...), từ chối `//` (tránh trỏ sang domain khác), và chặn riêng việc đưa customer vào khu vực `/admin/`. Nếu `next` không hợp lệ, hàm trả về `null` và hệ thống dùng trang mặc định thay thế |
| **Ý nghĩa với kịch bản tấn công thật** | Nếu thiếu allowlist này, script độc hại sẽ chạy đúng thời điểm session vừa đăng nhập. Lưu ý: cookie phiên của hệ thống có thuộc tính `HttpOnly`, nên JavaScript **không đọc trực tiếp được** giá trị cookie đó. XSS vẫn nguy hiểm trong trường hợp này vì script chạy cùng origin có thể **tự gọi API bằng chính phiên của nạn nhân** (cookie vẫn tự động gửi kèm mỗi request), qua đó đọc/ghi dữ liệu cá nhân mà không cần biết giá trị cookie |

### 4.3. Thử Stored XSS — Bình luận/đánh giá công khai

|  | Nội dung |
| --- | --- |
| **Vị trí** | `hotel/reviews.js` (hiển thị bình luận công khai) và `admin/admin-operations.js` (hiển thị bình luận trong bảng quản trị) |
| **Điều kiện đăng bình luận** | Phải đăng nhập (tài khoản customer ở Mục 2.2); **không** yêu cầu đã từng đặt phòng — bình luận hiện đăng ngay sau khi submit |
| **Payload thử nghiệm** | `<img src=x onerror=alert('Stored XSS Demo')>` nhập vào ô đánh giá, submit |
| **Kết quả mong đợi (đã vá)** | Sau khi submit, xem lại trang có bình luận đó (kể cả tài khoản/trình duyệt khác) → **không có popup**, nội dung hiển thị dưới dạng văn bản thuần túy |
| **Cơ chế chặn** | `hotel/reviews.js` escape nội dung bình luận và tên tác giả trước khi render ra trang công khai: `esc(r.comment)` và `esc(r.author)`. `admin/admin-operations.js` cũng escape nội dung tương ứng khi hiển thị trong bảng quản trị, nên admin xem danh sách bình luận cũng không bị ảnh hưởng |
| **Vì sao đáng chú ý hơn Reflected** | Payload chỉ cần đăng **một lần**; sau đó **mọi người** xem trang (khách khác, admin xem bảng quản trị...) đều có khả năng bị ảnh hưởng nếu thiếu escape — khác với Reflected vốn cần lừa từng nạn nhân bấm link riêng lẻ |

### 4.4. Thử SQL Injection — Form đăng nhập

|  | Nội dung |
| --- | --- |
| **Vị trí** | `api/auth/login.php` |
| **Payload thử nghiệm** | `' OR 1=1 -- ` trong trường `email` |
| **Cách gửi** | Gửi thẳng request JSON vào endpoint API (ví dụ bằng DevTools → tab Network → "Copy as fetch", hoặc công cụ như Postman/curl), **không điền qua form trên giao diện** — vì ô email trên form có thể bị chặn bởi validation định dạng email của trình duyệt (thuộc tính `type="email"`) trước khi kịp gửi đi |
| **Kết quả mong đợi (đã vá)** | API trả về `401` (hoặc mã lỗi xác thực tương ứng), **không cấp phiên đăng nhập mới**, không có bản ghi người dùng nào được trả về |
| **Cơ chế chặn** | `api/auth/login.php` dùng **prepared statement** của PDO, tham số hóa đầy đủ: |

```php
$stmt = $pdo->prepare(
    "SELECT id,email,password_hash,full_name,display_name,phone,birthday,role,session_version,deleted_at
     FROM users WHERE email = :email LIMIT 1"
);
$stmt->execute([
    "email" => $email,
]);
$user = $stmt->fetch();
```

|  | Nội dung |
| --- | --- |
| **Vì sao an toàn** | Vì `:email` được truyền qua tham số (`execute(["email" => $email])`) thay vì nối chuỗi trực tiếp vào câu SQL, driver PDO gửi dữ liệu và câu lệnh SQL tách biệt xuống MySQL — bất kỳ ký tự đặc biệt nào (`'`, `OR`, `--`...) trong `$email` đều được hiểu là **dữ liệu**, không phải **cú pháp SQL** |
| **Phạm vi kết luận (quan trọng)** | Chỉ nên kết luận: *"các payload và luồng đã kiểm tra (payload `' OR 1=1 -- ` gửi qua API cho form đăng nhập) đều bị chặn đúng như mong đợi"* — **không** khái quát thành "an toàn tuyệt đối với mọi input SQL injection", vì chưa kiểm thử hết các điểm nhập liệu khác trong ứng dụng (tìm kiếm, lọc, các API khác...) |
| **Đối chiếu để báo cáo** | Nếu trong quá trình phát triển từng có một "nhánh thử nghiệm" nối chuỗi `email` trực tiếp vào `SELECT` (không dùng `:email`/`execute([...])`) để minh họa lỗ hổng, nhánh đó **không nên tồn tại trong bản nộp cuối cùng** — chỉ giữ lại duy nhất phiên bản dùng prepared statement ở trên |
| **Nguyên tắc chung cần nêu trong bài luận** | Luôn dùng prepared statement/parameterized query cho mọi câu lệnh SQL có chứa input người dùng; không tự ráp chuỗi SQL bằng phép nối (`.`/`+`) dù đã lọc ký tự đặc biệt thủ công |

---

## 5. Bảng tổng kết nguyên lý 3 loại XSS

| Loại | Mã độc nằm ở đâu | Nạn nhân cần làm gì để dính | Vị trí demo trong project này |
| --- | --- | --- | --- |
| Reflected | Trong request, không lưu lại | Phải bị lừa bấm 1 link/submit chứa payload | `booking/lookup.html` (test phòng thủ đầu vào — API không phản chiếu payload, xem lưu ý ở Mục 4.1) |
| Stored | Lưu trong database | Chỉ cần mở trang có chứa nội dung độc hại | `hotel/reviews.js`, `admin/admin-operations.js` |
| DOM-based | Trong JavaScript phía trình duyệt | Tùy sink — ở đây là ngay sau khi đăng nhập qua `next` | `auth/login.html` |

---

## 6. Nguyên tắc phòng chống chung (Countermeasures)

| Biện pháp | Áp dụng trong project |
| --- | --- |
| **Output escaping** | Hàm `safe()` escape `& < > " '` trước khi chèn vào `innerHTML`, áp dụng nhất quán tại `booking/detail.html` |
| **Input validation / Allowlist** | Hàm `safeCustomerDestination()` chỉ chấp nhận path nội bộ hợp lệ cho redirect sau đăng nhập |
| **Parameterized queries** | Dùng PDO prepared statement (`$db->prepare(...)->execute([...])`) trong các file PHP backend, chống SQL Injection |
| **Xác thực phía server, không chỉ tin JS** | Vai trò admin được xác minh lại qua `api/admin/me.php` thay vì chỉ dựa vào giá trị `role` lưu ở client |
| **Security headers (đã triển khai, không phải đề xuất)** | `api/shared/security.php` đã đặt `Content-Security-Policy` và `X-Content-Type-Options: nosniff` cho các response từ API, cùng `Cache-Control: no-store` cho dữ liệu nhạy cảm (ví dụ ở `detail.php`). **Lưu ý phạm vi:** CSP này áp dụng cho response của API, **không tự động áp dụng cho các trang HTML tĩnh** (`.html` phục vụ trực tiếp) — nên chưa thể kết luận toàn bộ website đã chặn script inline, trừ khi các trang HTML cũng được cấu hình gửi header này (qua server hoặc thẻ `<meta http-equiv="Content-Security-Policy">`) |

---

## 7. Phạm vi và phương pháp kiểm thử

Phần này trình bày rõ phạm vi, phương pháp và giới hạn của các kết quả kiểm thử ở Mục 4, nhằm giúp người đọc đánh giá đúng mức độ tin cậy của các kết luận được đưa ra trong báo cáo.

**7.1. Phương pháp kiểm thử**

Mục 4 kiểm thử trực tiếp trên **bản hoàn thiện của ứng dụng (nhánh `main`)**, không chỉnh sửa hay vô hiệu hóa bất kỳ cơ chế phòng thủ nào trong quá trình kiểm thử. Mục tiêu là xác minh rằng các cơ chế phòng thủ đã triển khai hoạt động đúng như thiết kế, đối với tập payload và luồng xử lý **đã được liệt kê cụ thể** trong từng mục con.

Các payload thử nghiệm được lựa chọn ở dạng tối thiểu, chỉ đủ để xác nhận có/không có hành vi thực thi mã (dùng `alert()` cho các trường hợp XSS, và mệnh đề logic cơ bản `' OR 1=1 -- ` cho SQL Injection), nhằm tránh đưa vào báo cáo bất kỳ đoạn mã nào có khả năng gây hại thực sự hoặc được dùng để chiếm quyền truy cập.

**7.2. Phân loại kết quả theo bản chất kỹ thuật**

Không phải mọi mục trong Mục 4 đều có cùng bản chất. Cụ thể:

- **Mục 4.1 (Reflected XSS)** cho kết quả **âm tính do thiết kế** (API không phản chiếu input người dùng trở lại trong response), không phải trường hợp "tấn công thành công rồi bị một lớp phòng thủ chặn lại". Hai trường hợp này khác nhau về mặt bảo mật và cần được phân biệt rõ trong phần trình bày, để tránh đánh giá sai mức độ phòng thủ thực sự của hệ thống tại điểm này.
- **Mục 4.2, 4.3, 4.4** là các trường hợp **có cơ chế phòng thủ chủ động** (escaping, allowlist, prepared statement) được kiểm chứng bằng cách thử payload tương ứng và quan sát hành vi bị chặn.

**7.3. Giới hạn của kết luận**

Các kết luận trong báo cáo này **chỉ có giá trị trong phạm vi payload và luồng xử lý đã được liệt kê**. Báo cáo không đưa ra các khẳng định mang tính khái quát như "ứng dụng an toàn tuyệt đối với mọi input" hay "toàn bộ hệ thống đã được bảo vệ khỏi \[loại tấn công\]", vì những khẳng định này vượt quá phạm vi các phép thử đã thực hiện. Việc một điểm cụ thể đã được kiểm chứng không đảm bảo các điểm chưa được kiểm thử trong ứng dụng cũng có mức độ an toàn tương đương.

**7.4. Tiêu chí xác định kết quả bất thường**

Nếu trong quá trình kiểm thử lại, bất kỳ payload nào ở Mục 4 **thực thi được** (xuất hiện popup, hoặc trường hợp SQL Injection dẫn đến đăng nhập thành công), kết quả đó cho thấy lỗ hổng tương ứng **chưa được khắc phục** tại thời điểm kiểm thử, và cần được ghi nhận như một phát hiện mới, không nên đối chiếu theo kết quả "mong đợi" đã nêu trong tài liệu này.
