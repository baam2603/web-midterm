"""OSM/manual location policy and SQL persistence. Fake accounts, no live providers."""
import http.cookiejar,json,secrets,subprocess,urllib.request,urllib.error
from registration_helpers import register_test_user
URL='http://127.0.0.1:8001';DB='web-midterm-admin-db';WEB='web-midterm-admin-web'
def sql(q):return subprocess.check_output(['docker','exec','-i',DB,'mariadb','-uroot','-N','threek_booking'],input=q.encode()).decode().strip()
def client():return urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def call(c,path,body=None,status=200,token=None):
 h={'Content-Type':'application/json'}
 if token:h['X-CSRF-Token']=token
 req=urllib.request.Request(URL+path,data=None if body is None else json.dumps(body).encode(),headers=h)
 try:r=c.open(req,timeout=20)
 except urllib.error.HTTPError as e:r=e
 with r:
  j=json.load(r);assert r.status==status,(path,r.status,j);return j
run=secrets.token_hex(6);email=f'manual-{run}@example.invalid';pw=secrets.token_urlsafe(20)+'A1';uid=None;hotels=[];c=client()
try:
 body={'slug':'manual-'+run,'name':'Manual Hotel','address':'12 Private Test Street, Da Lat','city':'dalat','type':'hotel','stars':3,'price_per_night':900000,'description':'Own business details','google_place_id':'','location_mode':'manual','latitude':11.9404,'longitude':108.4583,'location_confirmed':True}
 call(c,'/api/admin/hotels-create.php',body,401)
 register_test_user({'email':email,'password':pw,'fullName':'Manual Location Test'},URL,c);uid=int(sql(f"SELECT id FROM users WHERE email='{email}'"))
 call(c,'/api/admin/hotels-create.php',body,403)
 sql(f"UPDATE users SET role='admin' WHERE id={uid}");token=call(c,'/api/admin/csrf.php')['data']['csrfToken']
 call(c,'/api/admin/hotels-create.php',body,403)
 for changes in [{'location_confirmed':False},{'location_confirmed':'true'},{'latitude':0,'longitude':0},{'latitude':'NaN'},{'latitude':371.9404},{'longitude':468.4583},{'latitude':None},{'google_place_id':'osm-N12345'},{'location_mode':'google'},{'address':''}]:
  call(c,'/api/admin/hotels-create.php',{**body,**changes},422,token)
 assert sql(f"SELECT COUNT(*) FROM hotels WHERE slug='{body['slug']}'")=='0'
 hid=int(call(c,'/api/admin/hotels-create.php',body,201,token)['data']['id']);hotels.append(hid)
 assert sql(f"SELECT CONCAT(maps_provider,':',google_place_id IS NULL,':',is_active) FROM hotels WHERE id={hid}")=='manual:1:0'
 assert sql(f'SELECT maps_verified_at IS NOT NULL FROM hotels WHERE id={hid}')=='1'
 assert float(sql(f'SELECT latitude FROM hotels WHERE id={hid}'))==11.9404
 print('PASS manual create requires admin/CSRF, valid in-city coordinates and boolean confirmation; no forged OSM ID')
 second=int(call(c,'/api/admin/hotels-create.php',{**body,'slug':'manual-second-'+run,'name':'Another Manual Hotel'},201,token)['data']['id']);hotels.append(second)
 print('PASS multiple manual businesses can coexist without fake provider IDs or unique-key collisions')
 update={'id':hid,'name':'Corrected Manual Hotel','type':'hotel','stars':4,'price_per_night':950000,'description':'Updated business','location_mode':'manual','latitude':11.95,'longitude':108.46,'address':'34 Corrected Test Street','location_confirmed':False}
 call(c,'/api/admin/hotels-update.php',update,422,token)
 assert sql(f'SELECT price_per_night FROM hotels WHERE id={hid}')=='900000.00'
 call(c,'/api/admin/hotels-update.php',{**update,'location_confirmed':True},token=token)
 assert sql(f'SELECT address FROM hotels WHERE id={hid}')=='34 Corrected Test Street'
 assert float(sql(f'SELECT longitude FROM hotels WHERE id={hid}'))==108.46
 call(c,'/api/admin/hotels-update.php',{**update,'location_mode':'keep','price_per_night':1000000},token=token)
 assert sql(f'SELECT address FROM hotels WHERE id={hid}')=='34 Corrected Test Street'
 print('PASS edits validate before mutating SQL, persist corrected coordinates and keep location on ordinary metadata edits')
 # An OSM building is an address, not a hotel; the server must reject relabeling it.
 fixture='''<?php require '/app/api/admin/places-service.php';
 $params=['osm_ids'=>'N999999999998','format'=>'jsonv2','addressdetails'=>1,'namedetails'=>1,'accept-language'=>'vi'];
 $url=NOMINATIM_URL.'lookup?'.http_build_query($params,'','&',PHP_QUERY_RFC3986);
 $p=['osm_type'=>'node','osm_id'=>999999999998,'lat'=>'11.9404','lon'=>'108.4583','class'=>'building','type'=>'yes','name'=>'Office Building','display_name'=>'12 Test Street, Dalat, Vietnam','address'=>['country_code'=>'vn']];
 osmCacheWrite(osmCacheDir().'/'.sha1('nominatim:'.$url).'.json',[$p]);
 '''
 subprocess.run(['docker','exec','-i',WEB,'php'],input=fixture.encode(),check=True)
 call(c,'/api/admin/hotels-create.php',{**body,'slug':'building-'+run,'location_mode':'osm','google_place_id':'osm-N999999999998','address':'12 Test Street, Dalat, Vietnam'},422,token)
 print('PASS address-only OSM object cannot silently become a verified lodging business')
 sql(f"INSERT INTO room_types(hotel_id,code,name,capacity,total_rooms,price_per_night,is_active) VALUES({hid},'standard','Manual Room',2,5,900000,1);UPDATE hotels SET is_active=1 WHERE id={hid}")
 public=call(client(),'/api/hotels/detail.php?slug='+body['slug'])['data']['hotel']
 assert float(public['latitude'])==11.95 and float(public['longitude'])==108.46
 print('PASS public hotel API returns the corrected persisted location')
finally:
 for hid in hotels:sql(f'DELETE FROM hotels WHERE id={hid}')
 if uid:sql(f'DELETE FROM audit_logs WHERE actor_id={uid};DELETE FROM users WHERE id={uid}')
 sql(f"DELETE FROM mail_outbox WHERE recipient='{email}';DELETE FROM registration_challenges WHERE email='{email}'")
