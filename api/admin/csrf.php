<?php

declare(strict_types=1);

require_once __DIR__ . '/../shared/bootstrap.php';

requireMethod('GET');
requireAdmin();

header('Cache-Control: no-store, private');

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

// Tạo CSRF token nếu chưa có
if (empty($_SESSION['admin_csrf'])) {
    $_SESSION['admin_csrf'] = bin2hex(random_bytes(32));
}

// Trả token cho Frontend Admin
reply(200, [
    'status' => 'success',
    'data' => [
        'csrfToken' => $_SESSION['admin_csrf']
    ]
]);
