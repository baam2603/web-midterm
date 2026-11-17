<?php

if (PHP_SAPI !== "cli") {
    fwrite(STDERR, "ERROR: CLI only\n");
    exit(1);
}

if (
    getenv("DB_HOST") !== "127.0.0.1" ||
    getenv("DB_PORT") !== "3306" ||
    getenv("DB_NAME") !== "threek_booking_test"
) {
    fwrite(STDERR, "ERROR: Local test DB required\n");
    exit(1);
}

require_once __DIR__ . "/../api/config/database.php";

try {
    $dbGuard = connectDB();

    $actualDb = $dbGuard
        ->query("SELECT DATABASE()")
        ->fetchColumn();

    if ($actualDb !== "threek_booking_test") {
        throw new RuntimeException(
            "Wrong database: " . $actualDb
        );
    }

    unset($dbGuard);
} catch (Throwable $e) {
    fwrite(STDERR, "ERROR: " . $e->getMessage() . "\n");
    exit(1);
}
