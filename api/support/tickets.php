<?php
require_once __DIR__ . "/../shared/bootstrap.php";
$uid = requireUser();
header("Cache-Control: no-store, private");
try {
    $db = connectDB();
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $type = strtolower(
            trim(explode(";", $_SERVER["CONTENT_TYPE"] ?? "")[0]),
        );
        if ($type !== "application/json") {
            reply(415, ["status" => "error", "message" => "Yêu cầu JSON."]);
        }
        $v = input();
        $topic = trim((string) ($v["topic"] ?? ""));
        $message = trim((string) ($v["message"] ?? ""));
        $code = trim((string) ($v["code"] ?? ""));
        if (
            mb_strlen($topic) < 2 ||
            mb_strlen($topic) > 120 ||
            mb_strlen($message) < 10 ||
            mb_strlen($message) > 3000 ||
            strlen($code) > 50
        ) {
            reply(422, [
                "status" => "error",
                "message" =>
                    "Chọn chủ đề và nhập nội dung từ 10 đến 3000 ký tự.",
            ]);
        }
        if ($code !== "") {
            $q = $db->prepare(
                "SELECT id FROM bookings WHERE code=? AND user_id=?",
            );
            $q->execute([$code, $uid]);
            if (!$q->fetchColumn()) {
                reply(422, [
                    "status" => "error",
                    "message" => "Mã đơn không thuộc tài khoản của bạn.",
                ]);
            }
        }
        $db->prepare(
            "INSERT INTO support_tickets(user_id,topic,message,booking_code) VALUES(?,?,?,?)",
        )->execute([$uid, $topic, $message, $code ?: null]);
        reply(201, [
            "status" => "success",
            "data" => ["id" => (int) $db->lastInsertId()],
        ]);
    }
    requireMethod("GET");
    $q = $db->prepare(
        "SELECT id,topic,message,status,reply,created_at,replied_at FROM support_tickets WHERE user_id=? ORDER BY id DESC LIMIT 100",
    );
    $q->execute([$uid]);
    reply(200, ["status" => "success", "data" => $q->fetchAll()]);
} catch (Throwable $e) {
    failServer($e);
}
