<?php
function vnpConfig(): array
{
    $merchant = getenv("VNPAY_TMN_CODE") ?: "";
    $secret = getenv("VNPAY_HASH_SECRET") ?: "";
    $base = rtrim(getenv("APP_BASE_URL") ?: "", "/");
    $gateway =
        getenv("VNPAY_GATEWAY_URL") ?:
        "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    if (
        !$merchant ||
        !$secret ||
        !preg_match('~^https://[^\s]+$~D', $base) ||
        !in_array(
            $gateway,
            [
                "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
                "https://pay.vnpay.vn/vpcpay.html",
            ],
            true,
        )
    ) {
        throw new RuntimeException("VNPay chưa được cấu hình đầy đủ.");
    }
    return [
        "merchant" => $merchant,
        "secret" => $secret,
        "base" => $base,
        "gateway" => $gateway,
    ];
}
function vnpSign(array $params, string $secret): string
{
    unset($params["vnp_SecureHash"], $params["vnp_SecureHashType"]);
    ksort($params, SORT_STRING);
    return hash_hmac(
        "sha512",
        http_build_query($params, "", "&", PHP_QUERY_RFC1738),
        $secret,
    );
}
function vnpVerified(array $params, array $config): bool
{
    $hash = $params["vnp_SecureHash"] ?? "";
    foreach ($params as $key => $value) {
        if (
            !is_string($key) ||
            !str_starts_with($key, "vnp_") ||
            !is_string($value)
        ) {
            return false;
        }
    }
    return is_string($hash) &&
        preg_match('/^[a-f0-9]{128}$/iD', $hash) &&
        ($params["vnp_TmnCode"] ?? "") === $config["merchant"] &&
        hash_equals(vnpSign($params, $config["secret"]), strtolower($hash));
}
function vnpPaymentUrl(array $booking, array $config, string $ip): string
{
    $expires = strtotime($booking["payment_expires_at"]);
    if (!$expires || $expires <= time()) {
        throw new RuntimeException("Phiên thanh toán đã hết hạn.");
    }
    $params = [
        "vnp_Version" => "2.1.0",
        "vnp_Command" => "pay",
        "vnp_TmnCode" => $config["merchant"],
        "vnp_Amount" => (string) (int) round((float) $booking["total"] * 100),
        "vnp_CurrCode" => "VND",
        "vnp_TxnRef" => $booking["code"],
        "vnp_OrderInfo" => "Thanh toan don " . $booking["code"],
        "vnp_OrderType" => "other",
        "vnp_Locale" => "vn",
        "vnp_ReturnUrl" => $config["base"] . "/api/payments/return.php",
        "vnp_IpAddr" => filter_var($ip, FILTER_VALIDATE_IP) ? $ip : "127.0.0.1",
        "vnp_CreateDate" => date("YmdHis"),
        "vnp_ExpireDate" => date("YmdHis", $expires),
    ];
    $params["vnp_SecureHash"] = vnpSign($params, $config["secret"]);
    return $config["gateway"] .
        "?" .
        http_build_query($params, "", "&", PHP_QUERY_RFC1738);
}
