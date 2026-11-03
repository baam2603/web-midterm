<?php

declare(strict_types=1);

const OSM_USER_AGENT = '3KBookingMidterm/1.2 (+https://github.com/baam2603/web-midterm)';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

function httpJson(string $url, ?array $postFields = null, int $timeout = 15): array
{
    if (!extension_loaded('curl')) {
        throw new RuntimeException('Hãy bật extension curl trong php.ini của XAMPP.');
    }

    $ch = curl_init($url);
    if ($ch === false) {
        throw new RuntimeException('Không thể khởi tạo cURL.');
    }

    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_USERAGENT => OSM_USER_AGENT,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ];
    if ($postFields !== null) {
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_POSTFIELDS] = http_build_query($postFields, '', '&', PHP_QUERY_RFC3986);
        $opts[CURLOPT_HTTPHEADER] = [
            'Accept: application/json',
            'Content-Type: application/x-www-form-urlencoded; charset=UTF-8',
        ];
    }

    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($raw === false || $status < 200 || $status >= 300) {
        error_log('[3K maps] Upstream HTTP=' . $status . ', cURL=' . $error);
        throw new RuntimeException('Dịch vụ bản đồ tạm thời không phản hồi (HTTP ' . $status . ').');
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new RuntimeException('Dịch vụ bản đồ trả dữ liệu JSON không hợp lệ.');
    }
    return $data;
}

function osmCacheDir(): string
{
    $dir = rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . '3kbooking_osm_cache';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        throw new RuntimeException('Không thể tạo bộ nhớ đệm cho dịch vụ bản đồ.');
    }
    return $dir;
}

function osmCacheRead(string $path, int $ttlSeconds): ?array
{
    if (!is_file($path) || (time() - (int) filemtime($path)) > $ttlSeconds) {
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
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json !== false) {
        @file_put_contents($path, $json, LOCK_EX);
    }
}

/** Rate limit shared between sessions and between search/lookup endpoints. */
function osmLimitedCachedRequest(string $namespace, string $cacheKey, int $cacheTtl, float $minInterval, callable $fetch): array
{
    $dir = osmCacheDir();
    $cachePath = $dir . DIRECTORY_SEPARATOR . sha1($namespace . ':' . $cacheKey) . '.json';
    $cached = osmCacheRead($cachePath, $cacheTtl);
    if ($cached !== null) {
        return $cached;
    }

    $lock = @fopen($dir . DIRECTORY_SEPARATOR . $namespace . '.lock', 'c+');
    if ($lock === false) {
        throw new RuntimeException('Không thể khóa truy vấn bản đồ.');
    }
    try {
        if (!flock($lock, LOCK_EX)) {
            throw new RuntimeException('Không thể giới hạn tần suất truy vấn bản đồ.');
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
    $url = NOMINATIM_URL . ltrim($path, '/') . '?' . http_build_query($params, '', '&', PHP_QUERY_RFC3986);
    $ttl = ltrim($path, '/') === 'lookup' ? 86400 : 1800;
    return osmLimitedCachedRequest('nominatim', $url, $ttl, 1.1, static fn(): array => httpJson($url));
}

/** Cache Overpass queries; avoid repeated heavy queries. */
function overpassRequest(string $ql): array
{
    return osmLimitedCachedRequest(
        'overpass',
        $ql,
        1800,
        2.0,
        static fn(): array => httpJson(OVERPASS_URL, ['data' => $ql], 30)
    );
}

function isLodgingPlace(array $place): bool
{
    $category = (string) ($place['category'] ?? $place['class'] ?? '');
    $type = (string) ($place['type'] ?? '');
    return match ($category) {
        'tourism' => in_array($type, [
            'hotel',
            'motel',
            'guest_house',
            'hostel',
            'apartment',
            'chalet',
            'resort',
            'villa'
        ], true),
        'leisure' => in_array($type, ['resort', 'swimming_pool'], true),
        'building' => in_array($type, [
            'hotel',
            'resort',
            'hostel',
            'guest_house',
            'motel'
        ], true),
        default => false,
    };
}

function osmHotelName(array $place): string
{
    $name = trim((string) ($place['name'] ?? ''));
    if ($name === '' && isset($place['namedetails']['name'])) {
        $name = trim((string) $place['namedetails']['name']);
    }
    return $name;
}

function osmPlaceId(array $place): ?string
{
    $map = ['node' => 'N', 'way' => 'W', 'relation' => 'R'];
    $prefix = $map[$place['osm_type'] ?? ''] ?? null;
    $id = $place['osm_id'] ?? null;
    return $prefix !== null && is_numeric($id) && (int) $id > 0
        ? 'osm-' . $prefix . (int) $id : null;
}

function osmPlaceUrl(string $placeId): string
{
    if (!preg_match('/^osm-([NWR])([0-9]{1,15})$/D', $placeId, $m)) {
        throw new InvalidArgumentException('Mã OpenStreetMap không hợp lệ.');
    }
    $kinds = ['N' => 'node', 'W' => 'way', 'R' => 'relation'];
    return 'https://www.openstreetmap.org/' . $kinds[$m[1]] . '/' . $m[2];
}

/** City centre + radius are approximate checks, NOT administrative borders. */
function cityArea(string $city): ?array
{
    return [
        'dalat' => [11.9404, 108.4583, 30],
        'vungtau' => [10.3460, 107.0843, 25],
    ][$city] ?? null;
}

function cityBbox(string $city): ?array
{
    $area = cityArea($city);
    if ($area === null) return null;
    [$lat, $lon, $km] = $area;
    $dLat = $km / 111.0;
    $dLon = $km / (111.0 * cos(deg2rad($lat)));
    return [$lat - $dLat, $lon - $dLon, $lat + $dLat, $lon + $dLon];
}

function osmDistanceMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
{
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat / 2) ** 2
        + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;
    return 6371000.0 * 2.0 * asin(min(1.0, sqrt($a)));
}

function isNearSelectedCity(float $latitude, float $longitude, string $city): bool
{
    $area = cityArea($city);
    if ($area === null) return false;
    return osmDistanceMeters($area[0], $area[1], $latitude, $longitude) <= $area[2] * 1000.0;
}

/** Keep only actual tagged lodging objects with names & coordinates in city area. */
function filterLodgingPlaces(array $list, string $city): array
{
    $found = [];
    foreach ($list as $p) {
        if (
            !is_array($p) || !isLodgingPlace($p)
            || osmHotelName($p) === ''
            || trim((string) ($p['display_name'] ?? '')) === ''
            || !is_numeric($p['lat'] ?? null) || !is_numeric($p['lon'] ?? null)
            || !isNearSelectedCity((float) $p['lat'], (float) $p['lon'], $city)
        ) continue;

        $id = osmPlaceId($p);
        if ($id !== null) {
            $p['name'] = osmHotelName($p);
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
    if ($safe === []) return [];
    $items = osmRequest('lookup', [
        'osm_ids' => implode(',', array_unique($safe)),
        'format' => 'jsonv2',
        'addressdetails' => 1,
        'namedetails' => 1,
        'accept-language' => 'vi',
    ]);
    return filterLodgingPlaces($items, $city);
}

/** Choose one meaningful word for fuzzy name search, not AND across every word. */
function osmOverpassKeyword(string $query): ?string
{
    $clean = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $query);
    if ($clean === null) return null;
    $words = preg_split('/\s+/u', trim($clean), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $stop = [
        'hotel',
        'khach',
        'sạn',
        'san',
        'khách',
        'nha',
        'nhà',
        'nghi',
        'nghỉ',
        'resort',
        'homestay',
        'hostel',
        'guest',
        'house',
        'da',
        'dalat',
        'lat',
        'lạt',
        'đà',
        'vung',
        'vũng',
        'tau',
        'tàu',
        'đường',
        'duong',
        'phuong',
        'phường',
        'quan',
        'quận',
        'thanh',
        'thành',
        'pho',
        'phố',
        'street',
        'road',
        'viet',
        'nam'
    ];
    $choice = '';
    foreach ($words as $word) {
        $length = preg_match_all('/./us', $word);
        if ($length === false || $length < 3 || in_array(function_exists('mb_strtolower') ? mb_strtolower($word, 'UTF-8') : strtolower($word), $stop, true)) continue;
        if ($length > (preg_match_all('/./us', $choice) ?: 0)) $choice = $word;
    }
    if ($choice === '') return null;
    // Remove regex metacharacters so OSM names are queried as literal substrings.
    return preg_quote($choice, '/');
}

function osmOverpassIdsFromElements(array $elements, int $limit = 30): array
{
    $map = ['node' => 'N', 'way' => 'W', 'relation' => 'R'];
    $ids = [];
    foreach ($elements as $el) {
        if (!is_array($el)) continue;
        $prefix = $map[$el['type'] ?? ''] ?? null;
        $id = $el['id'] ?? null;
        if ($prefix !== null && is_numeric($id) && (int) $id > 0) {
            $ids[$prefix . (int) $id] = true;
        }
    }
    return array_slice(array_keys($ids), 0, $limit);
}

function osmFindByName(string $query, string $city): array
{
    $word = osmOverpassKeyword($query);
    $bbox = cityBbox($city);
    if ($word === null || $bbox === null) return [];
    $box = vsprintf('(%.5F,%.5F,%.5F,%.5F)', $bbox);
    $regex = '"' . $word . '"';
    $ql = '[out:json][timeout:20];('
        . 'nwr["tourism"~"^(hotel|motel|guest_house|hostel|apartment|chalet|resort)$"]["name"~' . $regex . ',i]' . $box . ';'
        . 'nwr["leisure"="resort"]["name"~' . $regex . ',i]' . $box . ';'
        . 'nwr["building"~"^(hotel|resort|hostel|guest_house|motel)$"]["name"~' . $regex . ',i]' . $box . ';'
        . ');out ids 30;';
    $response = overpassRequest($ql);
    return osmLookupIds(osmOverpassIdsFromElements($response['elements'] ?? []), $city);
}

/** Find lodging close to a geocoded street/house/address (not exact address matches). */
function osmFindNearAddress(float $lat, float $lon, string $city, int $radiusMeters = 700): array
{
    if (!isNearSelectedCity($lat, $lon, $city)) return [];
    $latText = sprintf('%.6F', $lat);
    $lonText = sprintf('%.6F', $lon);
    $around = '(around:' . $radiusMeters . ',' . $latText . ',' . $lonText . ')';
    $ql = '[out:json][timeout:20];('
        . 'nwr["tourism"~"^(hotel|motel|guest_house|hostel|apartment|chalet|resort)$"]' . $around . ';'
        . 'nwr["leisure"="resort"]' . $around . ';'
        . 'nwr["building"~"^(hotel|resort|hostel|guest_house|motel)$"]' . $around . ';'
        . ');out ids 40;';
    $response = overpassRequest($ql);
    $places = osmLookupIds(osmOverpassIdsFromElements($response['elements'] ?? []), $city);
    foreach ($places as &$p) {
        $p['_distanceMeters'] = (int) round(osmDistanceMeters($lat, $lon, (float) $p['lat'], (float) $p['lon']));
    }
    unset($p);
    usort($places, static fn(array $a, array $b): int => ($a['_distanceMeters'] ?? PHP_INT_MAX) <=> ($b['_distanceMeters'] ?? PHP_INT_MAX));
    return $places;
}

function osmResultKind(array $place): string
{
    // 1. Được gắn thẻ lưu trú rõ ràng
    if (isLodgingPlace($place)) {
        return 'lodging';
    }

    $category = (string) ($place['category'] ?? $place['class'] ?? '');
    $type = (string) ($place['type'] ?? '');
    $name = osmHotelName($place);
    $address = is_array($place['address'] ?? null) ? $place['address'] : [];

    $number = trim((string) ($address['house_number'] ?? ''));
    $street = trim((string) (
        $address['road']
        ?? $address['pedestrian']
        ?? $address['residential']
        ?? $address['footway']
        ?? $address['path']
        ?? ''
    ));

    // 2. Có số nhà + tên đường -> Địa chỉ hợp lệ
    if ($number !== '' && $street !== '') {
        return 'address';
    }

    // 3. Là bất kỳ tòa nhà nào (chung cư, căn hộ, thương mại, nhà ở...)
    if ($category === 'building') {
        return 'address';
    }

    // 4. Các khu căn hộ / khu dân cư / tổ hợp có tên riêng
    $nonSelectableCategories = ['boundary'];
    $nonSelectableTypes = [
        'administrative',
        'city',
        'town',
        'village',
        'suburb',
        'quarter',
        'island',
        'state',
        'country',
        'primary',
        'secondary',
        'tertiary',
        'trunk',
        'motorway',
        'residential',
        'unclassified',
        'service',
        'living_street',
        'pedestrian',
        'footway'
    ];

    // Nếu là con đường giao thông thuần túy (highway) mà không phải điểm địa chỉ -> Khóa
    if ($category === 'highway') {
        return 'location';
    }

    // Nếu là ranh giới hành chính cấp phường/thành phố -> Khóa
    if (in_array($category, $nonSelectableCategories, true)) {
        return 'location';
    }

    // Nếu có tên định danh cụ thể (như "The Sóng", "Chung cư Melody"...) hoặc nằm trên một con đường xác định -> Cho phép chọn
    if ($name !== '' || $street !== '') {
        if ($category === 'place' && in_array($type, $nonSelectableTypes, true) && $street === '') {
            return 'location';
        }
        return 'address';
    }

    return 'location';
}

/** Retain Nominatim results in the selected city's *approximate* search radius. */
function osmSearchCandidates(array $list, string $city): array
{
    $items = [];
    foreach ($list as $item) {
        if (
            !is_array($item) || !is_numeric($item['lat'] ?? null)
            || !is_numeric($item['lon'] ?? null)
            || empty($item['display_name']) || osmPlaceId($item) === null
        ) continue;
        if (!isNearSelectedCity((float) $item['lat'], (float) $item['lon'], $city)) continue;
        $id = osmPlaceId($item);
        $item['_kind'] = osmResultKind($item);
        $item['name'] = osmHotelName($item) ?: (string) $item['display_name'];
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
    if (preg_match('~^https?://(?:www\.)?openstreetmap\.org/(node|way|relation)/([0-9]{1,15})(?:[/#?].*)?$~iD', $input, $m)) {
        $types = ['node' => 'N', 'way' => 'W', 'relation' => 'R'];
        return $types[strtolower($m[1])] . $m[2];
    }
    return null;
}

/**
 * Prefer Nominatim's raw free-form search (as on openstreetmap.org).
 * Never turn a successfully found address into HTTP 502 because Overpass is down.
 * Overpass is an optional fallback ONLY when name search did not find tagged lodging.
 */
function searchLodgingPlaces(string $query, string $city, string $cityName, string $mode = 'auto'): array
{
    $bbox = cityBbox($city);
    if ($bbox === null) return [];

    // Bypass fuzzy name search when the admin supplies an exact OSM object link.
    $osmId = osmParseReference($query);
    if ($osmId !== null) {
        return osmSearchCandidates(osmRequest('lookup', [
            'osm_ids' => $osmId,
            'format' => 'jsonv2',
            'addressdetails' => 1,
            'namedetails' => 1,
            'accept-language' => 'vi',
        ]), $city);
    }

    $viewbox = sprintf('%.5F,%.5F,%.5F,%.5F', $bbox[1], $bbox[2], $bbox[3], $bbox[0]);
    $params = [
        'q' => $query,
        'format' => 'jsonv2',
        'addressdetails' => 1,
        'namedetails' => 1,
        'accept-language' => 'vi',
        'countrycodes' => 'vn',
        'limit' => 40,
        'viewbox' => $viewbox,
        'bounded' => 0,
    ];

    // First call keeps the user's exact text intact; never force a city suffix.
    $geo = osmRequest('search', $params);
    $candidates = osmSearchCandidates($geo, $city);

    // Nominatim may rank only the street. A city-qualified second attempt
    // is useful only if the first returns NO in-area results.
    if ($candidates === []) {
        $params['q'] = $query . ', ' . $cityName . ', Việt Nam';
        $geo = osmRequest('search', $params);
        $candidates = osmSearchCandidates($geo, $city);
    }

    $lodging = array_values(array_filter(
        $candidates,
        static fn(array $p): bool => $p['_kind'] === 'lodging'
    ));
    $addresses = array_values(array_filter(
        $candidates,
        static fn(array $p): bool => $p['_kind'] === 'address'
    ));
    $locations = array_values(array_filter(
        $candidates,
        static fn(array $p): bool => $p['_kind'] === 'location'
    ));

    // Put exact street addresses first in address mode.
    if ($mode === 'address') {
        $ordered = array_merge($addresses, $lodging, $locations);
    } else {
        $ordered = array_merge($lodging, $addresses, $locations);
    }

    // No need to query often-overloaded Overpass if Nominatim returned actual
    // matching POIs or exact street addresses. For partial name searches only,
    // Overpass can recover tagged hotels Nominatim did not rank highly.
    $looksLikeAddress = preg_match('/[0-9]|đường|duong|phố|pho\s|street|road|phường|phuong|hẻm|hem|ngõ|ngo\s/iu', $query) === 1;
    if ($mode !== 'address' && !$looksLikeAddress && $lodging === []) {
        try {
            $extra = osmFindByName($query, $city);
            $known = [];
            foreach ($extra as $p) {
                $p['_kind'] = 'lodging';
                $p['name'] = osmHotelName($p);
                $known[osmPlaceId($p)] = $p;
            }
            foreach ($ordered as $p) {
                $known[osmPlaceId($p)] = $p;
            }
            $ordered = array_values($known);
        } catch (Throwable $e) {
            // Overpass is an *optional* fallback; don't discard valid results.
            error_log('[3K OSM optional Overpass] ' . $e->getMessage());
        }
    }

    return array_slice($ordered, 0, 25);
}

/** Server-side verification of a selected OSM object before INSERT. */
function getVerifiedHotelPlace(string $placeId, string $city): array
{
    if (!preg_match('/^osm-[NWR][0-9]{1,15}$/D', $placeId)) {
        throw new InvalidArgumentException('Mã địa điểm OpenStreetMap không hợp lệ.');
    }
    $items = osmRequest('lookup', [
        'osm_ids' => substr($placeId, 4),
        'format' => 'jsonv2',
        'addressdetails' => 1,
        'namedetails' => 1,
        'accept-language' => 'vi',
    ]);
    $p = $items[0] ?? null;
    if (
        !is_array($p) || !is_numeric($p['lat'] ?? null)
        || !is_numeric($p['lon'] ?? null)
        || trim((string) ($p['display_name'] ?? '')) === ''
    ) {
        throw new InvalidArgumentException('Không thể xác minh địa điểm hoặc tọa độ trên OpenStreetMap.');
    }
    if (strtolower((string) ($p['address']['country_code'] ?? '')) !== 'vn') {
        throw new InvalidArgumentException('Địa điểm phải nằm tại Việt Nam.');
    }
    if (!isNearSelectedCity((float) $p['lat'], (float) $p['lon'], $city)) {
        throw new InvalidArgumentException('Địa điểm không nằm trong vùng thành phố đã chọn.');
    }
    $kind = osmResultKind($p);
    if ($kind === 'location') {
        throw new InvalidArgumentException('Đây là đường phố/khu vực, chưa phải địa chỉ số nhà hoặc cơ sở lưu trú.');
    }
    return [
        'id' => $placeId,
        'kind' => $kind,
        'name' => osmHotelName($p), // Trả về tên đối tượng cho cả lodging và address/tòa nhà
        'formattedAddress' => (string) $p['display_name'],
        'location' => [
            'latitude' => (float) $p['lat'],
            'longitude' => (float) $p['lon'],
        ],
    ];
}
