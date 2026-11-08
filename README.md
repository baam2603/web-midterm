
</head><body>
<h1>THREEK.COM — Booking Demo: Common Website Attacks and Countermeasures</h1>
<blockquote>
<p>Đồ án môn học minh họa các lỗ hổng bảo mật web phổ biến (XSS, SQL Injection, CSRF, Phishing) trên một ứng dụng đặt phòng khách sạn thật, kèm bản vá tương ứng. Yêu cầu chính của đề bài là <strong>phần demo tấn công và khắc phục</strong> — các mục dưới đây được sắp xếp để phục vụ đúng trọng tâm đó.</p>
</blockquote>
<hr>
<h2>1. Yêu cầu đề bài (trọng tâm)</h2>
<div class="md-table" role="group" aria-label="Table" tabindex="0"><table>
<thead>
<tr>
<th>Hạng mục</th>
<th>Nội dung</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Loại tấn công cần trình bày</strong></td>
<td>XSS, SQL Injection, CSRF, Phishing</td>
</tr>
<tr>
<td><strong>Ví dụ minh họa</strong></td>
<td>Kịch bản thực tế cho thấy thiệt hại khi bị tấn công</td>
</tr>
<tr>
<td><strong>Biện pháp khắc phục</strong></td>
<td>Input validation, escaping, security headers</td>
</tr>
<tr>
<td><strong>Yêu cầu demo</strong></td>
<td>Xây dựng ứng dụng có phòng thủ chống XSS/SQLi + mô phỏng một kịch bản tấn công có kiểm soát, cho thấy cả lỗ hổng lẫn bản vá</td>
</tr>
</tbody>
</table>
</div>
<p>Phần còn lại của README (cài đặt, cấu trúc thư mục...) chỉ là <strong>phụ</strong>, phục vụ cho việc chạy được phần demo ở Mục 4.</p>
<hr>
<h2>2. Cài đặt database</h2>
<h3>2.1. Thứ tự import file SQL (bắt buộc đúng thứ tự)</h3>
<div class="md-table" role="group" aria-label="Table" tabindex="0"><table>
<thead>
<tr>
<th>Thứ tự</th>
<th>File</th>
<th>Mục đích</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td><code>database/schema.sql</code></td>
<td>Cấu trúc ban đầu</td>
</tr>
<tr>
<td>2</td>
<td><code>database/seed.sql</code></td>
<td>Dữ liệu mẫu nền</td>
</tr>
<tr>
<td>3</td>
<td><code>database/admin_migration.sql</code></td>
<td>Bảng/cột quản trị</td>
</tr>
<tr>
<td>4</td>
<td><code>database/customer_migration.sql</code></td>
<td>Đơn, tài khoản, thông báo, email</td>
</tr>
<tr>
<td>5</td>
<td><code>database/registration_otp_migration.sql</code></td>
<td>Đăng ký qua OTP</td>
</tr>
<tr>
<td>6</td>
<td><code>database/account_closure_migration.sql</code></td>
<td>Đóng tài khoản/ẩn danh</td>
</tr>
<tr>
<td>7</td>
<td><code>database/public_reviews_migration.sql</code></td>
<td>Bình luận công khai</td>
</tr>
<tr>
<td>8</td>
<td><code>database/osm_location_migration.sql</code></td>
<td>Vị trí OpenStreetMap</td>
</tr>
<tr>
<td>9</td>
<td><code>database/demo_hotels_ready.sql</code></td>
<td>Danh mục cố định 20 khách sạn/60 loại phòng</td>
</tr>
<tr>
<td>10</td>
<td><code>database/demo_accounts.sql</code></td>
<td>3 tài khoản demo (1 admin, 2 customer)</td>
</tr>
</tbody>
</table>
</div>
<p>Import lần lượt bằng phpMyAdmin hoặc dòng lệnh:</p>
<pre><code class="language-bash">mysql -u root -p ten_database &lt; database/schema.sql
mysql -u root -p ten_database &lt; database/seed.sql
mysql -u root -p ten_database &lt; database/admin_migration.sql
mysql -u root -p ten_database &lt; database/customer_migration.sql
mysql -u root -p ten_database &lt; database/registration_otp_migration.sql
mysql -u root -p ten_database &lt; database/account_closure_migration.sql
mysql -u root -p ten_database &lt; database/public_reviews_migration.sql
mysql -u root -p ten_database &lt; database/osm_location_migration.sql
mysql -u root -p ten_database &lt; database/demo_hotels_ready.sql
mysql -u root -p ten_database &lt; database/demo_accounts.sql
</code></pre>
<h3>2.2. Tài khoản demo sẵn có</h3>
<div class="md-table" role="group" aria-label="Table" tabindex="0"><table>
<thead>
<tr>
<th>Vai trò</th>
<th>Email</th>
<th>Mật khẩu</th>
<th>Truy cập qua</th>
</tr>
</thead>
<tbody>
<tr>
<td>Admin</td>
<td><code>admin@gmail.com</code></td>
<td><code>admin123</code></td>
<td><code>admin/index.html</code></td>
</tr>
<tr>
<td>Customer</td>
<td><code>a@gmail.com</code></td>
<td><code>customer123</code></td>
<td><code>index.html</code></td>
</tr>
<tr>
<td>Customer</td>
<td><code>b@gmail.com</code></td>
<td><code>customer123</code></td>
<td><code>index.html</code></td>
</tr>
</tbody>
</table>
</div>
<hr>
<h2>3. Chạy ứng dụng</h2>
<ul>
<li><strong>Khách hàng:</strong> mở <code>index.html</code></li>
<li><strong>Quản trị:</strong> mở <code>admin/index.html</code></li>
<li>Yêu cầu máy chủ PHP + MySQL đang chạy (ví dụ XAMPP/Laragon), đặt project trong thư mục web server, chạy qua <code>http://localhost:&lt;port&gt;/...</code> (không mở trực tiếp file <code>.html</code> bằng <code>file://</code>, vì các request API cần cùng origin).</li>
</ul>
<hr>
<h2>4. Kiểm thử tấn công trên bản hoàn thiện (đã vá) và kết quả mong đợi</h2>
<blockquote>
<p>Mục đích của phần này là <strong>chứng minh các bản vá đang hoạt động đúng</strong> trên bản hoàn thiện — không tắt/sửa bất kỳ phòng thủ nào. Mỗi mục liệt kê payload thử nghiệm và kết quả <strong>mong đợi là bị chặn</strong>, kèm giải thích cơ chế chặn nằm ở đâu trong code.</p>
</blockquote>
<h3>4.1. Thử xử lý input nghi vấn XSS — Trang tra cứu đơn đặt phòng</h3>
<div class="md-table" role="group" aria-label="Table" tabindex="0"><table>
<thead>
<tr>
<th></th>
<th>Nội dung</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Vị trí</strong></td>
<td><code>booking/lookup.html</code> + <code>booking/lookup.js</code> (yêu cầu đăng nhập, dùng tài khoản customer ở Mục 2.2)</td>
</tr>
<tr>
<td><strong>Payload thử nghiệm</strong></td>
<td><code>&lt;img src=x onerror=alert('Reflected XSS Demo')&gt;</code> (47 ký tự)</td>
</tr>
<tr>
<td><strong>Cách thực hiện</strong></td>
<td>Đăng nhập → vào <code>lookup.html</code> → dán payload vào ô &quot;Mã đặt phòng&quot; → bấm &quot;Tra cứu đơn&quot;</td>
</tr>
<tr>
<td><strong>Kết quả thực tế quan sát được</strong></td>
<td><strong>Không có popup.</strong> API trả về <code>404</code> kèm thông báo <strong>cố định</strong> &quot;Không tìm thấy đơn thuộc tài khoản này.&quot; — payload không hề bị phản chiếu lại trong response</td>
</tr>
<tr>
<td><strong>Cơ chế thật trong code</strong></td>
<td><code>booking/lookup.js</code> gán kết quả lỗi bằng <code>out.textContent = e.message;</code> — dùng <code>textContent</code>, không phải <code>innerHTML</code>, nên dù có chèn gì vào cũng chỉ hiển thị như chữ thường chứ không liên quan đến việc có escape hay không</td>
</tr>
<tr>
<td><strong>Kết luận đúng về bản chất</strong></td>
<td>Đây là <strong>phép thử khả năng xử lý input nghi vấn XSS một cách an toàn</strong> (input handling test) — không phải minh họa trực tiếp một luồng <em>reflected</em> HTML thật, vì API không phản chiếu payload vào thông báo lỗi để kiểm chứng việc escape có hoạt động hay không. Nếu muốn minh họa đúng nghĩa luồng reflected (server/JS phản chiếu input vào DOM), cần tìm một điểm khác trong ứng dụng có hành vi phản chiếu thật, hoặc nêu rõ trong báo cáo rằng đây là test phòng thủ đầu vào, không phải PoC khai thác</td>
</tr>
</tbody>
</table>
</div>
<h3>4.2. Thử DOM-based XSS — Redirect sau đăng nhập qua tham số <code>next</code></h3>
<div class="md-table" role="group" aria-label="Table" tabindex="0"><table>
<thead>
<tr>
<th></th>
<th>Nội dung</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Vị trí</strong></td>
<td><code>auth/login.html</code></td>
</tr>
<tr>
<td><strong>Payload thử nghiệm</strong></td>
<td><code>javascript:alert('DOM-XSS')</code></td>
</tr>
<tr>
<td><strong>URL thử nghiệm</strong></td>
<td><code>auth/login.html?next=javascript%3Aalert%28%27DOM-XSS%27%29</code></td>
</tr>
<tr>
<td><strong>Cách thực hiện</strong></td>
<td>Mở URL trên → đăng nhập bằng tài khoản customer thật (<code>a@gmail.com</code> / <code>customer123</code>)</td>
</tr>
<tr>
<td><strong>Kết quả mong đợi (đã vá)</strong></td>
<td><strong>Không có popup.</strong> Sau khi đăng nhập thành công, hệ thống chuyển thẳng đến trang chủ khách hàng (<code>index1.html</code>) thay vì thực thi <code>next</code></td>
</tr>
<tr>
<td><strong>Cơ chế chặn</strong></td>
<td>Hàm <code>safeCustomerDestination()</code> áp dụng allowlist: chỉ chấp nhận <code>next</code> là đường dẫn nội bộ bắt đầu bằng <code>/</code>, từ chối mọi scheme khác (<code>javascript:</code>, <code>data:</code>...), từ chối <code>//</code> (tránh trỏ sang domain khác), và chặn riêng việc đưa customer vào khu vực <code>/admin/</code>. Nếu <code>next</code> không hợp lệ, hàm trả về <code>null</code> và hệ thống dùng trang mặc định thay thế</td>
</tr>
<tr>
<td><strong>Ý nghĩa với kịch bản tấn công thật</strong></td>
<td>Nếu thiếu allowlist này, script độc hại sẽ chạy đúng thời điểm session vừa đăng nhập. Lưu ý: cookie phiên của hệ thống có thuộc tính <code>HttpOnly</code>, nên JavaScript <strong>không đọc trực tiếp được</strong> giá trị cookie đó. XSS vẫn nguy hiểm trong trường hợp này vì script chạy cùng origin có thể <strong>tự gọi API bằng chính phiên của nạn nhân</strong> (cookie vẫn tự động gửi kèm mỗi request), qua đó đọc/ghi dữ liệu cá nhân mà không cần biết giá trị cookie</td>
</tr>
</tbody>
</table>
</div>
<h3>4.3. Thử Stored XSS — Bình luận/đánh giá công khai</h3>
<div class="md-table" role="group" aria-label="Table" tabindex="0"><table>
<thead>
<tr>
<th></th>
<th>Nội dung</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Vị trí</strong></td>
<td><code>hotel/reviews.js</code> (hiển thị bình luận công khai) và <code>admin/admin-operations.js</code> (hiển thị bình luận trong bảng quản trị)</td>
</tr>
<tr>
<td><strong>Điều kiện đăng bình luận</strong></td>
<td>Phải đăng nhập (tài khoản customer ở Mục 2.2); <strong>không</strong> yêu cầu đã từng đặt phòng — bình luận hiện đăng ngay sau khi submit</td>
</tr>
<tr>
<td><strong>Payload thử nghiệm</strong></td>
<td><code>&lt;img src=x onerror=alert('Stored XSS Demo')&gt;</code> nhập vào ô đánh giá, submit</td>
</tr>
<tr>
<td><strong>Kết quả mong đợi (đã vá)</strong></td>
<td>Sau khi submit, xem lại trang có bình luận đó (kể cả tài khoản/trình duyệt khác) → <strong>không có popup</strong>, nội dung hiển thị dưới dạng văn bản thuần túy</td>
</tr>
<tr>
<td><strong>Cơ chế chặn</strong></td>
<td><code>hotel/reviews.js</code> escape nội dung bình luận và tên tác giả trước khi render ra trang công khai: <code>esc(r.comment)</code> và <code>esc(r.author)</code>. <code>admin/admin-operations.js</code> cũng escape nội dung tương ứng khi hiển thị trong bảng quản trị, nên admin xem danh sách bình luận cũng không bị ảnh hưởng</td>
</tr>
<tr>
<td><strong>Vì sao đáng chú ý hơn Reflected</strong></td>
<td>Payload chỉ cần đăng <strong>một lần</strong>; sau đó <strong>mọi người</strong> xem trang (khách khác, admin xem bảng quản trị...) đều có khả năng bị ảnh hưởng nếu thiếu escape — khác với Reflected vốn cần lừa từng nạn nhân bấm link riêng lẻ</td>
</tr>
</tbody>
</table>
</div>
<h3>4.4. Thử SQL Injection — Form đăng nhập</h3>
<div class="md-table" role="group" aria-label="Table" tabindex="0"><table>
<thead>
<tr>
<th></th>
<th>Nội dung</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Vị trí</strong></td>
<td><code>api/auth/login.php</code></td>
</tr>
<tr>
<td><strong>Payload thử nghiệm</strong></td>
<td><code>' OR 1=1 -- </code> trong trường <code>email</code></td>
</tr>
<tr>
<td><strong>Cách gửi</strong></td>
<td>Gửi thẳng request JSON vào endpoint API (ví dụ bằng DevTools → tab Network → &quot;Copy as fetch&quot;, hoặc công cụ như Postman/curl), <strong>không điền qua form trên giao diện</strong> — vì ô email trên form có thể bị chặn bởi validation định dạng email của trình duyệt (thuộc tính <code>type=&quot;email&quot;</code>) trước khi kịp gửi đi</td>
</tr>
<tr>
<td><strong>Kết quả mong đợi (đã vá)</strong></td>
<td>API trả về <code>401</code> (hoặc mã lỗi xác thực tương ứng), <strong>không cấp phiên đăng nhập mới</strong>, không có bản ghi người dùng nào được trả về</td>
</tr>
<tr>
<td><strong>Cơ chế chặn</strong></td>
<td><code>api/auth/login.php</code> dùng <strong>prepared statement</strong> của PDO, tham số hóa đầy đủ:</td>
</tr>
</tbody>
</table>
</div>
<pre><code class="language-php">$stmt = $pdo-&gt;prepare(
    &#34;SELECT id,email,password_hash,full_name,display_name,phone,birthday,role,session_version,deleted_at
     FROM users WHERE email = :email LIMIT 1&#34;
);
$stmt-&gt;execute([
    &#34;email&#34; =&gt; $email,
]);
$user = $stmt-&gt;fetch();
</code></pre>
<div class="md-table" role="group" aria-label="Table" tabindex="0"><table>
<thead>
<tr>
<th></th>
<th>Nội dung</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Vì sao an toàn</strong></td>
<td>Vì <code>:email</code> được truyền qua tham số (<code>execute([&quot;email&quot; =&gt; $email])</code>) thay vì nối chuỗi trực tiếp vào câu SQL, driver PDO gửi dữ liệu và câu lệnh SQL tách biệt xuống MySQL — bất kỳ ký tự đặc biệt nào (<code>'</code>, <code>OR</code>, <code>--</code>...) trong <code>$email</code> đều được hiểu là <strong>dữ liệu</strong>, không phải <strong>cú pháp SQL</strong></td>
</tr>
<tr>
<td><strong>Phạm vi kết luận (quan trọng)</strong></td>
<td>Chỉ nên kết luận: <em>&quot;các payload và luồng đã kiểm tra (payload <code>' OR 1=1 -- </code> gửi qua API cho form đăng nhập) đều bị chặn đúng như mong đợi&quot;</em> — <strong>không</strong> khái quát thành &quot;an toàn tuyệt đối với mọi input SQL injection&quot;, vì chưa kiểm thử hết các điểm nhập liệu khác trong ứng dụng (tìm kiếm, lọc, các API khác...)</td>
</tr>
<tr>
<td><strong>Đối chiếu để báo cáo</strong></td>
<td>Nếu trong quá trình phát triển từng có một &quot;nhánh thử nghiệm&quot; nối chuỗi <code>email</code> trực tiếp vào <code>SELECT</code> (không dùng <code>:email</code>/<code>execute([...])</code>) để minh họa lỗ hổng, nhánh đó <strong>không nên tồn tại trong bản nộp cuối cùng</strong> — chỉ giữ lại duy nhất phiên bản dùng prepared statement ở trên</td>
</tr>
<tr>
<td><strong>Nguyên tắc chung cần nêu trong bài luận</strong></td>
<td>Luôn dùng prepared statement/parameterized query cho mọi câu lệnh SQL có chứa input người dùng; không tự ráp chuỗi SQL bằng phép nối (<code>.</code>/<code>+</code>) dù đã lọc ký tự đặc biệt thủ công</td>
</tr>
</tbody>
</table>
</div>
<hr>
<h2>5. Bảng tổng kết nguyên lý 3 loại XSS</h2>
<div class="md-table" role="group" aria-label="Table" tabindex="0"><table>
<thead>
<tr>
<th>Loại</th>
<th>Mã độc nằm ở đâu</th>
<th>Nạn nhân cần làm gì để dính</th>
<th>Vị trí demo trong project này</th>
</tr>
</thead>
<tbody>
<tr>
<td>Reflected</td>
<td>Trong request, không lưu lại</td>
<td>Phải bị lừa bấm 1 link/submit chứa payload</td>
<td><code>booking/lookup.html</code> (test phòng thủ đầu vào — API không phản chiếu payload, xem lưu ý ở Mục 4.1)</td>
</tr>
<tr>
<td>Stored</td>
<td>Lưu trong database</td>
<td>Chỉ cần mở trang có chứa nội dung độc hại</td>
<td><code>hotel/reviews.js</code>, <code>admin/admin-operations.js</code></td>
</tr>
<tr>
<td>DOM-based</td>
<td>Trong JavaScript phía trình duyệt</td>
<td>Tùy sink — ở đây là ngay sau khi đăng nhập qua <code>next</code></td>
<td><code>auth/login.html</code></td>
</tr>
</tbody>
</table>
</div>
<hr>
<h2>6. Nguyên tắc phòng chống chung (Countermeasures)</h2>
<div class="md-table" role="group" aria-label="Table" tabindex="0"><table>
<thead>
<tr>
<th>Biện pháp</th>
<th>Áp dụng trong project</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Output escaping</strong></td>
<td>Hàm <code>safe()</code> escape <code>&amp; &lt; &gt; &quot; '</code> trước khi chèn vào <code>innerHTML</code>, áp dụng nhất quán tại <code>booking/detail.html</code></td>
</tr>
<tr>
<td><strong>Input validation / Allowlist</strong></td>
<td>Hàm <code>safeCustomerDestination()</code> chỉ chấp nhận path nội bộ hợp lệ cho redirect sau đăng nhập</td>
</tr>
<tr>
<td><strong>Parameterized queries</strong></td>
<td>Dùng PDO prepared statement (<code>$db-&gt;prepare(...)-&gt;execute([...])</code>) trong các file PHP backend, chống SQL Injection</td>
</tr>
<tr>
<td><strong>Xác thực phía server, không chỉ tin JS</strong></td>
<td>Vai trò admin được xác minh lại qua <code>api/admin/me.php</code> thay vì chỉ dựa vào giá trị <code>role</code> lưu ở client</td>
</tr>
<tr>
<td><strong>Security headers (đã triển khai, không phải đề xuất)</strong></td>
<td><code>api/shared/security.php</code> đã đặt <code>Content-Security-Policy</code> và <code>X-Content-Type-Options: nosniff</code> cho các response từ API, cùng <code>Cache-Control: no-store</code> cho dữ liệu nhạy cảm (ví dụ ở <code>detail.php</code>). <strong>Lưu ý phạm vi:</strong> CSP này áp dụng cho response của API, <strong>không tự động áp dụng cho các trang HTML tĩnh</strong> (<code>.html</code> phục vụ trực tiếp) — nên chưa thể kết luận toàn bộ website đã chặn script inline, trừ khi các trang HTML cũng được cấu hình gửi header này (qua server hoặc thẻ <code>&lt;meta http-equiv=&quot;Content-Security-Policy&quot;&gt;</code>)</td>
</tr>
</tbody>
</table>
</div>
<hr>
</body></html>
