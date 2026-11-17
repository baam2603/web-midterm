<?php
require_once __DIR__ . "/../shared/customer.php";
$uid = requireUser();
header("Cache-Control: no-store, private");
try {
    $db = connectDB();
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        guardCustomerWrite();
        $v = input();
        $slug = $v["id"] ?? "";
        $city = $v["city"] ?? "";
        $saved = $v["saved"] ?? null;
        if (
            !is_string($slug) ||
            strlen($slug) > 80 ||
            !in_array($city, ["dalat", "vungtau"], true) ||
            !is_bool($saved)
        ) {
            reply(422, [
                "status" => "error",
                "message" => "Khách sạn không hợp lệ.",
            ]);
        }
        beginAccountWrite($db, $uid);
        $q = $db->prepare("SELECT id FROM hotels WHERE slug=? AND city=?");
        $q->execute([$slug, $city]);
        $id = $q->fetchColumn();
        if (!$id) {
            reply(404, [
                "status" => "error",
                "message" => "Khách sạn không còn tồn tại.",
            ]);
        }
        if ($saved) {
            $db->prepare(
                "INSERT IGNORE INTO favorites(user_id,hotel_id) VALUES(?,?)",
            )->execute([$uid, $id]);
        } else {
            $db->prepare(
                "DELETE FROM favorites WHERE user_id=? AND hotel_id=?",
            )->execute([$uid, $id]);
        }
    } else {
        requireMethod("GET");
    }
    $q = $db->prepare(
        "SELECT h.slug id,h.name,h.city,h.is_active,UNIX_TIMESTAMP(f.created_at)*1000 savedAt FROM favorites f JOIN hotels h ON h.id=f.hotel_id WHERE f.user_id=? ORDER BY f.created_at DESC,h.id DESC",
    );
    $q->execute([$uid]);
    $items = $q->fetchAll();
    if ($db->inTransaction()) {
        $db->commit();
    }
    reply(200, ["status" => "success", "data" => $items]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    failServer($e);
}
