<?php
declare(strict_types=1);
require_once __DIR__ . '/../shared/bootstrap.php';
requireMethod('POST');
try {
    $data = input();
    $email = strtolower(trim((string)($data['email'] ?? '')));
    $otp = trim((string)($data['otp'] ?? ''));
    $password = (string)($data['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^\d{6}$/D', $otp)) {
        reply(400, ['status'=>'error','message'=>'Email hoặc mã xác minh không hợp lệ.']);
    }
    if (strlen($password) < 8 || !preg_match('/[A-Za-z]/', $password) || !preg_match('/[0-9]/', $password)) {
        reply(400, ['status'=>'error','message'=>'Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ và số.']);
    }
    $secret = (string)getenv('THREEK_RESET_SECRET');
    if (strlen($secret) < 32) reply(503, ['status'=>'error','message'=>'Chức năng khôi phục chưa được cấu hình.']);

    $pdo = connectDB();
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT u.id, t.otp_hash, t.expires_at, t.failed_attempts
        FROM users u JOIN password_reset_tokens t ON t.user_id=u.id
        WHERE u.email=? FOR UPDATE');
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    if (!$row || strtotime($row['expires_at']) <= time() || (int)$row['failed_attempts'] >= 5) {
        $pdo->rollBack();
        reply(400, ['status'=>'error','message'=>'Mã không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.']);
    }
    $valid = hash_equals($row['otp_hash'], hash_hmac('sha256', $row['id'] . ':' . $otp, $secret));
    if (!$valid) {
        $upd = $pdo->prepare('UPDATE password_reset_tokens SET failed_attempts=failed_attempts+1 WHERE user_id=?');
        $upd->execute([(int)$row['id']]);
        $pdo->commit();
        reply(400, ['status'=>'error','message'=>'Mã không hợp lệ hoặc đã hết hạn.']);
    }
    $update = $pdo->prepare('UPDATE users SET password_hash=? WHERE id=?');
    $update->execute([password_hash($password, PASSWORD_DEFAULT), (int)$row['id']]);
    $delete = $pdo->prepare('DELETE FROM password_reset_tokens WHERE user_id=?');
    $delete->execute([(int)$row['id']]);
    $pdo->commit();
    reply(200, ['status'=>'success','message'=>'Đặt lại mật khẩu thành công.','data'=>[]]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    failServer($e);
}
