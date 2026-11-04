<?php

declare(strict_types=1);

require_once __DIR__ . '/../shared/bootstrap.php';
requireMethod('POST');
requireAdmin();
header('Cache-Control: no-store, private');

// Bài 4H: cập nhật room_types thật, không thay room ID, code, hotel_id.
$sentToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
$savedToken = $_SESSION['admin_csrf'] ?? '';
if (
    !is_string($sentToken) || !is_string($savedToken)
    || $savedToken === '' || !hash_equals($savedToken, $sentToken)
) {
    reply(403, ['status' => 'error', 'message' => 'CSRF không hợp lệ. Vui lòng tải lại Admin.']);
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') {
    reply(415, ['status' => 'error', 'message' => 'Yêu cầu Content-Type: application/json.']);
}

$data = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($data)) {
    reply(400, ['status' => 'error', 'message' => 'Dữ liệu JSON không hợp lệ.']);
}

$inputText = static fn(string $key): string => is_string($data[$key] ?? null)
    ? trim($data[$key]) : '';
$utfLength = static fn(string $value): int|false => preg_match_all('/./us', $value);
$integer = static fn(string $key, int $min, int $max): int|false|null =>
filter_var(
    $data[$key] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => $min, 'max_range' => $max]]
);

$id = $integer('id', 1, PHP_INT_MAX);
$name = $inputText('name');
$description = $inputText('description');
$bedType = $inputText('bed_type');
$capacity = $integer('capacity', 1, 20);
$stock = $integer('total_rooms', 0, 999);
$price = $integer('price_per_night', 100000, 100000000);
$area = $integer('area_m2', 1, 2000);
$breakfast = $data['breakfast_included'] ?? null;
$freeCancellation = $data['free_cancellation'] ?? null;
$isActive = $data['is_active'] ?? null;
$features = $data['features'] ?? null;

if (
    !$id || $utfLength($name) === false || $utfLength($name) < 2 || $utfLength($name) > 120
    || $utfLength($description) === false || $utfLength($description) > 3000
    || $utfLength($bedType) === false || $utfLength($bedType) < 2 || $utfLength($bedType) > 120
    || $capacity === false || $capacity === null
    || $stock === false || $stock === null
    || $price === false || $price === null
    || $area === false || $area === null
    || !is_bool($breakfast) || !is_bool($freeCancellation) || !is_bool($isActive)
    || !is_array($features) || count($features) > 12
) {
    reply(422, ['status' => 'error', 'message' => 'Thông tin loại phòng không hợp lệ. Kiểm tra số lượng, sức chứa, giá và tiện nghi.']);
}

$cleanFeatures = [];
foreach ($features as $feature) {
    if (!is_string($feature)) {
        reply(422, ['status' => 'error', 'message' => 'Tiện nghi phòng phải là văn bản.']);
    }
    $feature = trim($feature);
    $len = $utfLength($feature);
    if ($len === false || $len < 2 || $len > 70) {
        reply(422, ['status' => 'error', 'message' => 'Mỗi tiện nghi phải dài 2–70 ký tự.']);
    }
    $cleanFeatures[] = $feature;
}
$cleanFeatures = array_values(array_unique($cleanFeatures));

try {
    $pdo = connectDB();
    $pdo->beginTransaction();

    // Khóa hàng phòng: API tạo đơn cũng khóa room_types trước khi kiểm tra tồn.
    $find = $pdo->prepare('SELECT id, hotel_id, capacity, total_rooms FROM room_types WHERE id = ? FOR UPDATE');
    $find->execute([$id]);
    $existing = $find->fetch(PDO::FETCH_ASSOC);
    if (!$existing) {
        $pdo->rollBack();
        reply(404, ['status' => 'error', 'message' => 'Loại phòng không tồn tại.']);
    }

    $oldCapacity = (int) $existing['capacity'];
    $oldStock = (int) $existing['total_rooms'];

    if ($stock < $oldStock || $capacity < $oldCapacity) {
        $today = (new DateTimeImmutable('today', new DateTimeZone('Asia/Ho_Chi_Minh')))->format('Y-m-d');
        $bookings = $pdo->prepare(
            "SELECT checkin, checkout, rooms, guests FROM bookings
             WHERE room_type_id = ? AND status IN ('pending', 'confirmed', 'checked_in')
               AND checkout > ?"
        );
        $bookings->execute([$id, $today]);

        // Khoảng ngày [nhận phòng, trả phòng), checkout không chiếm đêm tiếp theo.
        $events = [];
        foreach ($bookings->fetchAll(PDO::FETCH_ASSOC) as $booking) {
            $units = (int) $booking['rooms'];
            $guests = (int) $booking['guests'];
            if ($capacity < $oldCapacity && $guests > $units * $capacity) {
                $pdo->rollBack();
                reply(409, [
                    'status' => 'error',
                    'message' => 'Không thể giảm sức chứa: đang có đơn đặt nhiều khách hơn giới hạn mới.'
                ]);
            }
            $from = max((string) $booking['checkin'], $today);
            $to = (string) $booking['checkout'];
            if ($from >= $to) continue;
            $events[$from] = ($events[$from] ?? 0) + $units;
            $events[$to] = ($events[$to] ?? 0) - $units;
        }
        if ($stock < $oldStock) {
            ksort($events, SORT_STRING);
            $inUse = 0;
            $peak = 0;
            foreach ($events as $delta) {
                $inUse += $delta;
                $peak = max($peak, $inUse);
            }
            if ($stock < $peak) {
                $pdo->rollBack();
                reply(409, [
                    'status' => 'error',
                    'message' => "Không thể giảm còn {$stock} phòng: có thời điểm {$peak} phòng đã được đặt."
                ]);
            }
        }
    }

    $update = $pdo->prepare(
        'UPDATE room_types SET
            name = :name,
            capacity = :capacity,
            total_rooms = :total_rooms,
            price_per_night = :price,
            description = :description,
            area_m2 = :area_m2,
            bed_type = :bed_type,
            breakfast_included = :breakfast,
            free_cancellation = :cancellation,
            features_json = :features,
            is_active = :is_active
         WHERE id = :id'
    );
    $update->execute([
        'name' => $name,
        'capacity' => $capacity,
        'total_rooms' => $stock,
        'price' => $price,
        'description' => $description !== '' ? $description : null,
        'area_m2' => $area,
        'bed_type' => $bedType,
        'breakfast' => $breakfast ? 1 : 0,
        'cancellation' => $freeCancellation ? 1 : 0,
        'features' => json_encode($cleanFeatures, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        'is_active' => $isActive ? 1 : 0,
        'id' => $id,
    ]);

    $pdo->commit();
    reply(200, [
        'status' => 'success',
        'message' => 'Đã cập nhật loại phòng trong MySQL.',
        'data' => [
            'id' => $id,
            'hotel_id' => (int) $existing['hotel_id'],
            'is_active' => $isActive ? 1 : 0
        ]
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    failServer($e);
}
