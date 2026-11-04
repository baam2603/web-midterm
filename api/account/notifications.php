<?php
require_once __DIR__ . "/../shared/customer.php";
$uid = requireUser();
header("Cache-Control: no-store, private");
try {
    $db = connectDB();
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        guardCustomerWrite();
        $v = input();
        $id = filter_var($v["id"] ?? null, FILTER_VALIDATE_INT, [
            "options" => ["min_range" => 1],
        ]);
        if (!$id) {
            reply(422, [
                "status" => "error",
                "message" => "Thông báo không hợp lệ.",
            ]);
        }
        $db->prepare(
            "UPDATE notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=? AND user_id=?",
        )->execute([$id, $uid]);
    } else {
        requireMethod("GET");
    }
    $q = $db->prepare(
        "SELECT id,title,message,booking_code code,read_at,created_at FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 100",
    );
    $q->execute([$uid]);
    reply(200, ["status" => "success", "data" => $q->fetchAll()]);
} catch (Throwable $e) {
    failServer($e);
}
