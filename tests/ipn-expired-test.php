<?php
// TC-IPN-07: Late successful IPN for an expired booking.
require_once __DIR__ . "/ipn-test-guard.php";
require_once __DIR__ . "/../api/payments/vnpay-service.php";

$code = $argv[1] ?? "";

if (!preg_match('/^TK[A-F0-9]{14}$/D', $code)) {
    exit("ERROR: Invalid booking code\n");
}

try {
    $db = connectDB();
    $config = vnpConfig();

    $q = $db->prepare(
        "SELECT b.status AS booking_status,
                b.payment_status,
                b.payment_expires_at,
                p.status AS transaction_status,
                p.amount,
                NOW() AS db_now
         FROM bookings b
         JOIN payments p ON p.booking_id = b.id
         WHERE b.code = ?"
    );
    $q->execute([$code]);
    $before = $q->fetch();

    if (
        !$before ||
        $before["booking_status"] !== "cancelled" ||
        $before["payment_status"] !== "expired" ||
        $before["transaction_status"] !== "pending" ||
        $before["payment_expires_at"] >= $before["db_now"]
    ) {
        exit("ERROR: Booking is not eligible for TC-IPN-07\n");
    }

    // Simulate a signed successful payment notification.
    $params = [
        "vnp_TmnCode" => $config["merchant"],
        "vnp_TxnRef" => $code,
        "vnp_Amount" => (string) (int) round(
            (float) $before["amount"] * 100
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

    // Send only to the local PHP server.
    $url = "http://127.0.0.1:8000/api/payments/ipn.php?"
        . http_build_query($params);

    $response = file_get_contents($url);

    if ($response === false) {
        throw new RuntimeException("Cannot call local IPN");
    }

    echo "IPN response: $response\n";

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

    echo "Booking status: " . $after["booking_status"] . "\n";
    echo "Payment status: " . $after["payment_status"] . "\n";
    echo "Transaction status: " . $after["transaction_status"] . "\n";

    $result = json_decode($response, true);

    $pass =
        ($result["RspCode"] ?? "") === "00" &&
        $after["booking_status"] === "cancelled" &&
        $after["payment_status"] === "paid_requires_review" &&
        $after["transaction_status"] === "review" &&
        $after["provider_transaction"] === $params["vnp_TransactionNo"];

    echo $pass
        ? "TC-IPN-07: PASS\n"
        : "TC-IPN-07: FAIL\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
