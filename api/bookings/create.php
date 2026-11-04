<?php
require_once __DIR__ . "/../shared/bootstrap.php";
require_once __DIR__ . "/../shared/inventory.php";
requireMethod("POST");
$userId = requireUser();
$v = input();
$city = trim((string) ($v["city"] ?? ""));
$slug = trim((string) ($v["hotelId"] ?? ""));
$room = trim((string) ($v["roomId"] ?? ""));
$checkin = (string) ($v["checkin"] ?? "");
$checkout = (string) ($v["checkout"] ?? "");
$coupon = strtoupper(trim((string) ($v["coupon"] ?? "")));
$rooms = filter_var($v["rooms"] ?? null, FILTER_VALIDATE_INT);
$guests = filter_var($v["guests"] ?? null, FILTER_VALIDATE_INT);
$validDate = static function ($s) {
    $d = DateTimeImmutable::createFromFormat("!Y-m-d", $s);
    return $d && $d->format("Y-m-d") === $s;
};
if (
    !in_array($city, ["dalat", "vungtau"], true) ||
    !$slug ||
    !$room ||
    !$validDate($checkin) ||
    !$validDate($checkout) ||
    $checkin < date("Y-m-d") ||
    $checkout <= $checkin ||
    !$rooms ||
    $rooms < 1 ||
    !$guests ||
    $guests < 1
) {
    reply(400, [
        "status" => "error",
        "message" => "Thông tin đặt phòng không hợp lệ.",
    ]);
}
try {
    $db = connectDB();
    $q = $db->prepare(
        "SELECT h.id AS hotel_id, r.id AS room_type_id, r.capacity, r.total_rooms, r.price_per_night FROM hotels h JOIN room_types r ON r.hotel_id=h.id WHERE h.slug=? AND h.city=? AND h.is_active=1 AND r.code=? AND r.is_active=1 LIMIT 1",
    );
    $q->execute([$slug, $city, $room]);
    $r = $q->fetch();
    if (!$r) {
        reply(404, [
            "status" => "error",
            "message" =>
                "Không tìm thấy khách sạn hoặc loại phòng trong MySQL. Kiểm tra slug/code.",
        ]);
    }
    if ($guests > $rooms * (int) $r["capacity"]) {
        reply(400, [
            "status" => "error",
            "message" => "Số khách vượt quá sức chứa.",
        ]);
    }
    $nights = (new DateTimeImmutable($checkin))->diff(
        new DateTimeImmutable($checkout),
    )->days;
    if ($nights < 1 || $nights > 30) {
        reply(400, [
            "status" => "error",
            "message" => "Chỉ hỗ trợ lưu trú từ 1 đến 30 đêm.",
        ]);
    }
    $db->beginTransaction();
    // Lock the room row while checking overlapping bookings.
    $lock = $db->prepare(
        "SELECT total_rooms,capacity,price_per_night,is_active FROM room_types WHERE id=? FOR UPDATE",
    );
    $lock->execute([$r["room_type_id"]]);
    $locked = $lock->fetch();
    if (!$locked || !(int) $locked["is_active"]) {
        $db->rollBack();
        reply(409, ["status" => "error", "message" => "Phòng đã ngừng bán."]);
    }
    if ($guests > $rooms * (int) $locked["capacity"]) {
        $db->rollBack();
        reply(409, [
            "status" => "error",
            "message" => "Sức chứa phòng đã thay đổi.",
        ]);
    }
    $r["price_per_night"] = $locked["price_per_night"];
    $capacity = (int) $locked["total_rooms"];
    if (
        availableRooms(
            $db,
            (int) $r["room_type_id"],
            $capacity,
            $checkin,
            $checkout,
        ) < $rooms
    ) {
        $db->rollBack();
        reply(409, ["status" => "error", "message" => "Không đủ phòng trống."]);
    }
    // Tinh gia chi tren server; khong tin gia/tong tien do client gui.
    $base = round((float) $r["price_per_night"] * $nights * $rooms, 2);
    if (!in_array($coupon, ["", "THREEK10", "WELCOME"], true)) {
        reply(400, [
            "status" => "error",
            "message" => "Mã giảm giá không hợp lệ.",
        ]);
    }
    $discount = match ($coupon) {
        "THREEK10" => round($base * 0.1, 2),
        "WELCOME" => min(200000, $base),
        default => 0.0,
    };
    $tax = round(($base - $discount) * 0.1, 2);
    $total = round($base - $discount + $tax, 2);
    $code = "TK" . strtoupper(bin2hex(random_bytes(7)));
    $ins = $db->prepare(
        "INSERT INTO bookings(code,user_id,hotel_id,room_type_id,checkin,checkout,rooms,guests,total,status) VALUES(?,?,?,?,?,?,?,?,?,'confirmed')",
    );
    $ins->execute([
        $code,
        $userId,
        $r["hotel_id"],
        $r["room_type_id"],
        $checkin,
        $checkout,
        $rooms,
        $guests,
        $total,
    ]);
    $db->commit();
    reply(201, [
        "status" => "success",
        "data" => [
            "code" => $code,
            "total" => $total,
            "subtotal" => $base,
            "discount" => $discount,
            "tax" => $tax,
            "status" => "confirmed",
        ],
    ]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    failServer($e);
}
