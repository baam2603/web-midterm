<?php
// Kept for existing clients: eligibility no longer depends on any booking.
require_once __DIR__ . '/../shared/reviews.php';
requireMethod('GET');requireUser();
try {
    reviewHotel(connectDB(),$_GET);
    reply(200,['status'=>'success','data'=>['eligible'=>true,'requiresBooking'=>false]]);
} catch (Throwable $error) { failServer($error); }
