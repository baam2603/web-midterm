<?php
require_once __DIR__ . "/../shared/customer.php";
require_once __DIR__ . "/vnpay-service.php";
requireMethod("POST");
$uid = requireUser();
guardCustomerWrite();
$v = input();
$code = (string) ($v["code"] ?? "");
try {
    if (
        !filter_var(
            getenv("ONLINE_PAYMENTS_ENABLED") ?: "false",
            FILTER_VALIDATE_BOOLEAN,
        )
    ) {
        reply(503, [
            "status" => "error",
            "message" => "Thanh toán trực tuyến đang tắt.",
        ]);
    }
    $config = vnpConfig();
    $db = connectDB();
    $db->beginTransaction();
    $q = $db->prepare(
        "SELECT * FROM bookings WHERE code=? AND user_id=? FOR UPDATE",
    );
    $q->execute([$code, $uid]);
    $b = $q->fetch();
    if (!$b) {
        $db->rollBack();
        reply(404, [
            "status" => "error",
            "message" => "Không tìm thấy đơn của bạn.",
        ]);
    }
    if (
        $b["status"] !== "pending" ||
        $b["pay_method"] !== "online" ||
        $b["payment_status"] === "paid"
    ) {
        $db->rollBack();
        reply(409, [
            "status" => "error",
            "message" => "Đơn không còn ở trạng thái chờ thanh toán.",
        ]);
    }
    // Each booking has one payment record in the current database schema.
    // Do not silently reuse a failed/paid/reviewed payment attempt.
    $paymentQuery = $db->prepare(
        "SELECT id,txn_ref,amount,status FROM payments WHERE booking_id=? FOR UPDATE",
    );
    $paymentQuery->execute([$b["id"]]);
    $existingPayment = $paymentQuery->fetch();

    if ($existingPayment) {
        $sameReference = hash_equals((string) $existingPayment["txn_ref"], $code);
        $sameAmount = (int) round((float) $existingPayment["amount"] * 100) ===
            (int) round((float) $b["total"] * 100);
        if (
            $existingPayment["status"] !== "pending" ||
            !$sameReference ||
            !$sameAmount
        ) {
            $db->rollBack();
            reply(409, [
                "status" => "error",
                "message" => "Giao dịch đã được xử lý hoặc không khớp đơn. Vui lòng kiểm tra trạng thái đặt phòng.",
            ]);
        }
    } else {
        $db->prepare(
            "INSERT INTO payments(booking_id,txn_ref,amount) VALUES(?,?,?)",
        )->execute([$b["id"], $code, $b["total"]]);
    }

    // Ensure the expiry check happens before issuing a new payment URL.
    $url = vnpPaymentUrl($b, $config, $_SERVER["REMOTE_ADDR"] ?? "127.0.0.1");
    $db->commit();
    reply(200, [
        "status" => "success",
        "data" => ["url" => $url, "expiresAt" => $b["payment_expires_at"]],
    ]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log("[VNPay start] " . $e->getMessage());
    reply(503, [
        "status" => "error",
        "message" =>
            "Chưa tạo được liên kết VNPay. Kiểm tra cấu hình hoặc thời hạn đơn; không tạo đơn mới nếu đơn này đã được lưu.",
    ]);
}
