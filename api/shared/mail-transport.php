<?php
// Provider selection is explicit; existing installations continue using Resend.
function mailTransport(): string
{
    return strtolower(trim(getenv('MAIL_TRANSPORT') ?: 'resend'));
}

function smtpConfig(): ?array
{
    $host = trim(getenv('SMTP_HOST') ?: '');
    $port = getenv('SMTP_PORT') ?: '587';
    $encryption = strtolower(trim(getenv('SMTP_ENCRYPTION') ?: 'tls'));
    $username = trim(getenv('SMTP_USERNAME') ?: '');
    $password = getenv('SMTP_PASSWORD') ?: '';
    if (
        !extension_loaded('openssl') ||
        !preg_match('/^[a-z0-9.-]+$/iD', $host) ||
        !ctype_digit((string) $port) || (int) $port < 1 || (int) $port > 65535 ||
        !in_array($encryption, ['tls', 'smtps'], true) ||
        !filter_var($username, FILTER_VALIDATE_EMAIL) || $password === ''
    ) {
        return null;
    }
    return compact('host', 'port', 'encryption', 'username', 'password');
}

function smtpMail(array $message): void
{
    $config = smtpConfig();
    $autoload = __DIR__ . '/../../vendor/autoload.php';
    if (!$config || !is_file($autoload)) {
        throw new RuntimeException('SMTP chưa sẵn sàng: kiểm tra cấu hình và chạy composer install.');
    }
    require_once $autoload;
    $mailer = new \PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $mailer->isSMTP();
        $mailer->Host = $config['host'];
        $mailer->Port = (int) $config['port'];
        $mailer->SMTPAuth = true;
        $mailer->Username = $config['username'];
        $mailer->Password = $config['password'];
        $mailer->SMTPSecure = $config['encryption'] === 'tls'
            ? \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS
            : \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        // Authentication must never take place without verified encryption.
        $mailer->SMTPOptions = ['ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
            'allow_self_signed' => false,
        ]];
        $mailer->Timeout = 15;
        $mailer->Timelimit = 20;
        $mailer->SMTPDebug = 0;
        $mailer->CharSet = 'UTF-8';
        $mailer->setFrom(getenv('MAIL_FROM'));
        $mailer->addAddress($message['recipient']);
        $mailer->Subject = $message['subject'];
        $mailer->isHTML(true);
        $mailer->Body = $message['html_body'];
        // Stable ID aids diagnosis; SMTP does not guarantee deduplication on retries.
        $domain = substr(strrchr(getenv('MAIL_FROM'), '@'), 1);
        $mailer->MessageID = '<threek-mail-' . (int) $message['id'] . '@' . $domain . '>';
        $mailer->send();
    } catch (\PHPMailer\PHPMailer\Exception $e) {
        // Provider responses can contain addresses, tokens or credentials. Never persist them.
        throw new RuntimeException('SMTP gửi thất bại. Kiểm tra tài khoản, mật khẩu ứng dụng, kết nối và TLS.');
    } finally {
        $mailer->smtpClose();
    }
}
