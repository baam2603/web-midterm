"""Username/email login regression checks on the isolated local Docker runtime."""
import http.cookiejar
import json
import secrets
import subprocess
import urllib.error
import urllib.request
from registration_helpers import test_sql as sql

URL='http://127.0.0.1:8001'
run=secrets.token_hex(8)
local='login-'+run
password='UsernameTest123!'
hash_value=subprocess.check_output(['docker','exec','web-midterm-admin-web','php','-r','echo password_hash($argv[1], PASSWORD_DEFAULT);',password],text=True)
users=[]
jar=http.cookiejar.CookieJar()
c=urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(jar))
def login(identifier,secret):
    req=urllib.request.Request(URL+'/api/auth/login.php',data=json.dumps({'email':identifier,'password':secret}).encode(),headers={'Content-Type':'application/json'})
    try:r=c.open(req)
    except urllib.error.HTTPError as e:r=e
    with r:return r.status,json.load(r)
try:
    email=local+'@example.invalid'
    sql(f"INSERT INTO users(email,password_hash,full_name,role) VALUES('{email}','{hash_value}','Username test','customer')")
    users.append(email)
    for identifier in [local,local.upper(),email]:
        status,result=login(identifier,password)
        assert status==200,(identifier,status,result)
        assert result['data']['user']['email']==email
    for identifier,secret in [(local,'wrong'),("' OR 1=1 -- ",password)]:
        assert login(identifier,secret)[0]==401
    second=local+'@other.invalid'
    sql(f"INSERT INTO users(email,password_hash,full_name,role) VALUES('{second}','{hash_value}','Other username test','customer')")
    users.append(second)
    assert login(local,password)[0]==401
    assert login(email,password)[0]==200
    assert login(second,password)[0]==200
    print('PASS username/email login, case normalization, wrong password, SQL payload and duplicate local-part rejection')
finally:
    for email in users:sql(f"DELETE FROM users WHERE email='{email}'")
