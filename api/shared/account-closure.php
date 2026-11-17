<?php
final class AccountClosureException extends RuntimeException
{
    public function __construct(
        public int $httpStatus,
        public string $reason,
        string $message,
    ) {
        parent::__construct($message);
    }
}
/** Keep financial/history foreign keys, but revoke access and remove profile/contact data. */
function closeCustomerAccount(
    PDO $db,
    int $uid,
    int $sessionVersion,
    string $password,
): void {
    $db->beginTransaction();
    try {
        // Booking creation takes this same user lock before inserting a booking.
        $q = $db->prepare(
            "SELECT email,password_hash,role,session_version,deleted_at FROM users WHERE id=? FOR UPDATE",
        );
        $q->execute([$uid]);
        $user = $q->fetch();
        if (
            !$user ||
            $user["deleted_at"] !== null ||
            (int) $user["session_version"] !== $sessionVersion
        ) {
            throw new AccountClosureException(
                401,
                "session_expired",
                "Phiên đăng nhập không còn hợp lệ.",
            );
        }
        if (!password_verify($password, $user["password_hash"])) {
            throw new AccountClosureException(
                400,
                "incorrect_password",
                "Mật khẩu không đúng.",
            );
        }
        if ($user["role"] !== "customer") {
            throw new AccountClosureException(
                409,
                "admin_account",
                "Tài khoản quản trị không thể tự đóng. Vui lòng liên hệ người quản lý để xử lý quyền quản trị trước.",
            );
        }
        $db->prepare(
            "UPDATE bookings SET status='cancelled',payment_status='expired' WHERE user_id=? AND status='pending' AND pay_method='online' AND payment_expires_at IS NOT NULL AND payment_expires_at<=NOW() AND payment_status='unpaid'",
        )->execute([$uid]);
        $q = $db->prepare(
            "SELECT id,status,pay_method,payment_status FROM bookings WHERE user_id=? FOR UPDATE",
        );
        $q->execute([$uid]);
        $bookings = $q->fetchAll();
        foreach ($bookings as $booking) {
            if (
                !in_array($booking["status"], ["cancelled", "completed"], true)
            ) {
                throw new AccountClosureException(
                    409,
                    "active_bookings",
                    "Bạn còn đơn đang chờ, đã xác nhận hoặc đang lưu trú. Hãy hủy hoặc hoàn tất các đơn này trước khi đóng tài khoản.",
                );
            }
            $settled =
                $booking["status"] === "cancelled"
                    ? in_array(
                        $booking["payment_status"],
                        ["unpaid", "failed", "expired", "refunded"],
                        true,
                    )
                    : in_array(
                            $booking["payment_status"],
                            ["paid", "refunded"],
                            true,
                        ) ||
                        ($booking["pay_method"] === "hotel" &&
                            $booking["payment_status"] === "unpaid");
            if (!$settled) {
                throw new AccountClosureException(
                    409,
                    "unsettled_payments",
                    "Bạn còn khoản thanh toán hoặc hoàn tiền cần đối soát. Vui lòng liên hệ hỗ trợ trước khi đóng tài khoản.",
                );
            }
        }
        // Check the provider ledger too: booking status alone must not hide a pending/refund transaction.
        $q = $db->prepare(
            "SELECT p.status,b.status booking_status FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE b.user_id=? FOR UPDATE",
        );
        $q->execute([$uid]);
        foreach ($q->fetchAll() as $payment) {
            if (
                !in_array($payment["status"], ["failed", "refunded"], true) &&
                !(
                    $payment["status"] === "paid" &&
                    $payment["booking_status"] === "completed"
                )
            ) {
                throw new AccountClosureException(
                    409,
                    "unsettled_payments",
                    "Bạn còn giao dịch chờ xác nhận, đối soát hoặc hoàn tiền. Vui lòng liên hệ hỗ trợ trước khi đóng tài khoản.",
                );
            }
        }
        $anonymousEmail =
            "closed-" .
            $uid .
            "-" .
            bin2hex(random_bytes(12)) .
            "@deleted.invalid";
        $unusablePassword = password_hash(
            bin2hex(random_bytes(32)),
            PASSWORD_DEFAULT,
        );
        $db->prepare(
            "UPDATE users SET email=?,password_hash=?,full_name='Tài khoản đã đóng',display_name=NULL,phone=NULL,birthday=NULL,session_version=session_version+1,deleted_at=NOW() WHERE id=?",
        )->execute([$anonymousEmail, $unusablePassword, $uid]);
        $db->prepare(
            "UPDATE bookings SET guest_name='Khách đã đóng tài khoản',guest_email=?,guest_phone=NULL,guest_note=NULL,request_hash=NULL WHERE user_id=?",
        )->execute([$anonymousEmail, $uid]);
        // Withdraw public free-text that might contain personal details; keep review IDs/scores for admin.
        $db->prepare(
            "UPDATE reviews SET comment='Nội dung đã được gỡ khi đóng tài khoản.',status='rejected' WHERE user_id=?",
        )->execute([$uid]);
        $db->prepare(
            "UPDATE support_tickets SET topic='Tài khoản đã đóng',message='Nội dung đã được gỡ khi đóng tài khoản.',reply=NULL,status='closed' WHERE user_id=?",
        )->execute([$uid]);
        foreach (["favorites", "notifications", "password_resets"] as $table) {
            $db->prepare("DELETE FROM $table WHERE user_id=?")->execute([$uid]);
        }
        $db->prepare("DELETE FROM mail_outbox WHERE recipient=?")->execute([
            $user["email"],
        ]);
        $db->prepare(
            "DELETE FROM registration_challenges WHERE email=?",
        )->execute([$user["email"]]);
        $db->prepare(
            "INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,details_json) VALUES(?,'account.close','user',?,?)",
        )->execute([
            $uid,
            (string) $uid,
            json_encode(["bookingsRetained" => count($bookings)]),
        ]);
        $db->commit();
    } catch (Throwable $error) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        throw $error;
    }
}
