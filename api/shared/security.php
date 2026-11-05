<?php
/** Shared HTTP controls. No authorization decisions are made in browser storage. */
function securityHeaders(): void
{
    ini_set("display_errors", "0");
    ini_set("log_errors", "1");
    header("X-Content-Type-Options: nosniff");
    header("X-Frame-Options: DENY");
    header("Referrer-Policy: strict-origin-when-cross-origin");
    header("Permissions-Policy: camera=(), microphone=(), geolocation=()");
    header("Cache-Control: no-store, private");
    header("Content-Type: application/json; charset=utf-8");
    if (
        !empty($_SERVER["HTTPS"]) &&
        strtolower((string) $_SERVER["HTTPS"]) !== "off"
    ) {
        header("Strict-Transport-Security: max-age=31536000");
    }
}
function securityReject(int $status, string $code, string $message): never
{
    http_response_code($status);
    echo json_encode(
        ["status" => "error", "code" => $code, "message" => $message],
        JSON_UNESCAPED_UNICODE,
    );
    exit();
}
function securityOrigin(string $url): ?string
{
    $parts = parse_url($url);
    if (
        !is_array($parts) ||
        !isset($parts["scheme"], $parts["host"]) ||
        isset($parts["user"]) ||
        isset($parts["pass"]) ||
        isset($parts["query"]) ||
        isset($parts["fragment"]) ||
        !in_array(strtolower($parts["scheme"]), ["http", "https"], true) ||
        !in_array($parts["path"] ?? "", ["", "/"], true)
    ) {
        return null;
    }
    $scheme = strtolower($parts["scheme"]);
    return $scheme .
        "://" .
        strtolower($parts["host"]) .
        ":" .
        ($parts["port"] ?? ($scheme === "https" ? 443 : 80));
}
function securityGuardSource(): void
{
    if (strtolower($_SERVER["HTTP_SEC_FETCH_SITE"] ?? "") === "cross-site") {
        securityReject(403, "invalid_origin", "Nguồn yêu cầu không hợp lệ.");
    }
    $origin = $_SERVER["HTTP_ORIGIN"] ?? "";
    if ($origin === "") {
        return;
    } // Non-browser clients still need the session-bound CSRF token.
    $https =
        !empty($_SERVER["HTTPS"]) &&
        strtolower((string) $_SERVER["HTTPS"]) !== "off";
    $expected = securityOrigin(
        ($https ? "https://" : "http://") . ($_SERVER["HTTP_HOST"] ?? ""),
    );
    if ($expected === null || securityOrigin($origin) !== $expected) {
        securityReject(403, "invalid_origin", "Nguồn yêu cầu không hợp lệ.");
    }
}
function securityCsrfToken(): string
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    if (empty($_SESSION["csrf_token"])) {
        $_SESSION["csrf_token"] = bin2hex(random_bytes(32));
    }
    return $_SESSION["csrf_token"];
}
function securityRequireCsrf(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    $sent = $_SERVER["HTTP_X_CSRF_TOKEN"] ?? "";
    $valid = false;
    foreach (["csrf_token", "admin_csrf"] as $key) {
        $expected = $_SESSION[$key] ?? "";
        if (
            is_string($sent) &&
            is_string($expected) &&
            $expected !== "" &&
            hash_equals($expected, $sent)
        ) {
            $valid = true;
        }
    }
    if (!$valid) {
        securityReject(
            403,
            "csrf_invalid",
            "Phiên bảo vệ không hợp lệ. Hãy tải lại trang rồi thử lại.",
        );
    }
}
function securityGuardJson(): void
{
    securityGuardSource();
    if (
        strtolower(trim(explode(";", $_SERVER["CONTENT_TYPE"] ?? "")[0])) !==
        "application/json"
    ) {
        securityReject(415, "json_required", "Yêu cầu application/json.");
    }
    if ((int) ($_SERVER["CONTENT_LENGTH"] ?? 0) > 65536) {
        securityReject(413, "body_too_large", "Nội dung yêu cầu quá lớn.");
    }
    securityRequireCsrf();
}
function securityJsonBody(): array
{
    $raw = file_get_contents("php://input", false, null, 0, 65537);
    if (strlen($raw) > 65536) {
        securityReject(413, "body_too_large", "Nội dung yêu cầu quá lớn.");
    }
    $value = json_decode($raw, true);
    if (
        json_last_error() !== JSON_ERROR_NONE ||
        !is_array($value) ||
        !str_starts_with(ltrim($raw), "{")
    ) {
        securityReject(400, "invalid_json", "Dữ liệu JSON không hợp lệ.");
    }
    return $value;
}
