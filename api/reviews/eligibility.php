<?php
require_once __DIR__.'/../shared/bootstrap.php';
requireMethod('GET');$uid=requireUser();
$code=trim((string)($_GET['code']??''));
if(!$code)reply(400,['status'=>'error','message'=>'Thiếu mã đơn.']);
try{
 $q=connectDB()->prepare("SELECT b.code,b.status,b.checkout,rv.id AS review_id FROM bookings b LEFT JOIN reviews rv ON rv.booking_id=b.id WHERE b.code=? AND b.user_id=? LIMIT 1");
 $q->execute([$code,$uid]);$b=$q->fetch();
 if(!$b)reply(404,['status'=>'error','message'=>'Không tìm thấy đơn của bạn trong MySQL.']);
 $eligible=$b['status']==='completed' && $b['checkout']<=date('Y-m-d') && !$b['review_id'];
 reply(200,['status'=>'success','data'=>['eligible'=>$eligible,'status'=>$b['status'],'alreadyReviewed'=>(bool)$b['review_id']]]);
}catch(Throwable $e){failServer($e);}
