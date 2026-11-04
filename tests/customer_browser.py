"""Real UI customer booking on SQL-only hotel/room codes. No live payment/email."""
import json,secrets,subprocess,urllib.request,os
from playwright.sync_api import sync_playwright
URL=os.environ.get('CUSTOMER_TEST_URL','http://127.0.0.1:8001');DB='web-midterm-admin-db'
def sql(q):return subprocess.check_output(['docker','exec','-i',DB,'mariadb','-uroot','-N','threek_booking'],input=q.encode()).decode().strip()
def api(path,body):
 req=urllib.request.Request(URL+path,data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(req) as r:return json.load(r)
run=secrets.token_hex(6);email=f'customer-browser-{run}@example.invalid';pw=secrets.token_urlsafe(20)+'A1';hotel=uid=None
try:
 api('/api/auth/register.php',{'fullName':'Browser Customer','email':email,'password':pw,'phone':'0900000000'});uid=int(sql(f"SELECT id FROM users WHERE email='{email}'"))
 sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,price_per_night,is_active) VALUES('customer-browser-{run}','SQL Browser Hotel {run}','dalat','hotel',4,'Browser Street',900000,1)")
 hotel=int(sql(f"SELECT id FROM hotels WHERE slug='customer-browser-{run}'"));sql(f"INSERT INTO room_types(hotel_id,code,name,capacity,total_rooms,price_per_night,free_cancellation,is_active) VALUES({hotel},'sql-only-room','SQL-only Room',2,5,900000,1,1)")
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=browser.new_context();ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(URL) else r.abort());page=ctx.new_page();page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(URL+'/auth/login.html',wait_until='domcontentloaded');page.locator('#email').fill(email);page.locator('#password').fill(pw);page.locator('button[type=submit]').click();page.wait_for_url('**/index1.html')
  prefix=urllib.parse.urlsplit(URL).path.rstrip('/')
  if prefix:
   assert any(cookie['name']=='THREEKSESSID' and cookie['path']==prefix+'/' for cookie in ctx.cookies());print('PASS PHP session cookie is scoped to the real project subdirectory')
  page.goto(URL+'/destinations/dalat.html',wait_until='domcontentloaded');card=page.locator(f'.hotel-card[data-id="customer-browser-{run}"]');card.wait_for();card.locator('.btn-fav').click();page.wait_for_function("document.querySelector('.btn-fav.is-saved') !== null")
  page.goto(URL+'/account/favorites.html',wait_until='domcontentloaded');page.get_by_text('SQL Browser Hotel '+run,exact=True).wait_for();print('PASS customer catalog and SQL favorites persist across pages')
  page.goto(URL+f'/hotel/hotel.html?city=dalat&id=customer-browser-{run}&checkin=2099-03-01&checkout=2099-03-03',wait_until='domcontentloaded');page.locator('[data-room=sql-only-room]').first.click();page.wait_for_url('**/hotel/Booking.html?*')
  page.locator('#booking-form').wait_for();page.locator('[name=phone]').fill('0912345678');page.locator('#booking-form button[type=submit]').click();page.wait_for_url('**/payment/payment.html')
  page.locator('#confirm-booking:not([disabled])').wait_for();
  if os.environ.get('CUSTOMER_TEST_OFFLINE')=='1':
   assert not page.locator('[name=method][value=online]').is_visible();print('PASS operation-only mode shows no online-payment option')
  page.locator('[name=terms]').check();page.locator('#confirm-booking').click();page.wait_for_url('**/payment/success.html?code=*');page.get_by_role('heading',name='Đã ghi nhận đặt phòng').wait_for();code=page.url.split('code=')[1]
  assert sql(f"SELECT COUNT(*) FROM bookings WHERE code='{code}' AND user_id={uid}")=='1';print('PASS SQL-only hotel → room → checkout → persistent success page')
  page.reload(wait_until='domcontentloaded');page.get_by_text(code,exact=True).wait_for();print('PASS success survives reload without localStorage booking')
  page.goto(URL+'/booking/detail.html?code='+code,wait_until='domcontentloaded');page.locator('#cancel-detail').wait_for();page.once('dialog',lambda d:d.accept());page.locator('#cancel-detail').click();page.wait_for_function("document.querySelector('.badge')?.textContent.includes('Đã hủy')")
  assert sql(f"SELECT status FROM bookings WHERE code='{code}'")=='cancelled';print('PASS customer cancellation and server status')
  page.goto(URL+'/account/notifications.html',wait_until='domcontentloaded');page.get_by_text('Đã hủy đặt phòng',exact=True).wait_for();print('PASS customer notifications from SQL')
  page.goto(URL+'/account/taikhoan.html',wait_until='domcontentloaded');page.locator('#fullname').fill('Updated Browser Customer');page.locator('#displayname').fill('Updated');page.locator('button[form=profile-form]').click();page.wait_for_function("document.getElementById('toast').textContent.includes('Đã lưu')");assert page.locator('#fullname').input_value()=='Updated Browser Customer';print('PASS profile save retains fields')
  assert not errors,errors;browser.close();print('PASS no customer JavaScript errors')
finally:
 if uid:
  sql(f'DELETE p FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE b.user_id={uid};DELETE FROM reviews WHERE user_id={uid};DELETE FROM bookings WHERE user_id={uid};')
  if hotel:sql(f'DELETE FROM hotels WHERE id={hotel}')
  sql(f"DELETE FROM mail_outbox WHERE recipient='{email}';DELETE FROM users WHERE id={uid}")
