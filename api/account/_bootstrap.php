<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__ . '/../config/database.php';
if (session_status() === PHP_SESSION_NONE) session_start();
function respond(int $code, string $message, $data = null): void {
 http_response_code($code); $out=['status'=>$code<400?'success':'error','message'=>$message];
 if ($data!==null) $out['data']=$data;
 echo json_encode($out,JSON_UNESCAPED_UNICODE); exit;
}
function method(string $expected): void { if($_SERVER['REQUEST_METHOD']!==$expected) respond(405,'Method not allowed'); }
function authId(): int { $id=(int)($_SESSION['user']['id']??0); if($id<=0) respond(401,'Vui lòng đăng nhập lại.'); return $id; }
function body(): array { $v=json_decode(file_get_contents('php://input'),true); if(!is_array($v)) respond(400,'Dữ liệu JSON không hợp lệ.'); return $v; }
function guardWrite(): void {
 $origin=$_SERVER['HTTP_ORIGIN']??'';
 if($origin){$host=parse_url($origin,PHP_URL_HOST);$port=parse_url($origin,PHP_URL_PORT);$server=explode(':',$_SERVER['HTTP_HOST']??'');
 if(strtolower((string)$host)!==strtolower($server[0]) || ($port!==null && (string)$port!==($server[1]??(($_SERVER['HTTPS']??'')==='on'?'443':'80')))) respond(403,'Origin không hợp lệ.');}
 $type=strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE']??'')[0])); if($type!=='application/json') respond(415,'Yêu cầu application/json.');
}
function userData(array $u): array {return ['id'=>(int)$u['id'],'email'=>$u['email'],'name'=>$u['full_name'],'fullName'=>$u['full_name'],'displayName'=>$u['display_name']?:$u['full_name'],'phone'=>$u['phone']??'','birthday'=>$u['birthday']??'','role'=>$u['role']];}
function run(callable $f): void {try{$f(connectDB());}catch(Throwable $e){error_log($e->getMessage());respond(500,'Lỗi hệ thống máy chủ.');}}
