<?php
require_once __DIR__ . "/../shared/customer.php";
require_once __DIR__ . "/../shared/email.php";
requireMethod("POST");
guardCustomerWrite();
$v = input();
$token = $v["token"] ?? "";
try {
    $db = connectDB();
    if (is_string($token) && $token !== "") {
        $password = $v["password"] ?? "";
        if (
            !preg_match('/^[a-f0-9]{64}$/D', $token) ||
            !is_string($password) ||
            strlen($password) < 8 ||
            strlen($password) > 72 ||
            !preg_match("/[A-Za-z]/", $password) ||
            !preg_match("/\d/", $password)
        ) {
            reply(422, [
                "status" => "error",
                "message" =>
                    "Mã khôi phục hoặc mật khẩu không hợp lệ (8–72 ký tự, có chữ và số).",
            ]);
        }
        $db->beginTransaction();
        $q = $db->prepare(
            "SELECT * FROM password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at>NOW() FOR UPDATE",
        );
        $q->execute([hash("sha256", $token)]);
        $reset = $q->fetch();
        if (!$reset) {
            $db->rollBack();
            reply(422, [
                "status" => "error",
                "message" => "Liên kết khôi phục không hợp lệ hoặc đã hết hạn.",
            ]);
        }
        $db->prepare(
            "UPDATE users SET password_hash=?,session_version=session_version+1 WHERE id=?",
        )->execute([
            password_hash($password, PASSWORD_DEFAULT),
            $reset["user_id"],
        ]);
        $db->prepare(
            "UPDATE password_resets SET used_at=NOW() WHERE user_id=? AND used_at IS NULL",
        )->execute([$reset["user_id"]]);
        $db->commit();
        $_SESSION = [];
        session_regenerate_id(true);
        reply(200, [
            "status" => "success",
            "message" =>
                "Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới.",
        ]);
    }
    $email = strtolower(trim((string) ($v["email"] ?? "")));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
        reply(422, ["status" => "error", "message" => "Email không hợp lệ."]);
    }
    $base = rtrim(getenv("APP_BASE_URL") ?: "", "/");
    if (!mailConfigured() || !preg_match('~^https://[^\s]+$~D', $base)) {
        reply(503, [
            "status" => "error",
            "message" =>
                "Email khôi phục chưa được kích hoạt. Vui lòng liên hệ hỗ trợ.",
        ]);
    }
    $db->beginTransaction();
    $q = $db->prepare("SELECT id FROM users WHERE email=? FOR UPDATE");
    $q->execute([$email]);
    $uid = $q->fetchColumn();
    if ($uid) {
        $q = $db->prepare(
            "SELECT COUNT(*) FROM password_resets WHERE user_id=? AND created_at>DATE_SUB(NOW(),INTERVAL 15 MINUTE)",
        );
        $q->execute([$uid]);
        if ((int) $q->fetchColumn() < 3) {
            $token = bin2hex(random_bytes(32));
            $db->prepare(
                "UPDATE password_resets SET used_at=NOW() WHERE user_id=? AND used_at IS NULL",
            )->execute([$uid]);
            $db->prepare(
                "INSERT INTO password_resets(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 5 MINUTE))",
            )->execute([$uid, hash("sha256", $token)]);
            queueMail(
                $db,
                $email,
                "Khôi phục mật khẩu THREEK.COM",
                '<p>Liên kết có hiệu lực 5 phút và chỉ dùng một lần.</p><a href="' .
                    htmlspecialchars(
                        $base . "/auth/forgot.html#token=" . $token,
                        ENT_QUOTES,
                    ) .
                    '">Đặt mật khẩu mới</a>',
            );
        }
    }
    $db->commit();
    reply(200, [
        "status" => "success",
        "message" =>
            "Nếu email tồn tại, hướng dẫn khôi phục sẽ được gửi. Hãy kiểm tra hộp thư và thư rác.",
    ]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    failServer($e);
}
