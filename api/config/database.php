<?php
require_once __DIR__ . "/session.php";
function connectDB(): PDO
{
    static $connection = null;
    if ($connection instanceof PDO) {
        return $connection;
    }
    $host = getenv("DB_HOST") !== false ? getenv("DB_HOST") : "127.0.0.1";
    $port = (int) (getenv("DB_PORT") ?: 3308);
    $dbname =
        getenv("DB_NAME") !== false ? getenv("DB_NAME") : "threek_security_lab";
    $username = getenv("DB_USER") !== false ? getenv("DB_USER") : "root";
    $password = getenv("DB_PASSWORD") !== false ? getenv("DB_PASSWORD") : "";

    // Deliberately vulnerable branch: refuse the normal DB and non-loopback traffic.
    $peer = $_SERVER['REMOTE_ADDR'] ?? '';
    $requestHost = strtolower(parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST) ?: '');
    if ($dbname !== 'threek_security_lab' ||
        !in_array($host, ['127.0.0.1','localhost','::1'], true) ||
        !in_array($peer, ['127.0.0.1','::1'], true) ||
        !in_array($requestHost, ['localhost','127.0.0.1','[::1]'], true)) {
        http_response_code(403);
        exit('Vulnerable branch: localhost and threek_security_lab only.');
    }
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
        throw new RuntimeException("Database connection failed", 0, $e);
    }
}
