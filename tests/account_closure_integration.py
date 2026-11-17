"""Account closure policy, privacy and session checks. Disposable test DB only."""
import hashlib,http.cookiejar,json,secrets,subprocess,urllib.request,urllib.error
from registration_helpers import register_test_user
URL='http://127.0.0.1:8001';DB='web-midterm-admin-db';WEB='web-midterm-admin-web'
def sql(q):return subprocess.check_output(['docker','exec','-i',DB,'mariadb','-uroot','-N','threek_booking'],input=q.encode()).decode().strip()
def client():return urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def request(c,path,body=None,status=200):
 r=urllib.request.Request(URL+path,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json'})
 try:response=c.open(r,timeout=20)
 except urllib.error.HTTPError as e:response=e
 with response:
  result=json.load(response);assert response.status==status,(path,response.status,result)
  return result
run=secrets.token_hex(6);password=secrets.token_urlsafe(20)+'A1';users=[];emails=[];hotel=None
hashed=subprocess.check_output(['docker','exec',WEB,'php','-r','echo password_hash($argv[1],PASSWORD_DEFAULT);',password],text=True).strip()
def user(name,role='customer'):
 email=f'close-{run}-{name}@example.invalid';emails.append(email)
 sql(f"INSERT INTO users(email,password_hash,full_name,display_name,phone,birthday,role) VALUES('{email}','{hashed}','Close Test','Close Test','0912345678','2000-01-01','{role}')")
 uid=int(sql(f"SELECT id FROM users WHERE email='{email}'"));users.append(uid);c=client();request(c,'/api/auth/login.php',{'email':email,'password':password});return uid,email,c
def booking(uid,status='cancelled',method='hotel',payment='unpaid',expired=False,ledger=None):
 code='CLOSE-'+secrets.token_hex(6)
 deadline='DATE_SUB(NOW(),INTERVAL 1 MINUTE)' if expired else 'NULL'
 sql(f"INSERT INTO bookings(code,user_id,hotel_id,room_type_id,checkin,checkout,rooms,guests,total,status,pay_method,payment_status,payment_expires_at,guest_name,guest_email,guest_phone,guest_note) VALUES('{code}',{uid},{hotel},{room},'2099-04-01','2099-04-02',1,2,990000,'{status}','{method}','{payment}',{deadline},'Private Guest','private@example.invalid','0912345678','Private note')")
 bid=int(sql(f"SELECT id FROM bookings WHERE code='{code}'"))
 if ledger:sql(f"INSERT INTO payments(booking_id,txn_ref,amount,status) VALUES({bid},'{code}',990000,'{ledger}')")
 return bid,code
try:
 sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,price_per_night,is_active) VALUES('closure-{run}','Closure Hotel','dalat','hotel',3,'Test Street',900000,1)");hotel=int(sql(f"SELECT id FROM hotels WHERE slug='closure-{run}'"))
 sql(f"INSERT INTO room_types(hotel_id,code,name,capacity,total_rooms,price_per_night,free_cancellation,is_active) VALUES({hotel},'standard','Closure Room',2,100,900000,1,1)");room=int(sql(f'SELECT id FROM room_types WHERE hotel_id={hotel}'))
 uid,email,c=user('empty');request(c,'/api/account/delete-account.php',{'password':'WrongPassword1'},400)
 assert sql(f'SELECT deleted_at IS NULL FROM users WHERE id={uid}')=='1'
 request(c,'/api/account/delete-account.php',{'password':password})
 assert sql(f'SELECT deleted_at IS NOT NULL FROM users WHERE id={uid}')=='1';request(c,'/api/account/profile.php',status=401)
 print('PASS no-history closure uses a tombstone; wrong password cannot mutate the account')
 for state in ['pending','confirmed','checked_in']:
  uid,email,c=user(state);booking(uid,state)
  result=request(c,'/api/account/delete-account.php',{'password':password},409);assert result['data']['reason']=='active_bookings'
  assert sql(f"SELECT email='{email}' AND deleted_at IS NULL FROM users WHERE id={uid}")=='1'
 print('PASS active pending/confirmed/checked-in stays block closure without losing profile data')
 cases=[('completed_unpaid','completed','hotel','unpaid',None),('completed_paid','completed','online','paid','paid'),('cancelled_unpaid','cancelled','hotel','unpaid',None),('cancelled_refunded','cancelled','online','refunded','refunded'),('cancelled_failed','cancelled','online','failed','failed')]
 for label,state,method,payment,ledger in cases:
  uid,email,c=user(label);bid,code=booking(uid,state,method,payment,ledger=ledger)
  request(c,'/api/account/delete-account.php',{'password':password});assert sql(f'SELECT COUNT(*) FROM bookings WHERE id={bid}')=='1'
  assert sql(f'SELECT deleted_at IS NOT NULL FROM users WHERE id={uid}')=='1'
 print('PASS cancelled pay-at-hotel, completed stays and settled/refunded histories allow closure; orders retained')
 for idx,(state,payment,ledger) in enumerate([('cancelled','refund_requested','refund_requested'),('cancelled','paid_requires_review','review'),('cancelled','paid','paid'),('cancelled','unpaid','pending'),('completed','unpaid',None),('completed','failed','failed')]):
  uid,email,c=user('money'+str(idx));booking(uid,state,'online',payment,ledger=ledger)
  result=request(c,'/api/account/delete-account.php',{'password':password},409);assert result['data']['reason']=='unsettled_payments'
  assert sql(f'SELECT deleted_at IS NULL FROM users WHERE id={uid}')=='1'
 print('PASS pending payment ledger/refunds/review and unsettled online stays block closure')
 uid,email,c=user('expired');bid,code=booking(uid,'pending','online','unpaid',expired=True)
 request(c,'/api/account/delete-account.php',{'password':password});assert sql(f"SELECT status='cancelled' AND payment_status='expired' FROM bookings WHERE id={bid}")=='1'
 print('PASS expired online hold with no provider transaction releases and permits closure')
 uid,email,c=user('expired-refund');bid,code=booking(uid,'pending','online','refund_requested',expired=True)
 request(c,'/api/account/delete-account.php',{'password':password},409)
 assert sql(f"SELECT payment_status FROM bookings WHERE id={bid}")=='refund_requested'
 print('PASS expiry cannot overwrite a pending refund or commit partial changes after rejection')

 uid,email,c=user('private');bid,code=booking(uid,'completed')
 other=client();request(other,'/api/auth/login.php',{'email':email,'password':password})
 resetToken=secrets.token_hex(32)
 sql(f"INSERT INTO password_resets(user_id,token_hash,expires_at) VALUES({uid},'{hashlib.sha256(resetToken.encode()).hexdigest()}',DATE_ADD(NOW(),INTERVAL 5 MINUTE));INSERT INTO favorites(user_id,hotel_id) VALUES({uid},{hotel});INSERT INTO notifications(user_id,title,message) VALUES({uid},'Private','Private');INSERT INTO support_tickets(user_id,topic,message,reply) VALUES({uid},'Private','Private contact','Private reply');INSERT INTO reviews(booking_id,user_id,hotel_id,score,comment,status) VALUES({bid},{uid},{hotel},5,'Private review contact','approved');INSERT INTO mail_outbox(recipient,subject,html_body) VALUES('{email}','Private','Private link')")
 request(c,'/api/account/delete-account.php',{'password':password})
 row=json.loads(sql(f"SELECT JSON_OBJECT('email',email,'name',full_name,'display',display_name,'phone',phone,'birthday',birthday,'closed',deleted_at IS NOT NULL,'version',session_version) FROM users WHERE id={uid}"))
 assert row['email']!=email and row['email'].endswith('@deleted.invalid') and row['name']=='Tài khoản đã đóng' and row['closed']==1 and row['version']==2 and not row['display'] and not row['phone'] and not row['birthday']
 assert sql(f'SELECT total FROM bookings WHERE id={bid}')=='990000.00'
 assert sql(f"SELECT guest_name='Khách đã đóng tài khoản' AND guest_phone IS NULL AND guest_note IS NULL FROM bookings WHERE id={bid}")=='1'
 for table in ['password_resets','favorites','notifications']:assert sql(f'SELECT COUNT(*) FROM {table} WHERE user_id={uid}')=='0'
 assert sql(f"SELECT COUNT(*) FROM mail_outbox WHERE recipient='{email}'")=='0'
 assert sql(f"SELECT status='rejected' AND comment NOT LIKE '%Private%' FROM reviews WHERE user_id={uid}")=='1'
 assert sql(f"SELECT status='closed' AND reply IS NULL AND message NOT LIKE '%Private%' FROM support_tickets WHERE user_id={uid}")=='1'
 request(other,'/api/account/profile.php',status=401);request(other,'/api/bookings/list.php',status=401)
 for address in [email,row['email']]:request(client(),'/api/auth/login.php',{'email':address,'password':password},401)
 request(client(),'/api/auth/recovery.php',{'token':resetToken,'password':'ReplacementPassword1'},422)
 assert sql(f"SELECT COUNT(*) FROM audit_logs WHERE actor_id={uid} AND action='account.close'")=='1'
 print('PASS profile/order contact/private caches anonymized, old sessions/login/reset token revoked, audit/history kept')
 # Try the real OTP registration flow with the released email, not a direct SQL shortcut.
 registered=register_test_user({'fullName':'New Account','email':email,'password':password},URL)[0]['data']['user']['id'];users.append(int(registered))
 fresh=client();request(fresh,'/api/auth/login.php',{'email':email,'password':password});assert request(fresh,'/api/bookings/list.php')['data']==[]
 print('PASS email can register again through OTP; the new account cannot inherit old bookings')
 uid,email,c=user('admin','admin');request(c,'/api/account/delete-account.php',{'password':password},409);assert sql(f'SELECT deleted_at IS NULL FROM users WHERE id={uid}')=='1'
 print('PASS self-service closure cannot remove an administrator')
 retained=request(c,'/api/admin/operations.php?section=bookings&q='+code)['data']['items']
 assert retained and retained[0]['guestName']=='Khách đã đóng tài khoản'
 print('PASS admin API still returns the retained booking with anonymized contact')

finally:
 if users:
  ids=','.join(map(str,users));sql(f'DELETE p FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE b.user_id IN ({ids});DELETE FROM reviews WHERE user_id IN ({ids});DELETE FROM bookings WHERE user_id IN ({ids});DELETE FROM audit_logs WHERE actor_id IN ({ids});DELETE FROM users WHERE id IN ({ids})')
 if hotel:sql(f'DELETE FROM hotels WHERE id={hotel}')
 for email in emails:sql(f"DELETE FROM mail_outbox WHERE recipient='{email}';DELETE FROM registration_challenges WHERE email='{email}'")
