<?php
declare(strict_types=1);
require_once __DIR__ . '/../shared/bootstrap.php';
requireMethod('POST');

try {
    $data = input();
    $email = strtolower(trim((string)($data['email'] ?? '')));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
        reply(400, ['status'=>'error','message'=>'Email không hợp lệ.']);
    }

    // Same response for known and unknown accounts, to reduce account enumeration.
    $message = 'Nếu email đã đăng ký, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư.';
    $pdo = connectDB();
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $id = (int)($stmt->fetchColumn() ?: 0);
    if (!$id) reply(200, ['status'=>'success','message'=>$message,'data'=>[]]);

    $secret = (string)getenv('THREEK_RESET_SECRET');
    $from = (string)getenv('THREEK_RESET_FROM');
    if (strlen($secret) < 32 || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
        error_log('Password reset mail is not configured (THREEK_RESET_SECRET / THREEK_RESET_FROM).');
        reply(200, ['status'=>'success','message'=>$message,'data'=>[]]);
    }

    $check = $pdo->prepare('SELECT requested_at FROM password_reset_tokens WHERE user_id = ?');
    $check->execute([$id]);
    $last = $check->fetchColumn();
    if ($last && strtotime((string)$last) > time() - 60) {
        reply(200, ['status'=>'success','message'=>$message,'data'=>[]]);
    }

    $otp = (string)random_int(100000, 999999);
    $hash = hash_hmac('sha256', $id . ':' . $otp, $secret);
    $save = $pdo->prepare('INSERT INTO password_reset_tokens (user_id, otp_hash, expires_at, requested_at, failed_attempts)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW(), 0)
      ON DUPLICATE KEY UPDATE otp_hash=VALUES(otp_hash), expires_at=VALUES(expires_at),
      requested_at=VALUES(requested_at), failed_attempts=0');
    $save->execute([$id, $hash]);

    $subject = 'THREEK - Password reset code';
    $body = "Ma xac minh THREEK cua ban: {$otp}\nMa het han sau 10 phut. Neu ban khong yeu cau, hay bo qua email nay.\n";
    $headers = ['From: ' . $from, 'Content-Type: text/plain; charset=UTF-8'];
    if (!mail($email, $subject, $body, implode("\r\n", $headers))) {
        $delete = $pdo->prepare('DELETE FROM password_reset_tokens WHERE user_id = ?');
        $delete->execute([$id]);
        error_log('Password reset mail delivery failed; configure a mail transport for PHP.');
    }
    reply(200, ['status'=>'success','message'=>$message,'data'=>[]]);
} catch (Throwable $e) {
    failServer($e);
}
