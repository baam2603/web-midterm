<?php
require __DIR__ . '/../api/shared/email.php';
function checkMail(bool $ok, string $label): void {
    if (!$ok) throw new RuntimeException($label);
    echo "PASS $label\n";
}
foreach (['MAIL_TRANSPORT','MAIL_FROM','SMTP_HOST','SMTP_PORT','SMTP_ENCRYPTION','SMTP_USERNAME','SMTP_PASSWORD','RESEND_API_KEY'] as $name) putenv($name);
checkMail(!mailConfigured(), 'no configuration disables recovery email');
putenv('MAIL_FROM=test@example.invalid');putenv('RESEND_API_KEY=test-only');
checkMail(mailConfigured(), 'existing Resend configuration remains compatible');
putenv('MAIL_TRANSPORT=unknown');checkMail(!mailConfigured(), 'unknown provider fails closed');
putenv('MAIL_TRANSPORT=smtp');checkMail(!mailConfigured(), 'SMTP does not fall back to Resend when incomplete');
putenv('SMTP_HOST=smtp.gmail.com');putenv('SMTP_USERNAME=test@example.invalid');putenv('SMTP_PASSWORD=fake-app-password');
checkMail(mailConfigured(), 'SMTP configuration enables email without a Resend key');
putenv('RESEND_API_KEY');checkMail(mailConfigured(), 'Resend key is unnecessary for SMTP');
putenv('SMTP_ENCRYPTION=none');checkMail(!mailConfigured(), 'unencrypted SMTP is rejected');
putenv('SMTP_ENCRYPTION=tls');putenv('SMTP_PORT=587oops');checkMail(!mailConfigured(), 'invalid SMTP port is rejected');
putenv('SMTP_PORT=465');putenv('SMTP_ENCRYPTION=smtps');checkMail(mailConfigured(), 'implicit TLS configuration is supported');
putenv('MAIL_FROM=invalid');checkMail(!mailConfigured(), 'invalid sender disables email');
