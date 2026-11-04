<?php
require_once __DIR__ . "/../shared/customer.php";
require_once __DIR__ . "/../shared/inventory.php";
requireMethod("GET");
header("Cache-Control: no-store, public");
$city = trim((string) ($_GET["city"] ?? ""));
$from = (string) ($_GET["checkin"] ?? "");
$to = (string) ($_GET["checkout"] ?? "");
$units = filter_var($_GET["rooms"] ?? 1, FILTER_VALIDATE_INT);
$guests = filter_var($_GET["guests"] ?? 1, FILTER_VALIDATE_INT);
if (
    ($city !== "" && !in_array($city, ["dalat", "vungtau"], true)) ||
    !$units ||
    $units < 1 ||
    $units > 30 ||
    !$guests ||
    $guests < 1 ||
    $guests > 600 ||
    (($from !== "" || $to !== "") &&
        (!validStayDate($from) ||
            !validStayDate($to) ||
            $from < date("Y-m-d") ||
            $to <= $from ||
            (new DateTimeImmutable($from))->diff(new DateTimeImmutable($to))
                ->days > 30))
) {
    reply(422, [
        "status" => "error",
        "message" =>
            "Kiểm tra ngày lưu trú (tối đa 30 đêm), số khách và số phòng.",
    ]);
}
try {
    $db = connectDB();
    $q = $db->prepare(
        "SELECT h.*, (SELECT image_path FROM hotel_images WHERE hotel_id=h.id ORDER BY is_cover DESC,sort_order,id LIMIT 1) cover_image,rv.rating,COALESCE(rv.review_count,0) review_count FROM hotels h LEFT JOIN (SELECT hotel_id,ROUND(AVG(score),2) rating,COUNT(*) review_count FROM reviews WHERE status='approved' GROUP BY hotel_id) rv ON rv.hotel_id=h.id WHERE h.is_active=1" .
            ($city !== "" ? " AND h.city=?" : "") .
            " ORDER BY h.id",
    );
    $q->execute($city !== "" ? [$city] : []);
    $hotels = $q->fetchAll();
    $rooms = $db
        ->query(
            "SELECT r.* FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE r.is_active=1 AND r.total_rooms>0 AND h.is_active=1",
        )
        ->fetchAll();
    $byHotel = [];
    $occupancy = [];
    if ($from !== "") {
        $q = $db->prepare(
            "SELECT room_type_id,checkin,checkout,rooms FROM bookings WHERE status IN ('pending','confirmed','checked_in') AND (status<>'pending' OR payment_expires_at IS NULL OR payment_expires_at>NOW()) AND checkin<? AND checkout>?",
        );
        $q->execute([$to, $from]);
        foreach ($q->fetchAll() as $b) {
            $occupancy[$b["room_type_id"]][] = $b;
        }
    }
    foreach ($rooms as $r) {
        $available =
            (int) $r["total_rooms"] -
            ($from !== ""
                ? peakOccupied($occupancy[$r["id"]] ?? [], $from, $to)
                : 0);
        if ($available < $units || (int) $r["capacity"] * $units < $guests) {
            continue;
        }
        $byHotel[$r["hotel_id"]][] = $r;
    }
    $amenities = [];
    foreach (
        $db
            ->query(
                "SELECT ha.hotel_id,a.code FROM hotel_amenities ha JOIN amenities a ON a.id=ha.amenity_id",
            )
            ->fetchAll()
        as $a
    ) {
        $amenities[$a["hotel_id"]][] = $a["code"];
    }
    $items = [];
    foreach ($hotels as $h) {
        $matching = $byHotel[$h["id"]] ?? [];
        if (!$matching) {
            continue;
        }
        $h["min_room_price"] = (float) min(
            array_column($matching, "price_per_night"),
        );
        $h["max_capacity"] = (int) max(array_column($matching, "capacity"));
        $h["amenities"] = $amenities[$h["id"]] ?? [];
        $h["id"] = (int) $h["id"];
        $h["stars"] = (int) $h["stars"];
        $h["price_per_night"] = (float) $h["price_per_night"];
        $h["rating"] = $h["rating"] === null ? null : (float) $h["rating"];
        $h["review_count"] = (int) $h["review_count"];
        $items[] = $h;
    }
    reply(200, [
        "status" => "success",
        "total" => count($items),
        "data" => $items,
    ]);
} catch (Throwable $e) {
    failServer($e);
}
