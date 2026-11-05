<?php
require_once __DIR__ . "/shared/bootstrap.php";
requireMethod("GET");
requireAdmin();
connectDB()->query("SELECT 1");
reply(200, [
    "status" => "success",
    "message" => "Database connection is ready",
]);
