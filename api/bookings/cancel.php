<?php
require_once __DIR__ . '/../shared/bootstrap.php';
requireMethod('POST');
$userId=requireUser();$v=input();$code=trim((string)($v['code']??''));
if(!$code)reply(400,['status'=>'error','message'=>'Thiếu mã đặt phòng.']);
try {
 $db=connectDB();
 $q=$db->prepare("UPDATE bookings SET status='cancelled' WHERE code=? AND user_id=? AND status IN ('pending','confirmed') AND checkin>CURDATE()");
 $q->execute([$code,$userId]);
 if(!$q->rowCount())reply(409,['status'=>'error','message'=>'Không thể hủy: đơn không hợp lệ, đã đến ngày nhận phòng hoặc không thuộc tài khoản.']);
 reply(200,['status'=>'success','message'=>'Đã hủy đơn trên MySQL.']);
} catch(Throwable $e){failServer($e);}
