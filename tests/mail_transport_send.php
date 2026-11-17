<?php
require __DIR__ . '/../api/shared/email.php';
try {
    sendMail([
        'id' => 42,
        'recipient' => 'recipient@example.invalid',
        'subject' => 'Khôi phục mật khẩu THREEK.COM',
        'html_body' => '<p>Đặt lại mật khẩu</p><a href="https://example.invalid/auth/forgot.html#token=test-token">Tiếp tục</a>',
    ]);
    echo "sent\n";
} catch (Throwable $e) {
    fwrite(STDERR, $e->getMessage() . "\n");
    exit(1);
}
