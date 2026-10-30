<?php
require_once __DIR__.'/_bootstrap.php'; method('POST'); authId(); guardWrite(); $v=body();
$full=trim((string)($v['fullName']??''));$display=trim((string)($v['displayName']??''));$phone=trim((string)($v['phone']??''));$birthday=trim((string)($v['birthday']??''));
if(mb_strlen($full)<2||mb_strlen($full)>120)respond(400,'Họ tên phải từ 2 đến 120 ký tự.');
if(mb_strlen($display)<2||mb_strlen($display)>30)respond(400,'Tên hiển thị phải từ 2 đến 30 ký tự.');
if($phone!==''&&!preg_match('/^[0-9+\-\s]{8,20}$/',$phone))respond(400,'Số điện thoại không hợp lệ.');
if($birthday!==''){ $d=DateTimeImmutable::createFromFormat('!Y-m-d',$birthday);if(!$d||$d->format('Y-m-d')!==$birthday||$d>new DateTimeImmutable('today'))respond(400,'Ngày sinh không hợp lệ.');}
$id=authId();run(function(PDO $pdo)use($id,$full,$display,$phone,$birthday){
$s=$pdo->prepare('UPDATE users SET full_name=?,display_name=?,phone=?,birthday=? WHERE id=?');$s->execute([$full,$display,$phone?:null,$birthday?:null,$id]);
$s=$pdo->prepare('SELECT * FROM users WHERE id=?');$s->execute([$id]);$u=$s->fetch();if(!$u)respond(401,'Không tìm thấy tài khoản.');
$_SESSION['user']=userData($u);respond(200,'Đã cập nhật hồ sơ.',['user'=>$_SESSION['user']]);});
