<?php
require_once __DIR__.'/../_shared/bootstrap.php';
requireMethod('GET');requireAdmin();
try{
 $q=connectDB()->query('SELECT rv.id,rv.score,rv.comment,rv.status,rv.created_at AS createdAt,COALESCE(u.display_name,u.full_name) AS author,h.name AS hotelName FROM reviews rv JOIN users u ON u.id=rv.user_id JOIN hotels h ON h.id=rv.hotel_id ORDER BY rv.created_at DESC LIMIT 200');
 reply(200,['status'=>'success','data'=>['reviews'=>$q->fetchAll()]]);
}catch(Throwable $e){failServer($e);}
