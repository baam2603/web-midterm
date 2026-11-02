<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/database.php';
if (session_status() === PHP_SESSION_NONE) session_start();
function reply(int $code, array $body): never {
 http_response_code($code);
 echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
 exit;
}
function input(): array {
 $v = json_decode(file_get_contents('php://input'), true);
 return is_array($v) ? $v : [];
}
function requireMethod(string $method): void {
 if ($_SERVER['REQUEST_METHOD'] !== $method) reply(405, ['status'=>'error','message'=>'Method not allowed']);
}
function requireUser(): int {
 $id = (int)($_SESSION['user']['id'] ?? 0);
 if (!$id) reply(401, ['status'=>'error','message'=>'Vui lòng đăng nhập.']);
 return $id;
}
function requireAdmin(): int {
 $id = requireUser();
 // Role must be verified from DB, not from localStorage or an unrefreshed session payload.
 $q = connectDB()->prepare('SELECT role FROM users WHERE id=?');
 $q->execute([$id]);
 if ($q->fetchColumn() !== 'admin') reply(403, ['status'=>'error','message'=>'Không có quyền quản trị.']);
 return $id;
}
function failServer(Throwable $e): never {
 error_log('[THREEK reviews] ' . $e->getMessage());
 reply(500, ['status'=>'error','message'=>'Lỗi hệ thống máy chủ.']);
}
