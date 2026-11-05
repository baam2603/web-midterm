from registration_helpers import register_test_user, read_registration_otp
"""Run only against an isolated test DB/container. Creates and removes its own fixtures.
ADMIN_TEST_URL=http://127.0.0.1:8001 ADMIN_TEST_DB_CONTAINER=web-midterm-admin-db python3 tests/admin_integration.py
"""
import os,json,subprocess,urllib.request,urllib.error,http.cookiejar,secrets,datetime
URL=os.environ.get('ADMIN_TEST_URL','http://127.0.0.1:8001')
CONTAINER=os.environ.get('ADMIN_TEST_DB_CONTAINER','web-midterm-admin-db')
if not CONTAINER.startswith('web-midterm-admin-'):raise RuntimeError('Refusing non-test container')
def sql(query):
    return subprocess.check_output(['docker','exec','-i',CONTAINER,'mariadb','-uroot','-N','threek_booking'],input=query.encode()).decode().strip()
def client():return urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def request(c,path,body=None,token=None,expected=200):
    headers={'Content-Type':'application/json'}
    if token:headers['X-CSRF-Token']=token
    req=urllib.request.Request(URL+path,data=None if body is None else json.dumps(body).encode(),headers=headers)
    try:
        with c.open(req,timeout=35) as r:status=r.status;raw=r.read()
    except urllib.error.HTTPError as r:status=r.code;raw=r.read()
    try:data=json.loads(raw)
    except Exception:raise AssertionError(f'{path}: invalid JSON, HTTP {status}')
    assert status==expected,(path,status,data)
    return data
run=secrets.token_hex(6);password=secrets.token_urlsafe(18)+'A1';emails=[f'{run}-{role}@example.invalid' for role in ('admin','customer')]
admin,customer,anon=client(),client(),client();hotel=None;uids=[]
count=0
def passed(name):
    global count;count+=1;print('PASS',name)
try:
    for c,email in [(admin,emails[0]),(customer,emails[1])]:
        register_test_user({'fullName':'Integration Test','email':email,'password':password},URL,c)
        uid=int(sql(f"SELECT id FROM users WHERE email='{email}';"));uids.append(uid)
    sql(f"UPDATE users SET role='admin' WHERE id={uids[0]};")
    for c,email in [(admin,emails[0]),(customer,emails[1])]:request(c,'/api/auth/login.php',{'email':email,'password':password})
    request(anon,'/api/admin/operations.php',expected=401);request(customer,'/api/admin/operations.php',expected=403);passed('anonymous/customer cannot access admin')
    token=request(admin,'/api/admin/csrf.php')['data']['csrfToken']
    sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,price_per_night,is_active) VALUES('test-{run}','Test Hotel','dalat','villa',4,'Test address',900000,1);")
    hotel=int(sql(f"SELECT id FROM hotels WHERE slug='test-{run}';"))
    body={'hotel_id':hotel,'code':'standard','name':'Test Room','capacity':2,'total_rooms':2,'price_per_night':900000,'area_m2':30,'bed_type':'Double','breakfast_included':False,'free_cancellation':True,'features':['Wifi'],'description':'Room test'}
    request(admin,'/api/admin/rooms-create.php',body,expected=403)
    room=request(admin,'/api/admin/rooms-create.php',body,token,201)['data']['id'];passed('room creation requires CSRF and persists')
    update={k:v for k,v in body.items() if k not in ('hotel_id','code')};update.update(id=room,is_active=True,price_per_night=1234000,name='Updated SQL Room')
    request(admin,'/api/admin/rooms-update.php',update,token)
    assert sql(f'SELECT price_per_night FROM room_types WHERE id={room};')=='1234000.00'
    assert any(r['id']==room and r['name']=='Updated SQL Room' for r in request(admin,'/api/admin/rooms.php')['data']['rooms']);passed('room update read back from SQL and admin API')
    detail=request(anon,f'/api/hotels/detail.php?slug=test-{run}');assert '1234000' in json.dumps(detail);passed('customer detail uses updated price')
    request(admin,'/api/admin/hotels-update.php',{'id':hotel,'name':'Updated Villa','type':'villa','stars':4,'price_per_night':1234000,'description':'Test'},token);passed('villa hotel update supported')
    for name,from_,to_ in [('A','2099-01-01','2099-01-02'),('B','2099-01-02','2099-01-03')]:
        sql(f"INSERT INTO bookings(code,user_id,hotel_id,room_type_id,checkin,checkout,rooms,guests,total,status) VALUES('test-{run}-{name}',{uids[1]},{hotel},{room},'{from_}','{to_}',1,1,900000,'confirmed');")
    quote={'city':'dalat','hotelId':f'test-{run}','roomId':'standard','checkin':'2099-01-01','checkout':'2099-01-03','rooms':1,'guests':1}
    q=request(customer,'/api/bookings/quote.php',quote)['data'];assert q['availableRooms']==1;passed('adjacent bookings use peak occupancy per night')
    request(customer,'/api/bookings/create.php',quote,expected=201)
    request(customer,'/api/bookings/create.php',quote,expected=409);passed('create respects remaining inventory and rejects oversell')
    request(admin,'/api/admin/rooms-update.php',{**update,'total_rooms':1},token,409);passed('cannot reduce stock below existing reservations')
    items=request(admin,'/api/admin/operations.php?section=calendar&from=2099-01-01&to=2099-01-03')['data']['items'];assert next(r for r in items if int(r['id'])==room)['available']==0;passed('calendar uses SQL inventory')
    future=int(sql(f"SELECT id FROM bookings WHERE code='test-{run}-A';"))
    request(admin,'/api/admin/operations.php?section=bookings',{'id':future,'status':'completed'},token,409)
    request(admin,'/api/admin/operations.php?section=bookings',{'id':future,'status':'checked_in'},token,409);passed('invalid transitions and early check-in rejected')
    request(admin,'/api/admin/operations.php?section=bookings',{'id':future,'status':'cancelled'},token)
    assert sql(f'SELECT status FROM bookings WHERE id={future};')=='cancelled';passed('admin cancellation updates SQL')
    yesterday=(datetime.date.today()-datetime.timedelta(days=1)).isoformat();old=(datetime.date.today()-datetime.timedelta(days=3)).isoformat()
    sql(f"INSERT INTO bookings(code,user_id,hotel_id,room_type_id,checkin,checkout,rooms,guests,total,status) VALUES('test-{run}-past',{uids[1]},{hotel},{room},'{old}','{yesterday}',1,1,900000,'checked_in');")
    past=int(sql(f"SELECT id FROM bookings WHERE code='test-{run}-past';"))
    request(admin,'/api/admin/operations.php?section=bookings',{'id':past,'status':'completed'},token)
    request(admin,'/api/bookings/complete.php',{'code':f'test-{run}-past'},token,409);passed('checkout completion persists and repeat request conflicts')
    review=request(customer,'/api/reviews/create.php',{'code':f'test-{run}-past','score':5,'comment':'A sufficiently detailed test review.'},expected=201)['data']['id']
    query=f'/api/reviews/index.php?city=dalat&hotelId=test-{run}'
    assert request(anon,query)['data']['count']==0
    request(admin,'/api/admin/operations.php?section=reviews',{'id':int(review),'status':'approved'},token)
    assert request(anon,query)['data']['count']==1;passed('review remains hidden until admin approval')
    ticket=request(customer,'/api/support/tickets.php',{'topic':'Booking help','message':'Please help with my booking.'},expected=201)['data']['id']
    request(admin,'/api/admin/operations.php?section=support',{'id':ticket,'reply':'Your request is resolved.','status':'answered'},token)
    assert request(customer,'/api/support/tickets.php')['data'][0]['reply']=='Your request is resolved.';passed('support response is visible to its owner')
    for section in ['bookings','reviews','support','audit']:
        request(admin,f'/api/admin/operations.php?section={section}&q=test&page=1')
    assert int(sql(f'SELECT COUNT(*) FROM audit_logs WHERE actor_id={uids[0]};'))>=7;passed('search/pagination and server audit log')
    request(admin,'/api/admin/places-verify.php?place_id=invalid&city=dalat',expected=422)
    request(admin,'/api/admin/places-nearby.php?city=dalat&lat=0&lng=0',expected=422);passed('map endpoints reject invalid references/coordinates')
    print(f'{count} integration checks passed')
finally:
    if uids:
        ids=','.join(map(str,uids));sql(f'DELETE FROM reviews WHERE user_id IN ({ids}); DELETE FROM bookings WHERE user_id IN ({ids});')
        if hotel:sql(f'DELETE FROM hotels WHERE id={hotel};')
        sql(f'DELETE FROM audit_logs WHERE actor_id IN ({ids}); DELETE FROM users WHERE id IN ({ids});')
