<?php
require_once __DIR__ . "/../shared/bootstrap.php";
requireMethod("GET");
$key = trim(getenv("GOOGLE_MAPS_BROWSER_KEY") ?: "");
if ($key === "") {
    reply(503, [
        "status" => "error",
        "message" =>
            "Bản đồ Google chưa được cấu hình. Vui lòng liên hệ quản trị viên.",
    ]);
}
// Browser key is intentionally public; restrict HTTP referrers and API in Google Cloud.
// The Places REST key is NEVER returned here.
reply(200, [
    "status" => "success",
    "data" => [
        "browserKey" => $key,
        "mapId" => getenv("GOOGLE_MAPS_MAP_ID") ?: "DEMO_MAP_ID",
    ],
]);
