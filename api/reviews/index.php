<?php
require_once __DIR__.'/../shared/bootstrap.php';
requireMethod('GET');
$city=trim((string)($_GET['city']??''));$slug=trim((string)($_GET['hotelId']??''));
if(!in_array($city,['dalat','vungtau'],true) || !$slug) reply(400,['status'=>'error','message'=>'Thiếu city hoặc hotelId.']);
try{
 $q=connectDB()->prepare("SELECT rv.id, rv.score, rv.comment, rv.created_at AS createdAt, COALESCE(u.display_name,u.full_name) AS author FROM reviews rv JOIN users u ON u.id=rv.user_id JOIN hotels h ON h.id=rv.hotel_id WHERE h.city=? AND h.slug=? AND rv.status='approved' ORDER BY rv.created_at DESC LIMIT 100");
 $q->execute([$city,$slug]);$items=$q->fetchAll();
 $avg=count($items)?round(array_sum(array_column($items,'score'))/count($items),2):null;
 reply(200,['status'=>'success','data'=>['reviews'=>$items,'count'=>count($items),'average'=>$avg]]);
}catch(Throwable $e){failServer($e);}
