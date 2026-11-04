<?php

declare(strict_types=1);
require_once __DIR__ . '/../shared/bootstrap.php';
requireMethod('GET');
header('Cache-Control: no-store, public');
$city = trim((string)($_GET['city'] ?? ''));
if ($city !== '' && !in_array($city, ['dalat', 'vungtau'], true)) {
    reply(400, ['status' => 'error', 'message' => 'Thành phố không hợp lệ.']);
}
try {
    $pdo = connectDB();
    $sql = 'SELECT h.id, h.slug, h.name, h.city, h.type, h.stars, h.address,
                   h.price_per_night, h.latitude, h.longitude,
                   (SELECT MIN(r.price_per_night) FROM room_types r
                     WHERE r.hotel_id=h.id AND r.is_active=1 AND r.total_rooms>0) AS min_room_price,
                   (SELECT MAX(r.capacity) FROM room_types r
                     WHERE r.hotel_id=h.id AND r.is_active=1 AND r.total_rooms>0) AS max_capacity,
                   (SELECT hi.image_path FROM hotel_images hi
                     WHERE hi.hotel_id=h.id ORDER BY hi.is_cover DESC,hi.sort_order,hi.id LIMIT 1) AS cover_image
            FROM hotels h
            WHERE h.is_active=1
              AND EXISTS (SELECT 1 FROM room_types r
                         WHERE r.hotel_id=h.id AND r.is_active=1 AND r.total_rooms>0)';
    if ($city !== '') $sql .= ' AND h.city=:city';
    $sql .= ' ORDER BY h.id';
    $q = $pdo->prepare($sql);
    $q->execute($city === '' ? [] : ['city' => $city]);
    $hotels = $q->fetchAll(PDO::FETCH_ASSOC);
    if ($hotels) {
        $amenities = $pdo->query('SELECT ha.hotel_id, a.code FROM hotel_amenities ha
                              JOIN amenities a ON a.id=ha.amenity_id')->fetchAll(PDO::FETCH_ASSOC);
        $byHotel = [];
        foreach ($amenities as $a) $byHotel[(int)$a['hotel_id']][] = $a['code'];
        foreach ($hotels as &$h) {
            $h['id'] = (int)$h['id'];
            $h['stars'] = (int)$h['stars'];
            $h['price_per_night'] = (float)$h['price_per_night'];
            $h['min_room_price'] = (float)$h['min_room_price'];
            $h['max_capacity'] = (int)$h['max_capacity'];
            $h['latitude'] = $h['latitude'] === null ? null : (float)$h['latitude'];
            $h['longitude'] = $h['longitude'] === null ? null : (float)$h['longitude'];
            $h['amenities'] = $byHotel[$h['id']] ?? [];
        }
        unset($h);
    }
    // Giữ shape tương thích với common/hotels-api.js hiện tại
    reply(200, ['status' => 'success', 'total' => count($hotels), 'data' => $hotels]);
} catch (Throwable $e) {
    failServer($e);
}
