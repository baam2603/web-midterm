<?php
require_once __DIR__ . "/../shared/bootstrap.php";
require_once __DIR__ . "/places-service.php";
requireMethod("GET");
requireAdmin();
session_write_close();
header("Cache-Control: no-store, private");
$city = (string) ($_GET["city"] ?? "");
$lat = filter_var($_GET["lat"] ?? null, FILTER_VALIDATE_FLOAT);
$lon = filter_var($_GET["lng"] ?? null, FILTER_VALIDATE_FLOAT);
if (
    !cityArea($city) ||
    $lat === false ||
    $lat === null ||
    $lon === false ||
    $lon === null
) {
    reply(422, [
        "status" => "error",
        "message" => "Thành phố hoặc tọa độ không hợp lệ.",
    ]);
}
try {
    reply(200, [
        "status" => "success",
        "data" => [
            "places" => googleNearbyPlaces((float) $lat, (float) $lon, $city),
        ],
    ]);
} catch (InvalidArgumentException $e) {
    reply(422, ["status" => "error", "message" => $e->getMessage()]);
} catch (GooglePlacesUnavailable $e) {
    reply($e->getCode() === 503 ? 503 : 502, [
        "status" => "error",
        "message" => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    error_log("[3K nearby] " . $e->getMessage());
    reply(502, [
        "status" => "error",
        "message" =>
            "Dịch vụ bản đồ đang bận. Hãy thử lại sau; không cần bấm tìm liên tục.",
    ]);
}
