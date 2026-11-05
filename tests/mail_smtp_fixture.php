<?php
// Local-only SMTP fixture: fake account, no provider traffic.
$context = stream_context_create(['ssl' => [
    'local_cert' => '/mail-certs/cert.pem',
    'local_pk' => '/mail-certs/key.pem',
    'verify_peer' => false, // Server does not request client certificates.
]]);
$server = stream_socket_server('tcp://0.0.0.0:2525', $errno, $errstr, STREAM_SERVER_BIND | STREAM_SERVER_LISTEN, $context);
if (!$server) exit(1);
echo "ready\n";flush();
$conn = stream_socket_accept($server, 30);
if (!$conn) exit(1);
stream_set_timeout($conn, 20);
$captured = ['tls' => false, 'auth' => false, 'body' => ''];
function smtpReply($conn, string $text): void { fwrite($conn, $text . "\r\n"); }
smtpReply($conn, '220 localhost local fixture');
try {
    while (($line = fgets($conn)) !== false) {
        $command = trim($line);
        if (str_starts_with($command, 'EHLO') || str_starts_with($command, 'HELO')) {
            smtpReply($conn, '250-localhost');
            if (!$captured['tls'] && getenv('OFFER_TLS') !== '0') smtpReply($conn, '250-STARTTLS');
            smtpReply($conn, '250 AUTH LOGIN');
        } elseif ($command === 'STARTTLS') {
            if (getenv('OFFER_TLS') === '0') { smtpReply($conn, '502 STARTTLS unavailable'); continue; }
            smtpReply($conn, '220 Ready to start TLS');
            if (!@stream_socket_enable_crypto($conn, true, STREAM_CRYPTO_METHOD_TLS_SERVER)) break;
            $captured['tls'] = true;
        } elseif ($command === 'AUTH LOGIN') {
            if (!$captured['tls']) throw new RuntimeException('credentials before TLS');
            smtpReply($conn, '334 ' . base64_encode('Username:'));
            if (base64_decode(trim(fgets($conn))) !== 'sender@example.invalid') throw new RuntimeException('unexpected username');
            smtpReply($conn, '334 ' . base64_encode('Password:'));
            if (base64_decode(trim(fgets($conn))) !== 'fake-password-never-use') throw new RuntimeException('unexpected password');
            $captured['auth'] = true;
            smtpReply($conn, getenv('REJECT_AUTH') === '1' ? '535 Rejected fake credentials' : '235 Authenticated');
        } elseif (str_starts_with($command, 'MAIL FROM:') || str_starts_with($command, 'RCPT TO:')) {
            if (!$captured['auth'] || !$captured['tls']) throw new RuntimeException('unauthenticated delivery');
            smtpReply($conn, '250 OK');
        } elseif ($command === 'DATA') {
            smtpReply($conn, '354 End with dot');
            while (($line = fgets($conn)) !== false && $line !== ".\r\n") {
                $captured['body'] .= str_starts_with($line, '..') ? substr($line, 1) : $line;
            }
            if ($line === false) throw new RuntimeException('incomplete DATA');
            smtpReply($conn, '250 Queued');
        } elseif ($command === 'QUIT') {
            smtpReply($conn, '221 Bye');break;
        } elseif ($command === 'RSET') {
            smtpReply($conn, '250 Reset');
        } else throw new RuntimeException('unexpected SMTP command');
    }
} catch (Throwable $e) { $captured['error'] = $e->getMessage(); }
fclose($conn);fclose($server);
echo json_encode($captured), "\n";
