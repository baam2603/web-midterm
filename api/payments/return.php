<?php
require_once __DIR__ . "/../shared/bootstrap.php";
require_once __DIR__ . "/vnpay-service.php";
try {
    $config = vnpConfig();
    if (!vnpVerified($_GET, $config)) {
        reply(400, [
            "status" => "error",
            "message" => "Chữ ký trả về VNPay không hợp lệ.",
        ]);
    }
    $ref = $_GET["vnp_TxnRef"] ?? "";
    header(
        "Location: " .
            $config["base"] .
            "/payment/success.html?code=" .
            rawurlencode($ref),
        true,
        303,
    );
    exit();
} catch (Throwable $e) {
    reply(503, [
        "status" => "error",
        "message" =>
            "Không kiểm tra được giao dịch. Vui lòng xem trong Đặt phòng của tôi.",
    ]);
}
