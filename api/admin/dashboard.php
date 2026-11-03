<?php

declare(strict_types=1);

require_once __DIR__ . '/../shared/bootstrap.php';

requireMethod('GET');
requireAdmin();

header('Cache-Control: no-store, private');

try {
    $db = connectDB();

    $sql = "
        SELECT
          (SELECT COUNT(*)
           FROM hotels) AS hotelCount,

          (SELECT COUNT(*)
           FROM bookings
           WHERE status IN (
               'pending',
               'confirmed',
               'checked_in'
           )) AS activeBookings,

          (SELECT COUNT(*)
           FROM bookings
           WHERE status = 'completed') AS completedBookings,

          (SELECT COUNT(*)
           FROM bookings
           WHERE status = 'pending') AS pendingBookings,

          (SELECT COALESCE(SUM(total), 0)
           FROM bookings
           WHERE status = 'completed') AS completedValue
    ";

    $metrics = $db->query($sql)->fetch(PDO::FETCH_ASSOC);

    $recentSql = "
        SELECT
            b.code,
            b.status,
            b.total,
            b.created_at AS createdAt,
            h.name AS hotelName,
            u.full_name AS guestName
        FROM bookings b
        INNER JOIN hotels h
            ON b.hotel_id = h.id
        INNER JOIN users u
            ON b.user_id = u.id
        ORDER BY b.created_at DESC, b.id DESC
        LIMIT 5
    ";

    $recentStmt = $db->query($recentSql);
    $recentBookings = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

    reply(200, [
        'status' => 'success',
        'data' => [
            'metrics' => [
                'hotelCount' => (int)$metrics['hotelCount'],
                'activeBookings' => (int)$metrics['activeBookings'],
                'completedBookings' => (int)$metrics['completedBookings'],
                'pendingBookings' => (int)$metrics['pendingBookings'],
                'completedValue' => (float)$metrics['completedValue']
            ],
            'recentBookings' => $recentBookings
        ]
    ]);
} catch (Throwable $e) {
    failServer($e);
}
