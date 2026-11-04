<?php
// One bounded, role-checked API for administrative operations.
require_once __DIR__ . "/../shared/customer.php";
require_once __DIR__ . "/../shared/inventory.php";
requireAdmin();
header("Cache-Control: no-store, private");
$method = $_SERVER["REQUEST_METHOD"];
if (!in_array($method, ["GET", "POST"], true)) {
    reply(405, ["status" => "error", "message" => "Method not allowed"]);
}
$section = (string) ($_GET["section"] ?? "bookings");
if (
    !in_array(
        $section,
        ["bookings", "calendar", "reviews", "support", "audit"],
        true,
    )
) {
    reply(422, ["status" => "error", "message" => "Phân hệ không hợp lệ."]);
}
try {
    $db = connectDB();
    if ($method === "POST") {
        requireCsrf();
        $v = input();
        $id = filter_var($v["id"] ?? null, FILTER_VALIDATE_INT, [
            "options" => ["min_range" => 1],
        ]);
        if (!$id) {
            reply(422, ["status" => "error", "message" => "ID không hợp lệ."]);
        }
        $db->beginTransaction();
        if ($section === "bookings") {
            $q = $db->prepare("SELECT * FROM bookings WHERE id=? FOR UPDATE");
            $q->execute([$id]);
            $b = $q->fetch();
            if (!$b) {
                $db->rollBack();
                reply(404, [
                    "status" => "error",
                    "message" => "Không tìm thấy đơn.",
                ]);
            }
            $next = $v["status"] ?? "";
            $allowed = [
                "pending" => ["confirmed", "cancelled"],
                "confirmed" => ["checked_in", "cancelled"],
                "checked_in" => ["completed"],
                "completed" => [],
                "cancelled" => [],
            ];
            if (
                !is_string($next) ||
                !in_array($next, $allowed[$b["status"]] ?? [], true)
            ) {
                $db->rollBack();
                reply(409, [
                    "status" => "error",
                    "message" =>
                        "Trạng thái đơn đã thay đổi hoặc thao tác không hợp lệ. Hãy tải lại danh sách.",
                ]);
            }
            if (
                $next === "confirmed" &&
                $b["pay_method"] === "online" &&
                $b["payment_status"] !== "paid"
            ) {
                $db->rollBack();
                reply(409, [
                    "status" => "error",
                    "message" =>
                        "Chỉ VNPay IPN được xác nhận thanh toán trực tuyến.",
                ]);
            }
            $today = date("Y-m-d");
            if (
                ($next === "checked_in" &&
                    ($b["checkin"] > $today || $b["checkout"] <= $today)) ||
                ($next === "completed" && $b["checkout"] > $today)
            ) {
                $db->rollBack();
                reply(409, [
                    "status" => "error",
                    "message" => "Chưa đến ngày nhận/trả phòng hợp lệ.",
                ]);
            }
            $q = $db->prepare(
                "UPDATE bookings SET status=?, completed_at=IF(?='completed',NOW(),completed_at) WHERE id=?",
            );
            $q->execute([$next, $next, $id]);
            if ($next === "cancelled" && $b["payment_status"] === "paid") {
                $db->prepare(
                    "UPDATE bookings SET payment_status='refund_requested' WHERE id=?",
                )->execute([$id]);
                $db->prepare(
                    "UPDATE payments SET status='refund_requested' WHERE booking_id=? AND status='paid'",
                )->execute([$id]);
            }
            notifyUser(
                $db,
                (int) $b["user_id"],
                "Cập nhật đặt phòng",
                "Đơn " . $b["code"] . " chuyển sang trạng thái " . $next . ".",
                $b["code"],
            );
            auditLog($db, "booking.status", "booking", $id, [
                "from" => $b["status"],
                "to" => $next,
                "code" => $b["code"],
            ]);
        } elseif ($section === "reviews") {
            $next = $v["status"] ?? "";
            if (!in_array($next, ["approved", "rejected"], true)) {
                $db->rollBack();
                reply(422, [
                    "status" => "error",
                    "message" => "Trạng thái đánh giá không hợp lệ.",
                ]);
            }
            $q = $db->prepare(
                "SELECT status FROM reviews WHERE id=? FOR UPDATE",
            );
            $q->execute([$id]);
            $old = $q->fetchColumn();
            if ($old === false) {
                $db->rollBack();
                reply(404, [
                    "status" => "error",
                    "message" => "Không tìm thấy đánh giá.",
                ]);
            }
            if ($old !== $next) {
                $owner = $db->prepare("SELECT user_id FROM reviews WHERE id=?");
                $owner->execute([$id]);
                notifyUser(
                    $db,
                    (int) $owner->fetchColumn(),
                    "Kết quả đánh giá",
                    $next === "approved"
                        ? "Đánh giá của bạn đã được duyệt."
                        : "Đánh giá của bạn chưa được duyệt.",
                );
                $db->prepare(
                    "UPDATE reviews SET status=?,moderated_at=NOW() WHERE id=?",
                )->execute([$next, $id]);
                auditLog($db, "review.moderate", "review", $id, [
                    "from" => $old,
                    "to" => $next,
                ]);
            }
        } elseif ($section === "support") {
            $reply = trim((string) ($v["reply"] ?? ""));
            $next = $v["status"] ?? "answered";
            if (
                !in_array($next, ["answered", "closed"], true) ||
                mb_strlen($reply) < 5 ||
                mb_strlen($reply) > 3000
            ) {
                $db->rollBack();
                reply(422, [
                    "status" => "error",
                    "message" => "Phản hồi phải từ 5 đến 3000 ký tự.",
                ]);
            }
            $q = $db->prepare(
                "SELECT id FROM support_tickets WHERE id=? FOR UPDATE",
            );
            $q->execute([$id]);
            if (!$q->fetchColumn()) {
                $db->rollBack();
                reply(404, [
                    "status" => "error",
                    "message" => "Không tìm thấy yêu cầu.",
                ]);
            }
            $db->prepare(
                "UPDATE support_tickets SET reply=?,status=?,replied_by=?,replied_at=NOW() WHERE id=?",
            )->execute([$reply, $next, $_SESSION["user"]["id"], $id]);
            $owner = $db->prepare(
                "SELECT user_id FROM support_tickets WHERE id=?",
            );
            $owner->execute([$id]);
            notifyUser(
                $db,
                (int) $owner->fetchColumn(),
                "Phản hồi hỗ trợ",
                "Yêu cầu #" . $id . " đã có phản hồi. Xem tại mục Hỗ trợ.",
            );
            auditLog($db, "support.reply", "ticket", $id, ["status" => $next]);
        } else {
            $db->rollBack();
            reply(405, [
                "status" => "error",
                "message" => "Phân hệ chỉ cho phép xem.",
            ]);
        }
        $db->commit();
        reply(200, ["status" => "success", "message" => "Đã lưu vào MySQL."]);
    }
    if ($section === "calendar") {
        $from = (string) ($_GET["from"] ?? date("Y-m-d"));
        $to = (string) ($_GET["to"] ?? date("Y-m-d", strtotime("+1 day")));
        if (
            !validStayDate($from) ||
            !validStayDate($to) ||
            $to <= $from ||
            (new DateTimeImmutable($from))->diff(new DateTimeImmutable($to))
                ->days > 90
        ) {
            reply(422, [
                "status" => "error",
                "message" => "Chọn khoảng ngày hợp lệ, tối đa 90 đêm.",
            ]);
        }
        $rooms = $db
            ->query(
                "SELECT r.id,r.name,r.total_rooms,r.is_active,h.is_active hotel_active,h.name hotelName,h.city FROM room_types r JOIN hotels h ON h.id=r.hotel_id ORDER BY h.name,r.id",
            )
            ->fetchAll();
        $q = $db->prepare(
            "SELECT room_type_id,checkin,checkout,rooms FROM bookings WHERE status IN ('pending','confirmed','checked_in') AND (status<>'pending' OR payment_expires_at IS NULL OR payment_expires_at>NOW()) AND checkin < ? AND checkout > ?",
        );
        $q->execute([$to, $from]);
        $byRoom = [];
        foreach ($q->fetchAll() as $b) {
            $byRoom[$b["room_type_id"]][] = $b;
        }
        foreach ($rooms as &$r) {
            $r["occupied"] = peakOccupied($byRoom[$r["id"]] ?? [], $from, $to);
            $r["available"] =
                $r["is_active"] && $r["hotel_active"]
                    ? max(0, (int) $r["total_rooms"] - $r["occupied"])
                    : 0;
        }
        unset($r);
        reply(200, [
            "status" => "success",
            "data" => ["items" => $rooms, "from" => $from, "to" => $to],
        ]);
    }
    $page = max(1, (int) ($_GET["page"] ?? 1));
    $size = 20;
    $offset = ($page - 1) * $size;
    $search = trim((string) ($_GET["q"] ?? ""));
    $status = (string) ($_GET["status"] ?? "");
    if (mb_strlen($search) > 100) {
        reply(422, [
            "status" => "error",
            "message" => "Từ khóa tối đa 100 ký tự.",
        ]);
    }
    $where = [];
    $args = [];
    if ($section === "bookings") {
        $source =
            "bookings b JOIN hotels h ON h.id=b.hotel_id JOIN room_types r ON r.id=b.room_type_id JOIN users u ON u.id=b.user_id";
        $fields =
            "b.*,h.name hotelName,r.name roomName,COALESCE(b.guest_name,u.full_name) guestName,COALESCE(b.guest_email,u.email) email,COALESCE(b.guest_phone,u.phone) phone";
        $order = "b.created_at DESC,b.id DESC";
        $prefix = "b";
        $statuses = [
            "pending",
            "confirmed",
            "checked_in",
            "completed",
            "cancelled",
        ];
        $searchSql =
            "(b.code LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR h.name LIKE ?)";
        $n = 4;
    } elseif ($section === "reviews") {
        $source =
            "reviews v JOIN hotels h ON h.id=v.hotel_id JOIN users u ON u.id=v.user_id JOIN bookings b ON b.id=v.booking_id";
        $fields = "v.*,u.full_name author,h.name hotelName,b.code";
        $order = "v.created_at DESC,v.id DESC";
        $prefix = "v";
        $statuses = ["pending", "approved", "rejected"];
        $searchSql =
            "(v.comment LIKE ? OR h.name LIKE ? OR u.full_name LIKE ?)";
        $n = 3;
    } elseif ($section === "support") {
        $source = "support_tickets t JOIN users u ON u.id=t.user_id";
        $fields = "t.*,u.full_name name,u.email";
        $order = "t.created_at DESC,t.id DESC";
        $prefix = "t";
        $statuses = ["open", "answered", "closed"];
        $searchSql = "(t.topic LIKE ? OR t.message LIKE ? OR u.email LIKE ?)";
        $n = 3;
    } else {
        $source = "audit_logs a LEFT JOIN users u ON u.id=a.actor_id";
        $fields = "a.*,COALESCE(u.full_name,'Tài khoản đã xóa') actor";
        $order = "a.id DESC";
        $prefix = "a";
        $statuses = [];
        $searchSql =
            "(a.action LIKE ? OR a.entity_id LIKE ? OR u.full_name LIKE ?)";
        $n = 3;
    }
    if ($status !== "") {
        if (!in_array($status, $statuses, true)) {
            reply(422, [
                "status" => "error",
                "message" => "Bộ lọc trạng thái không hợp lệ.",
            ]);
        }
        $where[] = "$prefix.status=?";
        $args[] = $status;
    }
    if ($search !== "") {
        $where[] = $searchSql;
        for ($i = 0; $i < $n; $i++) {
            $args[] =
                "%" .
                str_replace(["!", "%", "_"], ["!!", "!%", "!_"], $search) .
                "%";
        }
        $where[count($where) - 1] = str_replace(
            "LIKE ?",
            "LIKE ? ESCAPE '!'",
            $searchSql,
        );
    }
    $filter = $where ? " WHERE " . implode(" AND ", $where) : "";
    $q = $db->prepare("SELECT COUNT(*) FROM $source$filter");
    $q->execute($args);
    $total = (int) $q->fetchColumn();
    $q = $db->prepare(
        "SELECT $fields FROM $source$filter ORDER BY $order LIMIT $size OFFSET $offset",
    );
    $q->execute($args);
    reply(200, [
        "status" => "success",
        "data" => [
            "items" => $q->fetchAll(),
            "total" => $total,
            "page" => $page,
            "pageSize" => $size,
        ],
    ]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    failServer($e);
}
