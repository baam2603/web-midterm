<?php
require_once __DIR__ . '/../shared/bootstrap.php';
requireMethod('GET');
$userId = requireUser();
try {
    $db = connectDB();
    $sql = "SELECT b.code,b.checkin,b.checkout,b.rooms,b.guests,b.total,b.status,b.created_at,
                   h.slug AS hotelId,h.name AS hotelName,h.city,h.address,
                   r.code AS roomId,r.name AS roomName,
                   DATEDIFF(b.checkout,b.checkin) AS nights
            FROM bookings b
            JOIN hotels h ON h.id=b.hotel_id
            JOIN room_types r ON r.id=b.room_type_id
            WHERE b.user_id=?";
    $code=trim((string)($_GET['code']??''));
    if (!$code) reply(400,['status'=>'error','message'=>'Thiếu mã đơn.']);
    $stmt=$db->prepare($sql.' AND b.code=? LIMIT 1');
    $stmt->execute([$userId,$code]);
    $item=$stmt->fetch();
    if (!$item) reply(404,['status'=>'error','message'=>'Không tìm thấy đơn thuộc tài khoản này.']);
    reply(200,['status'=>'success','data'=>$item]);
} catch(Throwable $e) { failServer($e); }
