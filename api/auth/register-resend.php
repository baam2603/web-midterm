<?php
require_once __DIR__ . '/../shared/registration.php';
requireMethod('POST');guardCustomerWrite();$v=input();$db=connectDB();
if (!mailConfigured()) reply(503,['status'=>'error','message'=>'Email xác minh chưa được cấu hình.']);
try {
    $db->beginTransaction();$row=registrationPending($db,(string)($v['challengeId']??''));
    // Sending late in a rate window must still grant a full five-minute OTP.
    if (strtotime($row['window_started_at']) + 900 <= time()) {
        $row['window_started_at'] = date('Y-m-d H:i:s');
        $row['send_count'] = 0;
        $row['failed_attempts'] = 0;
        $db->prepare('UPDATE registration_challenges SET window_started_at=?,send_count=0,failed_attempts=0 WHERE email=?')->execute([$row['window_started_at'],$row['email']]);
    }
    registrationLimits($db,$row);registrationRate($db);registrationRetireMail($db,$row);
    $otp=registrationCode($row['otp_hash']);$otpHash=password_hash($otp,PASSWORD_DEFAULT);$now=time();$issuedAt=date('Y-m-d H:i:s',$now);$expires=date('Y-m-d H:i:s',$now+300);
    $mailId=registrationQueue($db,$row['email'],$otp,$expires);
    $db->prepare('UPDATE registration_challenges SET otp_hash=?,expires_at=?,last_sent_at=?,send_count=send_count+1,mail_id=? WHERE email=?')->execute([
        $otpHash,$expires,$issuedAt,$mailId,$row['email'],
    ]);
    $db->commit();$row['expires_at']=$expires;$row['last_sent_at']=$issuedAt;
    reply(200,['status'=>'success','message'=>'Mã mới đang được gửi. Mã cũ không còn hiệu lực.','data'=>['challenge'=>registrationPublic($row)]]);
} catch (Throwable $error) { registrationFailure($db,$error); }
