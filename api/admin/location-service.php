<?php
require_once __DIR__ . "/places-service.php";
/** Manual coordinates are an administrator assertion, never an invented OSM business ID. */
function resolveHotelLocation(
    array $data,
    string $city,
    string $address,
    string $ref,
): array {
    $mode = $data["location_mode"] ?? "osm";
    if ($mode === "manual") {
        $lat = filter_var($data["latitude"] ?? null, FILTER_VALIDATE_FLOAT);
        $lng = filter_var($data["longitude"] ?? null, FILTER_VALIDATE_FLOAT);
        if (
            ($data["location_confirmed"] ?? false) !== true ||
            $ref !== "" ||
            $lat === false ||
            $lat === null ||
            $lng === false ||
            $lng === null ||
            !is_finite((float) $lat) ||
            !is_finite((float) $lng) ||
            !isNearSelectedCity((float) $lat, (float) $lng, $city)
        ) {
            throw new InvalidArgumentException(
                "Nhập tọa độ trong vùng thành phố đã chọn và xác nhận đã kiểm tra đúng vị trí. Địa điểm thủ công không được gán mã OSM.",
            );
        }
        if (mb_strlen($address) < 5 || mb_strlen($address) > 255) {
            throw new InvalidArgumentException(
                "Nhập địa chỉ từ 5 đến 255 ký tự.",
            );
        }
        return [
            "id" => null,
            "kind" => "manual",
            "provider" => "manual",
            "formattedAddress" => $address,
            "location" => [
                "latitude" => (float) $lat,
                "longitude" => (float) $lng,
            ],
        ];
    }
    if ($mode !== "osm") {
        throw new InvalidArgumentException(
            "Cách xác định vị trí không hợp lệ.",
        );
    }
    $p = getVerifiedHotelPlace($ref, $city);
    if (($p["kind"] ?? "") !== "lodging") {
        throw new InvalidArgumentException(
            "OSM chỉ xác định địa chỉ/tòa nhà, chưa xác định khách sạn. Hãy dùng chế độ thủ công, nhập tên và kiểm tra ghim.",
        );
    }
    if ($address !== trim($p["formattedAddress"])) {
        throw new InvalidArgumentException(
            "Địa chỉ đã thay đổi. Hãy chọn lại cơ sở lưu trú từ kết quả OSM.",
        );
    }
    $p["provider"] = "osm_lodging";
    return $p;
}
