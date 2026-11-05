"""Regression: room-selection/login continuity, stale responses and unavailable browser storage."""
import json,secrets,subprocess,urllib.request,urllib.parse
from playwright.sync_api import sync_playwright
URL='http://127.0.0.1:8001';DB='web-midterm-admin-db';WEB='web-midterm-admin-web'
def sql(q):return subprocess.check_output(['docker','exec','-i',DB,'mariadb','-uroot','-N','threek_booking'],input=q.encode()).decode().strip()
def register(email,pw):
 req=urllib.request.Request(URL+'/api/auth/register.php',data=json.dumps({'fullName':'Auth Regression','email':email,'password':pw,'phone':'0900000000'}).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(req) as r:assert r.status==201
run=secrets.token_hex(6);email=f'auth-{run}@example.invalid';password=secrets.token_urlsafe(18)+'A1';uid=hotel=None
try:
 register(email,password);uid=int(sql(f"SELECT id FROM users WHERE email='{email}'"));slug='auth-'+run
 sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,price_per_night,is_active) VALUES('{slug}','Auth Hotel','dalat','hotel',3,'Test street',900000,1)");hotel=int(sql(f"SELECT id FROM hotels WHERE slug='{slug}'"))
 sql(f"INSERT INTO room_types(hotel_id,code,name,capacity,total_rooms,price_per_night,is_active) VALUES({hotel},'standard','Auth Room',2,5,900000,1)")
 hotelPath=f'/hotel/hotel.html?city=dalat&id={slug}&checkin=2099-06-01&checkout=2099-06-03'
 bookingPath=f'/hotel/Booking.html?city=dalat&id={slug}&room=standard&checkin=2099-06-01&checkout=2099-06-03'
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  def context(routeHandler=None):
   # Respect the site's reduced-motion mode so header entrance animation does not race clicks.
   c=browser.new_context(reduced_motion="reduce");c.route('**/*',routeHandler or (lambda r:r.continue_() if r.request.url.startswith(URL) else r.abort()));return c
  # The real guest journey used to be missing from the end-to-end test.
  c=context();page=c.new_page();page.set_default_timeout(10000);page.goto(URL+hotelPath,wait_until='domcontentloaded');page.locator('[data-room=standard]').first.click();page.wait_for_url('**/auth/login.html?next=*');page.locator('#email').fill(email);page.locator('#password').fill(password);page.locator('[type=submit]').click();page.wait_for_url('**/hotel/Booking.html?*');page.locator('#booking-form').wait_for();assert page.locator('[name=email]').input_value()==email;print('PASS guest room selection → login → exact selected room retained');c.close()
  # Session cookie, empty browser cache, slow profile: clicking must wait instead of redirecting.
  held=[];counter=[0]
  def delayProfile(r):
   if not r.request.url.startswith(URL):r.abort();return
   if '/api/account/profile.php' in r.request.url and counter[0]==0:counter[0]+=1;held.append(r);return
   r.continue_()
  c=context(delayProfile);assert c.request.post(URL+'/api/auth/login.php',data={'email':email,'password':password}).ok
  page=c.new_page();page.set_default_timeout(10000);page.goto(URL+hotelPath,wait_until='domcontentloaded');page.locator('[data-room=standard]').first.click();assert '/hotel/hotel.html' in page.url;assert held;held[0].continue_();page.wait_for_url('**/hotel/Booking.html?*');page.locator('#booking-form').wait_for();print('PASS valid cookie + empty cache + delayed profile does not redirect to login');c.close()
  # A profile requested before login may answer 401 after the new login succeeds.
  held=[];counter=[0]
  c=context(delayProfile);page=c.new_page();page.goto(URL+'/auth/login.html',wait_until='domcontentloaded')
  page.evaluate("([email,password])=>{window.loginResult=null;window.loginDone=loginUser(email,password).then(u=>window.loginResult=u).catch(e=>window.loginFailure=e.message);return true;}",[email,password]);page.wait_for_function('window.loginResult !== null')
  held[0].fulfill(status=401,content_type='application/json',body=json.dumps({'status':'error','message':'Vui lòng đăng nhập lại.'}));page.wait_for_function('getCurrentUser() !== null');assert page.evaluate('getCurrentUser().email')==email;assert page.evaluate('async()=> (await window.authReady).email')==email;print('PASS stale pre-login 401 cannot clear the new authenticated session');c.close()
  # localStorage is optional. PHP cookie and memory must be sufficient to book.
  c=context();c.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage blocked','SecurityError')}})");page=c.new_page();page.goto(URL+'/auth/login.html?next='+urllib.parse.quote(bookingPath,safe=''),wait_until='domcontentloaded');page.locator('#email').fill(email);page.locator('#password').fill(password);page.locator('[type=submit]').click();page.wait_for_url('**/hotel/Booking.html?*');page.locator('#booking-form').wait_for();print('PASS login and selected-room navigation work with localStorage blocked');c.close()
  # A broken backend must show an error and never masquerade as a logged-out visitor.
  def brokenProfile(r):
   if not r.request.url.startswith(URL):r.abort();return
   if '/api/account/profile.php' in r.request.url:r.fulfill(status=503,content_type='application/json',body=json.dumps({'status':'error','code':'database_upgrade_required','message':'Cần cập nhật database/customer_migration.sql'}));return
   r.continue_()
  c=context(brokenProfile);page=c.new_page();page.goto(URL+bookingPath,wait_until='domcontentloaded');page.get_by_text('Cần cập nhật database/customer_migration.sql',exact=True).wait_for();assert '/hotel/Booking.html' in page.url
  page.goto(URL+'/auth/login.html',wait_until='domcontentloaded');page.locator('#email').fill(email);page.locator('#password').fill(password);page.locator('[type=submit]').click();page.locator('#login-status').filter(has_text='customer_migration.sql').wait_for();assert '/auth/login.html' in page.url;print('PASS migration failure is explicit; no login/booking redirect loop');c.close()
  # Login must not navigate on bad credentials or when the cookie is not retained.
  c=context();page=c.new_page();page.goto(URL+'/auth/login.html',wait_until='domcontentloaded');page.locator('#email').fill(email);page.locator('#password').fill(password+'wrong');page.locator('[type=submit]').click();page.locator('#login-status').filter(has_text='Email hoặc mật khẩu').wait_for();assert '/auth/login.html' in page.url;print('PASS incorrect credentials stay on login with a visible error');c.close()
  loginSent=[False]
  def noLoginCookie(r):
   if not r.request.url.startswith(URL):r.abort();return
   if '/api/auth/login.php' in r.request.url:loginSent[0]=True;r.continue_();return
   if '/api/account/profile.php' in r.request.url and loginSent[0]:r.fulfill(status=401,content_type='application/json',body=json.dumps({'status':'error','message':'Vui lòng đăng nhập lại.'}));return
   r.continue_()
  c=context(noLoginCookie);page=c.new_page();page.set_default_timeout(10000);page.goto(URL+'/auth/login.html',wait_until='domcontentloaded');page.locator('#email').fill(email);page.locator('#password').fill(password);page.locator('[type=submit]').click();page.locator('#login-status').filter(has_text='Không giữ được phiên đăng nhập').wait_for();assert '/auth/login.html' in page.url;print('PASS rejected session verification is explained before redirecting');c.close()
  # Reproduce XAMPP subfolder hosting using a local reverse-proxy route.
  prefix='/course-project'
  def subfolder(r):
   parsed=urllib.parse.urlsplit(r.request.url)
   if not r.request.url.startswith(URL):r.abort();return
   if parsed.path.startswith(prefix+'/'):
    result=r.fetch(url=URL+parsed.path[len(prefix):]+('?' + parsed.query if parsed.query else ''));r.fulfill(response=result);return
   r.continue_()
  c=context(subfolder);page=c.new_page();page.goto(URL+prefix+hotelPath,wait_until='domcontentloaded');page.locator('[data-room=standard]').first.click();page.wait_for_url('**/course-project/auth/login.html?next=*');page.locator('#email').fill(email);page.locator('#password').fill(password);page.locator('[type=submit]').click();page.wait_for_url('**/course-project/hotel/Booking.html?*');page.locator('#booking-form').wait_for();print('PASS login return URL works under an Apache/XAMPP-style project subfolder');c.close()
  # Submit the redesigned registration form, then log out through the header.
  registrationEmail=f'registration-{run}@example.invalid'
  c=context();page=c.new_page();page.set_default_timeout(10000)
  try:
   page.goto(URL+'/auth/register.html',wait_until='domcontentloaded')
   for selector,value in [('#text_ho','Auth'),('#text_ten','Registration'),('#email',registrationEmail),('#text','0900000000'),('#password',password),('#confirm_password',password)]:page.locator(selector).fill(value)
   for selector,value in [('#day-select','1'),('#month-select','1'),('#year-select','2000'),('#gender-select','male')]:page.locator(selector).select_option(value)
   page.locator('[type=submit]').click();page.wait_for_url('**/index1.html')
   assert sql(f"SELECT COUNT(*) FROM users WHERE email='{registrationEmail}'")=='1'
   page.locator('#avatarBtn').click();page.locator('#logoutBtn').click()
   page.locator('#guest-actions').wait_for(state='visible')
   assert c.request.get(URL+'/api/account/profile.php').status==401
   print('PASS redesigned registration saves SQL account and header logout invalidates session')
  finally:
   c.close();sql(f"DELETE FROM users WHERE email='{registrationEmail}'")
  # The redesigned login must preserve role routing and its password toggle.
  c=context();page=c.new_page();page.set_default_timeout(10000)
  page.goto(URL+'/auth/login.html',wait_until='domcontentloaded')
  page.locator('#password').fill(password);page.locator('.password-eye-button').click()
  assert page.locator('#password').get_attribute('type')=='text'
  assert page.locator('.password-eye-button').get_attribute('aria-pressed')=='true'
  page.locator('.password-eye-button').click();assert page.locator('#password').get_attribute('type')=='password'
  sql(f"UPDATE users SET role='admin' WHERE id={uid}")
  try:
   page.locator('#email').fill(email);page.locator('[type=submit]').click()
   page.wait_for_url('**/admin/index.html');page.locator('#tk-admin-app').wait_for(state='visible')
   print('PASS redesigned login keeps password toggle and verified admin dashboard routing')
  finally:sql(f"UPDATE users SET role='customer' WHERE id={uid}")
  c.close()
  # Customers cannot use the return URL to enter the admin area.
  c=context();page=c.new_page();page.set_default_timeout(10000)
  page.goto(URL+'/auth/login.html?next=/admin/index.html',wait_until='domcontentloaded')
  page.locator('#email').fill(email);page.locator('#password').fill(password);page.locator('[type=submit]').click()
  page.locator('#login-status').filter(has_text='không có quyền quản trị').wait_for()
  assert '/auth/login.html' in page.url;print('PASS customer admin return URL shows an explicit permission error');c.close()
  browser.close()
finally:
 if uid:
  sql(f'DELETE FROM bookings WHERE user_id={uid};')
  if hotel:sql(f'DELETE FROM hotels WHERE id={hotel};')
  sql(f"DELETE FROM mail_outbox WHERE recipient='{email}';DELETE FROM users WHERE id={uid};")
