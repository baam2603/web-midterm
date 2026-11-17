<?php
require_once __DIR__ . '/customer.php';
header('Cache-Control: no-store, private');

function reviewHotel(PDO $db, array $values): array
{
    $city = $values['city'] ?? '';
    $slug = $values['hotelId'] ?? '';
    if (!is_string($city) || !is_string($slug) || !in_array($city, ['dalat','vungtau'], true) ||
        !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) || strlen($slug)>80) {
        reply(400, ['status'=>'error','message'=>'Khách sạn không hợp lệ.']);
    }
    $q=$db->prepare('SELECT id,name FROM hotels WHERE city=? AND slug=? AND is_active=1');
    $q->execute([$city,$slug]);$hotel=$q->fetch();
    if (!$hotel) reply(404,['status'=>'error','message'=>'Khách sạn không tồn tại hoặc đang ẩn.']);
    return $hotel;
}
function reviewViewer(PDO $db): ?array
{
    $uid=(int)($_SESSION['user']['id']??0);
    if (!$uid) return null;
    $q=$db->prepare('SELECT id,role,session_version FROM users WHERE id=? AND deleted_at IS NULL');
    $q->execute([$uid]);$viewer=$q->fetch();
    if (!$viewer || (int)$viewer['session_version']!==(int)($_SESSION['version']??1)) {
        endUserSession();return null;
    }
    return $viewer;
}
// Caller holds an active-account lock and a transaction; authorization is always from DB.
function deleteHotelReview(PDO $db, int $id, int $uid): void
{
    $q=$db->prepare('SELECT role FROM users WHERE id=? AND deleted_at IS NULL');$q->execute([$uid]);
    $admin=$q->fetchColumn()==='admin';
    if ($admin) requireCsrf();
    $q=$db->prepare('SELECT id,user_id,hotel_id FROM reviews WHERE id=? FOR UPDATE');$q->execute([$id]);$row=$q->fetch();
    if (!$row) { $db->rollBack();reply(404,['status'=>'error','message'=>'Đánh giá đã được xóa hoặc không tồn tại.']); }
    if (!$admin && (int)$row['user_id']!==$uid) {
        $db->rollBack();reply(403,['status'=>'error','message'=>'Bạn chỉ được xóa đánh giá của mình.']);
    }
    $db->prepare('DELETE FROM reviews WHERE id=?')->execute([$id]);
    if ($admin) auditLog($db,'review.delete','review',$id,['hotelId'=>(int)$row['hotel_id']]);
}
function reviewFailure(PDO $db, Throwable $error): never
{
    if ($db->inTransaction()) $db->rollBack();
    if ($error instanceof PDOException && (int)($error->errorInfo[1]??0)===1048) {
        error_log('[THREEK REVIEWS] Import database/public_reviews_migration.sql');
        reply(503,['status'=>'error','code'=>'reviews_migration_required','message'=>'Tính năng đánh giá chưa sẵn sàng. Vui lòng liên hệ quản trị viên.']);
    }
    failServer($error);
}
