<?php

declare(strict_types=1);

require_once __DIR__ . '/../shared/bootstrap.php';

requireMethod('POST');
requireAdmin();

header('Cache-Control: no-store, private');

// Kiểm tra CSRF token
$csrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
$expected = $_SESSION['admin_csrf'] ?? '';

if (
    !is_string($csrf) ||
    !is_string($expected) ||
    $expected === '' ||
    !hash_equals($expected, $csrf)
) {
    reply(403, [
        'status' => 'error',
        'message' => 'CSRF token không hợp lệ.'
    ]);
}

// Nhận dữ liệu JSON
$contentType = strtolower(trim(explode(
    ';',
    $_SERVER['CONTENT_TYPE'] ?? ''
)[0]));

if ($contentType !== 'application/json') {
    reply(415, [
        'status' => 'error',
        'message' => 'Yêu cầu dữ liệu JSON.'
    ]);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    reply(400, [
        'status' => 'error',
        'message' => 'Dữ liệu JSON không hợp lệ.'
    ]);
}

$id = filter_var(
    $data['id'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1]]
);

$isActive = $data['is_active'] ?? null;

if (
    $id === false ||
    $id === null ||
    !in_array($isActive, [0, 1], true)
) {
    reply(422, [
        'status' => 'error',
        'message' => 'ID hoặc trạng thái không hợp lệ.'
    ]);
}

try {
    $pdo = connectDB();

    $check = $pdo->prepare(
        "SELECT id FROM hotels WHERE id = ? LIMIT 1"
    );
    $check->execute([$id]);

    if (!$check->fetchColumn()) {
        reply(404, [
            'status' => 'error',
            'message' => 'Không tìm thấy khách sạn.'
        ]);
    }

    $stmt = $pdo->prepare("
        UPDATE hotels
        SET is_active = :active
        WHERE id = :id
    ");

    $stmt->execute([
        'active' => $isActive,
        'id' => $id
    ]);

    reply(200, [
        'status' => 'success',
        'message' => 'Đã cập nhật trạng thái khách sạn.',
        'data' => [
            'id' => (int)$id,
            'is_active' => $isActive
        ]
    ]);
} catch (Throwable $e) {
    failServer($e);
}
