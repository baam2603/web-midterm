<?php
require_once __DIR__.'/../shared/bootstrap.php';
requireMethod('POST');requireAdmin();$v=input();
$id=filter_var($v['id']??null,FILTER_VALIDATE_INT);$status=$v['status']??'';
if(!$id || !in_array($status,['approved','rejected'],true))reply(400,['status'=>'error','message'=>'Dữ liệu duyệt đánh giá không hợp lệ.']);
try{
 $q=connectDB()->prepare("UPDATE reviews SET status=?,moderated_at=NOW() WHERE id=? AND status='pending'");
 $q->execute([$status,$id]);
 if(!$q->rowCount())reply(404,['status'=>'error','message'=>'Không tìm thấy đánh giá đang chờ duyệt.']);
 reply(200,['status'=>'success','message'=>'Đã xử lý đánh giá.']);
}catch(Throwable $e){failServer($e);}
