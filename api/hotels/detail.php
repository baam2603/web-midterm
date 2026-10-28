
<?php

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../config/database.php";

// Chỉ cho phép GET
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "status" => "error",
        "message" => "Method not allowed"
    ]);

    exit;
}

try {
    $pdo = connectDB();

    // Lấy slug từ URL
    $slug = $_GET["slug"] ?? "";

    if (
        !is_string($slug) ||
        !preg_match('/^[a-z0-9-]{1,80}$/D', $slug)
    ) {
        http_response_code(400);

        echo json_encode([
            "status" => "error",
            "message" => "Invalid hotel slug"
        ]);

        exit;
    }

    // 1. Tìm khách sạn
    $sql = "SELECT * FROM hotels WHERE slug = :slug";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        "slug" => $slug
    ]);

    $hotel = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$hotel) {
        http_response_code(404);

        echo json_encode([
            "status" => "error",
            "message" => "Hotel not found"
        ]);

        exit;
    }

    // 2. Lấy các loại phòng của khách sạn
    $roomSql = "
        SELECT *
        FROM room_types
        WHERE hotel_id = :hotel_id
        ORDER BY price_per_night ASC
    ";

    $roomStmt = $pdo->prepare($roomSql);

    $roomStmt->execute([
        "hotel_id" => $hotel["id"]
    ]);

    $rooms = $roomStmt->fetchAll(PDO::FETCH_ASSOC);

    // lay anh
    $imageSql = "
    SELECT image_path, sort_order, is_cover
    FROM hotel_images
    WHERE hotel_id = :hotel_id
    ORDER BY is_cover DESC, sort_order ASC, id ASC
";

    $imageStmt = $pdo->prepare($imageSql);

    $imageStmt->execute([
        "hotel_id" => $hotel["id"]
    ]);

    $images = $imageStmt->fetchAll(PDO::FETCH_ASSOC);
    // lay tien nghi

    $amenitySql = "
    SELECT
        a.code,
        a.label,
        a.icon
    FROM amenities a
    INNER JOIN hotel_amenities ha
        ON ha.amenity_id = a.id
    WHERE ha.hotel_id = :hotel_id
    ORDER BY a.label ASC
";

    $amenityStmt = $pdo->prepare($amenitySql);

    $amenityStmt->execute([
        "hotel_id" => $hotel["id"]
    ]);

    $amenities = $amenityStmt->fetchAll(PDO::FETCH_ASSOC);


    // 3. Trả về dữ liệu JSON

    $hotel["images"] = $images;
    $hotel["amenities"] = $amenities;

    echo json_encode([
        "status" => "success",
        "data" => [
            "hotel" => $hotel,
            "rooms" => $rooms
        ]
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {

    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        "status" => "error",
        "message" => "Internal server error"
    ]);
}
