<?php
require_once __DIR__ . "/../shared/customer.php";
requireMethod("POST");
$uid = requireUser();
guardCustomerWrite();
$v = input();
$code = trim((string) ($v["code"] ?? ""));
if (!$code || strlen($code) > 50) {
    reply(422, ["status" => "error", "message" => "Mã đơn không hợp lệ."]);
}
try {
    $db = connectDB();
    $db->beginTransaction();
    $q = $db->prepare(
        bookingSelect() . " WHERE b.user_id=? AND b.code=? FOR UPDATE",
    );
    $q->execute([$uid, $code]);
    $b = $q->fetch();
    if (!$b) {
        $db->rollBack();
        reply(404, [
            "status" => "error",
            "message" => "Không tìm thấy đơn của bạn.",
        ]);
    }
    if ($b["status"] === "cancelled") {
        $db->rollBack();
        reply(200, ["status" => "success", "message" => "Đơn đã được hủy."]);
    }
    $b = bookingPayload($b);
    if (!$b["canCancel"]) {
        $db->rollBack();
        reply(409, [
            "status" => "error",
            "message" =>
                "Đơn không còn đủ điều kiện hủy. Vui lòng liên hệ hỗ trợ.",
        ]);
    }
    $db->prepare(
        "UPDATE bookings SET status='cancelled',payment_status=IF(payment_status='paid','refund_requested',payment_status) WHERE code=?",
    )->execute([$code]);
    if ($b["paymentStatus"] === "paid") {
        $db->prepare(
            "UPDATE payments SET status='refund_requested' WHERE booking_id=? AND status='paid'",
        )->execute([$b["id"]]);
    }
    notifyUser(
        $db,
        $uid,
        "Đã hủy đặt phòng",
        "Đơn " .
            $code .
            " đã được hủy. " .
            ($b["paymentStatus"] === "paid"
                ? "Yêu cầu hoàn tiền đang chờ xử lý."
                : ""),
        $code,
    );
    $db->commit();
    reply(200, ["status" => "success", "message" => "Đã hủy đơn."]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    failServer($e);
}
