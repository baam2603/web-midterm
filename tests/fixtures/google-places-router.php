<?php
// Local contract fixture, started only by scripts/start-test-environment.sh.
header("Content-Type: application/json");
if (($_SERVER["HTTP_X_GOOG_API_KEY"] ?? "") !== "test-only-places-key") {
    http_response_code(403);
    echo "{}";
    return;
}
$mask = $_SERVER["HTTP_X_GOOG_FIELDMASK"] ?? "";
if ($mask === "" || str_contains($mask, "*")) {
    http_response_code(400);
    echo "{}";
    return;
}
$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$body = json_decode(file_get_contents("php://input"), true) ?: [];
$hotel = [
    "id" => "ChIJFixtureHotelDalat123",
    "displayName" => ["text" => "Browser Google Hotel"],
    "formattedAddress" => "12 Test Street, Đà Lạt, Việt Nam",
    "location" => ["latitude" => 11.9404, "longitude" => 108.4583],
    "types" => ["lodging", "hotel"],
    "addressComponents" => [["types" => ["country"], "shortText" => "VN"]],
    "businessStatus" => "OPERATIONAL",
    "attributions" => [],
];
$road = $hotel;
$road["id"] = "ChIJFixtureStreetDalat123";
$road["types"] = ["route"];
$road["displayName"]["text"] = "Test Street";
$outside = $hotel;
$outside["id"] = "ChIJFixtureOutside123";
$outside["location"] = ["latitude" => 0, "longitude" => 0];
if ($path === "/v1/places:searchText") {
    if (
        !isset($body["textQuery"], $body["locationBias"]["circle"]) ||
        $body["pageSize"] > 10
    ) {
        http_response_code(400);
        echo "{}";
        return;
    }
    if (str_contains($body["textQuery"], "NO_RESULTS")) {
        echo json_encode(["places" => []]);
        return;
    }
    echo json_encode(["places" => [$hotel, $road, $outside]]);
    return;
}
if ($path === "/v1/places:searchNearby") {
    if (
        ($body["includedTypes"] ?? []) !== ["lodging"] ||
        !isset($body["locationRestriction"]["circle"])
    ) {
        http_response_code(400);
        echo "{}";
        return;
    }
    echo json_encode(["places" => [$hotel, $road]]);
    return;
}
foreach ([$hotel, $road, $outside] as $p) {
    if ($path === "/v1/places/" . $p["id"]) {
        echo json_encode($p);
        return;
    }
}
http_response_code(404);
echo "{}";
