<?php

declare(strict_types=1);

const OSM_USER_AGENT = "3KBookingMidterm/1.2 (+https://github.com/baam2603/web-midterm)";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

function httpJson(
    string $url,
    ?array $postFields = null,
    int $timeout = 15,
): array {
    if (!extension_loaded("curl")) {
        throw new RuntimeException(
            "Hãy bật extension curl trong php.ini của XAMPP.",
        );
    }

    $remaining = (int) ceil(
        ($GLOBALS["osm_deadline"] ?? microtime(true) + 12) - microtime(true),
    );
    if ($remaining < 1) {
        throw new RuntimeException("Đã hết thời gian tìm kiếm bản đồ.");
    }
    $timeout = min($timeout, $remaining);
    $ch = curl_init($url);
    if ($ch === false) {
        throw new RuntimeException("Không thể khởi tạo cURL.");
    }

    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => min($timeout, 10),
        CURLOPT_MAXFILESIZE => 4 * 1024 * 1024,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_USERAGENT => OSM_USER_AGENT,
        CURLOPT_HTTPHEADER => ["Accept: application/json"],
    ];
    if ($postFields !== null) {
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_POSTFIELDS] = http_build_query(
            $postFields,
            "",
            "&",
            PHP_QUERY_RFC3986,
        );
        $opts[CURLOPT_HTTPHEADER] = [
            "Accept: application/json",
            "Content-Type: application/x-www-form-urlencoded; charset=UTF-8",
        ];
    }

    // Trust the managed CA bundle when provided; never disable TLS verification.
    $ca = getenv("CURL_CA_BUNDLE");
    if ($ca && is_readable($ca)) {
        $opts[CURLOPT_CAINFO] = $ca;
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($raw === false || $status < 200 || $status >= 300) {
        error_log("[3K maps] Upstream HTTP=" . $status . ", cURL=" . $error);
        throw new RuntimeException(
            "Dịch vụ bản đồ tạm thời không phản hồi (HTTP " . $status . ").",
        );
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new RuntimeException(
            "Dịch vụ bản đồ trả dữ liệu JSON không hợp lệ.",
        );
    }
    return $data;
}

function osmCacheDir(): string
{
    $dir =
        rtrim(sys_get_temp_dir(), "/\\") .
        DIRECTORY_SEPARATOR .
        "3kbooking_osm_cache";
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        throw new RuntimeException(
            "Không thể tạo bộ nhớ đệm cho dịch vụ bản đồ.",
        );
    }
    return $dir;
}

function osmCacheRead(string $path, int $ttlSeconds): ?array
{
    if (!is_file($path) || time() - (int) filemtime($path) > $ttlSeconds) {
        return null;
    }
    $raw = @file_get_contents($path);
    if ($raw === false) {
        return null;
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : null;
}

function osmCacheWrite(string $path, array $data): void
{
    $json = json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE,
    );
    if ($json !== false) {
        @file_put_contents($path, $json, LOCK_EX);
    }
}

/** Rate limit shared between sessions and between search/lookup endpoints. */
function osmLimitedCachedRequest(
    string $namespace,
    string $cacheKey,
    int $cacheTtl,
    float $minInterval,
    callable $fetch,
): array {
    $dir = osmCacheDir();
    $cachePath =
        $dir .
        DIRECTORY_SEPARATOR .
        sha1($namespace . ":" . $cacheKey) .
        ".json";
    $cached = osmCacheRead($cachePath, $cacheTtl);
    if ($cached !== null) {
        return $cached;
    }

    $lock = @fopen($dir . DIRECTORY_SEPARATOR . $namespace . ".lock", "c+");
    if ($lock === false) {
        throw new RuntimeException("Không thể khóa truy vấn bản đồ.");
    }
    try {
        $deadline = microtime(true) + 2.0;
        while (!flock($lock, LOCK_EX | LOCK_NB)) {
            if (microtime(true) >= $deadline) {
                throw new RuntimeException(
                    "Dịch vụ bản đồ đang xử lý truy vấn khác. Hãy thử lại sau.",
                );
            }
            usleep(50000);
        }

        // Another request may already have populated the cache while waiting.
        $cached = osmCacheRead($cachePath, $cacheTtl);
        if ($cached !== null) {
            return $cached;
        }

        rewind($lock);
        $last = (float) trim((string) stream_get_contents($lock));
        $remaining = $minInterval - (microtime(true) - $last);
        if ($remaining > 0) {
            usleep((int) ceil($remaining * 1000000));
        }

        rewind($lock);
        ftruncate($lock, 0);
        fwrite($lock, (string) microtime(true));
        fflush($lock);

        $result = $fetch();
        osmCacheWrite($cachePath, $result);
        return $result;
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

/** One Nominatim request per second across the whole PHP installation. */
function osmRequest(string $path, array $params): array
{
    $url =
        NOMINATIM_URL .
        ltrim($path, "/") .
        "?" .
        http_build_query($params, "", "&", PHP_QUERY_RFC3986);
    $ttl = ltrim($path, "/") === "lookup" ? 86400 : 1800;
    return osmLimitedCachedRequest(
        "nominatim",
        $url,
        $ttl,
        1.1,
        static fn(): array => httpJson($url),
    );
}

/** Cache Overpass queries; avoid repeated heavy queries. */
function overpassRequest(string $ql): array
{
    return osmLimitedCachedRequest(
        "overpass",
        $ql,
        1800,
        2.0,
        static fn(): array => httpJson(OVERPASS_URL, ["data" => $ql], 30),
    );
}

function isLodgingPlace(array $place): bool
{
    $category = (string) ($place["category"] ?? ($place["class"] ?? ""));
    $type = (string) ($place["type"] ?? "");
    return match ($category) {
        "tourism" => in_array(
            $type,
            [
                "hotel",
                "motel",
                "guest_house",
                "hostel",
                "apartment",
                "chalet",
                "resort",
                "villa",
            ],
            true,
        ),
        "leisure" => $type === "resort",
        // Chung cư / tòa căn hộ có tên riêng cũng được coi là nơi lưu trú.
        "building" => in_array(
            $type,
            [
                "hotel",
                "resort",
                "hostel",
                "guest_house",
                "motel",
                "apartments",
                "dormitory",
            ],
            true,
        ),
        default => false,
    };
}

function osmHotelName(array $place): string
{
    $name = trim((string) ($place["name"] ?? ""));
    if ($name === "" && isset($place["namedetails"]["name"])) {
        $name = trim((string) $place["namedetails"]["name"]);
    }
    return $name;
}

function osmPlaceId(array $place): ?string
{
    $map = ["node" => "N", "way" => "W", "relation" => "R"];
    $prefix = $map[$place["osm_type"] ?? ""] ?? null;
    $id = $place["osm_id"] ?? null;
    return $prefix !== null && is_numeric($id) && (int) $id > 0
        ? "osm-" . $prefix . (int) $id
        : null;
}

function osmPlaceUrl(string $placeId): string
{
    if (!preg_match('/^osm-([NWR])([0-9]{1,15})$/D', $placeId, $m)) {
        throw new InvalidArgumentException("Mã OpenStreetMap không hợp lệ.");
    }
    $kinds = ["N" => "node", "W" => "way", "R" => "relation"];
    return "https://www.openstreetmap.org/" . $kinds[$m[1]] . "/" . $m[2];
}

/** City centre + radius are approximate checks, NOT administrative borders. */
function cityArea(string $city): ?array
{
    return [
        "dalat" => [11.9404, 108.4583, 30],
        "vungtau" => [10.346, 107.0843, 25],
    ][$city] ?? null;
}

function cityBbox(string $city): ?array
{
    $area = cityArea($city);
    if ($area === null) {
        return null;
    }
    [$lat, $lon, $km] = $area;
    $dLat = $km / 111.0;
    $dLon = $km / (111.0 * cos(deg2rad($lat)));
    return [$lat - $dLat, $lon - $dLon, $lat + $dLat, $lon + $dLon];
}

function osmDistanceMeters(
    float $lat1,
    float $lon1,
    float $lat2,
    float $lon2,
): float {
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a =
        sin($dLat / 2) ** 2 +
        cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
    return 6371000.0 * 2.0 * asin(min(1.0, sqrt($a)));
}

/** Bỏ dấu tiếng Việt, hạ chữ thường, chỉ giữ [a-z0-9] cách nhau bằng 1 khoảng trắng. */
function osmFold(string $text): string
{
    static $map = null;
    if ($map === null) {
        $map = [];
        $groups = [
            "a" => "àáảãạăằắẳẵặâầấẩẫậ",
            "e" => "èéẻẽẹêềếểễệ",
            "i" => "ìíỉĩị",
            "o" => "òóỏõọôồốổỗộơờớởỡợ",
            "u" => "ùúủũụưừứửữự",
            "y" => "ỳýỷỹỵ",
            "d" => "đ",
        ];
        foreach ($groups as $base => $chars) {
            foreach (
                preg_split("//u", $chars, -1, PREG_SPLIT_NO_EMPTY) ?: []
                as $ch
            ) {
                $map[$ch] = $base;
            }
        }
    }
    $text = function_exists("mb_strtolower")
        ? mb_strtolower($text, "UTF-8")
        : strtolower($text);
    $text = preg_replace("/\p{Mn}+/u", "", $text) ?? $text; // dấu tổ hợp (NFD)
    $text = strtr($text, $map);
    $text = preg_replace("/[^a-z0-9]+/", " ", $text) ?? $text;
    return trim($text);
}

/** Regex (cho Overpass) khớp một từ đã fold, bất kể OSM ghi có dấu hay không dấu. */
function osmFoldRegexWord(string $foldedWord): string
{
    static $classes = [
        "a" => "aAàáảãạăằắẳẵặâầấẩẫậÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ",
        "e" => "eEèéẻẽẹêềếểễệÈÉẺẼẸÊỀẾỂỄỆ",
        "i" => "iIìíỉĩịÌÍỈĨỊ",
        "o" => "oOòóỏõọôồốổỗộơờớởỡợÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ",
        "u" => "uUùúủũụưừứửữựÙÚỦŨỤƯỪỨỬỮỰ",
        "y" => "yYỳýỷỹỵỲÝỶỸỴ",
        "d" => "dDđĐ",
    ];
    $out = "";
    foreach (str_split($foldedWord) as $ch) {
        if (!preg_match('/^[a-z0-9]$/D', $ch)) {
            continue;
        } // an toàn khi nhúng vào chuỗi QL
        $out .= isset($classes[$ch]) ? "[" . $classes[$ch] . "]" : $ch;
    }
    return $out;
}

/** Bỏ các từ chỉ loại hình ("khách sạn", "hotel", "căn hộ"...) vì tên trong OSM thường không chứa chúng. */
function osmStripGenericWords(string $query): string
{
    $tokens = preg_split("/\s+/u", trim($query), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $folded = array_map("osmFold", $tokens);
    $two = [
        "khach san",
        "nha nghi",
        "can ho",
        "chung cu",
        "biet thu",
        "nha khach",
        "guest house",
        "nha tro",
    ];
    $one = [
        "hotel",
        "resort",
        "villa",
        "apartment",
        "apartments",
        "homestay",
        "hostel",
        "motel",
        "bungalow",
        "condotel",
    ];
    $kept = [];
    $n = count($tokens);
    for ($i = 0; $i < $n; $i++) {
        if (
            $i + 1 < $n &&
            in_array($folded[$i] . " " . $folded[$i + 1], $two, true)
        ) {
            $i++;
            continue;
        }
        if (in_array($folded[$i], $one, true)) {
            continue;
        }
        $kept[] = $tokens[$i];
    }
    return implode(" ", $kept);
}

/** Truy vấn có vẻ là địa chỉ (số nhà + tên đường, hoặc có từ đường/phố/hẻm...). */
function osmLooksLikeAddress(string $query): bool
{
    return preg_match(
        "/^\s*\d+[\/\-\dA-Za-z]*\s+\p{L}|\b(đường|duong|phố|pho|ngõ|ngo|hẻm|hem|phường|phuong|street|road)\b/iu",
        $query,
    ) === 1;
}

/** Các biến thể truy vấn Nominatim, thử lần lượt cho đến khi đủ kết quả (tối đa 4 request). */
function osmQueryVariants(string $query, string $cityName, string $mode): array
{
    $variants = [["q" => $query, "bounded" => 1]];

    $stripped = osmStripGenericWords($query);
    if ($stripped !== "" && $stripped !== $query) {
        $variants[] = ["q" => $stripped, "bounded" => 1];
    }

    if ($mode !== "name") {
        // 12/3 -> 12 và bỏ chữ "đường/phố/phường/quận" mà OSM thường không ghi trong tên đường.
        $addr =
            preg_replace("~(\d)[/\-]\d+[A-Za-z]?~u", '$1', $query) ?? $query;
        $parts = preg_split("/\s+/u", $addr, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $parts = array_values(
            array_filter(
                $parts,
                static fn(string $t): bool => !in_array(
                    osmFold($t),
                    ["duong", "pho", "phuong", "quan"],
                    true,
                ),
            ),
        );
        $addr = implode(" ", $parts);
        if ($addr !== "" && $addr !== $query && $addr !== $stripped) {
            $variants[] = ["q" => $addr, "bounded" => 1];
        }
    }

    // Phương án cuối: thêm tên thành phố, không giới hạn viewbox.
    $variants[] = [
        "q" => $query . ", " . $cityName . ", Việt Nam",
        "bounded" => 0,
    ];

    $seen = [];
    $unique = [];
    foreach ($variants as $v) {
        $key = $v["q"] . "|" . $v["bounded"];
        if (isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        $unique[] = $v;
    }
    return array_slice($unique, 0, 4);
}

/** Điểm liên quan: tên (kể cả name:en, alt_name...) khớp từ khóa > loại lưu trú > gần địa chỉ. */
function osmScore(array $p, string $query, string $mode): float
{
    $stripped = osmStripGenericWords($query);
    $needle = osmFold($stripped !== "" ? $stripped : $query);
    $tokens = array_values(
        array_filter(
            explode(" ", $needle),
            static fn(string $t): bool => $t !== "",
        ),
    );

    $alt = [];
    foreach ((array) ($p["namedetails"] ?? []) as $v) {
        if (is_scalar($v)) {
            $alt[] = (string) $v;
        }
    }
    $nameText = osmFold(osmHotelName($p) . " " . implode(" ", $alt));
    $addrText = osmFold((string) ($p["display_name"] ?? ""));

    $cover = static function (string $text) use ($tokens, $needle): float {
        if ($tokens === [] || $text === "") {
            return 0.0;
        }
        $padded = " " . $text . " ";
        $hit = 0;
        foreach ($tokens as $t) {
            if (str_contains($padded, " " . $t)) {
                $hit++;
            } // khớp đầu từ
        }
        $score = $hit / count($tokens);
        if (str_contains($padded, " " . $needle)) {
            $score += 0.5;
        } // khớp cả cụm
        return $score;
    };

    $relevance = max($cover($nameText), 0.8 * $cover($addrText));
    $kind = (string) ($p["_kind"] ?? "location");
    $kindWeight = match ($kind) {
        "lodging" => 0.6,
        "address" => 0.3,
        default => 0.0,
    };
    if ($mode === "address" && $kind === "address") {
        $kindWeight += 0.3;
    }
    $distance = isset($p["_distanceMeters"])
        ? (min((int) $p["_distanceMeters"], 1000) / 1000) * 0.5
        : 0.0;

    return $relevance * 2 + $kindWeight - $distance;
}

function isNearSelectedCity(
    float $latitude,
    float $longitude,
    string $city,
): bool {
    $area = cityArea($city);
    if ($area === null) {
        return false;
    }
    return osmDistanceMeters($area[0], $area[1], $latitude, $longitude) <=
        $area[2] * 1000.0;
}

/** Keep only actual tagged lodging objects with names & coordinates in city area. */
function filterLodgingPlaces(array $list, string $city): array
{
    $found = [];
    foreach ($list as $p) {
        if (
            !is_array($p) ||
            !isLodgingPlace($p) ||
            osmHotelName($p) === "" ||
            trim((string) ($p["display_name"] ?? "")) === "" ||
            !is_numeric($p["lat"] ?? null) ||
            !is_numeric($p["lon"] ?? null) ||
            !isNearSelectedCity((float) $p["lat"], (float) $p["lon"], $city)
        ) {
            continue;
        }

        $id = osmPlaceId($p);
        if ($id !== null) {
            $p["name"] = osmHotelName($p);
            $found[$id] = $p;
        }
    }
    return array_values($found);
}

/** Safely convert Overpass IDs to one Nominatim lookup call (max 30). */
function osmLookupIds(array $ids, string $city): array
{
    $safe = [];
    foreach (array_slice($ids, 0, 30) as $id) {
        if (preg_match('/^[NWR][0-9]{1,15}$/D', (string) $id)) {
            $safe[] = $id;
        }
    }
    if ($safe === []) {
        return [];
    }
    $items = osmRequest("lookup", [
        "osm_ids" => implode(",", array_unique($safe)),
        "format" => "jsonv2",
        "addressdetails" => 1,
        "namedetails" => 1,
        "accept-language" => "vi",
    ]);
    return filterLodgingPlaces($items, $city);
}

/** Chọn 1 từ đặc trưng nhất để tìm tên trên Overpass; trả về regex không phân biệt dấu. */
function osmOverpassKeyword(string $query): ?string
{
    $stop = [
        "hotel",
        "khach",
        "san",
        "nha",
        "nghi",
        "resort",
        "homestay",
        "hostel",
        "guest",
        "house",
        "apartment",
        "villa",
        "dalat",
        "da",
        "lat",
        "vung",
        "tau",
        "vungtau",
        "viet",
        "nam",
        "duong",
        "pho",
        "phuong",
        "quan",
        "street",
        "road",
    ];
    $stripped = osmStripGenericWords($query);
    $best = "";
    foreach (
        explode(" ", osmFold($stripped !== "" ? $stripped : $query))
        as $w
    ) {
        if (strlen($w) < 2 || ctype_digit($w) || in_array($w, $stop, true)) {
            continue;
        }
        if (strlen($w) > strlen($best)) {
            $best = $w;
        }
    }
    return $best === "" ? null : osmFoldRegexWord($best);
}

function osmOverpassIdsFromElements(array $elements, int $limit = 30): array
{
    $map = ["node" => "N", "way" => "W", "relation" => "R"];
    $ids = [];
    foreach ($elements as $el) {
        if (!is_array($el)) {
            continue;
        }
        $prefix = $map[$el["type"] ?? ""] ?? null;
        $id = $el["id"] ?? null;
        if ($prefix !== null && is_numeric($id) && (int) $id > 0) {
            $ids[$prefix . (int) $id] = true;
        }
    }
    return array_slice(array_keys($ids), 0, $limit);
}

/** Bộ lọc lưu trú dùng chung cho các truy vấn Overpass. */
function osmLodgingQl(string $extraFilter, string $area): string
{
    return 'nwr["tourism"~"^(hotel|motel|guest_house|hostel|apartment|chalet|resort|villa)$"]' .
        $extraFilter .
        $area .
        ";" .
        'nwr["leisure"="resort"]' .
        $extraFilter .
        $area .
        ";" .
        'nwr["building"~"^(hotel|resort|hostel|guest_house|motel|apartments|dormitory)$"]' .
        $extraFilter .
        $area .
        ";";
}

function osmFindByName(string $query, string $city): array
{
    $regex = osmOverpassKeyword($query);
    $bbox = cityBbox($city);
    if ($regex === null || $bbox === null) {
        return [];
    }
    $box = vsprintf("(%.5F,%.5F,%.5F,%.5F)", $bbox);
    // Tìm cả name, name:vi, name:en, alt_name, old_name, short_name.
    $nameFilter =
        '[~"^(name|name:vi|name:en|alt_name|old_name|short_name)$"~"' .
        $regex .
        '",i]';
    $ql =
        "[out:json][timeout:20];(" .
        osmLodgingQl($nameFilter, $box) .
        ");out ids 30;";
    $response = overpassRequest($ql);
    return osmLookupIds(
        osmOverpassIdsFromElements($response["elements"] ?? []),
        $city,
    );
}

/** Find lodging close to a geocoded street/house/address (not exact address matches). */
function osmFindNearAddress(
    float $lat,
    float $lon,
    string $city,
    int $radiusMeters = 700,
): array {
    if (!isNearSelectedCity($lat, $lon, $city)) {
        return [];
    }
    $around =
        "(around:" .
        $radiusMeters .
        "," .
        sprintf("%.6F", $lat) .
        "," .
        sprintf("%.6F", $lon) .
        ")";
    $ql =
        "[out:json][timeout:20];(" .
        osmLodgingQl('["name"]', $around) .
        ");out ids 40;";
    $response = overpassRequest($ql);
    $places = osmLookupIds(
        osmOverpassIdsFromElements($response["elements"] ?? []),
        $city,
    );
    foreach ($places as &$p) {
        $p["_distanceMeters"] = (int) round(
            osmDistanceMeters($lat, $lon, (float) $p["lat"], (float) $p["lon"]),
        );
    }
    unset($p);
    usort(
        $places,
        static fn(array $a, array $b): int => ($a["_distanceMeters"] ??
            PHP_INT_MAX) <=>
            ($b["_distanceMeters"] ?? PHP_INT_MAX),
    );
    return $places;
}

function osmResultKind(array $place): string
{
    // 1. Được gắn thẻ lưu trú rõ ràng
    if (isLodgingPlace($place)) {
        return "lodging";
    }

    $category = (string) ($place["category"] ?? ($place["class"] ?? ""));
    $type = (string) ($place["type"] ?? "");
    $name = osmHotelName($place);
    $address = is_array($place["address"] ?? null) ? $place["address"] : [];

    $number = trim((string) ($address["house_number"] ?? ""));
    $street = trim(
        (string) ($address["road"] ??
            ($address["pedestrian"] ??
                ($address["residential"] ??
                    ($address["footway"] ?? ($address["path"] ?? ""))))),
    );

    // 2. Có số nhà + tên đường -> Địa chỉ hợp lệ
    if ($number !== "" && $street !== "") {
        return "address";
    }

    // 3. Là bất kỳ tòa nhà nào (chung cư, căn hộ, thương mại, nhà ở...)
    if ($category === "building") {
        return "address";
    }

    // 4. Các khu căn hộ / khu dân cư / tổ hợp có tên riêng
    $nonSelectableCategories = ["boundary"];
    $nonSelectableTypes = [
        "administrative",
        "city",
        "town",
        "village",
        "suburb",
        "quarter",
        "island",
        "state",
        "country",
        "primary",
        "secondary",
        "tertiary",
        "trunk",
        "motorway",
        "residential",
        "unclassified",
        "service",
        "living_street",
        "pedestrian",
        "footway",
    ];

    // Nếu là con đường giao thông thuần túy (highway) mà không phải điểm địa chỉ -> Khóa
    if ($category === "highway") {
        return "location";
    }

    // Nếu là ranh giới hành chính cấp phường/thành phố -> Khóa
    if (in_array($category, $nonSelectableCategories, true)) {
        return "location";
    }

    // Nếu có tên định danh cụ thể (như "The Sóng", "Chung cư Melody"...) hoặc nằm trên một con đường xác định -> Cho phép chọn
    if ($name !== "" || $street !== "") {
        if (
            $category === "place" &&
            in_array($type, $nonSelectableTypes, true) &&
            $street === ""
        ) {
            return "location";
        }
        return "address";
    }

    return "location";
}

/** Retain Nominatim results in the selected city's *approximate* search radius. */
function osmSearchCandidates(array $list, string $city): array
{
    $items = [];
    foreach ($list as $item) {
        if (
            !is_array($item) ||
            !is_numeric($item["lat"] ?? null) ||
            !is_numeric($item["lon"] ?? null) ||
            empty($item["display_name"]) ||
            osmPlaceId($item) === null
        ) {
            continue;
        }
        if (
            !isNearSelectedCity(
                (float) $item["lat"],
                (float) $item["lon"],
                $city,
            )
        ) {
            continue;
        }
        $id = osmPlaceId($item);
        $item["_kind"] = osmResultKind($item);
        $item["name"] = osmHotelName($item) ?: (string) $item["display_name"];
        $items[$id] = $item;
    }
    return array_values($items);
}

/** OSM URL or osm-W123 input: useful if the user found an item on the OSM website. */
function osmParseReference(string $input): ?string
{
    $input = trim($input);
    if (preg_match('/^osm-([NWR])([0-9]{1,15})$/iD', $input, $m)) {
        return strtoupper($m[1]) . $m[2];
    }
    if (
        preg_match(
            '~^https?://(?:www\.)?openstreetmap\.org/(node|way|relation)/([0-9]{1,15})(?:[/#?].*)?$~iD',
            $input,
            $m,
        )
    ) {
        $types = ["node" => "N", "way" => "W", "relation" => "R"];
        return $types[strtolower($m[1])] . $m[2];
    }
    return null;
}

function searchLodgingPlaces(
    string $query,
    string $city,
    string $cityName,
    string $mode = "auto",
): array {
    $bbox = cityBbox($city);
    if ($bbox === null) {
        return [];
    }

    $lookupParams = [
        "format" => "jsonv2",
        "addressdetails" => 1,
        "namedetails" => 1,
        "accept-language" => "vi",
    ];

    // Admin dán link OSM / osm-W123: tra thẳng, không cần tìm mờ.
    $osmId = osmParseReference($query);
    if ($osmId !== null) {
        return osmSearchCandidates(
            osmRequest("lookup", ["osm_ids" => $osmId] + $lookupParams),
            $city,
        );
    }

    $viewbox = sprintf(
        "%.5F,%.5F,%.5F,%.5F",
        $bbox[1],
        $bbox[2],
        $bbox[3],
        $bbox[0],
    );
    $looksLikeAddress = osmLooksLikeAddress($query);

    $countKinds = static function (array $items): array {
        $c = ["lodging" => 0, "address" => 0, "location" => 0];
        foreach ($items as $p) {
            $c[$p["_kind"] ?? "location"] =
                ($c[$p["_kind"] ?? "location"] ?? 0) + 1;
        }
        return $c;
    };
    $enough = static function (array $items) use (
        $countKinds,
        $mode,
        $looksLikeAddress,
    ): bool {
        $c = $countKinds($items);
        return match ($mode) {
            "name" => $c["lodging"] > 0,
            "address" => $c["address"] + $c["lodging"] > 0,
            default => $c["lodging"] > 0 ||
                ($looksLikeAddress && $c["address"] > 0),
        };
    };

    // 1) Nominatim: thử lần lượt các biến thể truy vấn, giới hạn trong khung thành phố (bounded=1)
    //    để các tên phổ biến ở tỉnh khác không chiếm hết 40 kết quả.
    $all = [];
    $providerError = null;
    foreach (
        array_slice(osmQueryVariants($query, $cityName, $mode), 0, 2)
        as $variant
    ) {
        try {
            $geo = osmRequest("search", [
                "q" => $variant["q"],
                "format" => "jsonv2",
                "addressdetails" => 1,
                "namedetails" => 1,
                "accept-language" => "vi",
                "countrycodes" => "vn",
                "limit" => 40,
                "viewbox" => $viewbox,
                "bounded" => $variant["bounded"],
            ]);
        } catch (Throwable $e) {
            $providerError = $e;
            break;
        }
        foreach (osmSearchCandidates($geo, $city) as $c) {
            $all[osmPlaceId($c)] ??= $c;
        }
        if ($enough($all) || count($all) >= 10) {
            break;
        }
    }

    // 2) Overpass theo tên (name/name:en/alt_name..., không phân biệt dấu) khi còn ít cơ sở lưu trú.
    if ($mode !== "address" && $countKinds($all)["lodging"] === 0) {
        try {
            foreach (osmFindByName($query, $city) as $p) {
                $id = osmPlaceId($p);
                if ($id === null) {
                    continue;
                }
                $p["_kind"] = "lodging";
                $p["name"] = osmHotelName($p);
                $all[$id] = ($all[$id] ?? []) + $p; // giữ dữ liệu Nominatim nếu đã có
                $all[$id]["_kind"] = "lodging";
            }
        } catch (Throwable $e) {
            error_log("[3K OSM optional Overpass name] " . $e->getMessage());
            if ($all === [] && $providerError !== null) {
                throw $providerError;
            }
        }
    }

    // 3) Truy vấn theo địa chỉ: tìm khách sạn/căn hộ nằm ngay tại hoặc quanh địa chỉ đó.
    if (
        ($mode === "address" || $looksLikeAddress) &&
        $countKinds($all)["lodging"] === 0
    ) {
        $anchor = null;
        foreach ($all as $p) {
            if (($p["_kind"] ?? "") === "lodging") {
                continue;
            }
            if (
                $anchor === null ||
                (($p["_kind"] ?? "") === "address" &&
                    ($anchor["_kind"] ?? "") !== "address")
            ) {
                $anchor = $p;
            }
        }
        if ($anchor !== null) {
            $exact = !empty($anchor["address"]["house_number"]);
            try {
                $near = osmFindNearAddress(
                    (float) $anchor["lat"],
                    (float) $anchor["lon"],
                    $city,
                    $exact ? 150 : 400,
                );
                foreach ($near as $p) {
                    $id = osmPlaceId($p);
                    if ($id === null) {
                        continue;
                    }
                    $p["_kind"] = "lodging";
                    $all[$id] = ($all[$id] ?? []) + $p;
                    $all[$id]["_kind"] = "lodging";
                    $all[$id]["_distanceMeters"] =
                        $p["_distanceMeters"] ?? null;
                }
            } catch (Throwable $e) {
                error_log(
                    "[3K OSM optional Overpass near] " . $e->getMessage(),
                );
            }
        }
    }

    // 4) Xếp hạng theo độ liên quan thay vì chỉ theo loại.
    $ranked = [];
    foreach ($all as $p) {
        $ranked[] = ["p" => $p, "score" => osmScore($p, $query, $mode)];
    }
    usort(
        $ranked,
        static fn(array $a, array $b): int => $b["score"] <=> $a["score"],
    );

    return array_slice(array_column($ranked, "p"), 0, 25);
}

/** Server-side verification of a selected OSM object before INSERT. */
function getVerifiedHotelPlace(string $placeId, string $city): array
{
    if (!preg_match('/^osm-[NWR][0-9]{1,15}$/D', $placeId)) {
        throw new InvalidArgumentException(
            "Mã địa điểm OpenStreetMap không hợp lệ.",
        );
    }
    $items = osmRequest("lookup", [
        "osm_ids" => substr($placeId, 4),
        "format" => "jsonv2",
        "addressdetails" => 1,
        "namedetails" => 1,
        "accept-language" => "vi",
    ]);
    $p = $items[0] ?? null;
    if (
        !is_array($p) ||
        osmPlaceId($p) !== $placeId ||
        !is_numeric($p["lat"] ?? null) ||
        !is_numeric($p["lon"] ?? null) ||
        trim((string) ($p["display_name"] ?? "")) === ""
    ) {
        throw new InvalidArgumentException(
            "Không thể xác minh địa điểm hoặc tọa độ trên OpenStreetMap.",
        );
    }
    if (strtolower((string) ($p["address"]["country_code"] ?? "")) !== "vn") {
        throw new InvalidArgumentException("Địa điểm phải nằm tại Việt Nam.");
    }
    if (!isNearSelectedCity((float) $p["lat"], (float) $p["lon"], $city)) {
        throw new InvalidArgumentException(
            "Địa điểm không nằm trong vùng thành phố đã chọn.",
        );
    }
    $kind = osmResultKind($p);
    if ($kind === "location") {
        throw new InvalidArgumentException(
            "Đây là đường phố/khu vực, chưa phải địa chỉ số nhà hoặc cơ sở lưu trú.",
        );
    }
    return [
        "id" => $placeId,
        "kind" => $kind,
        "name" => osmHotelName($p), // Trả về tên đối tượng cho cả lodging và address/tòa nhà
        "formattedAddress" => (string) $p["display_name"],
        "location" => [
            "latitude" => (float) $p["lat"],
            "longitude" => (float) $p["lon"],
        ],
    ];
}
/** Overpass already supplies tags and centres: no 30-item Nominatim lookup needed. */
function osmNearbyPlaces(
    float $lat,
    float $lon,
    string $city,
    int $radius = 1800,
): array {
    if (
        !is_finite($lat) ||
        !is_finite($lon) ||
        !isNearSelectedCity($lat, $lon, $city)
    ) {
        throw new InvalidArgumentException(
            "Vị trí nằm ngoài vùng thành phố đã chọn.",
        );
    }
    $around = sprintf("(around:%d,%.6F,%.6F)", $radius, $lat, $lon);
    $response = overpassRequest(
        "[out:json][timeout:12];(" .
            osmLodgingQl('["name"]', $around) .
            ");out center tags 60;",
    );
    $items = [];
    foreach ($response["elements"] ?? [] as $e) {
        $tags = $e["tags"] ?? [];
        $pLat = $e["lat"] ?? ($e["center"]["lat"] ?? null);
        $pLon = $e["lon"] ?? ($e["center"]["lon"] ?? null);
        if (
            !is_numeric($pLat) ||
            !is_numeric($pLon) ||
            !isNearSelectedCity((float) $pLat, (float) $pLon, $city)
        ) {
            continue;
        }
        $p = ["osm_type" => $e["type"] ?? "", "osm_id" => $e["id"] ?? 0];
        $id = osmPlaceId($p);
        $name = trim((string) ($tags["name"] ?? ""));
        if (!$id || $name === "") {
            continue;
        }
        $distance = (int) round(
            osmDistanceMeters($lat, $lon, (float) $pLat, (float) $pLon),
        );
        if ($distance > $radius) {
            continue;
        }
        $items[$id] = [
            "placeId" => $id,
            "name" => $name,
            "lat" => (float) $pLat,
            "lng" => (float) $pLon,
            "distanceMeters" => $distance,
            "distanceKm" => round($distance / 1000, 2),
            "addressPreview" => trim(
                ($tags["addr:housenumber"] ?? "") .
                    " " .
                    ($tags["addr:street"] ?? ""),
            ),
        ];
    }
    $items = array_values($items);
    usort($items, fn($a, $b) => $a["distanceMeters"] <=> $b["distanceMeters"]);
    return array_slice($items, 0, 40);
}
