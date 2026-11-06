<?php
// A local installation check: exposes no connection parameters, secrets or customer rows.
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");
require_once __DIR__ . "/config/database.php";
$required = [
    "users" => [
        "id",
        "email",
        "password_hash",
        "role",
        "session_version",
        "deleted_at",
    ],
    "hotels" => ["latitude", "longitude", "is_active"],
    "room_types" => ["is_active", "area_m2", "bed_type", "features_json"],
    "bookings" => [
        "guest_name",
        "guest_note",
        "subtotal",
        "discount",
        "tax",
        "request_hash",
        "refundable",
        "guest_email",
        "guest_phone",
        "pay_method",
        "payment_status",
        "request_key",
        "payment_expires_at",
    ],
    "favorites" => ["user_id", "hotel_id"],
    "notifications" => ["user_id", "read_at"],
    "support_tickets" => ["user_id", "reply"],
    "audit_logs" => ["actor_id"],
    "registration_challenges" => [
        "challenge_id",
        "otp_hash",
        "expires_at",
        "failed_attempts",
        "mail_id",
        "consumed_at",
    ],
    "registration_rate_limits" => [
        "ip_hash",
        "window_started_at",
        "send_count",
    ],
    "mail_outbox" => ["expires_at"],
];
$result = [
    "phpSupported" => version_compare(PHP_VERSION, "8.1", ">="),
    "mysqlDriver" => extension_loaded("pdo_mysql"),
    "mbstring" => extension_loaded("mbstring"),
    "databaseConnected" => false,
    "missing" => [],
];
try {
    $db = connectDB();
    $result["databaseConnected"] = true;
    $q = $db->query(
        "SELECT table_name,column_name,is_nullable FROM information_schema.columns WHERE table_schema=DATABASE()",
    );
    $actual = [];
    foreach ($q->fetchAll() as $row) {
        $actual[$row["table_name"]][$row["column_name"]] = true;
    }
    $reviewColumn = $db->query("SELECT is_nullable FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='reviews' AND column_name='booking_id'")->fetchColumn();
    if ($reviewColumn !== 'YES') $result['missing'][] = 'reviews.booking_id (nullable)';
    foreach ($required as $table => $columns) {
        foreach ($columns as $column) {
            if (empty($actual[$table][$column])) {
                $result["missing"][] = $table . "." . $column;
            }
        }
    }
} catch (Throwable $e) {
    $result["message"] =
        "Kiểm tra MySQL đã chạy và cấu hình kết nối trong api/config/database.php hoặc biến môi trường.";
}
$result["ready"] =
    $result["phpSupported"] &&
    $result["mysqlDriver"] &&
    $result["mbstring"] &&
    $result["databaseConnected"] &&
    !$result["missing"];
if ($result["missing"]) {
    $result["message"] =
        "Sao lưu database rồi import database/admin_migration.sql và database/customer_migration.sql rồi database/registration_otp_migration.sql và database/account_closure_migration.sql và database/public_reviews_migration.sql. Không import schema.sql đè lên dữ liệu hiện có.";
}
if (!$result["mbstring"]) {
    $result["message"] =
        "Bật extension mbstring trong php.ini rồi khởi động lại Apache.";
}
if (!$result["mysqlDriver"]) {
    $result["message"] =
        "Bật extension pdo_mysql trong php.ini rồi khởi động lại Apache.";
}
if (!$result["phpSupported"]) {
    $result["message"] = "Cần PHP 8.1 trở lên (khuyến nghị PHP 8.3).";
}
echo json_encode(
    ["status" => "success", "data" => $result],
    JSON_UNESCAPED_UNICODE,
);
