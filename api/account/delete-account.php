<?php
require_once __DIR__ . "/_bootstrap.php";
require_once __DIR__ . "/../shared/account-closure.php";
method("POST");
$id = authId();
guardWrite();
$v = body();
$password = $v["password"] ?? "";
if (!is_string($password) || $password === "" || strlen($password) > 72) {
    respond(400, "Nhập mật khẩu hiện tại để xác nhận đóng tài khoản.");
}
run(function (PDO $db) use ($id, $password) {
    try {
        closeCustomerAccount(
            $db,
            $id,
            (int) ($_SESSION["version"] ?? 1),
            $password,
        );
    } catch (AccountClosureException $error) {
        if ($error->httpStatus === 401) {
            endUserSession();
        }
        respond($error->httpStatus, $error->getMessage(), [
            "reason" => $error->reason,
        ]);
    } catch (PDOException $error) {
        if (in_array((int) ($error->errorInfo[1] ?? 0), [1205, 1213], true)) {
            respond(
                409,
                "Dữ liệu tài khoản vừa thay đổi. Vui lòng tải lại trang rồi thử lại.",
                ["reason" => "concurrent_change"],
            );
        }
        throw $error;
    }
    endUserSession();
    respond(
        200,
        "Đã đóng tài khoản và ẩn danh thông tin cá nhân. Lịch sử giao dịch được giữ để đối soát.",
    );
});
