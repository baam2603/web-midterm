<?php
// Unit tests: no database, credentials or VNPay network calls required.
date_default_timezone_set('Asia/Ho_Chi_Minh');
require_once __DIR__ . '/../api/payments/vnpay-service.php';

$passed = 0;
$failed = 0;
function checkCase(string $name, bool $ok): void {
    global $passed, $failed;
    echo ($ok ? '[PASS] ' : '[FAIL] ') . $name . PHP_EOL;
    $ok ? $passed++ : $failed++;
}

$config = [
    'merchant' => 'DEMO_TMN',
    'secret' => 'NON_PRODUCTION_TEST_ONLY',
    'base' => 'https://example.test',
    'gateway' => 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
];
$booking = [
    'code' => 'TK1234567890ABCD',
    'total' => 1500000,
    'payment_expires_at' => date('Y-m-d H:i:s', time() + 900),
];
$url = vnpPaymentUrl($booking, $config, '127.0.0.1');
parse_str((string) parse_url($url, PHP_URL_QUERY), $params);
checkCase('URL uses sandbox gateway', str_starts_with($url, $config['gateway'] . '?'));
checkCase('Amount is in VND minor units', ($params['vnp_Amount'] ?? '') === '150000000');
checkCase('Correct signed payment URL', vnpVerified($params, $config));
$modified = $params;
$modified['vnp_Amount'] = '100';
checkCase('Detect tampered amount', !vnpVerified($modified, $config));
$modified = $params;
$modified['vnp_TmnCode'] = 'OTHER_TMN';
checkCase('Reject different merchant', !vnpVerified($modified, $config));
$modified = $params;
$modified['vnp_SecureHash'] = str_repeat('0', 128);
checkCase('Reject invalid signature', !vnpVerified($modified, $config));
$expired = $booking;
$expired['payment_expires_at'] = date('Y-m-d H:i:s', time() - 60);
$rejected = false;
try {
    vnpPaymentUrl($expired, $config, '127.0.0.1');
} catch (RuntimeException $e) {
    $rejected = true;
}
checkCase('Reject expired booking', $rejected);
echo "Summary: {$passed} passed, {$failed} failed" . PHP_EOL;
exit($failed ? 1 : 0);
