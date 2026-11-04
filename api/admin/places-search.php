<?php

declare(strict_types=1);

require_once __DIR__ . "/../shared/bootstrap.php";
require_once __DIR__ . "/places-service.php";

requireMethod("GET");
set_time_limit(45); // tìm kiếm có thể gọi Nominatim + Overpass nhiều lần (mỗi lần cách nhau >= 1 giây)
requireAdmin();
session_write_close();
header("Cache-Control: no-store, private");

$query = trim((string) ($_GET["q"] ?? ""));
$city = trim((string) ($_GET["city"] ?? ""));
$mode = trim((string) ($_GET["mode"] ?? "auto"));
$cityNames = ["dalat" => "Đà Lạt", "vungtau" => "Vũng Tàu"];

$length = preg_match_all("/./us", $query);
if (
    !isset($cityNames[$city]) ||
    $length === false ||
    $length < 3 ||
    $length > 100 ||
    !in_array($mode, ["auto", "name", "address"], true)
) {
    reply(422, [
        "status" => "error",
        "message" =>
            "Nhập tên/địa chỉ từ 3 đến 100 ký tự và chọn thành phố hợp lệ.",
    ]);
}

try {
    $GLOBALS["osm_deadline"] = microtime(true) + 20.0;
    $key = hash("sha256", $city . "|" . $mode . "|" . osmFold($query));
    $items = osmLimitedCachedRequest(
        "ranked-search-" . $key,
        $key,
        900,
        0.0,
        static fn() => searchLodgingPlaces(
            $query,
            $city,
            $cityNames[$city],
            $mode,
        ),
    );
    $places = [];
    foreach ($items as $p) {
        $id = osmPlaceId($p);
        if ($id === null) {
            continue;
        }
        $kind = $p["_kind"] ?? osmResultKind($p);
        $places[] = [
            "placeId" => $id,
            "name" => osmHotelName($p) ?: (string) $p["display_name"],
            "address" => (string) $p["display_name"],
            "mapsUrl" => osmPlaceUrl($id),
            "kind" => $kind,
            "canSelect" => $kind !== "location",
            "distanceMeters" => $p["_distanceMeters"] ?? null,
        ];
    }
    reply(200, [
        "status" => "success",
        "data" => [
            "places" => $places,
            "mode" => $mode,
            "note" =>
                "Địa chỉ có số nhà chỉ xác minh vị trí; không xác nhận cơ sở kinh doanh khách sạn.",
        ],
    ]);
} catch (Throwable $e) {
    error_log("[3K places-search] " . $e->getMessage());
    reply(502, [
        "status" => "error",
        "message" =>
            "Dịch vụ bản đồ đang bận hoặc mất kết nối. Hãy thử lại sau; bạn cũng có thể dán đường dẫn địa điểm OSM.",
    ]);
}
