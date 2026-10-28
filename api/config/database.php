
<?php
function connectDB(): PDO
{
    $host = "127.0.0.1";
    $port = 3308;
    $dbname = "threek_booking";
    $username = "root";
    $password = "";

    try {
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";

        $pdo = new PDO($dsn, $username, $password);

        $pdo->setAttribute(
            PDO::ATTR_ERRMODE,
            PDO::ERRMODE_EXCEPTION
        );

        $pdo->setAttribute(
            PDO::ATTR_DEFAULT_FETCH_MODE,
            PDO::FETCH_ASSOC
        );

        $pdo->setAttribute(
            PDO::ATTR_EMULATE_PREPARES,
            false
        );

        return $pdo;
    } catch (PDOException $e) {
        error_log($e->getMessage());
        throw new RuntimeException("Database connection failed");
    }
}
