<?php

declare(strict_types=1);
require_once __DIR__ . '/../shared/bootstrap.php';
requireMethod('GET');
requireAdmin();
header('Cache-Control: no-store, private');
$hotelId = null;
if (isset($_GET['hotel_id'])) {
    $hotelId = filter_var($_GET['hotel_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if (!$hotelId) reply(422, ['status' => 'error', 'message' => 'ID khách sạn không hợp lệ.']);
}
try {
    $pdo = connectDB();
    $sql = 'SELECT r.*, h.name hotel_name, h.city hotel_city, h.is_active hotel_is_active
              FROM room_types r JOIN hotels h ON h.id = r.hotel_id';
    if ($hotelId !== null) $sql .= ' WHERE r.hotel_id = :hotel_id';
    $sql .= ' ORDER BY h.name, r.id';
    $q = $pdo->prepare($sql);
    $q->execute($hotelId === null ? [] : ['hotel_id' => $hotelId]);
    $rooms = $q->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rooms as &$r) {
        foreach (
            [
                'id',
                'hotel_id',
                'capacity',
                'total_rooms',
                'breakfast_included',
                'free_cancellation',
                'is_active',
                'hotel_is_active'
            ] as $k
        ) $r[$k] = (int)$r[$k];
        $r['area_m2'] = $r['area_m2'] === null ? null : (int)$r['area_m2'];
        $r['price_per_night'] = (float)$r['price_per_night'];
        $decodedFeatures = json_decode($r['features_json'] ?? '[]', true);
        $r['features'] = is_array($decodedFeatures) ? $decodedFeatures : [];
        unset($r['features_json']);
    }
    unset($r);
    reply(200, ['status' => 'success', 'data' => ['rooms' => $rooms]]);
} catch (Throwable $e) {
    failServer($e);
}
