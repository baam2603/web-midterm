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
    $input = json_decode($rawBody, true);

    if (!is_array($input)) {
        $input = $_POST;
    }

    $fullName = trim((string)($input["fullName"] ?? $input["full_name"] ?? $input["name"] ?? ""));
    $email    = strtolower(trim((string)($input["email"] ?? "")));
    $password = (string)($input["password"] ?? "");
    $phone    = trim((string)($input["phone"] ?? ""));
    $birthday = trim((string)($input["birthday"] ?? ""));

    // 1. Validate dữ liệu đầu vào
    if (mb_strlen($fullName) < 2 || mb_strlen($fullName) > 120) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Họ và tên phải từ 2 đến 120 ký tự."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 150) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Email không hợp lệ."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (strlen($password) < 8 || !preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Mật khẩu phải có ít nhất 8 ký tự, bao gồmทั้ง chữ và số."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($phone !== "" && !preg_match('/^[0-9+\-\s]{8,20}$/', $phone)) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Số điện thoại không hợp lệ."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $pdo = connectDB();

    // 2. Kiểm tra trùng lặp email
    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
    $checkStmt->execute(["email" => $email]);
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode([
            "status" => "error",
            "message" => "Email này đã được đăng ký."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($birthday !== "") {
    $date = DateTimeImmutable::createFromFormat("!Y-m-d", $birthday);

    if (
        !$date ||
        $date->format("Y-m-d") !== $birthday ||
        $date > new DateTimeImmutable("today")
    ) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Ngày sinh không hợp lệ."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

    // 3. Hash mật khẩu chuẩn bảo mật server (Bcrypt)
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // 4. Lưu vào MySQL
    
    // 4. Lưu tài khoản mới vào MySQL
    $insertSql = "
        INSERT INTO users (
            email,
            password_hash,
            full_name,
            display_name,
            phone,
            birthday,
            role
        )
        VALUES (
            :email,
            :password_hash,
            :full_name,
            :display_name,
            :phone,
            :birthday,
            'customer'
        )
    ";

    $insertStmt = $pdo->prepare($insertSql);

    $insertStmt->execute([
        "email"         => $email,
        "password_hash" => $passwordHash,
        "full_name"     => $fullName,
        "display_name"  => $fullName,
        "phone"         => $phone !== "" ? $phone : null,
        "birthday"      => $birthday !== "" ? $birthday : null 
    ]);


    $userId = (int)$pdo->lastInsertId();

    $userPayload = [
        "id"          => $userId,
        "email"       => $email,
        "name"        => $fullName,
        "fullName"    => $fullName,
        "displayName" => $fullName,
        "phone"       => $phone,
        "birthday"    => $birthday,
        "role"        => "customer",
        "createdAt"   => date("c")
    ];

    // Khởi tạo PHP session để dùng cho các API cần xác thực sau này
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $_SESSION["user"] = $userPayload;

    http_response_code(201);
    echo json_encode([
        "status"  => "success",
        "message" => "Đăng ký tài khoản thành công.",
        "data"    => [
            "user" => $userPayload
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Lỗi hệ thống máy chủ."
    ], JSON_UNESCAPED_UNICODE);
}