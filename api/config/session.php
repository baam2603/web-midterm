<?php
require_once __DIR__ . "/../shared/security.php";
// One policy for every PHP entry point, including installations under a subdirectory.
if (session_status() === PHP_SESSION_NONE) {
    $scriptPath = str_replace("\\", "/", $_SERVER["SCRIPT_NAME"] ?? "");
    $apiPosition = strrpos($scriptPath, "/api/");
    $cookiePath =
        $apiPosition === false ? "/" : substr($scriptPath, 0, $apiPosition + 1);
    $https =
        !empty($_SERVER["HTTPS"]) &&
        strtolower((string) $_SERVER["HTTPS"]) !== "off";

    session_name("THREEKSESSID");
    ini_set("session.use_strict_mode", "1");
    ini_set("session.use_cookies", "1");
    ini_set("session.use_only_cookies", "1");
    ini_set("session.use_trans_sid", "0");
    session_set_cookie_params([
        "lifetime" => 0,
        "path" => $cookiePath,
        "domain" => "",
        "secure" => $https,
        "httponly" => true,
        "samesite" => "Lax",
    ]);
}

function endUserSession(): void
{
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $cookie = session_get_cookie_params();
        setcookie(session_name(), "", [
            "expires" => time() - 42000,
            "path" => $cookie["path"],
            "domain" => $cookie["domain"],
            "secure" => $cookie["secure"],
            "httponly" => $cookie["httponly"],
            "samesite" => $cookie["samesite"],
        ]);
    }
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}
