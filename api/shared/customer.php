<?php
require_once __DIR__ . "/bootstrap.php";
function guardCustomerWrite(): void
{
    if (
        strtolower(trim(explode(";", $_SERVER["CONTENT_TYPE"] ?? "")[0])) !==
        "application/json"
    ) {
        reply(415, ["status" => "error", "message" => "Yêu cầu JSON."]);
    }
    $origin = $_SERVER["HTTP_ORIGIN"] ?? "";
    if ($origin !== "") {
        $scheme =
            !empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off"
                ? "https"
                : "http";
        $expected = $scheme . "://" . ($_SERVER["HTTP_HOST"] ?? "");
        if (strtolower(rtrim($origin, "/")) !== strtolower($expected)) {
            reply(403, [
                "status" => "error",
                "message" => "Nguồn yêu cầu không hợp lệ.",
            ]);
        }
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
 h.slug hotelId,h.name hotelName,h.city,h.address,r.code roomId,r.name roomName,DATEDIFF(b.checkout,b.checkin) nights
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
