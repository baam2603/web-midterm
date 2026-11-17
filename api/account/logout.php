<?php
require_once __DIR__ . "/_bootstrap.php";
method("POST");
guardWrite();
endUserSession();
respond(200, "Đã đăng xuất.");
