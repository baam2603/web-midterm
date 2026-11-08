<?php
require_once __DIR__ . "/../shared/bootstrap.php";
require_once __DIR__ . "/vnpay-service.php";

try {
    $config = vnpConfig();

    // 1. Xac minh chu ky VNPay
    if (!vnpVerified($_GET, $config)) {
        reply(400, [
            "status" => "error",
            "message" => "Chu ky VNPay khong hop le.",
        ]);
    }

    // 2. Lay thong tin giao dich
    $ref = (string) ($_GET["vnp_TxnRef"] ?? "");
    $responseCode = (string) ($_GET["vnp_ResponseCode"] ?? "");
    $transactionStatus = (string) ($_GET["vnp_TransactionStatus"] ?? "");

    // 3. Kiem tra ma booking hop le
    if (!preg_match('/^TK[A-F0-9]{14}$/D', $ref)) {
        reply(400, [
            "status" => "error",
            "message" => "Ma giao dich khong hop le.",
        ]);
    }

    // 4. Phan loai ket qua VNPay tra ve
    $successful =
        $responseCode === "00" &&
        $transactionStatus === "00";

    $result = $successful
        ? "pending_confirmation"
        : "failed";

    // 5. Dua nguoi dung ve trang chi tiet booking
    // IPN moi la noi cap nhat trang thai thanh toan.
    $query = http_build_query([
        "code" => $ref,
        "paymentResult" => $result,
    ]);

    header(
        "Location: " .
            $config["base"] .
            "/booking/detail.html?" .
            $query,
        true,
        303
    );
    exit();
} catch (Throwable $e) {
    error_log("[VNPay Return] " . $e->getMessage());

    reply(503, [
        "status" => "error",
        "message" =>
        "Khong kiem tra duoc ket qua thanh toan. " .
            "Vui long xem trong Dat phong cua toi.",
    ]);
}
