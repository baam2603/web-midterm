from registration_helpers import register_test_user, read_registration_otp
"""Cookie/session lifecycle against the disposable PHP/MariaDB test environment."""
import http.cookiejar,json,os,secrets,subprocess,urllib.request,urllib.error,urllib.parse
URL=os.environ.get('SESSION_TEST_URL','http://127.0.0.1:8001')
DB='web-midterm-admin-db'
WEB=os.environ.get('SESSION_TEST_WEB','web-midterm-admin-web')
APP=os.environ.get('SESSION_TEST_ROOT','/app')
def sql(query):
 return subprocess.check_output(['docker','exec','-i',DB,'mariadb','-uroot','-N','threek_booking'],input=query.encode()).decode().strip()
def client():
 jar=http.cookiejar.CookieJar()
 return urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(jar)),jar
def request(c,path,body=None,status=200,cookie=None):
 headers={'Content-Type':'application/json'}
 if cookie:headers['Cookie']='THREEKSESSID='+cookie
 req=urllib.request.Request(URL+path,data=None if body is None else json.dumps(body).encode(),headers=headers)
 try:response=c.open(req,timeout=15)
 except urllib.error.HTTPError as error:response=error
 with response:
  result=json.load(response);assert response.status==status,(path,response.status,result)
  return result,response.headers

def sid(jar):return next(c.value for c in jar if c.name=='THREEKSESSID')
def replay(value):
 opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
 request(opener,'/api/account/profile.php',status=401,cookie=value)
# Inspect actual PHP configuration for HTTP/HTTPS and a XAMPP-style subdirectory.
for https,path,scope in [('off','/api/auth/login.php','/'),('on','/api/auth/login.php','/'),('on','/3kbooking_midterm/api/auth/login.php','/3kbooking_midterm/')]:
 code="<?php $_SERVER['HTTPS']="+json.dumps(https)+";$_SERVER['SCRIPT_NAME']="+json.dumps(path)+";require "+json.dumps(APP+'/api/config/session.php')+";echo json_encode(['cookie'=>session_get_cookie_params(),'strict'=>ini_get('session.use_strict_mode'),'onlyCookies'=>ini_get('session.use_only_cookies'),'transSid'=>ini_get('session.use_trans_sid')]);"
 params=json.loads(subprocess.check_output(['docker','exec','-i',WEB,'php'],input=code.encode()))
 assert params['cookie']=={'lifetime':0,'path':scope,'domain':'','secure':https=='on','httponly':True,'samesite':'Lax'}
 assert params['strict']=='1' and params['onlyCookies']=='1' and params['transSid']=='0'
print('PASS explicit cookie policy on HTTP, HTTPS and project subdirectory (PHP configuration)')
run=secrets.token_hex(6);email=f'session-{run}@example.invalid';pw=secrets.token_urlsafe(20)+'A1';uid=None
try:
 c,jar=client();_,headers=request(c,'/api/account/profile.php',status=401)
 anonymous=sid(jar);cookie=headers.get('Set-Cookie','')
 assert 'HttpOnly' in cookie and 'SameSite=Lax' in cookie and 'expires=' not in cookie.lower()
 expected_path=urllib.parse.urlsplit(URL).path.rstrip('/')+'/'
 assert next(k.path for k in jar if k.name=='THREEKSESSID')==expected_path
 assert not next(k.domain_specified for k in jar if k.name=='THREEKSESSID')
 print('PASS host-only session cookie has HttpOnly, SameSite=Lax and project-scoped path')
 _,headers=register_test_user({'fullName':'Session Test','email':email,'password':pw,'phone':'0900000000'},URL,c)
 uid=int(sql(f"SELECT id FROM users WHERE email='{email}'"));registered=sid(jar)
 assert registered!=anonymous and 'no-store' in headers.get('Cache-Control','')
 replay(anonymous);print('PASS registration rotates anonymous session; old cookie cannot authenticate')
 _,headers=request(c,'/api/auth/login.php',{'email':email,'password':pw});logged=sid(jar)
 assert logged!=registered and 'no-store' in headers.get('Cache-Control','')
 replay(registered)
 assert request(c,'/api/account/profile.php')[0]['data']['user']['email']==email
 print('PASS login rotates session; new cookie restores authenticated profile')
 guest,_=client();request(guest,'/api/account/profile.php?THREEKSESSID='+logged,status=401)
 forged=secrets.token_hex(16);_,headers=request(guest,'/api/account/profile.php',status=401,cookie=forged)
 assert forged not in headers.get('Set-Cookie','')
 print('PASS URL session IDs and unknown injected cookie IDs cannot authenticate')
 sql(f"UPDATE users SET role='admin' WHERE id={uid}")
 token=request(c,'/api/admin/csrf.php')[0]['data']['csrfToken']
 request(c,'/api/auth/login.php',{'email':email,'password':pw})
 assert request(c,'/api/admin/csrf.php')[0]['data']['csrfToken']!=token
 sql(f"UPDATE users SET role='customer' WHERE id={uid}")
 print('PASS re-authentication clears prior admin CSRF state')

 other,otherJar=client();request(other,'/api/auth/login.php',{'email':email,'password':pw});otherId=sid(otherJar)
 beforePasswordChange=sid(jar)
 newPw=secrets.token_urlsafe(20)+'A2';request(c,'/api/account/change-password.php',{'currentPassword':pw,'newPassword':newPw})
 assert sid(jar)!=beforePasswordChange;replay(beforePasswordChange)
 _,headers=request(other,'/api/account/profile.php',status=401)
 assert 'Max-Age=0' in headers.get('Set-Cookie','') and not list(otherJar)
 replay(otherId)
 assert request(c,'/api/account/profile.php')[0]['data']['user']['email']==email
 print('PASS password change retains current login and destroys revoked sessions/cookies')
 current=sid(jar);_,headers=request(c,'/api/account/logout.php',{})
 assert not list(jar) and 'Max-Age=0' in headers.get('Set-Cookie','') and 'SameSite=Lax' in headers.get('Set-Cookie','')
 replay(current);request(c,'/api/account/profile.php',status=401)
 print('PASS logout removes browser cookie and server session; replay fails')
 request(c,'/api/auth/login.php',{'email':email,'password':newPw});current=sid(jar)
 request(c,'/api/account/delete-account.php',{'password':newPw})
 assert not list(jar);replay(current)
 assert sql(f'SELECT COUNT(*) FROM users WHERE id={uid} AND deleted_at IS NOT NULL')=='1'
 print('PASS account closure anonymizes user and removes server session/browser cookie')
finally:
 if uid:sql(f'DELETE FROM audit_logs WHERE actor_id={uid};DELETE FROM users WHERE id={uid}')
