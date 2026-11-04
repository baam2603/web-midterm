<?php
declare(strict_types=1);
date_default_timezone_set("Asia/Ho_Chi_Minh");
header("Content-Type: application/json; charset=utf-8");
require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../shared/errors.php";
set_exception_handler("outputApiFailure");
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
function reply(int $code, array $body): never
{
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}
function input(): array
{
    $v = json_decode(file_get_contents("php://input"), true);
    return is_array($v) ? $v : [];
}
function requireMethod(string $method): void
{
    if ($_SERVER["REQUEST_METHOD"] !== $method) {
        reply(405, ["status" => "error", "message" => "Method not allowed"]);
    }
}
function requireUser(): int
{
    $id = (int) ($_SESSION["user"]["id"] ?? 0);
    if (!$id) {
        reply(401, ["status" => "error", "message" => "Vui lòng đăng nhập."]);
    }
    $q = connectDB()->prepare("SELECT session_version FROM users WHERE id=?");
    $q->execute([$id]);
    $version = $q->fetchColumn();
    if (
        $version === false ||
        (int) $version !== (int) ($_SESSION["version"] ?? 1)
    ) {
        $_SESSION = [];
        reply(401, [
            "status" => "error",
            "message" => "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.",
        ]);
    }
    return $id;
}
function requireAdmin(): int
{
    $id = requireUser();
    // Role must be verified from DB, not from localStorage or an unrefreshed session payload.
    $q = connectDB()->prepare("SELECT role FROM users WHERE id=?");
    $q->execute([$id]);
    if ($q->fetchColumn() !== "admin") {
        reply(403, [
            "status" => "error",
            "message" => "Không có quyền quản trị.",
        ]);
    }
    return $id;
}
function failServer(Throwable $e): never
{
    outputApiFailure($e);
    exit();
}

function requireCsrf(): void
{
    $expected = $_SESSION["admin_csrf"] ?? "";
    $sent = $_SERVER["HTTP_X_CSRF_TOKEN"] ?? "";
    if (
        !is_string($sent) ||
        !is_string($expected) ||
        $expected === "" ||
        !hash_equals($expected, $sent)
    ) {
        reply(403, [
            "status" => "error",
            "message" => "Phiên bảo vệ không hợp lệ. Hãy tải lại trang.",
        ]);
    }
}
function auditLog(
    PDO $db,
    string $action,
    string $entity,
    $id,
    array $details = [],
): void {
    $q = $db->prepare(
        "INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,details_json) VALUES(?,?,?,?,?)",
    );
    $q->execute([
        $_SESSION["user"]["id"] ?? null,
        $action,
        $entity,
        (string) $id,
        json_encode($details, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
    ]);
}
function validStayDate(string $s): bool
{
    $d = DateTimeImmutable::createFromFormat("!Y-m-d", $s);
    return $d !== false && $d->format("Y-m-d") === $s;
}
