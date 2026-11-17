<?php
require_once __DIR__ . '/../shared/registration.php';
requireMethod('POST');guardCustomerWrite();$v=input();$db=connectDB();
try {
    $db->beginTransaction();$row=registrationPending($db,(string)($v['challengeId']??''));
    if ((int)$row['failed_attempts']>=5) registrationError($db,429,'otp_locked','Đã nhập sai quá nhiều lần. Vui lòng đăng ký lại sau 15 phút.');
    if (strtotime($row['expires_at'])<=time()) registrationError($db,410,'otp_expired','Mã đã hết hạn. Vui lòng gửi lại mã.');
    $otp=$v['otp']??'';
    if (!is_string($otp) || !preg_match('/^[0-9]{6}$/D',$otp)) registrationError($db,422,'otp_format','Vui lòng nhập đúng mã gồm 6 chữ số.');
    if (!password_verify($otp,$row['otp_hash'])) {
        $db->prepare('UPDATE registration_challenges SET failed_attempts=failed_attempts+1 WHERE email=?')->execute([$row['email']]);
        if ((int)$row['failed_attempts']+1>=5) registrationRetireMail($db,$row);
        if ((int)$row['failed_attempts']+1>=5) registrationError($db,429,'otp_locked','Đã nhập sai 5 lần. Vui lòng đăng ký lại sau 15 phút.');
        registrationError($db,422,'otp_invalid','Mã xác minh không đúng. Vui lòng kiểm tra email.');
    }
    $db->prepare("INSERT INTO users(email,password_hash,full_name,display_name,phone,birthday,role) VALUES(?,?,?,?,?,?,'customer')")->execute([
        $row['email'],$row['password_hash'],$row['full_name'],$row['full_name'],$row['phone'],$row['birthday'],
    ]);
    $uid=(int)$db->lastInsertId();
    registrationRetireMail($db,$row);
    $db->prepare('UPDATE registration_challenges SET consumed_at=NOW(),otp_hash=NULL,password_hash=NULL,full_name=NULL,phone=NULL,birthday=NULL,mail_id=NULL WHERE email=?')->execute([$row['email']]);
    $db->commit();
    $user=['id'=>$uid,'email'=>$row['email'],'name'=>$row['full_name'],'fullName'=>$row['full_name'],
        'displayName'=>$row['full_name'],'phone'=>$row['phone']??'','birthday'=>$row['birthday']??'','role'=>'customer','createdAt'=>date('c')];
    $_SESSION=[];session_regenerate_id(true);$_SESSION['user']=$user;$_SESSION['version']=1;
    reply(201,['status'=>'success','message'=>'Xác minh email và đăng ký thành công.','data'=>['user'=>$user]]);
} catch (Throwable $error) { registrationFailure($db,$error); }
