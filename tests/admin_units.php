<?php
require __DIR__ . "/../api/shared/inventory.php";
require __DIR__ . "/../api/admin/places-service.php";
function check($ok, $name)
{
    if (!$ok) {
        throw new RuntimeException($name);
    }
    echo "PASS $name\n";
}
check(
    peakOccupied(
        [
            [
                "checkin" => "2099-01-01",
                "checkout" => "2099-01-02",
                "rooms" => 1,
            ],
            [
                "checkin" => "2099-01-02",
                "checkout" => "2099-01-03",
                "rooms" => 1,
            ],
        ],
        "2099-01-01",
        "2099-01-03",
    ) === 1,
    "adjacent stays",
);
check(
    peakOccupied(
        [
            [
                "checkin" => "2099-01-01",
                "checkout" => "2099-01-04",
                "rooms" => 2,
            ],
            [
                "checkin" => "2099-01-02",
                "checkout" => "2099-01-03",
                "rooms" => 1,
            ],
        ],
        "2099-01-01",
        "2099-01-03",
    ) === 3,
    "overlapping stays",
);
check(osmFold("ĐÀ LẠT") === "da lat", "Vietnamese folding");
check(
    osmParseReference("https://www.openstreetmap.org/way/12345") === "W12345",
    "OSM reference",
);
check(
    osmParseReference("https://evil.invalid/way/12345") === null,
    "foreign URL rejected",
);
check(osmLooksLikeAddress("12 đường Trần Phú"), "address detection");
check(!isNearSelectedCity(0, 0, "dalat"), "out-of-city coordinates");
check(
    osmResultKind([
        "class" => "highway",
        "type" => "residential",
        "name" => "Street",
    ]) === "location",
    "street is not selectable",
);
$hotel = [
    "name" => "Khách sạn Đồi Thông",
    "display_name" => "Đà Lạt",
    "_kind" => "lodging",
];
$other = [
    "name" => "Sea Resort",
    "display_name" => "Đà Lạt",
    "_kind" => "lodging",
];
check(
    osmScore($hotel, "Doi Thong", "name") >
        osmScore($other, "Doi Thong", "name"),
    "accent insensitive ranking",
);
