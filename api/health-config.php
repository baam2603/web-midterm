<?php
require_once __DIR__ . "/shared/bootstrap.php";
require_once __DIR__ . "/shared/email.php";
require_once __DIR__ . "/payments/vnpay-service.php";
requireMethod("GET");
$online = false;
try {
    $c = vnpConfig();
    $online = filter_var(
        getenv("ONLINE_PAYMENTS_ENABLED") ?: "false",
        FILTER_VALIDATE_BOOLEAN,
    );
} catch (Throwable $e) {
}
reply(200, [
    "status" => "success",
    "data" => [
        "onlinePayments" => $online,
        "gatewayMode" =>
            isset($c) && str_contains($c["gateway"], "sandbox")
                ? "sandbox"
                : "production",
        "email" => mailConfigured(),
    ],
]);
