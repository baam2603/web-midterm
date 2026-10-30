<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../config/database.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "status" => "error",
        "message" => "Method not allowed"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $rawBody = file_get_contents("php://input");
    $input = json_decode($rawBody, true) ?: $_POST;

    $email = strtolower(trim((string)($input["email"] ?? "")));
    $password = (string)($input["password"] ?? "");

    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Vui lòng nhập đầy đủ email và mật khẩu."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $pdo = connectDB();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
    $stmt->execute(["email" => $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user["password_hash"])) {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "message" => "Email hoặc mật khẩu không đúng."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $userPayload = [
        "id"          => $user["id"],
        "email"       => $user["email"],
        "name"        => $user["full_name"],
        "fullName"    => $user["full_name"],
        "displayName" => $user["display_name"] ?? $user["full_name"],
        "phone"       => $user["phone"] ?? "",
        "birthday"    => $user["birthday"] ?? "",
        "role"        => $user["role"],
    ];

    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    $_SESSION["user"] = $userPayload;

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => "Đăng nhập thành công.",
        "data" => ["user" => $userPayload]
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Lỗi hệ thống máy chủ."
    ], JSON_UNESCAPED_UNICODE);
}