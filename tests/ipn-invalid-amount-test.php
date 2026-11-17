<?php
require_once __DIR__ . "/ipn-test-guard.php";
require_once __DIR__ . "/../api/payments/vnpay-service.php";

$bookingCode = $argv[1] ?? "";

if (!preg_match('/^TK[A-F0-9]{14}$/D', $bookingCode)) {
    exit("Ma booking khong hop le.\n");
}

try {
    $config = vnpConfig();

    // Co tinh gui 1 VND (100 don vi VNPay).
    // Booking test hien tai co gia tri khac 1 VND.
    $params = [
        "vnp_TmnCode" => $config["merchant"],
        "vnp_TxnRef" => $bookingCode,
        "vnp_Amount" => "100",
    ];

    $params["vnp_SecureHash"] = vnpSign(
        $params,
        $config["secret"]
    );

    // Chi goi PHP Server local, khong gui den VNPay.
    $url = "http://127.0.0.1:8000/api/payments/ipn.php?"
        . http_build_query($params);

    $response = file_get_contents($url);

    echo "IPN response: " . $response . PHP_EOL;

    $data = json_decode($response, true);

    if (($data["RspCode"] ?? "") === "04") {
        echo "TC-IPN-02: PASS\n";
    } else {
        echo "TC-IPN-02: FAIL\n";
    }
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
}
