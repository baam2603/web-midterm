<?php
require_once __DIR__ . '/customer.php';
require_once __DIR__ . '/email.php';
header('Cache-Control: no-store, private');

function registrationError(PDO $db, int $status, string $code, string $message, int $retry = 0): never
{
    // Commit attempt/rate counters even when verification fails.
    if ($db->inTransaction()) $db->commit();
    if ($retry > 0) header('Retry-After: ' . $retry);
    reply($status, ['status' => 'error', 'code' => $code, 'message' => $message,
        'data' => ['retryAfter' => $retry]]);
}
function registrationPublic(array $row): array
{
    return [
        'id' => $row['challenge_id'], 'email' => $row['email'],
        'expiresIn' => max(0, strtotime($row['expires_at']) - time()),
        'retryAfter' => max(0, strtotime($row['last_sent_at']) + 60 - time()),
    ];
}
function registrationPending(PDO $db, string $id): array
{
    if (!preg_match('/^[a-f0-9]{64}$/D', $id) ||
        !hash_equals((string) ($_SESSION['registration_id'] ?? ''), $id)) {
        registrationError($db, 403, 'registration_session', 'Phiên xác minh không hợp lệ. Hãy đăng ký lại trên trình duyệt này.');
    }
    $q = $db->prepare('SELECT * FROM registration_challenges WHERE challenge_id=? FOR UPDATE');
    $q->execute([$id]);$row = $q->fetch();
    if (!$row || $row['consumed_at'] !== null || !$row['password_hash'] ||
        strtotime($row['last_sent_at']) + 900 <= time()) {
        registrationError($db, 410, 'registration_expired', 'Phiên đăng ký đã kết thúc. Vui lòng điền lại thông tin đăng ký.');
    }
    return $row;
}
function registrationRate(PDO $db): void
{
    $key = hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    $db->prepare('INSERT IGNORE INTO registration_rate_limits(ip_hash,window_started_at,send_count) VALUES(?,NOW(),0)')->execute([$key]);
    $q = $db->prepare('SELECT * FROM registration_rate_limits WHERE ip_hash=? FOR UPDATE');
    $q->execute([$key]);$row = $q->fetch();
    $reset = strtotime($row['window_started_at']) + 900 <= time();
    if (!$reset && (int) $row['send_count'] >= 10) {
        $db->rollBack();
        registrationError($db, 429, 'registration_rate_limit', 'Bạn đã gửi quá nhiều mã. Vui lòng thử lại sau.', max(1, strtotime($row['window_started_at']) + 900 - time()));
    }
    $db->prepare($reset
        ? 'UPDATE registration_rate_limits SET window_started_at=NOW(),send_count=1 WHERE ip_hash=?'
        : 'UPDATE registration_rate_limits SET send_count=send_count+1 WHERE ip_hash=?')->execute([$key]);
}
function registrationLimits(PDO $db, array $row): void
{
    if ((int) $row['failed_attempts'] >= 5) {
        registrationError($db, 429, 'otp_locked', 'Đã nhập sai quá nhiều lần. Vui lòng đăng ký lại sau 15 phút.');
    }
    $retry = max(0, strtotime($row['last_sent_at']) + 60 - time());
    if ($retry > 0) registrationError($db, 429, 'otp_cooldown', 'Vui lòng chờ trước khi gửi lại mã.', $retry);
    if ((int) $row['send_count'] >= 3) {
        registrationError($db, 429, 'otp_send_limit', 'Chỉ được gửi tối đa 3 mã trong 15 phút. Vui lòng thử lại sau.', max(1, strtotime($row['window_started_at']) + 900 - time()));
    }
}
function registrationRetireMail(PDO $db, array $row): void
{
    if ($row['mail_id']) $db->prepare('DELETE FROM mail_outbox WHERE id=?')->execute([$row['mail_id']]);
}
function registrationQueue(PDO $db, string $email, string $otp, string $expires): int
{
    queueMail($db, $email, 'Mã xác minh đăng ký THREEK.COM',
        '<p>Mã xác minh đăng ký của bạn:</p><p style="font-size:28px;letter-spacing:6px"><strong>' . $otp .
        '</strong></p><p>Mã có hiệu lực 5 phút từ lúc yêu cầu và chỉ dùng một lần. Không chia sẻ mã này.</p>', $expires);
    return (int) $db->lastInsertId();
}
function registrationFailure(PDO $db, Throwable $error): never
{
    if ($db->inTransaction()) $db->rollBack();
    // Duplicate user creation must never replace an existing account.
    if ($error instanceof PDOException && (int) ($error->errorInfo[1] ?? 0) === 1062) {
        reply(409, ['status' => 'error', 'message' => 'Email này đã được đăng ký. Vui lòng đăng nhập.']);
    }
    failServer($error);
}

function registrationCode(?string $previousHash): string
{
    do {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    } while ($previousHash && password_verify($otp, $previousHash));
    return $otp;
}
