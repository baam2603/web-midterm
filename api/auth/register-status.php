<?php
require_once __DIR__ . '/../shared/registration.php';
requireMethod('GET');$db=connectDB();
$id=$_SESSION['registration_id']??'';
if (!$id) reply(200,['status'=>'success','data'=>['challenge'=>null]]);
try {
    $q=$db->prepare('SELECT * FROM registration_challenges WHERE challenge_id=? AND consumed_at IS NULL AND password_hash IS NOT NULL AND last_sent_at>DATE_SUB(NOW(),INTERVAL 15 MINUTE)');
    $q->execute([$id]);$row=$q->fetch();
    reply(200,['status'=>'success','data'=>['challenge'=>$row?registrationPublic($row):null]]);
} catch (Throwable $error) { registrationFailure($db,$error); }
