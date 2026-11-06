<?php

declare(strict_types=1);

require_once __DIR__ . "/../shared/bootstrap.php";
require_once __DIR__ . "/places-service.php";

requireMethod("GET");
set_time_limit(25);
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
    $length > 255 ||
    !in_array($mode, ["auto", "name", "address"], true)
) {
    reply(422, [
        "status" => "error",
        "message" =>
            "Nhập tên/địa chỉ từ 3 đến 255 ký tự và chọn thành phố hợp lệ.",
    ]);
}

try {
    $places = googleSearchPlaces($query, $city, $mode);
    reply(200, [
        "status" => "success",
        "data" => [
            "places" => $places,
            "mode" => $mode,
            "note" =>
                "Chọn đúng cơ sở lưu trú. Kết quả đường phố chỉ dùng tham khảo, không thể lưu thành khách sạn.",
        ],
    ]);
} catch (GooglePlacesUnavailable $e) {
    reply($e->getCode() === 503 ? 503 : 502, [
        "status" => "error",
        "message" => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    error_log("[3K places-search] " . $e->getMessage());
    reply(502, [
        "status" => "error",
        "message" =>
            "Google Places chưa sẵn sàng. Kiểm tra cấu hình Places API (New), billing và key phía máy chủ.",
    ]);
}
