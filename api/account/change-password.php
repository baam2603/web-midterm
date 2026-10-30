<?php
require_once __DIR__.'/_bootstrap.php'; method('POST');$id=authId();guardWrite();$v=body();
$current=(string)($v['currentPassword']??'');$next=(string)($v['newPassword']??'');
if(strlen($next)<8||!preg_match('/[A-Za-z]/',$next)||!preg_match('/[0-9]/',$next))respond(400,'Mật khẩu mới phải từ 8 ký tự, có chữ và số.');
if($current===$next)respond(400,'Mật khẩu mới phải khác mật khẩu cũ.');
run(function(PDO $pdo)use($id,$current,$next){$s=$pdo->prepare('SELECT password_hash FROM users WHERE id=?');$s->execute([$id]);$u=$s->fetch();if(!$u||!password_verify($current,$u['password_hash']))respond(400,'Mật khẩu hiện tại không đúng.');
$s=$pdo->prepare('UPDATE users SET password_hash=? WHERE id=?');$s->execute([password_hash($next,PASSWORD_DEFAULT),$id]);session_regenerate_id(true);respond(200,'Đổi mật khẩu thành công.');});
