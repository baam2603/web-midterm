<?php
require_once __DIR__ . '/../shared/reviews.php';
requireMethod('POST');guardCustomerWrite();$uid=requireUser();$v=input();
$score=filter_var($v['score']??null,FILTER_VALIDATE_INT);
$comment=$v['comment']??'';
if (!is_string($comment) || $score===false || $score<1 || $score>5 || mb_strlen(trim($comment))<1 || mb_strlen(trim($comment))>1500) {
    reply(400,['status'=>'error','message'=>'Chọn 1–5 sao và viết bình luận từ 1 đến 1500 ký tự.']);
}
$db=connectDB();
try {
    beginAccountWrite($db,$uid);
    $hotel=reviewHotel($db,$v);
    $db->prepare("INSERT INTO reviews(user_id,hotel_id,score,comment,status) VALUES(?,?,?,?,'approved')")->execute([$uid,$hotel['id'],$score,trim($comment)]);
    $id=(int)$db->lastInsertId();$db->commit();
    reply(201,['status'=>'success','message'=>'Đánh giá đã được đăng.','data'=>['id'=>$id]]);
} catch (Throwable $error) { reviewFailure($db,$error); }
