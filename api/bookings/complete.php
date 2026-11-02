<?php
require_once __DIR__.'/../_shared/bootstrap.php';
requireMethod('POST');requireAdmin();$v=input();$code=trim((string)($v['code']??''));
if(!$code)reply(400,['status'=>'error','message'=>'Thiếu mã đơn.']);
try{
 $q=connectDB()->prepare("UPDATE bookings SET status='completed',completed_at=NOW() WHERE code=? AND status IN ('confirmed','checked_in') AND checkout<=CURDATE()");
 $q->execute([$code]);
 if(!$q->rowCount())reply(409,['status'=>'error','message'=>'Đơn chưa đến ngày checkout hoặc không ở trạng thái hợp lệ.']);
 reply(200,['status'=>'success','message'=>'Đã xác nhận hoàn tất lưu trú.']);
}catch(Throwable $e){failServer($e);}
