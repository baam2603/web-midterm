<?php
require_once __DIR__ . '/../shared/reviews.php';
requireMethod('GET');$db=connectDB();
try {
    $hotel=reviewHotel($db,$_GET);$viewer=reviewViewer($db);
    $page=filter_var($_GET['page']??1,FILTER_VALIDATE_INT,['options'=>['min_range'=>1,'max_range'=>1000000]]);
    if (!$page) reply(400,['status'=>'error','message'=>'Trang đánh giá không hợp lệ.']);
    $stats=$db->prepare("SELECT COUNT(*) total,ROUND(AVG(score),2) average FROM reviews WHERE hotel_id=? AND status='approved'");
    $stats->execute([$hotel['id']]);$stats=$stats->fetch();$count=(int)$stats['total'];$pageSize=20;
    $page=min($page,max(1,(int)ceil($count/$pageSize)));$offset=($page-1)*$pageSize;
    $q=$db->prepare("SELECT v.id,v.user_id,v.score,v.comment,v.created_at AS createdAt,COALESCE(NULLIF(u.display_name,''),u.full_name) author FROM reviews v JOIN users u ON u.id=v.user_id WHERE v.hotel_id=? AND v.status='approved' ORDER BY v.created_at DESC,v.id DESC LIMIT $pageSize OFFSET $offset");
    $q->execute([$hotel['id']]);$items=$q->fetchAll();$admin=$viewer && $viewer['role']==='admin';
    foreach ($items as &$item) {
        $item['id']=(int)$item['id'];$item['score']=(int)$item['score'];
        $item['canDelete']=$viewer && ($admin || (int)$viewer['id']===(int)$item['user_id']);
        unset($item['user_id']);
    }unset($item);
    reply(200,['status'=>'success','data'=>['reviews'=>$items,'count'=>$count,
        'average'=>$stats['average']===null?null:(float)$stats['average'],'page'=>$page,'pageSize'=>$pageSize,
        'canReview'=>$viewer!==null,'isAdmin'=>(bool)$admin]]);
} catch (Throwable $error) { reviewFailure($db,$error); }
