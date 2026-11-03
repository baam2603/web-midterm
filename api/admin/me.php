<?php

declare(strict_types=1);
require_once __DIR__ . '/../shared/bootstrap.php';
requireMethod('GET');
header('Cache-Control: no-store');
try {
    $adminId = requireAdmin();
    $pdo = connectDB();
    $stmt = $pdo->prepare(
        "SELECT id, full_name, email, role
         FROM users
         WHERE id = ?
         LIMIT 1"
    );
    $stmt->execute([$adminId]);

    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin) {
        reply(401, [
            'status' => 'error',
            'message' => 'Tài khoản không tồn tại.'
        ]);
    }

    reply(200, [
        'status' => 'success',
        'data' => [
            'admin' => [
                'id' => (int)$admin['id'],
                'fullName' => $admin['full_name'],
                'email' => $admin['email'],
                'role' => $admin['role']
            ]
        ]
    ]);
} catch (Throwable $e) {
    failServer($e);
}
