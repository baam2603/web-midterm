<?php
require_once __DIR__.'/_bootstrap.php';method('POST');$id=authId();guardWrite();$v=body();$pw=(string)($v['password']??'');if(!$pw)respond(400,'Nhập mật khẩu để xác nhận.');
run(function(PDO $pdo)use($id,$pw){$s=$pdo->prepare('SELECT password_hash FROM users WHERE id=?');$s->execute([$id]);$u=$s->fetch();if(!$u||!password_verify($pw,$u['password_hash']))respond(400,'Mật khẩu không đúng.');
try{$s=$pdo->prepare('DELETE FROM users WHERE id=?');$s->execute([$id]);}catch(PDOException $e){if($e->getCode()==='23000')respond(409,'Tài khoản có dữ liệu liên quan. Cần xử lý đơn đặt phòng trước khi xóa.');throw $e;}
$_SESSION=[];session_destroy();respond(200,'Đã xóa tài khoản.');});
