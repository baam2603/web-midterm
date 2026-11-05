"""Real HTTP requests overlapping a locked user-row transaction in the test DB."""
import concurrent.futures,http.cookiejar,json,secrets,select,subprocess,time,urllib.request,urllib.error
URL='http://127.0.0.1:8001';DB='web-midterm-admin-db';WEB='web-midterm-admin-web'
def sql(q):return subprocess.check_output(['docker','exec','-i',DB,'mariadb','-uroot','-N','threek_booking'],input=q.encode()).decode().strip()
def call(c,path,body,status=200):
 req=urllib.request.Request(URL+path,data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
 try:r=c.open(req,timeout=15)
 except urllib.error.HTTPError as e:r=e
 with r:
  data=json.load(r);assert r.status==status,(r.status,data);return data
run=secrets.token_hex(6);password=secrets.token_urlsafe(20)+'A1';uids=[];hotel=None;holder=None
hashed=subprocess.check_output(['docker','exec',WEB,'php','-r','echo password_hash($argv[1],PASSWORD_DEFAULT);',password],text=True).strip()
def user(suffix):
 email=f'closure-race-{run}-{suffix}@example.invalid';sql(f"INSERT INTO users(email,password_hash,full_name) VALUES('{email}','{hashed}','Closure Race')");uid=int(sql(f"SELECT id FROM users WHERE email='{email}'"));uids.append(uid)
 c=urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()));call(c,'/api/auth/login.php',{'email':email,'password':password});return uid,c
def hold(uid,mutation):
 code="require '/app/api/config/database.php';$db=connectDB();$db->beginTransaction();$q=$db->prepare('SELECT id FROM users WHERE id=? FOR UPDATE');$q->execute(["+str(uid)+"]);$db->exec("+json.dumps(mutation)+");echo \"LOCKED\\n\";flush();if(trim(fgets(STDIN))==='commit')$db->commit();else $db->rollBack();"
 p=subprocess.Popen(['docker','exec','-i',WEB,'php','-r',code],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 assert select.select([p.stdout],[],[],10)[0], 'holder did not acquire lock'
 assert p.stdout.readline().strip()=='LOCKED'
 return p
def await_waiter(future):
 for _ in range(60):
  assert not future.done(),'request completed without serializing on the user row'
  if int(sql('SELECT COUNT(*) FROM information_schema.INNODB_LOCK_WAITS'))>0:return
  time.sleep(.05)
 raise AssertionError('request never waited for user lock')
def release(p,command='commit'):
 p.stdin.write(command+'\n');p.stdin.flush();p.communicate(timeout=10);assert p.returncode==0
try:
 sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,price_per_night,is_active) VALUES('closure-race-{run}','Race Hotel','dalat','hotel',3,'Test Street',900000,1)");hotel=int(sql(f"SELECT id FROM hotels WHERE slug='closure-race-{run}'"))
 sql(f"INSERT INTO room_types(hotel_id,code,name,capacity,total_rooms,price_per_night,free_cancellation,is_active) VALUES({hotel},'standard','Race Room',2,10,900000,1,1)");room=int(sql(f'SELECT id FROM room_types WHERE hotel_id={hotel}'))
 with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
  uid,c=user('close-first')
  # Model the closure UPDATE while its transaction is still uncommitted. authId can
  # still see the old committed user, so create.php must recheck under its row lock.
  holder=hold(uid,f'UPDATE users SET deleted_at=NOW(),session_version=session_version+1 WHERE id={uid}')
  body={'city':'dalat','hotelId':'closure-race-'+run,'roomId':'standard','checkin':'2099-05-01','checkout':'2099-05-02','rooms':1,'guests':2,'payMethod':'hotel','phone':'0900000000','requestKey':secrets.token_hex(16)}
  future=pool.submit(call,c,'/api/bookings/create.php',body,401);await_waiter(future);release(holder);holder=None;future.result(timeout=15)
  assert sql(f'SELECT COUNT(*) FROM bookings WHERE user_id={uid}')=='0'
  print('PASS stale authorized booking request cannot insert after account closure commits')
  uid,c=user('booking-first')
  mutation=f"INSERT INTO bookings(code,user_id,hotel_id,room_type_id,checkin,checkout,rooms,guests,total,status,pay_method,payment_status) VALUES('RACE-{run}',{uid},{hotel},{room},'2099-05-01','2099-05-02',1,2,990000,'confirmed','hotel','unpaid')"
  holder=hold(uid,mutation)
  future=pool.submit(call,c,'/api/account/delete-account.php',{'password':password},409);await_waiter(future);release(holder);holder=None;result=future.result(timeout=15)
  assert result['data']['reason']=='active_bookings' and sql(f'SELECT deleted_at IS NULL FROM users WHERE id={uid}')=='1'
  print('PASS closure waits for concurrent booking and rejects it after the active order commits')
  personal=[('/api/support/tickets.php',{'topic':'Race support','message':'Private content must not reappear'},'support_tickets'),('/api/account/favorites.php',{'id':'closure-race-'+run,'city':'dalat','saved':True},'favorites'),('/api/reviews/create.php',{'code':'PRIVATE-REVIEW-'+run,'score':5,'comment':'Private review must not reappear'},'reviews')]
  for index,(endpoint,payload,table) in enumerate(personal):
   uid,c=user('personal'+str(index))
   if table=='reviews':sql(f"INSERT INTO bookings(code,user_id,hotel_id,room_type_id,checkin,checkout,rooms,guests,total,status) VALUES('PRIVATE-REVIEW-{run}',{uid},{hotel},{room},'2020-01-01','2020-01-02',1,2,990000,'completed')")
   holder=hold(uid,f'UPDATE users SET deleted_at=NOW(),session_version=session_version+1 WHERE id={uid}')
   future=pool.submit(call,c,endpoint,payload,401);await_waiter(future);release(holder);holder=None;future.result(timeout=15)
   assert sql(f'SELECT COUNT(*) FROM {table} WHERE user_id={uid}')=='0'
  print('PASS in-flight support/review/favorite requests cannot recreate personal data after closure')

finally:
 if holder and holder.poll() is None:release(holder,'rollback')
 if uids:
  ids=','.join(map(str,uids));sql(f'DELETE FROM reviews WHERE user_id IN ({ids});DELETE FROM bookings WHERE user_id IN ({ids});DELETE FROM users WHERE id IN ({ids})')
 if hotel:sql(f'DELETE FROM hotels WHERE id={hotel}')
