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
$sent = 0;
for ($i = 0; $i < 20; $i++) {
    $db->beginTransaction();
    $q = $db->query(
        "SELECT * FROM mail_outbox WHERE status IN ('pending','failed') AND attempts<5 AND (last_attempt_at IS NULL OR last_attempt_at<DATE_SUB(NOW(),INTERVAL 1 MINUTE)) ORDER BY id LIMIT 1 FOR UPDATE",
    );
    $m = $q->fetch();
    if (!$m) {
        $db->rollBack();
        break;
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
