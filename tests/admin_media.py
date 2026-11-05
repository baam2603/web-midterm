from security_client import protected_headers
"""Upload/cover/delete integration test, isolated admin test server only."""
import json,secrets,subprocess,urllib.request,http.cookiejar,base64
URL='http://127.0.0.1:8001';DB='web-midterm-admin-db'
def sql(q):return subprocess.check_output(['docker','exec','-i',DB,'mariadb','-uroot','-N','threek_booking'],input=q.encode()).decode().strip()
c=urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def call(path,body=None,token=None):
 h={'Content-Type':'application/json'}
 if body is not None:h=protected_headers(c,URL,h)
 if token:h['X-CSRF-Token']=token
 with c.open(urllib.request.Request(URL+path,data=None if body is None else json.dumps(body).encode(),headers=h)) as r:return json.load(r)
run=secrets.token_hex(6);email=f'media-{run}@example.invalid';pw=secrets.token_urlsafe(18)+'A1';uid=None;hotel=None
try:
 call('/api/auth/register.php',{'fullName':'Media Test','email':email,'password':pw});uid=int(sql(f"SELECT id FROM users WHERE email='{email}';"));sql(f"UPDATE users SET role='admin' WHERE id={uid}")
 call('/api/auth/login.php',{'email':email,'password':pw});token=call('/api/admin/csrf.php')['data']['csrfToken']
 sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,price_per_night,is_active) VALUES('media-{run}','Media Test','dalat','hotel',3,'Test Street',900000,1)");hotel=int(sql(f"SELECT id FROM hotels WHERE slug='media-{run}'"))
 images=[]
 for n in range(2):
  boundary='Boundary'+secrets.token_hex(12)
  data=b''
  for name,value in [('kind','hotel'),('item_id',str(hotel))]:data+=f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
  data+=f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jz1sAAAAASUVORK5CYII=')+f'\r\n--{boundary}--\r\n'.encode()
  with c.open(urllib.request.Request(URL+'/api/admin/media-upload.php',data=data,headers={'Content-Type':'multipart/form-data; boundary='+boundary,'X-CSRF-Token':token})) as r:images.append(json.load(r)['data'])
 assert len(call(f'/api/admin/media.php?kind=hotel&id={hotel}')['data'])==2
 call('/api/admin/media.php',{'kind':'hotel','item_id':hotel,'id':images[1]['id'],'action':'cover'},token)
 assert int(sql(f"SELECT is_cover FROM hotel_images WHERE id={images[1]['id']}"))==1
 for im in images:
  with c.open(URL+'/'+im['image_path']) as r:assert r.status==200
  call('/api/admin/media.php',{'kind':'hotel','item_id':hotel,'id':im['id'],'action':'delete'},token)
 assert call(f'/api/admin/media.php?kind=hotel&id={hotel}')['data']==[]
 print('PASS upload, SQL image metadata, serving, cover change and deletion')
finally:
 if hotel:sql(f'DELETE FROM hotels WHERE id={hotel}')
 if uid:sql(f'DELETE FROM audit_logs WHERE actor_id={uid}; DELETE FROM users WHERE id={uid}')
