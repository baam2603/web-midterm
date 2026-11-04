<?php

declare(strict_types=1);
require_once __DIR__ . "/../shared/bootstrap.php";
requireMethod("POST");
requireAdmin();
header("Cache-Control: no-store, private");
$token = $_SERVER["HTTP_X_CSRF_TOKEN"] ?? "";
$expected = $_SESSION["admin_csrf"] ?? "";
if (
    !is_string($token) ||
    !is_string($expected) ||
    $expected === "" ||
    !hash_equals($expected, $token)
) {
    reply(403, ["status" => "error", "message" => "CSRF token không hợp lệ."]);
}
if (
    strtolower(trim(explode(";", $_SERVER["CONTENT_TYPE"] ?? "")[0])) !==
    "application/json"
) {
    reply(415, ["status" => "error", "message" => "Yêu cầu JSON."]);
}
$d = input();
$text = static fn(string $k): string => is_string($d[$k] ?? null)
    ? trim($d[$k])
    : "";
$hotelId = filter_var($d["hotel_id"] ?? null, FILTER_VALIDATE_INT, [
    "options" => ["min_range" => 1],
]);
$code = $text("code");
$name = $text("name");
$desc = $text("description");
$uLen = static fn(string $s): int|false => preg_match_all("/./us", $s);
$bed = $text("bed_type");
$area = filter_var($d["area_m2"] ?? null, FILTER_VALIDATE_INT, [
    "options" => ["min_range" => 1, "max_range" => 2000],
]);
$capacity = filter_var($d["capacity"] ?? null, FILTER_VALIDATE_INT, [
    "options" => ["min_range" => 1, "max_range" => 20],
]);
$totalRooms = filter_var($d["total_rooms"] ?? null, FILTER_VALIDATE_INT, [
    "options" => ["min_range" => 0, "max_range" => 999],
]);
$price = filter_var($d["price_per_night"] ?? null, FILTER_VALIDATE_INT, [
    "options" => ["min_range" => 100000, "max_range" => 100000000],
]);
$breakfast = $d["breakfast_included"] ?? false;
$refundable = $d["free_cancellation"] ?? false;
$features = $d["features"] ?? [];
if (
    $hotelId === false ||
    $hotelId === null ||
    !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $code) ||
    strlen($code) > 50 ||
    $uLen($name) < 2 ||
    $uLen($name) > 120 ||
    $uLen($desc) > 3000 ||
    $uLen($bed) < 2 ||
    $uLen($bed) > 120 ||
    $area === false ||
    $area === null ||
    $capacity === false ||
    $capacity === null ||
    $totalRooms === false ||
    $totalRooms === null ||
    $price === false ||
    $price === null ||
    !is_bool($breakfast) ||
    !is_bool($refundable) ||
    !is_array($features) ||
    count($features) > 12
) {
    reply(422, [
        "status" => "error",
        "message" => "Thông tin loại phòng không hợp lệ.",
    ]);
}
$cleanFeatures = [];
foreach ($features as $f) {
    if (!is_string($f) || $uLen(trim($f)) < 2 || $uLen(trim($f)) > 70) {
        reply(422, [
            "status" => "error",
            "message" => "Tiện nghi phòng không hợp lệ.",
        ]);
    }
    $cleanFeatures[] = trim($f);
}
try {
    $pdo = connectDB();
    $q = $pdo->prepare("SELECT id FROM hotels WHERE id=? LIMIT 1");
    $q->execute([$hotelId]);
    if (!$q->fetchColumn()) {
        reply(404, [
            "status" => "error",
            "message" => "Không tìm thấy khách sạn.",
        ]);
    }
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('INSERT INTO room_types
        (hotel_id, code, name, capacity, total_rooms, price_per_night,
         description, area_m2, bed_type, breakfast_included, free_cancellation, features_json, is_active)
        VALUES (:hotel_id,:code,:name,:capacity,:total_rooms,:price,:description,
                :area,:bed,:breakfast,:refund,:features,1)');
    $stmt->execute([
        "hotel_id" => $hotelId,
        "code" => $code,
        "name" => $name,
        "capacity" => $capacity,
        "total_rooms" => $totalRooms,
        "price" => $price,
        "description" => $desc !== "" ? $desc : null,
        "area" => $area,
        "bed" => $bed,
        "breakfast" => $breakfast ? 1 : 0,
        "refund" => $refundable ? 1 : 0,
        "features" => json_encode(
            $cleanFeatures,
            JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
        ),
    ]);
    $createdId = (int) $pdo->lastInsertId();
    auditLog($pdo, "room.create", "room", $createdId);
    $pdo->commit();
    reply(201, [
        "status" => "success",
        "message" => "Đã thêm loại phòng vào MySQL.",
        "data" => [
            "id" => $createdId,
            "hotel_id" => (int) $hotelId,
            "code" => $code,
        ],
    ]);
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (
        ($e->errorInfo[0] ?? "") === "23000" &&
        (int) ($e->errorInfo[1] ?? 0) === 1062
    ) {
        reply(409, [
            "status" => "error",
            "message" => "Mã phòng đã tồn tại trong khách sạn.",
        ]);
    }
    failServer($e);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    failServer($e);
}
