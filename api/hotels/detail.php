<?php

declare(strict_types=1);
require_once __DIR__ . "/../shared/bootstrap.php";
require_once __DIR__ . "/../shared/inventory.php";
requireMethod("GET");
header("Cache-Control: no-store, public");
$slug = trim((string) ($_GET["slug"] ?? ""));
if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) || strlen($slug) > 80) {
    reply(400, [
        "status" => "error",
        "message" => "Slug khách sạn không hợp lệ.",
    ]);
}
$tz = new DateTimeZone("Asia/Ho_Chi_Minh");
$tomorrow = (new DateTimeImmutable("tomorrow", $tz))->format("Y-m-d");
$checkin = (string) ($_GET["checkin"] ?? $tomorrow);
$checkout =
    (string) ($_GET["checkout"] ??
        (new DateTimeImmutable($tomorrow, $tz))
            ->modify("+1 day")
            ->format("Y-m-d"));
$validDate = static function (string $s): bool {
    $d = DateTimeImmutable::createFromFormat("!Y-m-d", $s);
    return $d !== false && $d->format("Y-m-d") === $s;
};
if (
    !$validDate($checkin) ||
    !$validDate($checkout) ||
    $checkout <= $checkin ||
    $checkin < (new DateTimeImmutable("today", $tz))->format("Y-m-d")
) {
    reply(400, [
        "status" => "error",
        "message" => "Ngày nhận/trả phòng không hợp lệ.",
    ]);
}
if (
    (new DateTimeImmutable($checkin))->diff(new DateTimeImmutable($checkout))
        ->days > 30
) {
    reply(400, ["status" => "error", "message" => "Chỉ hỗ trợ tối đa 30 đêm."]);
}
try {
    $pdo = connectDB();
    $q = $pdo->prepare(
        "SELECT * FROM hotels WHERE slug=? AND is_active=1 LIMIT 1",
    );
    $q->execute([$slug]);
    $hotel = $q->fetch(PDO::FETCH_ASSOC);
    if (!$hotel) {
        reply(404, [
            "status" => "error",
            "message" => "Khách sạn không tồn tại hoặc đang ẩn.",
        ]);
    }
    $hotelId = (int) $hotel["id"];
    $reviewStats = $pdo->prepare(
        "SELECT ROUND(AVG(score),2) rating,COUNT(*) review_count FROM reviews WHERE hotel_id=? AND status='approved'",
    );
    $reviewStats->execute([$hotelId]);
    $hotel = array_merge($hotel, $reviewStats->fetch());

    $q = $pdo->prepare('SELECT image_path,sort_order,is_cover FROM hotel_images
                        WHERE hotel_id=? ORDER BY is_cover DESC,sort_order,id');
    $q->execute([$hotelId]);
    $hotel["images"] = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $pdo->prepare('SELECT a.code,a.label,a.icon FROM hotel_amenities ha JOIN amenities a ON a.id=ha.amenity_id
                        WHERE ha.hotel_id=? ORDER BY a.label');
    $q->execute([$hotelId]);
    $hotel["amenities"] = $q->fetchAll(PDO::FETCH_ASSOC);

    $q = $pdo->prepare('SELECT id,hotel_id,code,name,capacity,total_rooms,price_per_night,description,
                         area_m2,bed_type,breakfast_included,free_cancellation,features_json
                         FROM room_types WHERE hotel_id=? AND is_active=1 ORDER BY price_per_night, id');
    $q->execute([$hotelId]);
    $rooms = $q->fetchAll(PDO::FETCH_ASSOC);
    $q = $pdo->prepare('SELECT ri.room_type_id,ri.image_path FROM room_images ri
                         JOIN room_types r ON r.id=ri.room_type_id
                        WHERE r.hotel_id=? ORDER BY ri.is_cover DESC,ri.sort_order,ri.id');
    $q->execute([$hotelId]);
    $roomImages = [];
    foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $img) {
        $roomImages[(int) $img["room_type_id"]][] = $img["image_path"];
    }

    $used = $pdo->prepare(
        "SELECT b.room_type_id,b.checkin,b.checkout,b.rooms FROM bookings b JOIN room_types r ON r.id=b.room_type_id WHERE r.hotel_id=? AND b.status IN ('pending','confirmed','checked_in') AND (b.status<>'pending' OR b.payment_expires_at IS NULL OR b.payment_expires_at>NOW()) AND b.checkin < ? AND b.checkout > ?",
    );
    $used->execute([$hotelId, $checkout, $checkin]);
    $occupancy = [];
    foreach ($used->fetchAll() as $b) {
        $occupancy[$b["room_type_id"]][] = $b;
    }
    foreach ($rooms as &$r) {
        $rid = (int) $r["id"];
        $r["available_rooms"] = max(
            0,
            (int) $r["total_rooms"] -
                peakOccupied($occupancy[$rid] ?? [], $checkin, $checkout),
        );
        $r["id"] = $rid;
        $r["capacity"] = (int) $r["capacity"];
        $r["total_rooms"] = (int) $r["total_rooms"];
        $r["price_per_night"] = (float) $r["price_per_night"];
        $r["area_m2"] = $r["area_m2"] === null ? null : (int) $r["area_m2"];
        $r["breakfast_included"] = (bool) $r["breakfast_included"];
        $r["free_cancellation"] = (bool) $r["free_cancellation"];
        $r["features"] = json_decode($r["features_json"] ?? "[]", true) ?: [];
        unset($r["features_json"]);
        $r["images"] = $roomImages[$rid] ?? [];
    }
    unset($r);
    $hotel["id"] = $hotelId;
    $hotel["stars"] = (int) $hotel["stars"];
    $hotel["rules"] = json_decode($hotel["rules_json"] ?? "[]", true) ?: [];
    unset($hotel["rules_json"]);
    reply(200, [
        "status" => "success",
        "data" => [
            "hotel" => $hotel,
            "rooms" => $rooms,
            "checkin" => $checkin,
            "checkout" => $checkout,
        ],
    ]);
} catch (Throwable $e) {
    failServer($e);
}
