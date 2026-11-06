<?php
require_once __DIR__ . "/../shared/bootstrap.php";
require_once __DIR__ . "/places-service.php";
requireMethod("GET");
requireAdmin();
session_write_close();
header("Cache-Control: no-store, private");
try {
    $city = (string) ($_GET["city"] ?? "");
    if (!cityArea($city)) {
        throw new InvalidArgumentException("Thành phố không hợp lệ.");
    }
    $p = getVerifiedHotelPlace((string) ($_GET["place_id"] ?? ""), $city);
    reply(200, [
        "status" => "success",
        "data" => [
            "placeId" => $p["id"],
            "name" => $p["name"],
            "address" => $p["formattedAddress"],
            "kind" => $p["kind"],
            "attributions" => $p["attributions"],
            "mapsUrl" => placeMapsUrl($p["id"]),
            "lat" => $p["location"]["latitude"],
            "lng" => $p["location"]["longitude"],
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
    error_log("[3K verify] " . $e->getMessage());
    reply(502, [
        "status" => "error",
        "message" => "Không xác minh được địa điểm. Hãy thử lại sau.",
    ]);
}
