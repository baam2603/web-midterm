<?php
require_once __DIR__ . '/../shared/reviews.php';
requireMethod('POST');guardCustomerWrite();$uid=requireUser();$v=input();
$id=filter_var($v['id']??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
if (!$id) reply(400,['status'=>'error','message'=>'ID đánh giá không hợp lệ.']);
$db=connectDB();
try {
    beginAccountWrite($db,$uid);deleteHotelReview($db,$id,$uid);$db->commit();
    reply(200,['status'=>'success','message'=>'Đã xóa đánh giá.']);
} catch (Throwable $error) { reviewFailure($db,$error); }
