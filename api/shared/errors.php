<?php
/** Consistent JSON errors, including failures before an endpoint's business handler. */
function apiFailure(Throwable $error): array
{
    $root = $error;
    while ($root->getPrevious()) {
        $root = $root->getPrevious();
    }
    $driverCode =
        $root instanceof PDOException ? (int) ($root->errorInfo[1] ?? 0) : 0;
    if (in_array($driverCode, [1054, 1146], true)) {
        return [
            503,
            "database_upgrade_required",
            "Cơ sở dữ liệu chưa được cập nhật. Hãy import database/admin_migration.sql rồi database/customer_migration.sql và database/registration_otp_migration.sql và database/account_closure_migration.sql và database/osm_location_migration.sql vào database đang dùng. Không xóa dữ liệu hiện có.",
        ];
    }
    if (
        $root instanceof PDOException ||
        $error->getMessage() === "Database connection failed"
    ) {
        return [
            503,
            "database_unavailable",
            "Không kết nối được MySQL. Kiểm tra MySQL đã chạy và cấu hình DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD trên máy chủ.",
        ];
    }
    return [500, "server_error", "Hệ thống đang gặp lỗi. Vui lòng thử lại."];
}
function outputApiFailure(Throwable $error): void
{
    error_log("[THREEK API] " . $error->getMessage());
    [$status, $code, $message] = apiFailure($error);
    http_response_code($status);
    header("Content-Type: application/json; charset=utf-8");
    header("Cache-Control: no-store");
    echo json_encode(
        ["status" => "error", "code" => $code, "message" => $message],
        JSON_UNESCAPED_UNICODE,
    );
}
