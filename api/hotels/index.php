
<?php

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../config/database.php";

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

    // Nhận thành phố từ URL
    $city = $_GET["city"] ?? "";

    if (!is_string($city)) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid city"
        ]);
        exit;
    }

    $city = trim($city);

    // Kiểm tra giá trị hợp lệ
    if ($city !== "" && !in_array($city, ["dalat", "vungtau"], true)) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Unsupported city"
        ]);
        exit;
    }

    if ($city === "") {
        // Không có city: lấy tất cả
        $sql = "SELECT * FROM hotels ORDER BY id";

        $stmt = $pdo->query($sql);
    } else {
        // Có city: lọc theo thành phố
        $sql = "SELECT * FROM hotels
                WHERE city = :city
                ORDER BY id";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            "city" => $city
        ]);
    }

    $hotels = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "total" => count($hotels),
        "data" => $hotels
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {

    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        "status" => "error",
        "message" => "Internal server error"
    ]);
}
