<?php
require_once __DIR__ . "/../shared/customer.php";
requireMethod("GET");
$uid = requireUser();
header("Cache-Control: no-store, private");
$code = trim((string) ($_GET["code"] ?? ""));
$key = (string) ($_GET["requestKey"] ?? "");
if (
    (!$code && !preg_match("/^[a-zA-Z0-9_-]{16,80}$/D", $key)) ||
    strlen($code) > 50
) {
    reply(422, ["status" => "error", "message" => "Mã đơn không hợp lệ."]);
}
try {
    $db = connectDB();
    expireCustomerBookings($db, $uid);
    $q = $db->prepare(
        bookingSelect() .
            ($code !== ""
                ? " WHERE b.user_id=? AND b.code=? LIMIT 1"
                : " WHERE b.user_id=? AND b.request_key=? LIMIT 1"),
    );
    $q->execute([$uid, $code !== "" ? $code : $key]);
    $b = $q->fetch();
    if (!$b) {
        reply(404, [
            "status" => "error",
            "message" => "Không tìm thấy đơn thuộc tài khoản này: " . $code,
        ]);
    }
    reply(200, ["status" => "success", "data" => bookingPayload($b)]);
} catch (Throwable $e) {
    failServer($e);
}
