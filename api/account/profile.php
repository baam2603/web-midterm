<?php
require_once __DIR__.'/_bootstrap.php'; method('GET'); $id=authId();
run(function(PDO $pdo)use($id){$s=$pdo->prepare('SELECT * FROM users WHERE id=? LIMIT 1');$s->execute([$id]);$u=$s->fetch();if(!$u)respond(401,'Phiên đăng nhập không còn hợp lệ.');respond(200,'Lấy hồ sơ thành công.',['user'=>userData($u)]);});
