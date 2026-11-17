<?php

declare(strict_types=1);

require_once __DIR__ . "/../shared/bootstrap.php";
require_once __DIR__ . "/location-service.php";

requireMethod("POST");
requireAdmin();
header("Cache-Control: no-store, private");

// CSRF token được cấp bởi api/admin/csrf.php trong phiên PHP này.
$receivedToken = $_SERVER["HTTP_X_CSRF_TOKEN"] ?? "";
$sessionToken = $_SESSION["admin_csrf"] ?? "";
if (
    !is_string($receivedToken) ||
    !is_string($sessionToken) ||
    $sessionToken === "" ||
    !hash_equals($sessionToken, $receivedToken)
) {
    reply(403, [
        "status" => "error",
        "message" => "Phiên bảo vệ không hợp lệ. Vui lòng tải lại trang Admin.",
    ]);
}

$contentType = strtolower(
    trim(explode(";", $_SERVER["CONTENT_TYPE"] ?? "")[0]),
);
if ($contentType !== "application/json") {
    reply(415, [
        "status" => "error",
        "message" => "Yêu cầu gửi dữ liệu JSON.",
    ]);
}

$data = input();
$getText = static function (string $key) use ($data): string {
    return isset($data[$key]) && is_string($data[$key])
        ? trim($data[$key])
        : "";
};
$validLength = static function (string $value, int $min, int $max): bool {
    $length = preg_match_all("/./us", $value);
    return $length !== false && $length >= $min && $length <= $max;
};

$name = $getText("name");
$slug = $getText("slug");
$city = $getText("city");
$type = $getText("type");
$address = $getText("address");
$placeRef = $getText("google_place_id"); // cột cũ, nay lưu ID OSM dạng osm-W123456
$description = $getText("description");
$stars = filter_var($data["stars"] ?? null, FILTER_VALIDATE_INT, [
    "options" => ["min_range" => 1, "max_range" => 5],
]);
$price = filter_var($data["price_per_night"] ?? null, FILTER_VALIDATE_INT, [
    "options" => ["min_range" => 100000, "max_range" => 100000000],
]);

if (
    !$validLength($name, 3, 150) ||
    strlen($slug) > 80 ||
    !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) ||
    !in_array($city, ["dalat", "vungtau"], true) ||
    !in_array($type, ["hotel", "resort", "homestay", "villa"], true) ||
    $stars === false ||
    !$validLength($address, 5, 255) ||
    !$validLength($description, 0, 3000) ||
    $price === false
) {
    reply(422, [
        "status" => "error",
        "message" =>
            "Thông tin khách sạn không hợp lệ. Kiểm tra tên, slug, thành phố, loại hình, sao, địa chỉ và giá.",
    ]);
}

session_write_close();
try {
    $place = resolveHotelLocation($data, $city, $address, $placeRef);
    $placeRef = $place["id"];
    $verifiedKind = $place["kind"];
    $lat = $place["location"]["latitude"] ?? null;
    $lon = $place["location"]["longitude"] ?? null;
    if (!is_numeric($lat) || !is_numeric($lon)) {
        reply(422, [
            "status" => "error",
            "message" => "Địa điểm thiếu tọa độ.",
        ]);
    }

    $pdo = connectDB();
    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        'INSERT INTO hotels
         (slug, name, city, type, stars, address, google_place_id, price_per_night, description, latitude, longitude, is_active, maps_provider, maps_verified_at)
         VALUES (:slug, :name, :city, :type, :stars, :address, :google_place_id, :price, :description, :lat, :lon, 0, :provider, NOW())',
    );
    $stmt->execute([
        "slug" => $slug,
        "name" => $name,
        "city" => $city,
        "type" => $type,
        "stars" => $stars,
        "address" => $address,
        "google_place_id" => $placeRef,
        "provider" => $place["provider"],
        "price" => $price,
        "description" => $description !== "" ? $description : null,
        "lat" => (float) $lat,
        "lon" => (float) $lon,
    ]);

    $createdId = (int) $pdo->lastInsertId();
    auditLog($pdo, "hotel.create", "hotel", $createdId);
    $pdo->commit();
    reply(201, [
        "status" => "success",
        "message" => "Đã thêm khách sạn ở trạng thái ẩn.",
        "data" => [
            "id" => $createdId,
            "slug" => $slug,
            "is_active" => 0,
            "verified_kind" => $verifiedKind,
        ],
    ]);
} catch (InvalidArgumentException $e) {
    reply(422, ["status" => "error", "message" => $e->getMessage()]);
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    // SQLSTATE 23000 = vi phạm ràng buộc, mã MySQL 1062 = trùng khóa duy nhất
    if (
        ($e->errorInfo[0] ?? "") === "23000" &&
        (int) ($e->errorInfo[1] ?? 0) === 1062
    ) {
        reply(409, [
            "status" => "error",
            "message" =>
                "Slug hoặc địa điểm OpenStreetMap đã tồn tại trong hệ thống.",
        ]);
    }
    failServer($e);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    failServer($e);
}
