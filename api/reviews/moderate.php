<?php
require_once __DIR__ . '/../shared/bootstrap.php';
requireMethod('POST');requireAdmin();requireCsrf();
reply(410,['status'=>'error','message'=>'Đánh giá được đăng ngay, không còn chức năng duyệt. Quản trị viên có thể xóa đánh giá.']);
