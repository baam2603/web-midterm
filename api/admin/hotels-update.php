<?php
declare(strict_types=1);

require_once __DIR__ . "/../shared/bootstrap.php";

requireMethod("POST");
requireAdmin();
header("Cache-Control: no-store, private");

$incomingCsrf = $_SERVER["HTTP_X_CSRF_TOKEN"] ?? "";
$storedCsrf = $_SESSION["admin_csrf"] ?? "";
if (
    !is_string($incomingCsrf) ||
    !is_string($storedCsrf) ||
    $storedCsrf === "" ||
    !hash_equals($storedCsrf, $incomingCsrf)
) {
    reply(403, ["status" => "error", "message" => "CSRF token không hợp lệ."]);
}

$contentType = strtolower(
    trim(explode(";", $_SERVER["CONTENT_TYPE"] ?? "")[0]),
);
if ($contentType !== "application/json") {
    reply(415, ["status" => "error", "message" => "Yêu cầu JSON."]);
}
$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) {
    reply(400, ["status" => "error", "message" => "JSON không hợp lệ."]);
}

$id = filter_var($data["id"] ?? null, FILTER_VALIDATE_INT, [
    "options" => ["min_range" => 1],
]);
$name = is_string($data["name"] ?? null) ? trim($data["name"]) : "";
$type = is_string($data["type"] ?? null) ? trim($data["type"]) : "";
$description = is_string($data["description"] ?? null)
    ? trim($data["description"])
    : "";
$stars = filter_var($data["stars"] ?? null, FILTER_VALIDATE_INT, [
    "options" => ["min_range" => 1, "max_range" => 5],
]);
$price = filter_var($data["price_per_night"] ?? null, FILTER_VALIDATE_INT, [
    "options" => ["min_range" => 100000, "max_range" => 100000000],
]);

$length = static function (string $s): int|false {
    return preg_match_all("/./us", $s);
};
$nameLen = $length($name);
$descriptionLen = $length($description);

if (
    $id === false ||
    $id === null ||
    $nameLen === false ||
    $nameLen < 3 ||
    $nameLen > 150 ||
    !in_array($type, ["hotel", "resort", "homestay", "villa"], true) ||
    $stars === false ||
    $stars === null ||
    $price === false ||
    $price === null ||
    $descriptionLen === false ||
    $descriptionLen > 3000
) {
    reply(422, [
        "status" => "error",
        "message" => "Thông tin cập nhật không hợp lệ.",
    ]);
}

try {
    $pdo = connectDB();
    $stmt = $pdo->prepare("SELECT id,city FROM hotels WHERE id = :id LIMIT 1");
    $stmt->execute(["id" => $id]);
    $existing = $stmt->fetch();
    if (!$existing) {
        reply(404, [
            "status" => "error",
            "message" => "Không tìm thấy khách sạn.",
        ]);
    }
    $location = null;
    if (($data["location_mode"] ?? "keep") !== "keep") {
        require_once __DIR__ . "/location-service.php";
        if (
            !is_string($data["address"] ?? null) ||
            !is_string($data["google_place_id"] ?? "")
        ) {
            throw new InvalidArgumentException("Dữ liệu vị trí không hợp lệ.");
        }
        $location = resolveHotelLocation(
            $data,
            $existing["city"],
            trim($data["address"]),
            trim($data["google_place_id"] ?? ""),
        );
    }
    $pdo->beginTransaction();
    $update = $pdo->prepare(
        'UPDATE hotels
         SET name = :name, type = :type, stars = :stars,
             price_per_night = :price, description = :description
         WHERE id = :id',
    );
    $update->execute([
        "id" => $id,
        "name" => $name,
        "type" => $type,
        "stars" => $stars,
        "price" => $price,
        "description" => $description === "" ? null : $description,
    ]);

    if ($location) {
        $pdo->prepare(
            "UPDATE hotels SET address=?,google_place_id=?,latitude=?,longitude=?,maps_provider=?,maps_verified_at=NOW() WHERE id=?",
        )->execute([
            $location["formattedAddress"],
            $location["id"],
            $location["location"]["latitude"],
            $location["location"]["longitude"],
            $location["provider"],
            $id,
        ]);
    }
    auditLog($pdo, "hotel.update", "hotel", $id);
    $pdo->commit();
    reply(200, [
        "status" => "success",
        "message" => "Đã cập nhật thông tin khách sạn.",
        "data" => ["id" => (int) $id],
    ]);
} catch (InvalidArgumentException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    reply(422, ["status" => "error", "message" => $e->getMessage()]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    failServer($e);
}
