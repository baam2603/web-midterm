<?php
require_once __DIR__ . "/../shared/bootstrap.php";
requireMethod("GET");
$uid = requireUser();
if (isset($_GET["hotelId"], $_GET["city"])) {
    try {
        $q = connectDB()->prepare(
            "SELECT b.code,r.name roomName FROM bookings b JOIN hotels h ON h.id=b.hotel_id JOIN room_types r ON r.id=b.room_type_id LEFT JOIN reviews rv ON rv.booking_id=b.id WHERE b.user_id=? AND h.slug=? AND h.city=? AND b.status='completed' AND b.checkout<=CURDATE() AND rv.id IS NULL ORDER BY b.checkout DESC LIMIT 100",
        );
        $q->execute([$uid, (string) $_GET["hotelId"], (string) $_GET["city"]]);
        reply(200, [
            "status" => "success",
            "data" => ["bookings" => $q->fetchAll()],
        ]);
    } catch (Throwable $e) {
        failServer($e);
    }
}
$code = trim((string) ($_GET["code"] ?? ""));
if (!$code) {
    reply(400, ["status" => "error", "message" => "Thiếu mã đơn."]);
}
try {
    $q = connectDB()->prepare(
        "SELECT b.code,b.status,b.checkout,rv.id AS review_id FROM bookings b LEFT JOIN reviews rv ON rv.booking_id=b.id WHERE b.code=? AND b.user_id=? LIMIT 1",
    );
    $q->execute([$code, $uid]);
    $b = $q->fetch();
    if (!$b) {
        reply(404, [
            "status" => "error",
            "message" => "Không tìm thấy đơn của bạn trong MySQL.",
        ]);
    }
    $eligible =
        $b["status"] === "completed" &&
        $b["checkout"] <= date("Y-m-d") &&
        !$b["review_id"];
    reply(200, [
        "status" => "success",
        "data" => [
            "eligible" => $eligible,
            "status" => $b["status"],
            "alreadyReviewed" => (bool) $b["review_id"],
        ],
    ]);
} catch (Throwable $e) {
    failServer($e);
}
