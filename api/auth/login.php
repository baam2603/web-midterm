<?php
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store, private");

require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../shared/errors.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(
        [
            "status" => "error",
            "message" => "Method not allowed",
        ],
        JSON_UNESCAPED_UNICODE,
    );
    exit();
}

$failure = securityWriteFailure();
if ($failure) {
    http_response_code($failure[0]);
    echo json_encode(['status' => 'error', 'message' => $failure[1]], JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $rawBody = file_get_contents("php://input");
    $input = json_decode($rawBody, true);

    if (!is_array($input) || !is_string($input['email'] ?? null) || !is_string($input['password'] ?? null)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Dữ liệu đăng nhập không hợp lệ.']);
        exit();
    }
    $email = strtolower(trim((string) ($input["email"] ?? "")));
    $password = (string) ($input["password"] ?? "");

    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(
            [
                "status" => "error",
                "message" => "Vui lòng nhập đầy đủ email và mật khẩu.",
            ],
            JSON_UNESCAPED_UNICODE,
        );
        exit();
    }

    $pdo = connectDB();
    $stmt = $pdo->prepare(
        "SELECT id,email,password_hash,full_name,display_name,phone,birthday,role,session_version,deleted_at FROM users WHERE email = :email LIMIT 1",
    );
    $stmt->execute(["email" => $email]);
    $user = $stmt->fetch();

    if (
        !$user ||
        $user["deleted_at"] !== null ||
        !password_verify($password, $user["password_hash"])
    ) {
        http_response_code(401);
        echo json_encode(
            [
                "status" => "error",
                "message" => "Email hoặc mật khẩu không đúng.",
            ],
            JSON_UNESCAPED_UNICODE,
        );
        exit();
    }

    $userPayload = [
        "id" => $user["id"],
        "email" => $user["email"],
        "name" => $user["full_name"],
        "fullName" => $user["full_name"],
        "displayName" => $user["display_name"] ?? $user["full_name"],
        "phone" => $user["phone"] ?? "",
        "birthday" => $user["birthday"] ?? "",
        "role" => $user["role"],
    ];

    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $_SESSION = [];
    session_regenerate_id(true);

    $_SESSION["user"] = $userPayload;
    $_SESSION["version"] = (int) ($user["session_version"] ?? 1);

    http_response_code(200);
    echo json_encode(
        [
            "status" => "success",
            "message" => "Đăng nhập thành công.",
            "data" => ["user" => $userPayload],
        ],
        JSON_UNESCAPED_UNICODE,
    );
} catch (Throwable $e) {
    outputApiFailure($e);
}
