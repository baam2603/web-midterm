<?php
require_once __DIR__ . "/../config/session.php";
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    securityReject(405, "method_not_allowed", "Method not allowed");
}
securityGuardSource();
echo json_encode([
    "status" => "success",
    "data" => ["csrfToken" => securityCsrfToken()],
]);
