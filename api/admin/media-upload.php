<?php

declare(strict_types=1);
require_once __DIR__ . '/../shared/bootstrap.php';
requireMethod('POST');
requireAdmin();
header('Cache-Control: no-store, private');
$sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
$expected = $_SESSION['admin_csrf'] ?? '';
if (!is_string($sent) || !is_string($expected) || $expected === '' || !hash_equals($expected, $sent)) {
    reply(403, ['status' => 'error', 'message' => 'CSRF token không hợp lệ.']);
}
$kind = (string)($_POST['kind'] ?? '');
$id = filter_var($_POST['item_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!in_array($kind, ['hotel', 'room'], true) || !$id) {
    reply(422, ['status' => 'error', 'message' => 'Loại ảnh hoặc ID không hợp lệ.']);
}
$file = $_FILES['image'] ?? null;
if (
    !is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK
    || (int)($file['size'] ?? 0) < 1 || (int)($file['size'] ?? 0) > 5 * 1024 * 1024
    || !is_uploaded_file((string)($file['tmp_name'] ?? ''))
) {
    reply(422, ['status' => 'error', 'message' => 'Chỉ nhận ảnh JPEG/PNG/WebP tối đa 5MB.']);
}
$tmp = $file['tmp_name'];
$info = @getimagesize($tmp);
$mime = $info['mime'] ?? '';
$types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
if (!isset($types[$mime]) || ($info[0] ?? 0) > 8000 || ($info[1] ?? 0) > 8000) {
    reply(422, ['status' => 'error', 'message' => 'Định dạng hoặc kích thước ảnh không hợp lệ.']);
}
try {
    $pdo = connectDB();
    $table = $kind === 'hotel' ? 'hotels' : 'room_types';
    $q = $pdo->prepare("SELECT id FROM $table WHERE id=? LIMIT 1");
    $q->execute([$id]);
    if (!$q->fetchColumn()) reply(404, ['status' => 'error', 'message' => 'Không tìm thấy đối tượng tải ảnh.']);
    $imageTable = $kind === 'hotel' ? 'hotel_images' : 'room_images';
    $fk = $kind === 'hotel' ? 'hotel_id' : 'room_type_id';
    $q = $pdo->prepare("SELECT COUNT(*), COALESCE(MAX(sort_order),0) FROM $imageTable WHERE $fk=?");
    $q->execute([$id]);
    [$count, $maxOrder] = $q->fetch(PDO::FETCH_NUM);
    if ((int)$count >= 15) reply(422, ['status' => 'error', 'message' => 'Mỗi khách sạn/loại phòng tối đa 15 ảnh.']);

    $projectRoot = dirname(__DIR__, 2);
    $relativeDir = 'uploads/' . $kind . 's/' . $id;
    $destDir = $projectRoot . '/' . $relativeDir;
    if (!is_dir($destDir) && !mkdir($destDir, 0755, true) && !is_dir($destDir)) {
        throw new RuntimeException('Không thể tạo thư mục lưu ảnh.');
    }
    // Ngăn PHP thực thi trong thư mục ảnh trên Apache. Khuyến nghị bật cấu hình này ở web server.
    $htaccess = dirname($destDir, 2) . '/.htaccess';
    if (!file_exists($htaccess)) @file_put_contents($htaccess, "Options -Indexes\n<FilesMatch \"\\.(php|phtml|phar)$\">\nRequire all denied\n</FilesMatch>\n");
    $name = bin2hex(random_bytes(16)) . '.' . $types[$mime];
    $destination = $destDir . '/' . $name;
    if (!move_uploaded_file($tmp, $destination)) throw new RuntimeException('Không thể lưu ảnh đã tải lên.');
    chmod($destination, 0644);
    $path = $relativeDir . '/' . $name;
    try {
        $insert = $pdo->prepare("INSERT INTO $imageTable ($fk,image_path,sort_order,is_cover) VALUES (?,?,?,?)");
        $insert->execute([$id, $path, (int)$maxOrder + 1, (int)$count === 0 ? 1 : 0]);
    } catch (Throwable $e) {
        @unlink($destination);
        throw $e;
    }
    reply(201, ['status' => 'success', 'data' => ['id' => (int)$pdo->lastInsertId(), 'image_path' => $path]]);
} catch (Throwable $e) {
    failServer($e);
}
