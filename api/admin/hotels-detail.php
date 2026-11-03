<?php
declare(strict_types=1);

require_once __DIR__ . '/../shared/bootstrap.php';

requireMethod('GET');
requireAdmin();
header('Cache-Control: no-store, private');

$id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 1],
]);
if ($id === false || $id === null) {
    reply(422, ['status' => 'error', 'message' => 'ID khách sạn không hợp lệ.']);
}

try {
    $pdo = connectDB();
    $stmt = $pdo->prepare(
        'SELECT id, slug, name, city, type, stars, address, google_place_id,
                price_per_night, description, is_active
         FROM hotels WHERE id = :id LIMIT 1'
    );
    $stmt->execute(['id' => $id]);
    $hotel = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$hotel) {
        reply(404, ['status' => 'error', 'message' => 'Không tìm thấy khách sạn.']);
    }
    $hotel['id'] = (int) $hotel['id'];
    $hotel['stars'] = (int) $hotel['stars'];
    $hotel['is_active'] = (int) $hotel['is_active'];
    $hotel['price_per_night'] = (float) $hotel['price_per_night'];
    reply(200, ['status' => 'success', 'data' => ['hotel' => $hotel]]);
} catch (Throwable $e) {
    failServer($e);
}
