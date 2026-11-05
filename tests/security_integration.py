"""Controlled negative tests on the disposable local database, never a live target."""
import base64,hashlib,http.cookiejar,json,secrets,subprocess,urllib.request,urllib.error,urllib.parse
from security_client import protected_headers
URL='http://127.0.0.1:8001';DB='web-midterm-admin-db'
def sql(query):return subprocess.check_output(['docker','exec','-i',DB,'mariadb','-uroot','-N','threek_booking'],input=query.encode()).decode().strip()
def client():return urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def call(c,path,body=None,status=200,headers=None,raw=None):
 h={'Content-Type':'application/json',**(headers or {})}
 data=raw if raw is not None else (None if body is None else json.dumps(body).encode())
 req=urllib.request.Request(URL+path,data=data,headers=h)
 try:r=c.open(req,timeout=20)
 except urllib.error.HTTPError as e:r=e
 with r:
  result=json.load(r);assert r.status==status,(path,r.status,result)
  return result,r.headers
# This suite runs only on the named disposable test container/database.
sql('DELETE FROM security_rate_limits')
run=secrets.token_hex(6);email=f'security-{run}@example.invalid';password=secrets.token_urlsafe(20)+'A1';uid=hotel=None
c,other=client(),client();payload={'fullName':'Security Test','email':email,'password':password}
try:
 call(c,'/api/auth/register.php',payload,403)
 tokenHeaders=protected_headers(c,URL)
 call(c,'/api/auth/register.php',payload,201,tokenHeaders)
 uid=int(sql(f"SELECT id FROM users WHERE email='{email}'"))
 # The pre-auth token was invalidated by successful registration.
 call(c,'/api/account/update-profile.php',{'fullName':'Should not save'},403,tokenHeaders)
 valid=protected_headers(c,URL)
 call(c,'/api/account/update-profile.php',{'fullName':'Should not save'},403,protected_headers(other,URL))
 call(c,'/api/account/update-profile.php',{'fullName':'Should not save'},403,{'X-CSRF-Token':'invalid'})
 for origin in ['https://evil.invalid','null','http://127.0.0.1','https://127.0.0.1:8001']:
  call(c,'/api/account/update-profile.php',{'fullName':'Should not save'},403,{**valid,'Origin':origin})
 call(c,'/api/account/update-profile.php',{'fullName':'Should not save'},403,{**valid,'Sec-Fetch-Site':'cross-site'})
 call(c,'/api/account/update-profile.php',status=400,headers=valid,raw=b'{broken')
 call(c,'/api/account/update-profile.php',status=400,headers=valid,raw=b'[]')
 call(c,'/api/account/update-profile.php',status=413,headers=valid,raw=b' '*65537)
 call(c,'/api/auth/login.php',status=415,headers={**valid,'Content-Type':'application/x-www-form-urlencoded'},raw=b'email=test&password=test')
 assert sql(f'SELECT full_name FROM users WHERE id={uid}')=='Security Test'
 print('PASS missing, forged, other-session and rotated CSRF tokens cannot change SQL')
 print('PASS cross-site/null/wrong-port/wrong-scheme origins, malformed/oversized JSON and form-login rejected')
 _,headers=call(c,'/api/account/profile.php')
 assert headers['X-Content-Type-Options']=='nosniff' and headers['X-Frame-Options']=='DENY' and 'no-store' in headers['Cache-Control']
 assert 'Access-Control-Allow-Origin' not in headers
 call(c,'/api/db-check.php',status=403)
 call(client(),'/api/db-check.php',status=401)
 print('PASS private API headers and admin-only database diagnostics')
 call(c,'/api/auth/login.php',{'email':"' OR 1=1 --",'password':password},401,protected_headers(c,URL))
 call(c,'/api/hotels/detail.php?slug='+urllib.parse.quote("' OR 1=1 --"),status=400)
 assert sql(f'SELECT COUNT(*) FROM users WHERE id={uid}')=='1'
 print('PASS SQL injection input cannot authenticate or bypass catalog validation')
 # Simulate account attacks; no provider/network traffic, keys hashed as production does.
 bucket=hashlib.sha256(('login-account:'+email).encode()).hexdigest()
 sql(f"DELETE FROM security_rate_limits WHERE bucket='{bucket}'")
 for _ in range(10):call(c,'/api/auth/login.php',{'email':email,'password':'WrongPassword1'},401,protected_headers(c,URL))
 _,headers=call(c,'/api/auth/login.php',{'email':email,'password':password},429,{**protected_headers(c,URL),'X-Forwarded-For':'198.51.100.1'})
 assert int(headers['Retry-After'])>0
 sql(f"UPDATE security_rate_limits SET reset_at=UTC_TIMESTAMP()-INTERVAL 1 SECOND WHERE bucket='{bucket}'")
 call(c,'/api/auth/login.php',{'email':email,'password':password},headers=protected_headers(c,URL))
 assert sql(f"SELECT COUNT(*) FROM security_rate_limits WHERE bucket='{bucket}'")=='0'
 print('PASS persistent account rate limit, Retry-After, expiry and successful-login reset')
 # Upload authorization and MIME rejection use an isolated, temporary admin fixture.
 call(c,'/api/admin/rooms-create.php',{},403,protected_headers(c,URL))
 sql(f"UPDATE users SET role='admin' WHERE id={uid}")
 adminToken=call(c,'/api/admin/csrf.php')[0]['data']['csrfToken']
 sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,price_per_night,is_active) VALUES('security-{run}','Security Hotel','dalat','hotel',3,'Test Street',900000,1)")
 hotel=int(sql(f"SELECT id FROM hotels WHERE slug='security-{run}'"))
 for content in [b'<?php echo "test"; ?>',b'<svg xmlns="http://www.w3.org/2000/svg"><script>window.securityMarker=1</script></svg>']:
  boundary='Security'+secrets.token_hex(6)
  raw=(f'--{boundary}\r\nContent-Disposition: form-data; name="kind"\r\n\r\nhotel\r\n--{boundary}\r\nContent-Disposition: form-data; name="item_id"\r\n\r\n{hotel}\r\n--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="picture.png"\r\nContent-Type: image/png\r\n\r\n').encode()+content+f'\r\n--{boundary}--\r\n'.encode()
  call(c,'/api/admin/media-upload.php',status=422,headers={'Content-Type':'multipart/form-data; boundary='+boundary,'X-CSRF-Token':adminToken},raw=raw)
 assert sql(f'SELECT COUNT(*) FROM hotel_images WHERE hotel_id={hotel}')=='0'
 print('PASS customer cannot use admin writes; fake image/PHP/SVG uploads cannot persist')
finally:
 if hotel:sql(f'DELETE FROM hotels WHERE id={hotel}')
 if uid:sql(f'DELETE FROM audit_logs WHERE actor_id={uid};DELETE FROM users WHERE id={uid}')
 sql("DELETE FROM security_rate_limits WHERE bucket='"+hashlib.sha256(('login-account:'+email).encode()).hexdigest()+"'")
