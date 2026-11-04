<?php
require_once __DIR__ . "/../shared/customer.php";
requireMethod("GET");
$uid = requireUser();
header("Cache-Control: no-store, private");
$code = trim((string) ($_GET["code"] ?? ""));
if (!$code || strlen($code) > 50) {
    reply(422, ["status" => "error", "message" => "Mã đơn không hợp lệ."]);
}
try {
    $db = connectDB();
    expireCustomerBookings($db, $uid);
    $q = $db->prepare(
        bookingSelect() . " WHERE b.user_id=? AND b.code=? LIMIT 1",
    );
    $q->execute([$uid, $code]);
    $b = $q->fetch();
    if (!$b) {
        reply(404, [
            "status" => "error",
            "message" => "Không tìm thấy đơn thuộc tài khoản này.",
        ]);
    }
    reply(200, ["status" => "success", "data" => bookingPayload($b)]);
} catch (Throwable $e) {
    failServer($e);
}
