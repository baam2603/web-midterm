<?php
require_once __DIR__ . "/ipn-test-guard.php";
require_once __DIR__ . "/../api/payments/vnpay-service.php";

try {
    $config = vnpConfig();


    // Mã giao dịch không tồn tại trong database test
    $params = [
        "vnp_TmnCode" => $config["merchant"],
        "vnp_TxnRef" => "TKFFFFFFFFFFFFFF",
        "vnp_Amount" => "100",
    ];

    // Ký hợp lệ bằng chính hàm của dự án
    $params["vnp_SecureHash"] = vnpSign(
        $params,
        $config["secret"]
    );

    $url = "http://127.0.0.1:8000/api/payments/ipn.php?"
        . http_build_query($params);

    // Chỉ gửi tới PHP local, không gửi VNPay thật
    $response = file_get_contents($url);

    if ($response === false) {
        throw new RuntimeException("Khong goi duoc IPN local");
    }

    echo "IPN response: " . $response . PHP_EOL;

    $data = json_decode($response, true);

    if (($data["RspCode"] ?? "") === "01") {
        echo "TC-IPN-03: PASS\n";
    } else {
        echo "TC-IPN-03: FAIL\n";
    }
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
}
