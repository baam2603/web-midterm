<?php
require_once __DIR__ . '/../shared/registration.php';
requireMethod('POST');
guardCustomerWrite();
$v = input();
$fullName = trim((string) ($v['fullName'] ?? $v['full_name'] ?? $v['name'] ?? ''));
$email = strtolower(trim((string) ($v['email'] ?? '')));
$password = (string) ($v['password'] ?? '');
$phone = trim((string) ($v['phone'] ?? ''));
$birthday = trim((string) ($v['birthday'] ?? ''));
if (mb_strlen($fullName) < 2 || mb_strlen($fullName) > 120) {
    reply(400, ['status' => 'error', 'message' => 'Họ và tên phải từ 2 đến 120 ký tự.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
    reply(400, ['status' => 'error', 'message' => 'Email không hợp lệ.']);
}
if (strlen($password) < 8 || strlen($password) > 72 || !preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
    reply(400, ['status' => 'error', 'message' => 'Mật khẩu phải có 8–72 ký tự, bao gồm chữ và số.']);
}
if ($phone !== '' && !preg_match('/^[0-9+\-\s]{8,20}$/', $phone)) {
    reply(400, ['status' => 'error', 'message' => 'Số điện thoại không hợp lệ.']);
}
if ($birthday !== '') {
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $birthday);
    if (!$date || $date->format('Y-m-d') !== $birthday || $date > new DateTimeImmutable('today')) {
        reply(400, ['status' => 'error', 'message' => 'Ngày sinh không hợp lệ.']);
    }
}
if (!mailConfigured()) reply(503, ['status' => 'error', 'message' => 'Email xác minh chưa được cấu hình. Vui lòng liên hệ quản trị viên.']);
$db = connectDB();
try {
    $db->beginTransaction();
    $q = $db->prepare('SELECT id FROM users WHERE email=?');$q->execute([$email]);
    if ($q->fetchColumn()) registrationError($db, 409, 'email_registered', 'Email này đã được đăng ký.');
    // Create the email lock before reading counters to serialize concurrent requests.
    $db->prepare('INSERT IGNORE INTO registration_challenges(email,challenge_id,expires_at,last_sent_at,window_started_at) VALUES(?,?,NOW(),DATE_SUB(NOW(),INTERVAL 1 DAY),NOW())')->execute([$email, bin2hex(random_bytes(32))]);
    $q = $db->prepare('SELECT * FROM registration_challenges WHERE email=? FOR UPDATE');$q->execute([$email]);$row=$q->fetch();
    $newWindow = strtotime($row['window_started_at']) + 900 <= time();
    if (!$newWindow) registrationLimits($db, $row);
    registrationRate($db);
    registrationRetireMail($db, $row);
    $id = bin2hex(random_bytes(32));$otp = registrationCode($row['otp_hash']);
    $passwordHash = password_hash($password,PASSWORD_DEFAULT);
    $otpHash = password_hash($otp,PASSWORD_DEFAULT);
    $now = time();
    $issuedAt = date('Y-m-d H:i:s', $now);
    $expires = date('Y-m-d H:i:s', $now + 300);
    $mailId = registrationQueue($db, $email, $otp, $expires);
    $db->prepare('UPDATE registration_challenges SET challenge_id=?,full_name=?,password_hash=?,phone=?,birthday=?,otp_hash=?,expires_at=?,last_sent_at=?,window_started_at=?,send_count=?,failed_attempts=?,mail_id=?,consumed_at=NULL WHERE email=?')->execute([
        $id,$fullName,$passwordHash,$phone ?: null,$birthday ?: null,$otpHash,$expires,$issuedAt,
        $newWindow ? $issuedAt : $row['window_started_at'], $newWindow ? 1 : (int)$row['send_count']+1,
        $newWindow ? 0 : (int)$row['failed_attempts'],$mailId,$email,
    ]);
    $db->commit();
    $_SESSION['registration_id']=$id;
    reply(202, ['status'=>'success','message'=>'Mã xác minh đang được gửi đến email của bạn.',
        'data'=>['verificationRequired'=>true,'challenge'=>['id'=>$id,'email'=>$email,'expiresIn'=>300,'retryAfter'=>60]]]);
} catch (Throwable $error) { registrationFailure($db,$error); }
