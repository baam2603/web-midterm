from security_client import protected_headers
"""Customer and signed VNPay protocol tests. Isolated test DB only; no real payments or mail."""
import os,json,subprocess,urllib.request,urllib.error,http.cookiejar,secrets,hashlib,hmac,urllib.parse,re
URL=os.environ.get('ADMIN_TEST_URL','http://127.0.0.1:8001');DB='web-midterm-admin-db'
SECRET='integration-test-key-not-for-production'
def sql(q):return subprocess.check_output(['docker','exec','-i',DB,'mariadb','-uroot','-N','threek_booking'],input=q.encode()).decode().strip()
def client():return urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def request(c,path,body=None,status=200,headers=None):
 if body is not None:headers=protected_headers(c,URL,headers)
 r=urllib.request.Request(URL+path,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json',**(headers or {})})
 try:
  with c.open(r,timeout=15) as res:code=res.status;raw=res.read()
 except urllib.error.HTTPError as res:code=res.code;raw=res.read()
 try:j=json.loads(raw)
 except Exception:raise AssertionError((path,code,'Non-JSON response'))
 assert code==status,(path,code,j);return j
run=secrets.token_hex(6);password=secrets.token_urlsafe(20)+'A1';newPassword=secrets.token_urlsafe(20)+'A2';users=[];hotel=None;count=0
emails=[f'customer-{run}-{i}@example.invalid' for i in range(2)];a,b,anon=client(),client(),client()
def passed(s):
 global count;count+=1;print('PASS',s)
def signed(p):
 p={k:str(v) for k,v in p.items()};query=urllib.parse.urlencode(sorted(p.items()));p['vnp_SecureHash']=hmac.new(SECRET.encode(),query.encode(),hashlib.sha512).hexdigest();return urllib.parse.urlencode(p)
try:
 for c,email in [(a,emails[0]),(b,emails[1])]:
  request(c,'/api/auth/register.php',{'fullName':'Customer Test','email':email,'password':password,'phone':'0900000000'},201);users.append(int(sql(f"SELECT id FROM users WHERE email='{email}'")))
 sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,price_per_night,is_active) VALUES('customer-{run}','Customer SQL Hotel','dalat','hotel',4,'Test address',900000,1)");hotel=int(sql(f"SELECT id FROM hotels WHERE slug='customer-{run}'"))
 sql(f"INSERT INTO room_types(hotel_id,code,name,capacity,total_rooms,price_per_night,free_cancellation,is_active) VALUES({hotel},'unique-room','SQL New Room',2,5,900000,1,1)");room=int(sql(f'SELECT id FROM room_types WHERE hotel_id={hotel}'))
 body={'city':'dalat','hotelId':f'customer-{run}','roomId':'unique-room','checkin':'2099-02-01','checkout':'2099-02-03','rooms':1,'guests':2,'guestName':'Actual Guest','email':emails[0],'phone':'0912345678','note':'Guest note','requestKey':secrets.token_hex(16),'payMethod':'hotel','coupon':'THREEK10'}
 request(a,'/api/bookings/create.php',body,403,{'Origin':'https://evil.invalid'});passed('cross-origin writes rejected')
 request(a,'/api/bookings/create.php',{**body,'expectedTotal':1},409)
 order=request(a,'/api/bookings/create.php',body,201)['data'];code=order['code']
 again=request(a,'/api/bookings/create.php',body)['data'];assert again['code']==code
 request(a,'/api/bookings/create.php',{**body,'guests':1},409);passed('server price, idempotent creation and request-key conflict')
 detail=request(a,'/api/bookings/detail.php?code='+code)['data'];assert detail['guestName']=='Actual Guest' and detail['email']==emails[0] and detail['phone']=='0912345678' and detail['note']=='Guest note';passed('immutable guest/contact details persist in SQL')
 request(b,'/api/bookings/detail.php?code='+code,status=404);request(anon,'/api/bookings/detail.php?code='+code,status=401);request(b,'/api/bookings/cancel.php',{'code':code},404);passed('booking ownership enforced')
 request(a,'/api/account/favorites.php',{'id':body['hotelId'],'city':'dalat','saved':True});assert len(request(a,'/api/account/favorites.php')['data'])==1;assert request(b,'/api/account/favorites.php')['data']==[];passed('favorites stored per account')
 notes=request(a,'/api/account/notifications.php')['data'];assert notes and request(b,'/api/account/notifications.php')['data']==[]
 request(b,'/api/account/notifications.php',{'id':notes[0]['id']});assert request(a,'/api/account/notifications.php')['data'][0]['read_at'] is None
 request(a,'/api/account/notifications.php',{'id':notes[0]['id']});assert request(a,'/api/account/notifications.php')['data'][0]['read_at'];passed('notifications owner-only read status')
 request(a,'/api/bookings/cancel.php',{'code':code});request(a,'/api/bookings/cancel.php',{'code':code});assert request(a,'/api/bookings/detail.php?code='+code)['data']['status']=='cancelled';passed('cancellation persists and retries safely')
 assert request(a,'/api/bookings/detail.php?requestKey='+body['requestKey'])['data']['code']==code
 request(b,'/api/bookings/detail.php?requestKey='+body['requestKey'],status=404)
 request(anon,'/api/bookings/detail.php?requestKey='+body['requestKey'],status=401);passed('lost-response resume by request key is owner-only')
 for method in ['card_demo','bank_demo','momo_demo','zalopay_demo']:
  demo=request(a,'/api/bookings/create.php',{**body,'payMethod':method,'requestKey':secrets.token_hex(16)},201)['data']
  persisted=request(a,'/api/bookings/detail.php?code='+demo['code'])['data']
  assert persisted['payMethod']==method and persisted['status']=='confirmed' and persisted['paymentStatus']=='unpaid'
  assert sql(f"SELECT COUNT(*) FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE b.code='{demo['code']}'")=='0'
  request(a,'/api/bookings/cancel.php',{'code':demo['code']})
 assert sql(f"SELECT COUNT(*) FROM mail_outbox WHERE recipient='{emails[0]}'")=='0'
 passed('all original demo methods persist unpaid, without payment transactions or email jobs')

 online=request(a,'/api/bookings/create.php',{**body,'payMethod':'online','requestKey':secrets.token_hex(16)},201)['data'];onlineCode=online['code'];amount=str(int(float(online['total'])*100))
 start=request(a,'/api/payments/start.php',{'code':onlineCode})['data'];url=urllib.parse.urlparse(start['url']);assert url.hostname=='sandbox.vnpayment.vn';params=dict(urllib.parse.parse_qsl(url.query));signature=params.pop('vnp_SecureHash');assert signature==hmac.new(SECRET.encode(),urllib.parse.urlencode(sorted(params.items())).encode(),hashlib.sha512).hexdigest();passed('hosted VNPay URL signed with server amount')
 ipn={'vnp_TmnCode':'TESTONLY','vnp_TxnRef':onlineCode,'vnp_Amount':amount,'vnp_ResponseCode':'00','vnp_TransactionStatus':'00','vnp_TransactionNo':str(secrets.randbelow(10**12))}
 bad=signed(ipn).replace('vnp_Amount='+amount,'vnp_Amount=1');assert request(anon,'/api/payments/ipn.php?'+bad)['RspCode']=='97'
 assert request(anon,'/api/payments/ipn.php?'+signed({**ipn,'vnp_Amount':'1'}))['RspCode']=='04'
 assert request(a,'/api/bookings/detail.php?code='+onlineCode)['data']['paymentStatus']=='unpaid';passed('forged signatures and signed wrong amounts rejected')
 assert request(anon,'/api/payments/ipn.php?'+signed(ipn))['RspCode']=='00';assert request(anon,'/api/payments/ipn.php?'+signed(ipn))['RspCode']=='02'
 paid=request(a,'/api/bookings/detail.php?code='+onlineCode)['data'];assert paid['status']=='confirmed' and paid['paymentStatus']=='paid';passed('verified IPN confirms once; replay does not duplicate')
 request(a,'/api/bookings/cancel.php',{'code':onlineCode});assert request(a,'/api/bookings/detail.php?code='+onlineCode)['data']['paymentStatus']=='refund_requested';passed('paid cancellation requests refund without claiming money refunded')
 # Expired holds must release inventory, and late paid callbacks must not oversell.
 late=request(a,'/api/bookings/create.php',{**body,'payMethod':'online','requestKey':secrets.token_hex(16)},201)['data'];lateCode=late['code']
 request(a,'/api/payments/start.php',{'code':lateCode});sql(f"UPDATE bookings SET payment_expires_at=DATE_SUB(NOW(),INTERVAL 1 MINUTE) WHERE code='{lateCode}'")
 assert request(a,'/api/bookings/detail.php?code='+lateCode)['data']['paymentStatus']=='expired'
 sql(f"UPDATE room_types SET total_rooms=1 WHERE id={room}")
 request(a,'/api/bookings/create.php',{**body,'requestKey':secrets.token_hex(16)},201)
 lateIpn={**ipn,'vnp_TxnRef':lateCode,'vnp_TransactionNo':str(secrets.randbelow(10**12))}
 assert request(anon,'/api/payments/ipn.php?'+signed(lateIpn))['RspCode']=='00'
 lateStatus=request(a,'/api/bookings/detail.php?code='+lateCode)['data'];assert lateStatus['status']=='cancelled' and lateStatus['paymentStatus']=='paid_requires_review';passed('expired holds release stock; late payment cannot oversell')
 sql(f"UPDATE room_types SET total_rooms=5 WHERE id={room}")
 failed=request(a,'/api/bookings/create.php',{**body,'payMethod':'online','requestKey':secrets.token_hex(16)},201)['data'];request(a,'/api/payments/start.php',{'code':failed['code']})
 assert request(anon,'/api/payments/ipn.php?'+signed({**ipn,'vnp_TxnRef':failed['code'],'vnp_ResponseCode':'24','vnp_TransactionStatus':'02'}))['RspCode']=='00'
 assert request(a,'/api/bookings/detail.php?code='+failed['code'])['data']['status']=='cancelled';passed('failed VNPay callback releases pending booking')
 request(b,'/api/admin/payments.php',status=403)
 sql(f"UPDATE users SET role='admin' WHERE id={users[0]}")
 adminOrder=request(a,'/api/admin/operations.php?section=bookings&q='+onlineCode)['data']['items'][0];assert adminOrder['guestName']=='Actual Guest' and adminOrder['phone']=='0912345678'
 csrf=request(a,'/api/admin/csrf.php')['data']['csrfToken']
 payId=int(sql(f"SELECT p.id FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE b.code='{onlineCode}'"))
 request(a,'/api/admin/payments.php',{'id':payId,'reference':'MERCHANT-REFUND-TEST'},headers={'X-CSRF-Token':csrf})
 assert request(a,'/api/bookings/detail.php?code='+onlineCode)['data']['paymentStatus']=='refunded';passed('refund reconciliation requires admin and records reference')
 sql(f"UPDATE users SET role='customer' WHERE id={users[0]}")
 request(a,'/api/account/update-profile.php',{'fullName':'Changed Customer','displayName':'Changed','phone':'0987654321','birthday':'2000-01-01'});assert request(a,'/api/account/profile.php')['data']['user']['fullName']=='Changed Customer';passed('profile updates saved server-side')
 recovery=request(anon,'/api/auth/recovery.php',{'email':emails[0]});assert 'token' not in json.dumps(recovery).lower()
 html=sql(f"SELECT html_body FROM mail_outbox WHERE recipient='{emails[0]}' AND subject LIKE '%THREEK%' ORDER BY id DESC LIMIT 1")
 token=re.search(r'token=([a-f0-9]{64})',html).group(1);assert token!=sql(f'SELECT token_hash FROM password_resets WHERE user_id={users[0]} ORDER BY id DESC LIMIT 1')
 request(anon,'/api/auth/recovery.php',{'token':token,'password':newPassword});request(anon,'/api/auth/recovery.php',{'token':token,'password':newPassword},422)
 request(a,'/api/account/profile.php',status=401);request(a,'/api/auth/login.php',{'email':emails[0],'password':password},401);request(a,'/api/auth/login.php',{'email':emails[0],'password':newPassword});passed('hashed one-time recovery token and revocation of old sessions')
 assert request(b,'/api/account/profile.php')['data']['user']['email']==emails[1];passed('password reset does not affect another account')
 print(f'{count} customer checks passed; no live provider requests performed')
finally:
 if users:
  ids=','.join(map(str,users));sql(f'DELETE p FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE b.user_id IN ({ids}); DELETE FROM reviews WHERE user_id IN ({ids});DELETE FROM bookings WHERE user_id IN ({ids});')
  if hotel:sql(f'DELETE FROM hotels WHERE id={hotel};')
  for email in emails:sql(f"DELETE FROM mail_outbox WHERE recipient='{email}'")
  sql(f'DELETE FROM audit_logs WHERE actor_id IN ({ids});DELETE FROM users WHERE id IN ({ids});')
