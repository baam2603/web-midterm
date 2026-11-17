<?php
require_once __DIR__ . "/mail-transport.php";
function mailConfigured(): bool
{
    if (!filter_var(getenv("MAIL_FROM"), FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    if (mailTransport() === 'smtp') {
        return smtpConfig() !== null && is_file(__DIR__ . '/../../vendor/autoload.php');
    }
    return mailTransport() === 'resend' && (bool) getenv('RESEND_API_KEY');
}
function queueMail(PDO $db, string $email, string $subject, string $html, ?string $expiresAt = null): void
{
    $db->prepare(
        "INSERT INTO mail_outbox(recipient,subject,html_body,expires_at) VALUES(?,?,?,?)",
    )->execute([$email, $subject, $html, $expiresAt]);
}
function sendMail(array $message): void
{
    if (!mailConfigured()) {
        throw new RuntimeException('Email chưa được cấu hình đầy đủ.');
    }
    if (mailTransport() === 'smtp') {
        smtpMail($message);
        return;
    }
    resendMail($message);
}

function resendMail(array $message): void
{
    if (!mailConfigured()) {
        throw new RuntimeException("Resend chưa được cấu hình.");
    }
    $ch = curl_init("https://api.resend.com/emails");
    $opts = [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "Authorization: Bearer " . getenv("RESEND_API_KEY"),
            "Idempotency-Key: threek-mail-" . $message["id"],
        ],
        CURLOPT_POSTFIELDS => json_encode(
            [
                "from" => getenv("MAIL_FROM"),
                "to" => [$message["recipient"]],
                "subject" => $message["subject"],
                "html" => $message["html_body"],
            ],
            JSON_THROW_ON_ERROR,
        ),
    ];
    $ca = getenv("CURL_CA_BUNDLE");
    if ($ca && is_readable($ca)) {
        $opts[CURLOPT_CAINFO] = $ca;
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if (
        $raw === false ||
        $http < 200 ||
        $http >= 300 ||
        !isset(json_decode($raw, true)["id"])
    ) {
        throw new RuntimeException("Resend HTTP " . $http);
    } // Never log API keys or email bodies.
}
