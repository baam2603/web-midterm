<?php
require_once __DIR__ . "/ipn-test-guard.php";
require_once __DIR__ . "/../api/payments/vnpay-service.php";

$code = $argv[1] ?? "";

if (!preg_match('/^TK[A-F0-9]{14}$/D', $code)) {
    exit("ERROR: Ma booking khong hop le\n");
}

try {
    $db = connectDB();
    $config = vnpConfig();

    $q = $db->prepare(
        "SELECT b.id, b.status AS booking_status,
                b.payment_status, p.amount,
                p.status AS transaction_status
         FROM bookings b
         JOIN payments p ON p.booking_id = b.id
         WHERE b.code = ?"
    );

    $q->execute([$code]);
    $booking = $q->fetch();

    if (!$booking) {
        exit("ERROR: Khong tim thay giao dich\n");
    }

    if (
        $booking["booking_status"] !== "pending" ||
        $booking["transaction_status"] !== "pending"
    ) {
        exit("ERROR: Giao dich khong o trang thai pending\n");
    }

    // Mo phong VNPay thong bao giao dich that bai.
    $params = [
        "vnp_TmnCode" => $config["merchant"],
        "vnp_TxnRef" => $code,
        "vnp_Amount" => (string) (int) round(
            (float) $booking["amount"] * 100
        ),
        "vnp_ResponseCode" => "24",
        "vnp_TransactionStatus" => "02"
    ];

    // Tao chu ky hop le bang Hash Secret local.
    $params["vnp_SecureHash"] = vnpSign(
        $params,
        $config["secret"]
    );

    // Chi gui den PHP Server local.
    $url = "http://127.0.0.1:8000/api/payments/ipn.php?"
        . http_build_query($params);

    $response = file_get_contents($url);

    if ($response === false) {
        throw new RuntimeException("Khong ket noi duoc IPN");
    }

    echo "IPN response: " . $response . PHP_EOL;

    $data = json_decode($response, true);

    // Kiem tra ket qua thuc te trong database.
    $q = $db->prepare(
        "SELECT b.status AS booking_status,
                b.payment_status,
                p.status AS transaction_status
         FROM bookings b
         JOIN payments p ON p.booking_id = b.id
         WHERE b.code = ?"
    );

    $q->execute([$code]);
    $after = $q->fetch();

    echo "Booking status: " . $after["booking_status"] . PHP_EOL;
    echo "Payment status: " . $after["payment_status"] . PHP_EOL;
    echo "Transaction status: " . $after["transaction_status"] . PHP_EOL;

    $pass =
        ($data["RspCode"] ?? "") === "00" &&
        $after["booking_status"] === "cancelled" &&
        $after["payment_status"] === "failed" &&
        $after["transaction_status"] === "failed";

    echo $pass
        ? "TC-IPN-06: PASS\n"
        : "TC-IPN-06: FAIL\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
}
