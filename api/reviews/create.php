<?php
require_once __DIR__.'/../shared/bootstrap.php';
requireMethod('POST');$uid=requireUser();$v=input();
$code=trim((string)($v['code']??''));$score=filter_var($v['score']??null,FILTER_VALIDATE_INT);$comment=trim((string)($v['comment']??''));
if(!$code || $score===false || $score<1 || $score>5 || mb_strlen($comment)<15 || mb_strlen($comment)>1500)
 reply(400,['status'=>'error','message'=>'Chọn 1–5 sao và viết nhận xét từ 15 đến 1500 ký tự.']);
try{
 $db=connectDB();
 $q=$db->prepare('SELECT id,hotel_id,status,checkout FROM bookings WHERE code=? AND user_id=? LIMIT 1');$q->execute([$code,$uid]);$b=$q->fetch();
 if(!$b)reply(404,['status'=>'error','message'=>'Không tìm thấy đơn đặt phòng hợp lệ của bạn.']);
 if($b['status']!=='completed' || $b['checkout']>date('Y-m-d'))reply(403,['status'=>'error','message'=>'Chỉ được đánh giá sau khi hoàn tất lưu trú.']);
 $q=$db->prepare('INSERT INTO reviews(booking_id,user_id,hotel_id,score,comment) VALUES(?,?,?,?,?)');
 try{$q->execute([$b['id'],$uid,$b['hotel_id'],$score,$comment]);}
 catch(PDOException $e){if($e->getCode()==='23000')reply(409,['status'=>'error','message'=>'Đơn này đã gửi đánh giá.']);throw $e;}
 reply(201,['status'=>'success','message'=>'Đã gửi đánh giá, đang chờ duyệt.','data'=>['id'=>$db->lastInsertId()]]);
}catch(Throwable $e){failServer($e);}
