<?php
require_once __DIR__ . "/../shared/customer.php";
requireMethod("GET");
$uid = requireUser();
header("Cache-Control: no-store, private");
try {
    $db = connectDB();
    expireCustomerBookings($db, $uid);
    $q = $db->prepare(
        bookingSelect() .
            " WHERE b.user_id=? ORDER BY b.created_at DESC,b.id DESC LIMIT 200",
    );
    $q->execute([$uid]);
    reply(200, [
        "status" => "success",
        "data" => array_map("bookingPayload", $q->fetchAll()),
    ]);
} catch (Throwable $e) {
    failServer($e);
}
