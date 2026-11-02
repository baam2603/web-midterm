<?php
require_once __DIR__ . '/../shared/bootstrap.php';
requireMethod('POST');
requireUser();
$v=input();
$city=trim((string)($v['city']??''));
$slug=trim((string)($v['hotelId']??''));
$room=trim((string)($v['roomId']??''));
$in=(string)($v['checkin']??'');
$out=(string)($v['checkout']??'');
$coupon=strtoupper(trim((string)($v['coupon']??'')));
$count=filter_var($v['rooms']??null,FILTER_VALIDATE_INT);
$guests=filter_var($v['guests']??null,FILTER_VALIDATE_INT);
$validDate=static function($s){$d=DateTimeImmutable::createFromFormat('!Y-m-d',$s);return $d&&$d->format('Y-m-d')===$s;};
if(!in_array($city,['dalat','vungtau'],true)||!$slug||!$room||!$validDate($in)||!$validDate($out)||$in<date('Y-m-d')||$out<=$in||!$count||$count<1||!$guests||$guests<1)
 reply(400,['status'=>'error','message'=>'Thông tin báo giá không hợp lệ.']);
if(!in_array($coupon,['','THREEK10','WELCOME'],true)) reply(400,['status'=>'error','message'=>'Mã giảm giá không hợp lệ.']);
try {
 $db=connectDB();
 $q=$db->prepare('SELECT r.id,r.capacity,r.total_rooms,r.price_per_night FROM hotels h JOIN room_types r ON r.hotel_id=h.id WHERE h.slug=? AND h.city=? AND r.code=? LIMIT 1');
 $q->execute([$slug,$city,$room]);$r=$q->fetch();
 if(!$r) reply(404,['status'=>'error','message'=>'Không tìm thấy khách sạn hoặc loại phòng trong MySQL.']);
 if($guests>$count*(int)$r['capacity']) reply(400,['status'=>'error','message'=>'Vượt quá sức chứa phòng.']);
 $nights=(new DateTimeImmutable($in))->diff(new DateTimeImmutable($out))->days;
 if($nights<1||$nights>30) reply(400,['status'=>'error','message'=>'Chỉ hỗ trợ 1–30 đêm.']);
 $used=$db->prepare("SELECT COALESCE(SUM(rooms),0) FROM bookings WHERE room_type_id=? AND status IN ('pending','confirmed','checked_in') AND checkin < ? AND checkout > ?");
 $used->execute([$r['id'],$out,$in]);
 $available=(int)$r['total_rooms']-(int)$used->fetchColumn();
 if($available<$count) reply(409,['status'=>'error','message'=>'Không đủ phòng trống.']);
 $base=round((float)$r['price_per_night']*$nights*$count,2);
 $discount=$coupon==='THREEK10'?round($base*.10,2):($coupon==='WELCOME'?min(200000,$base):0);
 $tax=round(($base-$discount)*.10,2);
 reply(200,['status'=>'success','data'=>['pricePerNight'=>(float)$r['price_per_night'],'nights'=>$nights,'subtotal'=>$base,'discount'=>$discount,'tax'=>$tax,'total'=>round($base-$discount+$tax,2),'availableRooms'=>$available]]);
} catch(Throwable $e){failServer($e);}
