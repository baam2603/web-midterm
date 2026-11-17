<?php
require_once __DIR__ . "/ipn-test-guard.php";
require_once __DIR__ . "/../api/payments/vnpay-service.php";

$code = $argv[1] ?? "";

if (!preg_match('/^TK[A-F0-9]{14}$/D', $code)) {
    exit("ERROR: Ma booking khong hop le\n");
}

try {
    $config = vnpConfig();
    $db = connectDB();

    $q = $db->prepare(
        "SELECT b.code, b.status AS booking_status,
                b.payment_expires_at,
                p.amount, p.status AS payment_status,
                NOW() AS db_now
         FROM bookings b
         JOIN payments p ON p.booking_id = b.id
         WHERE b.code = ?"
    );
    $q->execute([$code]);
    $booking = $q->fetch();

    if (!$booking) {
        exit("ERROR: Khong tim thay payment\n");
    }

    if (
        $booking["booking_status"] !== "pending" ||
        $booking["payment_status"] !== "pending" ||
        $booking["payment_expires_at"] <= $booking["db_now"]
    ) {
        exit("ERROR: Booking khong con hop le de test success\n");
    }

    $params = [
        "vnp_TmnCode" => $config["merchant"],
        "vnp_TxnRef" => $code,
        "vnp_Amount" => (string) (int) round(
            (float) $booking["amount"] * 100
        ),
        "vnp_ResponseCode" => "00",
        "vnp_TransactionStatus" => "00",
        "vnp_TransactionNo" => (string) random_int(
            100000000,
            999999999
        ),
    ];

    $params["vnp_SecureHash"] = vnpSign(
        $params,
        $config["secret"]
    );

    $url = "http://127.0.0.1:8000/api/payments/ipn.php?"
        . http_build_query($params);

    // Lan dau: thanh toan thanh cong
    $response1 = file_get_contents($url);
    echo "First IPN: $response1\n";

    // Lan hai: gui lai cung IPN
    $response2 = file_get_contents($url);
    echo "Duplicate IPN: $response2\n";

    $first = json_decode($response1, true);
    $second = json_decode($response2, true);
    $q = $db->prepare(
        "SELECT b.status AS booking_status,
            b.payment_status,
            p.status AS transaction_status,
            p.provider_transaction
     FROM bookings b
     JOIN payments p ON p.booking_id = b.id
     WHERE b.code = ?"
    );

    $q->execute([$code]);
    $after = $q->fetch();

    $pass =
        ($first["RspCode"] ?? "") === "00" &&
        ($second["RspCode"] ?? "") === "02" &&
        $after !== false &&
        $after["booking_status"] === "confirmed" &&
        $after["payment_status"] === "paid" &&
        $after["transaction_status"] === "paid" &&
        $after["provider_transaction"] === $params["vnp_TransactionNo"];

    echo $pass
        ? "TC-IPN-04/05: PASS\n"
        : "TC-IPN-04/05: FAIL\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
