<?php
/** Peak occupancy in [from,to): adjacent reservations never count twice. */
function peakOccupied(array $bookings, string $from, string $to): int
{
    $events = [];
    foreach ($bookings as $b) {
        $start = max($from, $b["checkin"]);
        $end = min($to, $b["checkout"]);
        if ($start >= $end) {
            continue;
        }
        $events[$start] = ($events[$start] ?? 0) + (int) $b["rooms"];
        $events[$end] = ($events[$end] ?? 0) - (int) $b["rooms"];
    }
    ksort($events, SORT_STRING);
    $used = 0;
    $peak = 0;
    foreach ($events as $delta) {
        $used += $delta;
        $peak = max($peak, $used);
    }
    return $peak;
}
function availableRooms(
    PDO $db,
    int $roomId,
    int $stock,
    string $from,
    string $to,
): int {
    $q = $db->prepare(
        "SELECT checkin,checkout,rooms FROM bookings WHERE room_type_id=? AND status IN ('pending','confirmed','checked_in') AND checkin < ? AND checkout > ?",
    );
    $q->execute([$roomId, $to, $from]);
    return max(0, $stock - peakOccupied($q->fetchAll(), $from, $to));
}
