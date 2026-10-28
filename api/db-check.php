
<?php

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/config/database.php";

try {
    $pdo = connectDB();

    $stmt = $pdo->query("SELECT DATABASE()");
    $database = $stmt->fetchColumn();

    echo json_encode([
        "status" => "success",
        "message" => "MySQL connected successfully",
        "database" => $database
    ]);
} catch (Throwable $e) {
    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed"
    ]);
}

