<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

/** Send a plain-text recovery email using authenticated Gmail SMTP. */
function sendThreekMail(string $recipient, string $subject, string $body): void
{
    $autoload = dirname(__DIR__, 2) . '/vendor/autoload.php';
    if (!is_file($autoload)) {
        throw new RuntimeException('Missing Composer vendor/autoload.php; install phpmailer/phpmailer');
    }
    require_once $autoload;

    $user = trim((string)getenv('THREEK_SMTP_USER'));
    $password = (string)getenv('THREEK_SMTP_APP_PASSWORD');
    $from = trim((string)getenv('THREEK_RESET_FROM'));
    if (!filter_var($user, FILTER_VALIDATE_EMAIL) || $password === '' ||
        !filter_var($from, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('Missing or invalid SMTP environment configuration');
    }
    // Gmail sender must be the authenticated mailbox or an approved alias.
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->Port = 587;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->SMTPAuth = true;
    $mail->Username = $user;
    $mail->Password = $password;
    $mail->CharSet = 'UTF-8';
    $mail->Timeout = 15;
    $mail->setFrom($from, 'THREEK Booking');
    $mail->addAddress($recipient);
    $mail->isHTML(false);
    $mail->Subject = $subject;
    $mail->Body = $body;
    $mail->send();
}
