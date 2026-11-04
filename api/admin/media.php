<?php
require_once __DIR__ . "/../shared/bootstrap.php";
requireAdmin();
header("Cache-Control: no-store, private");
$method = $_SERVER["REQUEST_METHOD"];
$v = $method === "POST" ? input() : $_GET;
$kind = $v["kind"] ?? "";
$parent = filter_var($v["item_id"] ?? ($v["id"] ?? null), FILTER_VALIDATE_INT, [
    "options" => ["min_range" => 1],
]);
if (!in_array($kind, ["hotel", "room"], true) || !$parent) {
    reply(422, [
        "status" => "error",
        "message" => "Đối tượng ảnh không hợp lệ.",
    ]);
}
$table = $kind === "hotel" ? "hotel_images" : "room_images";
$fk = $kind === "hotel" ? "hotel_id" : "room_type_id";
$parentTable = $kind === "hotel" ? "hotels" : "room_types";
try {
    $db = connectDB();
    if ($method === "GET") {
        $q = $db->prepare(
            "SELECT id,image_path,is_cover,sort_order FROM $table WHERE $fk=? ORDER BY is_cover DESC,sort_order,id",
        );
        $q->execute([$parent]);
        reply(200, ["status" => "success", "data" => $q->fetchAll()]);
    }
    requireMethod("POST");
    requireCsrf();
    $id = filter_var($v["id"] ?? null, FILTER_VALIDATE_INT, [
        "options" => ["min_range" => 1],
    ]);
    $action = $v["action"] ?? "";
    if (!$id || !in_array($action, ["cover", "delete"], true)) {
        reply(422, [
            "status" => "error",
            "message" => "Thao tác ảnh không hợp lệ.",
        ]);
    }
    $db->beginTransaction();
    $q = $db->prepare("SELECT id FROM $parentTable WHERE id=? FOR UPDATE");
    $q->execute([$parent]);
    $q = $db->prepare(
        "SELECT image_path,is_cover FROM $table WHERE id=? AND $fk=? FOR UPDATE",
    );
    $q->execute([$id, $parent]);
    $image = $q->fetch();
    if (!$image) {
        $db->rollBack();
        reply(404, ["status" => "error", "message" => "Ảnh không tồn tại."]);
    }
    if ($action === "cover") {
        $db->prepare("UPDATE $table SET is_cover=(id=?) WHERE $fk=?")->execute([
            $id,
            $parent,
        ]);
    } else {
        $db->prepare("DELETE FROM $table WHERE id=?")->execute([$id]);
        if ($image["is_cover"]) {
            $db->prepare(
                "UPDATE $table SET is_cover=1 WHERE $fk=? ORDER BY sort_order,id LIMIT 1",
            )->execute([$parent]);
        }
    }
    auditLog($db, "media." . $action, $kind, $parent, ["image_id" => $id]);
    $db->commit();
    if (
        $action === "delete" &&
        str_starts_with($image["image_path"], "uploads/")
    ) {
        $root = realpath(dirname(__DIR__, 2) . "/uploads");
        $file = realpath(dirname(__DIR__, 2) . "/" . $image["image_path"]);
        if (
            $root &&
            $file &&
            str_starts_with($file, $root . DIRECTORY_SEPARATOR) &&
            is_file($file)
        ) {
            @unlink($file);
        }
    }
    reply(200, ["status" => "success", "message" => "Đã cập nhật ảnh."]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    failServer($e);
}
