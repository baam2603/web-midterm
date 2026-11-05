<?php
function securityRateLimit(
    PDO $db,
    string $scope,
    string $identity,
    int $limit,
    int $seconds,
): string {
    $bucket = hash("sha256", $scope . ":" . $identity);
    // Row locking/atomic increment prevents parallel attempts bypassing the limit.
    $db->beginTransaction();
    try {
        $q = $db->prepare(
            "INSERT INTO security_rate_limits(bucket,attempts,reset_at) VALUES (?,1,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? SECOND)) ON DUPLICATE KEY UPDATE attempts=IF(reset_at<=UTC_TIMESTAMP(),1,attempts+1),reset_at=IF(reset_at<=UTC_TIMESTAMP(),VALUES(reset_at),reset_at)",
        );
        $q->execute([$bucket, $seconds]);
        $q = $db->prepare(
            "SELECT attempts,GREATEST(1,TIMESTAMPDIFF(SECOND,UTC_TIMESTAMP(),reset_at)) retry FROM security_rate_limits WHERE bucket=? FOR UPDATE",
        );
        $q->execute([$bucket]);
        $row = $q->fetch();
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        throw $e;
    }
    if ((int) $row["attempts"] > $limit) {
        header("Retry-After: " . (int) $row["retry"]);
        securityReject(
            429,
            "rate_limited",
            "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.",
        );
    }
    // Bounded cleanup; stores hashes/counters only, never passwords or raw email/IP.
    $db->exec(
        "DELETE FROM security_rate_limits WHERE reset_at<UTC_TIMESTAMP()-INTERVAL 1 DAY LIMIT 100",
    );
    return $bucket;
}
