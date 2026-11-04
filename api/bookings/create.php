<?php
require_once __DIR__ . "/../shared/customer.php";
require_once __DIR__ . "/../shared/inventory.php";
requireMethod("POST");
$uid = requireUser();
guardCustomerWrite();
$v = input();
$city = trim((string) ($v["city"] ?? ""));
$slug = trim((string) ($v["hotelId"] ?? ""));
$room = trim((string) ($v["roomId"] ?? ""));
$from = (string) ($v["checkin"] ?? "");
$to = (string) ($v["checkout"] ?? "");
$coupon = strtoupper(trim((string) ($v["coupon"] ?? "")));
$units = filter_var($v["rooms"] ?? null, FILTER_VALIDATE_INT);
$guests = filter_var($v["guests"] ?? null, FILTER_VALIDATE_INT);
$method = (string) ($v["payMethod"] ?? "hotel");
$key = $v["requestKey"] ?? null;
$guestName = trim(
    (string) ($v["guestName"] ??
        ($_SESSION["user"]["name"] ?? ($_SESSION["user"]["fullName"] ?? ""))),
);
$email = trim((string) ($v["email"] ?? ($_SESSION["user"]["email"] ?? "")));
$phone = trim((string) ($v["phone"] ?? ($_SESSION["user"]["phone"] ?? "")));
$note = trim((string) ($v["note"] ?? ""));
if (
    !in_array($city, ["dalat", "vungtau"], true) ||
    !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) ||
    strlen($slug) > 80 ||
    !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $room) ||
    strlen($room) > 50 ||
    !validStayDate($from) ||
    !validStayDate($to) ||
    $from < date("Y-m-d") ||
    $to <= $from ||
    !$units ||
    $units < 1 ||
    $units > 999 ||
    !$guests ||
    $guests < 1 ||
    $guests > 19980 ||
    !in_array($coupon, ["", "THREEK10", "WELCOME"], true) ||
    !in_array($method, ["hotel", "online"], true) ||
    mb_strlen($guestName) < 2 ||
    mb_strlen($guestName) > 120 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    strlen($email) > 150 ||
    ($phone !== "" && !preg_match('/^[0-9+\-\s]{8,25}$/D', $phone)) ||
    mb_strlen($note) > 2000 ||
    ($key !== null &&
        (!is_string($key) || !preg_match('/^[a-zA-Z0-9_-]{16,80}$/D', $key)))
) {
    reply(422, [
        "status" => "error",
        "message" =>
            "Kiểm tra thông tin khách, ngày ở, số phòng và phương thức thanh toán.",
    ]);
}
$nights = (new DateTimeImmutable($from))->diff(new DateTimeImmutable($to))
    ->days;
if ($nights < 1 || $nights > 30) {
    reply(422, [
        "status" => "error",
        "message" => "Chỉ hỗ trợ lưu trú từ 1 đến 30 đêm.",
    ]);
}
// Online payments must be explicitly enabled after merchant credentials/webhooks are configured.
if (
    $method === "online" &&
    !filter_var(
        getenv("ONLINE_PAYMENTS_ENABLED") ?: "false",
        FILTER_VALIDATE_BOOLEAN,
    )
) {
    reply(503, [
        "status" => "error",
        "message" =>
            "Thanh toán trực tuyến chưa được kích hoạt. Bạn có thể chọn thanh toán tại khách sạn.",
    ]);
}
if ($method === "online") {
    require_once __DIR__ . "/../payments/vnpay-service.php";
    try {
        vnpConfig();
    } catch (Throwable $e) {
        reply(503, [
            "status" => "error",
            "message" =>
                "VNPay chưa được cấu hình. Vui lòng chọn thanh toán tại khách sạn.",
        ]);
    }
}
$hash = hash(
    "sha256",
    json_encode([
        $city,
        $slug,
        $room,
        $from,
        $to,
        $units,
        $guests,
        $coupon,
        $method,
        $guestName,
        $email,
        $phone,
        $note,
    ]),
);
try {
    $db = connectDB();
    $db->beginTransaction();
    $q = $db->prepare("SELECT id FROM users WHERE id=? FOR UPDATE");
    $q->execute([$uid]);
    if (!$q->fetchColumn()) {
        $db->rollBack();
        reply(401, [
            "status" => "error",
            "message" => "Tài khoản không còn hợp lệ.",
        ]);
    }
    if ($key) {
        $q = $db->prepare(
            "SELECT code,total,subtotal,discount,tax,status,request_hash FROM bookings WHERE user_id=? AND request_key=?",
        );
        $q->execute([$uid, $key]);
        $old = $q->fetch();
        if ($old) {
            $db->rollBack();
            if (!hash_equals($old["request_hash"], $hash)) {
                reply(409, [
                    "status" => "error",
                    "message" =>
                        "Phiên đặt phòng đã dùng cho thông tin khác. Vui lòng tạo phiên mới.",
                ]);
            }
            unset($old["request_hash"]);
            reply(200, ["status" => "success", "data" => $old]);
        }
    }
    $q = $db->prepare(
        "SELECT r.id,r.capacity,r.total_rooms,r.price_per_night,r.free_cancellation,r.is_active,h.id hotel_id,h.is_active hotel_active FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug=? AND h.city=? AND r.code=? FOR UPDATE",
    );
    $q->execute([$slug, $city, $room]);
    $r = $q->fetch();
    if (!$r || !$r["is_active"] || !$r["hotel_active"]) {
        $db->rollBack();
        reply(404, [
            "status" => "error",
            "message" => "Khách sạn hoặc loại phòng đã ngừng bán.",
        ]);
    }
    if ($guests > $units * (int) $r["capacity"]) {
        $db->rollBack();
        reply(422, [
            "status" => "error",
            "message" => "Số khách vượt sức chứa.",
        ]);
    }
    if (
        availableRooms(
            $db,
            (int) $r["id"],
            (int) $r["total_rooms"],
            $from,
            $to,
        ) < $units
    ) {
        $db->rollBack();
        reply(409, [
            "status" => "error",
            "message" =>
                "Không đủ phòng trống. Vui lòng chọn ngày hoặc loại phòng khác.",
        ]);
    }
    $base = round((float) $r["price_per_night"] * $nights * $units, 2);
    $discount =
        $coupon === "THREEK10"
            ? round($base * 0.1, 2)
            : ($coupon === "WELCOME"
                ? min(200000, $base)
                : 0);
    $tax = round(($base - $discount) * 0.1, 2);
    $total = round($base - $discount + $tax, 2);
    if (
        isset($v["expectedTotal"]) &&
        (!is_numeric($v["expectedTotal"]) ||
            abs((float) $v["expectedTotal"] - $total) > 0.01)
    ) {
        $db->rollBack();
        reply(409, [
            "status" => "error",
            "message" =>
                "Giá phòng vừa thay đổi. Hãy kiểm tra báo giá mới trước khi xác nhận.",
            "data" => ["priceChanged" => true],
        ]);
    }
    $code = "TK" . strtoupper(bin2hex(random_bytes(7)));
    $status = $method === "hotel" ? "confirmed" : "pending";
    $q = $db->prepare(
        "INSERT INTO bookings(code,user_id,hotel_id,room_type_id,checkin,checkout,rooms,guests,total,status,guest_name,guest_email,guest_phone,guest_note,pay_method,refundable,subtotal,discount,tax,request_key,request_hash,payment_expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    );
    $q->execute([
        $code,
        $uid,
        $r["hotel_id"],
        $r["id"],
        $from,
        $to,
        $units,
        $guests,
        $total,
        $status,
        $guestName,
        $email,
        $phone,
        $note,
        $method,
        $r["free_cancellation"],
        $base,
        $discount,
        $tax,
        $key,
        $hash,
        $method === "online" ? date("Y-m-d H:i:s", time() + 900) : null,
    ]);
    notifyUser(
        $db,
        $uid,
        "Đã ghi nhận đặt phòng",
        "Đơn " .
            $code .
            " đã được lưu. " .
            ($method === "hotel"
                ? "Bạn thanh toán tại khách sạn."
                : "Vui lòng hoàn tất thanh toán trong 15 phút."),
        $code,
    );
    $db->prepare(
        "INSERT INTO mail_outbox(recipient,subject,html_body) VALUES(?,?,?)",
    )->execute([
        $email,
        "Thông tin đặt phòng " . $code,
        "<p>Đơn " .
        htmlspecialchars($code) .
        " đã được ghi nhận.</p><p>Ngày ở: " .
        htmlspecialchars($from) .
        " – " .
        htmlspecialchars($to) .
        "</p><p>Tổng tiền: " .
        number_format($total, 0, ",", ".") .
        " VND. " .
        ($method === "hotel"
            ? "Thanh toán tại khách sạn."
            : "Đang chờ thanh toán trực tuyến.") .
        "</p>",
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
            "status" => $status,
        ],
    ]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    failServer($e);
}
