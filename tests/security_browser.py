"""Stored/reflected XSS and forged browser role checks using fake local records."""
import json,re,secrets,subprocess,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
from security_client import protected_headers
URL='http://127.0.0.1:8001';DB='web-midterm-admin-db';ROOT=Path(__file__).resolve().parents[1]
def sql(query):return subprocess.check_output(['docker','exec','-i',DB,'mariadb','-uroot','-N','threek_booking'],input=query.encode()).decode().strip()
run=secrets.token_hex(6);email=f'xss-{run}@example.invalid';password=secrets.token_urlsafe(20)+'A1';uid=hotel=None
payload='<img src=x onerror="window.securityMarker=1">'
literal=payload.replace("'","''")
try:
 c=urllib.request.build_opener(urllib.request.ProxyHandler({}))
 req=urllib.request.Request(URL+'/api/auth/register.php',data=json.dumps({'fullName':'Security Browser','email':email,'password':password}).encode(),headers=protected_headers(c,URL))
 with c.open(req) as response:assert response.status==201
 uid=int(sql(f"SELECT id FROM users WHERE email='{email}'"))
 sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,price_per_night,is_active) VALUES('xss-{run}','{literal}','dalat','hotel',3,'Test Street',900000,1)")
 hotel=int(sql(f"SELECT id FROM hotels WHERE slug='xss-{run}'"))
 sql(f"INSERT INTO room_types(hotel_id,code,name,capacity,total_rooms,price_per_night,is_active) VALUES({hotel},'standard','Security Room',2,5,900000,1)")
 room=int(sql(f'SELECT id FROM room_types WHERE hotel_id={hotel}'))
 sql(f"INSERT INTO bookings(code,user_id,hotel_id,room_type_id,checkin,checkout,rooms,guests,total,status) VALUES('xss-{run}',{uid},{hotel},{room},'2020-01-01','2020-01-02',1,2,900000,'completed')")
 booking=int(sql(f"SELECT id FROM bookings WHERE code='xss-{run}'"))
 sql(f"INSERT INTO reviews(booking_id,user_id,hotel_id,score,comment,status) VALUES({booking},{uid},{hotel},5,'{literal}','approved')")
 csp=re.search(r'Header always set Content-Security-Policy "([^"]+)"',(ROOT/'.htaccess').read_text()).group(1)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=browser.new_context()
  def route(r):
   if not r.request.url.startswith(URL):r.abort();return
   if r.request.resource_type=='document':
    response=r.fetch();r.fulfill(response=response,headers={**response.headers,'Content-Security-Policy':csp})
   else:r.continue_()
  ctx.route('**/*',route);page=ctx.new_page();page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  ctx.add_init_script("window.securityViolations=[];document.addEventListener('securitypolicyviolation',e=>securityViolations.push(e.violatedDirective));")
  page.goto(URL+'/auth/login.html',wait_until='domcontentloaded');page.locator('#email').fill(email);page.locator('#password').fill(password);page.locator('[type=submit]').click();page.wait_for_url('**/index1.html')
  assert page.evaluate("async payload=>{await authReady;await updateProfile({fullName:payload,displayName:'<b>Test</b>',phone:'0900000000',birthday:''});return true}",payload)
  page.goto(URL+'/account/taikhoan.html',wait_until='domcontentloaded');page.locator('#fullname').wait_for();page.wait_for_function("document.querySelector('#profile-name')?.textContent==='<b>Test</b>'")
  assert page.locator('#profile-name b').count()==0
  page.goto(URL+f'/hotel/hotel.html?city=dalat&id=xss-{run}',wait_until='domcontentloaded');page.locator('#reviews article p').filter(has_text=payload).wait_for()
  assert page.locator('#reviews img').count()==0 and page.locator('.hotel-title h1 img').count()==0
  assert page.evaluate('window.securityMarker===undefined')
  assert not page.evaluate('window.securityViolations'),page.evaluate('window.securityViolations')
  print('PASS stored hotel/review/profile HTML renders as text under the production CSP baseline')
  page.goto(URL+'/support/index.html',wait_until='domcontentloaded')
  page.evaluate("async message=>{await authReady;const r=await apiFetch('../api/support/tickets.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:'Security test',message})});if(!r.ok)throw Error('ticket failed');}",payload)
  page.reload(wait_until='domcontentloaded');page.locator('#tk-ticket-list p').filter(has_text=payload).wait_for()
  assert page.locator('#tk-ticket-list img').count()==0 and page.evaluate('window.securityMarker===undefined')
  print('PASS stored support XSS cannot execute')
  page.evaluate("localStorage.setItem('threek_demo_session_v1',JSON.stringify({id:1,role:'admin',name:'Forged'}))")
  page.goto(URL+'/admin/index.html',wait_until='domcontentloaded');page.locator('#tk-admin-gate').wait_for();page.wait_for_function("document.querySelector('#tk-admin-gate-message')?.textContent.includes('quyền')")
  assert not page.locator('#tk-admin-app').is_visible()
  assert page.evaluate("async()=> (await fetch('../api/admin/me.php')).status")==403
  assert not errors,errors
  print('PASS forged localStorage admin role cannot open admin or authorize its API');browser.close()
finally:
 if uid:
  sql(f'DELETE FROM reviews WHERE user_id={uid};DELETE FROM bookings WHERE user_id={uid}')
  if hotel:sql(f'DELETE FROM hotels WHERE id={hotel}')
  sql(f'DELETE FROM users WHERE id={uid}')
