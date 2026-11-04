<?php
require_once __DIR__ . "/../shared/bootstrap.php";
requireMethod("POST");
requireAdmin();
requireCsrf();
$v = input();
$code = trim((string) ($v["code"] ?? ""));
if (!$code) {
    reply(422, ["status" => "error", "message" => "Thiếu mã đơn."]);
}
try {
    $db = connectDB();
    $db->beginTransaction();
    $q = $db->prepare(
        "SELECT id FROM bookings WHERE code=? AND status='checked_in' AND checkout<=CURDATE() FOR UPDATE",
    );
    $q->execute([$code]);
    $id = $q->fetchColumn();
    if (!$id) {
        $db->rollBack();
        reply(409, [
            "status" => "error",
            "message" =>
                "Đơn chưa nhận phòng, chưa đến ngày trả hoặc đã hoàn tất.",
        ]);
    }
    $db->prepare(
        "UPDATE bookings SET status='completed',completed_at=NOW() WHERE id=?",
    )->execute([$id]);
    auditLog($db, "booking.status", "booking", $id, [
        "from" => "checked_in",
        "to" => "completed",
        "code" => $code,
    ]);
    $db->commit();
    reply(200, ["status" => "success", "message" => "Đã hoàn tất lưu trú."]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    failServer($e);
}
