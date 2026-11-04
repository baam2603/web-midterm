<?php
require_once __DIR__ . "/../shared/customer.php";
require_once __DIR__ . "/../shared/inventory.php";
require_once __DIR__ . "/vnpay-service.php";
// Only the authenticated provider callback changes payment state; browser returns never do.
function ipnReply(string $code, string $message): never
{
    http_response_code(200);
    echo json_encode(["RspCode" => $code, "Message" => $message]);
    exit();
}
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    ipnReply("99", "Invalid method");
}
try {
    $config = vnpConfig();
    $params = $_GET;
    if (!vnpVerified($params, $config)) {
        ipnReply("97", "Invalid signature");
    }
    $ref = $params["vnp_TxnRef"] ?? "";
    $amount = $params["vnp_Amount"] ?? "";
    if (!preg_match('/^TK[A-F0-9]{14}$/D', $ref) || !ctype_digit($amount)) {
        ipnReply("01", "Order not found");
    }
    $db = connectDB();
    $db->beginTransaction();
    $q = $db->prepare(
        "SELECT p.*,b.user_id,b.room_type_id,b.checkin,b.checkout,b.rooms,b.status booking_status,b.payment_expires_at FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE p.txn_ref=? FOR UPDATE",
    );
    $q->execute([$ref]);
    $p = $q->fetch();
    if (!$p) {
        $db->rollBack();
        ipnReply("01", "Order not found");
    }
    if ((string) (int) round((float) $p["amount"] * 100) !== $amount) {
        $db->rollBack();
        ipnReply("04", "Invalid amount");
    }
    if ($p["status"] !== "pending") {
        $db->rollBack();
        ipnReply("02", "Order already confirmed");
    }
    $success =
        ($params["vnp_ResponseCode"] ?? "") === "00" &&
        ($params["vnp_TransactionStatus"] ?? "") === "00";
    if (!$success) {
        $db->prepare("UPDATE payments SET status='failed' WHERE id=?")->execute(
            [$p["id"]],
        );
        $db->prepare(
            "UPDATE bookings SET status=IF(status='pending','cancelled',status),payment_status='failed' WHERE id=?",
        )->execute([$p["booking_id"]]);
        notifyUser(
            $db,
            (int) $p["user_id"],
            "Thanh toán chưa thành công",
            "VNPay chưa xác nhận thanh toán cho " . $ref . ".",
            $ref,
        );
        $db->commit();
        ipnReply("00", "Confirm Success");
    }
    $transaction = $params["vnp_TransactionNo"] ?? "";
    if (!preg_match('/^[0-9]{1,100}$/D', $transaction)) {
        $db->rollBack();
        ipnReply("99", "Invalid transaction");
    }
    $q = $db->prepare(
        "SELECT total_rooms FROM room_types WHERE id=? FOR UPDATE",
    );
    $q->execute([$p["room_type_id"]]);
    $stock = (int) $q->fetchColumn();
    $expired =
        $p["payment_expires_at"] !== null &&
        $p["payment_expires_at"] <= date("Y-m-d H:i:s");
    // An unexpired pending booking already occupies stock; expired/cancelled holds must be checked anew.
    $review =
        $p["checkin"] < date("Y-m-d") ||
        $p["booking_status"] !== "pending" ||
        ($expired &&
            availableRooms(
                $db,
                (int) $p["room_type_id"],
                $stock,
                $p["checkin"],
                $p["checkout"],
            ) < (int) $p["rooms"]);
    $db->prepare(
        "UPDATE payments SET status=?,provider_transaction=?,paid_at=NOW() WHERE id=?",
    )->execute([$review ? "review" : "paid", $transaction, $p["id"]]);
    $db->prepare(
        "UPDATE bookings SET status=?,payment_status=? WHERE id=?",
    )->execute([
        $review ? "cancelled" : "confirmed",
        $review ? "paid_requires_review" : "paid",
        $p["booking_id"],
    ]);
    notifyUser(
        $db,
        (int) $p["user_id"],
        $review ? "Thanh toán cần đối soát" : "Thanh toán thành công",
        $review
            ? "Đã nhận tiền nhưng đơn không còn giữ phòng. Vui lòng liên hệ hỗ trợ để đối soát/hoàn tiền."
            : "VNPay đã xác nhận thanh toán cho " . $ref . ".",
        $ref,
    );
    $q = $db->prepare(
        "SELECT COALESCE(guest_email,u.email) email FROM bookings b JOIN users u ON u.id=b.user_id WHERE b.id=?",
    );
    $q->execute([$p["booking_id"]]);
    $db->prepare(
        "INSERT INTO mail_outbox(recipient,subject,html_body) VALUES(?,?,?)",
    )->execute([
        $q->fetchColumn(),
        "Kết quả thanh toán " . $ref,
        "<p>" .
        ($review
            ? "Đã nhận thanh toán; đơn cần đối soát. Hãy liên hệ hỗ trợ."
            : "Thanh toán VNPay thành công.") .
        " Mã đơn: " .
        htmlspecialchars($ref) .
        "</p>",
    ]);
    $db->commit();
    ipnReply("00", "Confirm Success");
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log("[VNPay IPN] " . $e->getMessage());
    ipnReply("99", "Unknown error");
}
