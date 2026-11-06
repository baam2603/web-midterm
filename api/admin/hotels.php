<?php

declare(strict_types=1);

require_once __DIR__ . "/../shared/bootstrap.php";

requireMethod("GET");
requireAdmin();

header("Cache-Control: no-store, private");

try {
    $pdo = connectDB();

    $sql = "
        SELECT
            h.id,
            h.slug,
            h.name,
            h.city,
            h.type,
            h.stars,
            h.address,
            h.price_per_night, latitude, longitude, maps_provider,
            h.description,
            h.is_active,
            (
                SELECT COUNT(*)
                FROM room_types r
                WHERE r.hotel_id = h.id
            ) AS room_type_count
        FROM hotels h
        ORDER BY h.id DESC
    ";

    $stmt = $pdo->query($sql);
    $hotels = $stmt->fetchAll(PDO::FETCH_ASSOC);

    reply(200, [
        "status" => "success",
        "data" => [
            "total" => count($hotels),
            "hotels" => $hotels,
        ],
    ]);
} catch (Throwable $e) {
    failServer($e);
}
