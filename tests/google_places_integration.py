"""Google Maps/Places contract and permission tests using only local fixtures."""
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
run=secrets.token_hex(6);email=f'google-{run}@example.invalid';pw=secrets.token_urlsafe(20)+'A1';uid=hotel=duplicate=None
c,guest=client(),client()
try:
 call(guest,'/api/admin/places-search.php?q=hotel&city=dalat',status=401)
 register_test_user({'email':email,'password':pw,'fullName':'Google Test'},URL,c);uid=int(sql(f"SELECT id FROM users WHERE email='{email}'"))
 call(c,'/api/admin/places-search.php?q=hotel&city=dalat',status=403)
 sql(f"UPDATE users SET role='admin' WHERE id={uid}")
 public=call(guest,'/api/maps/config.php')['data'];assert public['browserKey']=='test-only-browser-key' and 'test-only-places-key' not in json.dumps(public)
 print('PASS browser key config is public, server Places key never returned; admin search permission enforced')
 results=call(c,'/api/admin/places-search.php?q=hotel&city=dalat')['data']['places']
 assert len(results)==2 and any(p['canSelect'] and p['placeId']=='ChIJFixtureHotelDalat123' for p in results) and any(not p['canSelect'] for p in results)
 call(c,'/api/admin/places-verify.php?place_id=ChIJFixtureStreetDalat123&city=dalat',status=422)
 call(c,'/api/admin/places-verify.php?place_id=ChIJFixtureOutside123&city=dalat',status=422)
 call(c,'/api/admin/places-verify.php?place_id=osm-W12345&city=dalat',status=422)
 call(c,'/api/admin/places-nearby.php?city=dalat&lat=0&lng=0',status=422)
 nearby=call(c,'/api/admin/places-nearby.php?city=dalat&lat=11.9404&lng=108.4583')['data']['places'];assert len(nearby)==1
 assert call(c,'/api/admin/places-search.php?q=NO_RESULTS&city=dalat')['data']['places']==[]
 print('PASS search/nearby honor Google New contract; streets, old OSM IDs and wrong-city results cannot verify')
 token=call(c,'/api/admin/csrf.php')['data']['csrfToken']
 body={'slug':'google-'+run,'name':'Browser Google Hotel','city':'dalat','type':'hotel','stars':3,'address':'12 Test Street, Đà Lạt, Việt Nam','google_place_id':'ChIJFixtureHotelDalat123','price_per_night':900000,'description':''}
 call(c,'/api/admin/hotels-create.php',body,status=403)
 call(c,'/api/admin/hotels-create.php',{**body,'address':'Wrong address'},422,token)
 call(c,'/api/admin/hotels-create.php',{**body,'google_place_id':'ChIJFixtureStreetDalat123'},422,token)
 hotel=int(call(c,'/api/admin/hotels-create.php',body,201,token)['data']['id'])
 assert sql(f"SELECT CONCAT(google_place_id,':',maps_provider,':',is_active) FROM hotels WHERE id={hotel}")=='ChIJFixtureHotelDalat123:google:0'
 assert sql(f'SELECT maps_verified_at IS NOT NULL FROM hotels WHERE id={hotel}')=='1'
 assert float(sql(f'SELECT latitude FROM hotels WHERE id={hotel}'))==11.9404
 print('PASS create re-verifies Google ID/address on server and persists canonical coordinates/provenance in SQL')
 # Existing OSM record stays editable, but explicit re-verification upgrades its location.
 sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,google_place_id,price_per_night,maps_provider) VALUES('google-legacy-{run}','Legacy Hotel','dalat','hotel',3,'Old Address','osm-W987654321',700000,'osm')")
 duplicate=int(sql(f"SELECT id FROM hotels WHERE slug='google-legacy-{run}'"))
 update={'id':duplicate,'name':'Legacy Hotel','type':'hotel','stars':3,'price_per_night':700000,'description':''}
 call(c,'/api/admin/hotels-update.php',update,token=token)
 assert sql(f'SELECT google_place_id FROM hotels WHERE id={duplicate}')=='osm-W987654321'
 call(c,'/api/admin/hotels-update.php',{**update,'new_place_id':'ChIJFixtureHotelDalat123','price_per_night':800000},409,token)
 assert sql(f'SELECT price_per_night FROM hotels WHERE id={duplicate}')=='700000.00'
 sql(f'DELETE FROM hotels WHERE id={hotel}');hotel=None
 call(c,'/api/admin/hotels-update.php',{**update,'new_place_id':'ChIJFixtureHotelDalat123'},token=token)
 assert sql(f"SELECT CONCAT(maps_provider,':',google_place_id) FROM hotels WHERE id={duplicate}")=='google:ChIJFixtureHotelDalat123'
 print('PASS legacy data is preserved until re-verified; duplicate Google locations roll back the entire edit')
 # Missing configuration must fail closed, without an outbound call or exposing any credential.
 code="$_SERVER['REQUEST_METHOD']='GET';require '/app/api/maps/config.php';"
 raw=subprocess.check_output(['docker','exec','-e','GOOGLE_MAPS_BROWSER_KEY=',WEB,'php','-r',code],text=True)
 assert json.loads(raw)['status']=='error' and 'test-only-places-key' not in raw
 print('PASS missing browser configuration returns a safe actionable error')
finally:
 for hid in [hotel,duplicate]:
  if hid:sql(f'DELETE FROM hotels WHERE id={hid}')
 if uid:sql(f'DELETE FROM audit_logs WHERE actor_id={uid};DELETE FROM users WHERE id={uid}')
 sql(f"DELETE FROM registration_challenges WHERE email='{email}';DELETE FROM mail_outbox WHERE recipient='{email}'")
