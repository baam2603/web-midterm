<?php
require_once __DIR__ . "/bootstrap.php";

function guardCustomerWrite(): void
{
    $contentType = strtolower(trim(
        explode(";", $_SERVER["CONTENT_TYPE"] ?? "")[0]
    ));

    if ($contentType !== "application/json") {
        reply(415, [
            "status" => "error",
            "message" => "Yêu cầu JSON."
        ]);
    }

    $origin = $_SERVER["HTTP_ORIGIN"] ?? "";

    if ($origin === "") {
        return;
    }

    $scheme = (
        !empty($_SERVER["HTTPS"]) &&
        $_SERVER["HTTPS"] !== "off"
    ) ? "https" : "http";

    $requestHost = $_SERVER["HTTP_HOST"] ?? "";

    $allowedOrigins = [
        strtolower($scheme . "://" . $requestHost)
    ];

    $publicUrl = rtrim(getenv("APP_BASE_URL") ?: "", "/");

    if ($publicUrl !== "") {
        $publicScheme = parse_url($publicUrl, PHP_URL_SCHEME);
        $publicHost = parse_url($publicUrl, PHP_URL_HOST);

        if (
            $publicScheme === "https" &&
            $publicHost &&
            strcasecmp($requestHost, $publicHost) === 0
        ) {
            $allowedOrigins[] = strtolower($publicUrl);
        }
    }

    $normalizedOrigin = strtolower(rtrim($origin, "/"));

    if (!in_array($normalizedOrigin, $allowedOrigins, true)) {
        reply(403, [
            "status" => "error",
            "message" => "Nguồn yêu cầu không hợp lệ."
        ]);
    }
}

function notifyUser(
    PDO $db,
    int $uid,
    string $title,
    string $message,
    ?string $code = null,
): void {
    $db->prepare(
        "INSERT INTO notifications(user_id,title,message,booking_code) VALUES(?,?,?,?)",
    )->execute([$uid, $title, $message, $code]);
}
function bookingSelect(): string
{
    return "SELECT b.id,b.code,b.checkin,b.checkout,b.rooms,b.guests,b.total,b.status,b.created_at AS createdAt,b.completed_at,
 COALESCE(b.guest_name,u.full_name) guestName,COALESCE(b.guest_email,u.email) email,COALESCE(b.guest_phone,u.phone) phone,b.guest_note AS note,
 b.pay_method AS payMethod,b.payment_status AS paymentStatus,COALESCE(b.refundable,r.free_cancellation) refundable,
 b.subtotal,b.discount,b.tax,b.payment_expires_at,
 h.slug hotelId,h.name hotelName,h.city,h.address,r.code roomId,r.name roomName,
 (SELECT image_path FROM room_images WHERE room_type_id=r.id ORDER BY is_cover DESC,sort_order,id LIMIT 1) roomImage,
 (SELECT image_path FROM hotel_images WHERE hotel_id=h.id ORDER BY is_cover DESC,sort_order,id LIMIT 1) hotelImage,
 DATEDIFF(b.checkout,b.checkin) nights
 FROM bookings b JOIN hotels h ON h.id=b.hotel_id JOIN room_types r ON r.id=b.room_type_id JOIN users u ON u.id=b.user_id";
}
function bookingPayload(array $b): array
{
    foreach (["id", "rooms", "guests", "nights"] as $k) {
        $b[$k] = (int) $b[$k];
    }
    foreach (["total", "subtotal", "discount", "tax"] as $k) {
        if ($b[$k] !== null) {
            $b[$k] = (float) $b[$k];
        }
    }
    $b["refundable"] = (bool) $b["refundable"];
    $b["canCancel"] =
        in_array($b["status"], ["pending", "confirmed"], true) &&
        $b["checkin"] > date("Y-m-d") &&
        ($b["paymentStatus"] !== "paid" || $b["refundable"]);
    return $b;
}

function expireCustomerBookings(PDO $db, int $uid): void
{
    $q = $db->prepare(
        "UPDATE bookings SET status='cancelled',payment_status='expired' WHERE user_id=? AND status='pending' AND pay_method='online' AND payment_expires_at IS NOT NULL AND payment_expires_at<=NOW() AND payment_status<>'paid'",
    );
    $q->execute([$uid]);
}

/** Serialize personal-data writes with account closure, including requests authenticated earlier. */
function beginAccountWrite(PDO $db, int $uid): void
{
    $db->beginTransaction();
    $q = $db->prepare(
        "SELECT session_version FROM users WHERE id=? AND deleted_at IS NULL FOR UPDATE",
    );
    $q->execute([$uid]);
    $version = $q->fetchColumn();
    if (
        $version === false ||
        (int) $version !== (int) ($_SESSION["version"] ?? 1)
    ) {
        $db->rollBack();
        endUserSession();
        reply(401, [
            "status" => "error",
            "message" => "Phiên đăng nhập không còn hợp lệ.",
        ]);
    }
}
