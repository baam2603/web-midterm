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
check(googlePlaceId("ChIJFixtureHotelDalat123"), "Google Place ID");
check(!googlePlaceId("osm-W12345"), "legacy OSM cannot be mistaken for Google");
check(
    googlePlaceReference(
        "https://evil.invalid/?query_place_id=ChIJFixtureHotelDalat123",
    ) === null,
    "foreign URL rejected",
);
check(!isNearSelectedCity(0, 0, "dalat"), "out-of-city coordinates");
check(
    !googleLodging(["types" => ["route"]]),
    "street is not a lodging business",
);
check(
    googleLodging(["types" => ["hotel", "lodging"]]),
    "lodging type recognized",
);
