<?php
declare(strict_types=1);
final class GooglePlacesUnavailable extends RuntimeException {}

/** Google Places API (New), called only by authorized PHP endpoints. */
function cityArea(string $city): ?array
{
    return [
        "dalat" => [11.9404, 108.4583, 30],
        "vungtau" => [10.346, 107.0843, 25],
    ][$city] ?? null;
}
function placeDistance(float $a, float $b, float $c, float $d): float
{
    $x =
        sin(deg2rad($c - $a) / 2) ** 2 +
        cos(deg2rad($a)) * cos(deg2rad($c)) * sin(deg2rad($d - $b) / 2) ** 2;
    return 6371000 * 2 * asin(min(1, sqrt($x)));
}
function isNearSelectedCity(float $lat, float $lng, string $city): bool
{
    $area = cityArea($city);
    return $area &&
        is_finite($lat) &&
        is_finite($lng) &&
        abs($lat) <= 90 &&
        abs($lng) <= 180 &&
        placeDistance($lat, $lng, $area[0], $area[1]) <= $area[2] * 1000;
}
function googlePlaceId(string $id): bool
{
    return !str_starts_with($id, "osm-") &&
        (bool) preg_match('/^[A-Za-z0-9_-]{10,255}$/D', $id);
}
function placeMapsUrl(string $id): string
{
    if (!googlePlaceId($id)) {
        throw new InvalidArgumentException("Google Place ID không hợp lệ.");
    }
    return "https://www.google.com/maps/search/?api=1&query=" .
        rawurlencode($id) .
        "&query_place_id=" .
        rawurlencode($id);
}
function googlePlaceReference(string $query): ?string
{
    if (
        googlePlaceId($query) &&
        (str_starts_with($query, "ChI") || str_starts_with($query, "Ei"))
    ) {
        return $query;
    }
    if (!preg_match("~^https://~i", $query)) {
        return null;
    }
    $p = parse_url($query);
    if (
        !is_array($p) ||
        !in_array(
            strtolower($p["host"] ?? ""),
            ["www.google.com", "maps.google.com", "google.com"],
            true,
        )
    ) {
        return null;
    }
    parse_str($p["query"] ?? "", $q);
    $id = $q["query_place_id"] ?? "";
    return is_string($id) && googlePlaceId($id) ? $id : null;
}
function googlePlacesRequest(string $operation, ?array $payload = null): array
{
    $key = trim(getenv("GOOGLE_PLACES_API_KEY") ?: "");
    if ($key === "") {
        throw new GooglePlacesUnavailable(
            "Chưa cấu hình GOOGLE_PLACES_API_KEY trên máy chủ.",
            503,
        );
    }
    if (!extension_loaded("curl")) {
        throw new GooglePlacesUnavailable("Cần bật extension cURL trong PHP.");
    }
    $base = "https://places.googleapis.com/v1";
    // A fixed loopback fixture is allowed ONLY in the disposable test environment.
    if (
        getenv("APP_ENV") === "test" &&
        getenv("GOOGLE_PLACES_TEST_ENDPOINT") === "http://127.0.0.1:8004/v1"
    ) {
        $base = "http://127.0.0.1:8004/v1";
    }
    $search = str_starts_with($operation, "places:");
    $fields =
        "id,displayName,formattedAddress,location,types,addressComponents,businessStatus,attributions";
    if ($search) {
        $fields = implode(
            ",",
            array_map(static fn($f) => "places." . $f, explode(",", $fields)),
        );
    }
    $ch = curl_init($base . "/" . $operation);
    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "X-Goog-Api-Key: " . $key,
            "X-Goog-FieldMask: " . $fields,
        ],
    ];
    if ($payload !== null) {
        $options[CURLOPT_POST] = true;
        $options[CURLOPT_POSTFIELDS] = json_encode(
            $payload,
            JSON_THROW_ON_ERROR,
        );
    }
    $ca = getenv("CURL_CA_BUNDLE");
    if ($ca && is_readable($ca)) {
        $options[CURLOPT_CAINFO] = $ca;
    }
    curl_setopt_array($ch, $options);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($raw === false || !$status) {
        throw new GooglePlacesUnavailable(
            "Không kết nối được Google Places. Vui lòng thử lại.",
        );
    }
    if (in_array($status, [401, 403], true)) {
        throw new GooglePlacesUnavailable(
            "Google Places từ chối yêu cầu. Kiểm tra Places API (New), billing và quyền của key phía máy chủ.",
        );
    }
    if ($status === 429) {
        throw new GooglePlacesUnavailable(
            "Đã đạt giới hạn Google Places. Vui lòng thử lại sau.",
        );
    }
    if ($status === 404) {
        throw new InvalidArgumentException(
            "Không tìm thấy địa điểm Google Maps này.",
        );
    }
    $data = json_decode($raw, true);
    if ($status >= 400 || !is_array($data)) {
        throw new GooglePlacesUnavailable(
            "Google Places chưa trả được kết quả hợp lệ.",
        );
    }
    return $data;
}
function googleLodging(array $p): bool
{
    return count(
        array_intersect($p["types"] ?? [], [
            "lodging",
            "hotel",
            "guest_house",
            "hostel",
            "motel",
            "resort_hotel",
            "extended_stay_hotel",
            "bed_and_breakfast",
            "inn",
            "private_guest_room",
            "farmstay",
            "campground",
        ]),
    ) > 0;
}
function normalizeGooglePlace(array $p, string $city): ?array
{
    $lat = $p["location"]["latitude"] ?? null;
    $lng = $p["location"]["longitude"] ?? null;
    if (
        !is_numeric($lat) ||
        !is_numeric($lng) ||
        !isNearSelectedCity((float) $lat, (float) $lng, $city) ||
        !googlePlaceId((string) ($p["id"] ?? ""))
    ) {
        return null;
    }
    $country = null;
    foreach ($p["addressComponents"] ?? [] as $c) {
        if (in_array("country", $c["types"] ?? [], true)) {
            $country = $c["shortText"] ?? null;
        }
    }
    if (
        $country !== "VN" ||
        ($p["businessStatus"] ?? "") === "CLOSED_PERMANENTLY"
    ) {
        return null;
    }
    $name = trim((string) ($p["displayName"]["text"] ?? ""));
    $address = trim((string) ($p["formattedAddress"] ?? ""));
    if ($name === "" || $address === "") {
        return null;
    }
    return [
        "placeId" => $p["id"],
        "name" => $name,
        "address" => $address,
        "mapsUrl" => placeMapsUrl($p["id"]),
        "kind" => googleLodging($p) ? "lodging" : "location",
        "canSelect" => googleLodging($p),
        "lat" => (float) $lat,
        "lng" => (float) $lng,
        "attributions" => $p["attributions"] ?? [],
    ];
}
function getVerifiedHotelPlace(string $id, string $city): array
{
    if (!cityArea($city) || !googlePlaceId($id)) {
        throw new InvalidArgumentException(
            "Google Place ID hoặc thành phố không hợp lệ.",
        );
    }
    $p = normalizeGooglePlace(
        googlePlacesRequest("places/" . rawurlencode($id) . "?languageCode=vi"),
        $city,
    );
    if (!$p || !$p["canSelect"] || $p["placeId"] !== $id) {
        throw new InvalidArgumentException(
            "Địa điểm phải là cơ sở lưu trú tại Việt Nam và nằm trong khu vực thành phố đã chọn; không thể dùng đường phố làm khách sạn.",
        );
    }
    return [
        "id" => $p["placeId"],
        "name" => $p["name"],
        "formattedAddress" => $p["address"],
        "kind" => "lodging",
        "location" => ["latitude" => $p["lat"], "longitude" => $p["lng"]],
        "attributions" => $p["attributions"],
    ];
}
function googleSearchPlaces(
    string $query,
    string $city,
    string $mode = "auto",
): array {
    $area = cityArea($city);
    if (!$area) {
        throw new InvalidArgumentException("Thành phố không hợp lệ.");
    }
    $id = googlePlaceReference($query);
    if ($id) {
        $p = normalizeGooglePlace(
            googlePlacesRequest(
                "places/" . rawurlencode($id) . "?languageCode=vi",
            ),
            $city,
        );
        return $p ? [$p] : [];
    }
    $name = ["dalat" => "Đà Lạt", "vungtau" => "Vũng Tàu"][$city];
    $data = googlePlacesRequest("places:searchText", [
        "textQuery" =>
            ($mode === "address" ? "Khách sạn gần " : "") .
            $query .
            ", " .
            $name .
            ", Việt Nam",
        "languageCode" => "vi",
        "regionCode" => "VN",
        "pageSize" => 10,
        "locationBias" => [
            "circle" => [
                "center" => ["latitude" => $area[0], "longitude" => $area[1]],
                "radius" => $area[2] * 1000.0,
            ],
        ],
    ]);
    $result = [];
    foreach ($data["places"] ?? [] as $raw) {
        $p = normalizeGooglePlace($raw, $city);
        if ($p) {
            $result[] = $p;
        }
    }
    return $result;
}
function googleNearbyPlaces(float $lat, float $lng, string $city): array
{
    if (!isNearSelectedCity($lat, $lng, $city)) {
        throw new InvalidArgumentException(
            "Chọn vị trí trong khu vực thành phố đã chọn.",
        );
    }
    $data = googlePlacesRequest("places:searchNearby", [
        "includedTypes" => ["lodging"],
        "maxResultCount" => 20,
        "rankPreference" => "DISTANCE",
        "languageCode" => "vi",
        "locationRestriction" => [
            "circle" => [
                "center" => ["latitude" => $lat, "longitude" => $lng],
                "radius" => 1800.0,
            ],
        ],
    ]);
    $result = [];
    foreach ($data["places"] ?? [] as $raw) {
        $p = normalizeGooglePlace($raw, $city);
        if (!$p || !$p["canSelect"]) {
            continue;
        }
        $p["distanceKm"] = round(
            placeDistance($lat, $lng, $p["lat"], $p["lng"]) / 1000,
            2,
        );
        $p["addressPreview"] = $p["address"];
        $result[] = $p;
    }
    return $result;
}
