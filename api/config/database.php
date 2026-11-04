<?php
if (session_status() === PHP_SESSION_NONE) {
    ini_set("session.use_strict_mode", "1");
    ini_set("session.cookie_httponly", "1");
    ini_set("session.cookie_samesite", "Lax");
    if (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") {
        ini_set("session.cookie_secure", "1");
    }
}
function connectDB(): PDO
{
    static $connection = null;
    if ($connection instanceof PDO) {
        return $connection;
    }
    $host = getenv("DB_HOST") !== false ? getenv("DB_HOST") : "127.0.0.1";
    $port = (int) (getenv("DB_PORT") ?: 3308);
    $dbname =
        getenv("DB_NAME") !== false ? getenv("DB_NAME") : "threek_booking";
    $username = getenv("DB_USER") !== false ? getenv("DB_USER") : "root";
    $password = getenv("DB_PASSWORD") !== false ? getenv("DB_PASSWORD") : "";

    try {
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";

        $pdo = new PDO($dsn, $username, $password);

        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

        $pdo->exec("SET time_zone = '+07:00'");
        $connection = $pdo;
        return $connection;
    } catch (PDOException $e) {
        error_log($e->getMessage());
        throw new RuntimeException("Database connection failed");
    }
}
