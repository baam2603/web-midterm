<?php

declare(strict_types=1);
require_once __DIR__ . "/../shared/bootstrap.php";
requireAdmin();
header("Cache-Control: no-store, private");
$method = $_SERVER["REQUEST_METHOD"] ?? "";
$uLen = static fn(string $s): int|false => preg_match_all("/./us", $s);
if (!in_array($method, ["GET", "POST"], true)) {
    reply(405, ["status" => "error", "message" => "Method not allowed."]);
}
if ($method === "POST") {
    $sent = $_SERVER["HTTP_X_CSRF_TOKEN"] ?? "";
    $expected = $_SESSION["admin_csrf"] ?? "";
    if (
        !is_string($sent) ||
        !is_string($expected) ||
        $expected === "" ||
        !hash_equals($expected, $sent)
    ) {
        reply(403, ["status" => "error", "message" => "CSRF không hợp lệ."]);
    }
    $v = input();
    $id = filter_var($v["hotel_id"] ?? null, FILTER_VALIDATE_INT, [
        "options" => ["min_range" => 1],
    ]);
    $checkin = $v["checkin_time"] ?? "";
    $checkout = $v["checkout_time"] ?? "";
    $rules = $v["rules"] ?? [];
    $codes = $v["amenities"] ?? [];
    if (
        !$id ||
        !is_string($checkin) ||
        !is_string($checkout) ||
        ($checkin !== "" &&
            !preg_match('/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/D', $checkin)) ||
        ($checkout !== "" &&
            !preg_match('/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/D', $checkout)) ||
        !is_array($rules) ||
        count($rules) > 15 ||
        !is_array($codes) ||
        count($codes) > 30
    ) {
        reply(422, [
            "status" => "error",
            "message" => "Dữ liệu khách sạn không hợp lệ.",
        ]);
    }
    foreach ($rules as $x) {
        if (!is_string($x) || $uLen(trim($x)) > 250) {
            reply(422, [
                "status" => "error",
                "message" => "Quy tắc khách sạn quá dài.",
            ]);
        }
    }
    foreach ($codes as $x) {
        if (!is_string($x) || !preg_match('/^[a-z][a-z0-9_]{0,49}$/D', $x)) {
            reply(422, [
                "status" => "error",
                "message" => "Mã tiện nghi không hợp lệ.",
            ]);
        }
    }
    try {
        $pdo = connectDB();
        $pdo->beginTransaction();
        $q = $pdo->prepare("SELECT id FROM hotels WHERE id=? FOR UPDATE");
        $q->execute([$id]);
        if (!$q->fetchColumn()) {
            $pdo->rollBack();
            reply(404, [
                "status" => "error",
                "message" => "Khách sạn không tồn tại.",
            ]);
        }
        $q = $pdo->prepare(
            "UPDATE hotels SET checkin_time=?, checkout_time=?, rules_json=? WHERE id=?",
        );
        $cleanRules = array_values(
            array_filter(array_map("trim", $rules), "strlen"),
        );
        $q->execute([
            $checkin !== "" ? $checkin : null,
            $checkout !== "" ? $checkout : null,
            json_encode(
                $cleanRules,
                JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
            ),
            $id,
        ]);
        $pdo->prepare("DELETE FROM hotel_amenities WHERE hotel_id=?")->execute([
            $id,
        ]);
        if ($codes) {
            $codes = array_values(array_unique($codes));
            $q = $pdo->prepare("SELECT id FROM amenities WHERE code=?");
            $ins = $pdo->prepare(
                "INSERT INTO hotel_amenities(hotel_id,amenity_id) VALUES(?,?)",
            );
            foreach ($codes as $code) {
                $q->execute([$code]);
                $amenityId = $q->fetchColumn();
                if (!$amenityId) {
                    $pdo->rollBack();
                    reply(422, [
                        "status" => "error",
                        "message" =>
                            "Tiện nghi chưa có trong bảng amenities: " . $code,
                    ]);
                }
                $ins->execute([$id, $amenityId]);
            }
        }
        auditLog($pdo, "hotel.extras", "hotel", $id);
        $pdo->commit();
        reply(200, [
            "status" => "success",
            "message" => "Đã cập nhật thông tin khách sạn.",
        ]);
    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        failServer($e);
    }
}
$id = filter_var($_GET["hotel_id"] ?? null, FILTER_VALIDATE_INT, [
    "options" => ["min_range" => 1],
]);
if (!$id) {
    reply(422, ["status" => "error", "message" => "ID không hợp lệ."]);
}
try {
    $pdo = connectDB();
    $q = $pdo->prepare(
        "SELECT id,checkin_time,checkout_time,rules_json FROM hotels WHERE id=?",
    );
    $q->execute([$id]);
    $h = $q->fetch(PDO::FETCH_ASSOC);
    if (!$h) {
        reply(404, [
            "status" => "error",
            "message" => "Khách sạn không tồn tại.",
        ]);
    }
    $q = $pdo->prepare(
        "SELECT a.code FROM hotel_amenities ha JOIN amenities a ON a.id=ha.amenity_id WHERE ha.hotel_id=?",
    );
    $q->execute([$id]);
    $q2 = $pdo->query("SELECT code,label FROM amenities ORDER BY label");
    reply(200, [
        "status" => "success",
        "data" => [
            "hotel_id" => (int) $id,
            "checkin_time" => substr((string) ($h["checkin_time"] ?? ""), 0, 5),
            "checkout_time" => substr(
                (string) ($h["checkout_time"] ?? ""),
                0,
                5,
            ),
            "rules" => json_decode($h["rules_json"] ?? "[]", true) ?: [],
            "amenities" => $q->fetchAll(PDO::FETCH_COLUMN),
            "amenity_options" => $q2->fetchAll(PDO::FETCH_ASSOC),
        ],
    ]);
} catch (Throwable $e) {
    failServer($e);
}
