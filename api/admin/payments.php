<?php
require_once __DIR__ . "/../shared/customer.php";
requireAdmin();
header("Cache-Control: no-store, private");
try {
    $db = connectDB();
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        requireCsrf();
        guardCustomerWrite();
        $v = input();
        $id = filter_var($v["id"] ?? null, FILTER_VALIDATE_INT, [
            "options" => ["min_range" => 1],
        ]);
        $ref = trim((string) ($v["reference"] ?? ""));
        if (!$id || mb_strlen($ref) < 5 || mb_strlen($ref) > 120) {
            reply(422, [
                "status" => "error",
                "message" =>
                    "Nhập mã tham chiếu giao dịch hoàn tiền thực tế (5–120 ký tự).",
            ]);
        }
        $db->beginTransaction();
        $q = $db->prepare(
            "SELECT p.*,b.user_id,b.code FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE p.id=? FOR UPDATE",
        );
        $q->execute([$id]);
        $p = $q->fetch();
        if (
            !$p ||
            !in_array($p["status"], ["refund_requested", "review"], true)
        ) {
            $db->rollBack();
            reply(409, [
                "status" => "error",
                "message" => "Giao dịch không còn chờ hoàn tiền hoặc đối soát.",
            ]);
        }
        $db->prepare(
            "UPDATE payments SET status='refunded',refund_reference=?,refunded_at=NOW() WHERE id=?",
        )->execute([$ref, $id]);
        $db->prepare(
            "UPDATE bookings SET payment_status='refunded' WHERE id=?",
        )->execute([$p["booking_id"]]);
        auditLog($db, "payment.refund_recorded", "payment", $id, [
            "reference" => $ref,
        ]);
        notifyUser(
            $db,
            (int) $p["user_id"],
            "Đã ghi nhận hoàn tiền",
            "Quản trị viên xác nhận đã hoàn tiền đơn " .
                $p["code"] .
                ". Mã tham chiếu: " .
                $ref,
            $p["code"],
        );
        $db->commit();
        reply(200, ["status" => "success"]);
    }
    requireMethod("GET");
    $page = max(1, (int) ($_GET["page"] ?? 1));
    $q = trim((string) ($_GET["q"] ?? ""));
    $status = (string) ($_GET["status"] ?? "");
    $where = [];
    $args = [];
    if (mb_strlen($q) > 100) {
        reply(422, ["status" => "error", "message" => "Từ khóa quá dài."]);
    }
    if ($q !== "") {
        $where[] = "b.code LIKE ?";
        $args[] = "%" . $q . "%";
    }
    if ($status !== "") {
        if (
            !in_array(
                $status,
                [
                    "pending",
                    "paid",
                    "failed",
                    "review",
                    "refund_requested",
                    "refunded",
                ],
                true,
            )
        ) {
            reply(422, [
                "status" => "error",
                "message" => "Trạng thái không hợp lệ.",
            ]);
        }
        $where[] = "p.status=?";
        $args[] = $status;
    }
    $filter = $where ? " WHERE " . implode(" AND ", $where) : "";
    $source =
        "payments p JOIN bookings b ON b.id=p.booking_id JOIN users u ON u.id=b.user_id";
    $s = $db->prepare("SELECT COUNT(*) FROM " . $source . $filter);
    $s->execute($args);
    $total = (int) $s->fetchColumn();
    $offset = ($page - 1) * 20;
    $s = $db->prepare(
        "SELECT p.*,b.code,u.full_name guestName FROM " .
            $source .
            $filter .
            " ORDER BY p.id DESC LIMIT 20 OFFSET " .
            $offset,
    );
    $s->execute($args);
    reply(200, [
        "status" => "success",
        "data" => [
            "items" => $s->fetchAll(),
            "total" => $total,
            "page" => $page,
            "pageSize" => 20,
        ],
    ]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    failServer($e);
}
