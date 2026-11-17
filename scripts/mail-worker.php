<?php
// CLI only. Schedule once per minute; no public HTTP endpoint can drain mail.
if (PHP_SAPI !== "cli") {
    http_response_code(404);
    exit();
}
require_once __DIR__ . "/../api/config/database.php";
require_once __DIR__ . "/../api/shared/email.php";
if (!mailConfigured()) {
    fwrite(
        STDERR,
        "Configure MAIL_TRANSPORT (resend or smtp), its credentials and MAIL_FROM before starting the mail worker.\n",
    );
    exit(1);
}
$db = connectDB();
// Expired codes must not be delivered after a delayed cron run.
$db->exec("UPDATE mail_outbox SET status='failed',attempts=5,html_body='',last_error='Email expired before delivery' WHERE status IN ('pending','failed') AND expires_at IS NOT NULL AND expires_at<=NOW()");
// Retain pending profile data for at most 15 minutes after its latest code.
$db->exec("UPDATE registration_challenges SET password_hash=NULL,otp_hash=NULL,full_name=NULL,phone=NULL,birthday=NULL WHERE last_sent_at<=DATE_SUB(NOW(),INTERVAL 15 MINUTE)");
$db->exec("DELETE FROM registration_challenges WHERE last_sent_at<DATE_SUB(NOW(),INTERVAL 1 DAY)");
$db->exec("DELETE FROM registration_rate_limits WHERE window_started_at<DATE_SUB(NOW(),INTERVAL 1 DAY)");
$sent = 0;
for ($i = 0; $i < 20; $i++) {
    $db->beginTransaction();
    $q = $db->query(
        "SELECT *, (expires_at IS NOT NULL AND expires_at<=NOW()) AS mail_expired FROM mail_outbox WHERE status IN ('pending','failed') AND attempts<5 AND (last_attempt_at IS NULL OR last_attempt_at<DATE_SUB(NOW(),INTERVAL 1 MINUTE)) ORDER BY id LIMIT 1 FOR UPDATE",
    );
    $m = $q->fetch();
    if (!$m) {
        $db->rollBack();
        break;
    }
    if (!empty($m['mail_expired'])) {
        $db->prepare("UPDATE mail_outbox SET status='failed',attempts=5,html_body='',last_error='Email expired before delivery' WHERE id=?")->execute([$m['id']]);
        $db->commit();
        continue;
    }
    try {
        sendMail($m);
        $db->prepare(
            "UPDATE mail_outbox SET status='sent',sent_at=NOW(),last_attempt_at=NOW(),attempts=attempts+1,last_error=NULL,html_body='' WHERE id=?",
        )->execute([$m["id"]]);
        $sent++;
    } catch (Throwable $e) {
        $db->prepare(
            "UPDATE mail_outbox SET status='failed',last_attempt_at=NOW(),attempts=attempts+1,last_error=? WHERE id=?",
        )->execute([substr($e->getMessage(), 0, 250), $m["id"]]);
    }
    $db->commit();
}
echo "Sent $sent messages.\n";
