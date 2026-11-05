"""Real UI: active order blocks closure, cancel it, then close and revoke the other tab."""
import json,secrets,subprocess
from playwright.sync_api import sync_playwright
from registration_helpers import register_test_user
URL='http://127.0.0.1:8001';DB='web-midterm-admin-db'
def sql(query):return subprocess.check_output(['docker','exec','-i',DB,'mariadb','-uroot','-N','threek_booking'],input=query.encode()).decode().strip()
run=secrets.token_hex(6);email=f'close-browser-{run}@example.invalid';password=secrets.token_urlsafe(20)+'A1';uid=hotel=None
try:
 register_test_user({'fullName':'Closure Browser','email':email,'password':password,'phone':'0912345678'},URL);uid=int(sql(f"SELECT id FROM users WHERE email='{email}'"))
 sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,price_per_night,is_active) VALUES('close-browser-{run}','Closure Browser Hotel','dalat','hotel',3,'Test Street',900000,1)");hotel=int(sql(f"SELECT id FROM hotels WHERE slug='close-browser-{run}'"))
 sql(f"INSERT INTO room_types(hotel_id,code,name,capacity,total_rooms,price_per_night,free_cancellation,is_active) VALUES({hotel},'standard','Closure Browser Room',2,5,900000,1,1)");room=int(sql(f'SELECT id FROM room_types WHERE hotel_id={hotel}'))
 code='CLOSE-BROWSER-'+run
 sql(f"INSERT INTO bookings(code,user_id,hotel_id,room_type_id,checkin,checkout,rooms,guests,total,status,pay_method,payment_status,refundable) VALUES('{code}',{uid},{hotel},{room},'2099-04-01','2099-04-02',1,2,990000,'confirmed','hotel','unpaid',1)")
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=browser.new_context();ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(URL) else r.abort());page=ctx.new_page();page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(URL+'/auth/login.html',wait_until='domcontentloaded');page.locator('#email').fill(email);page.locator('#password').fill(password);page.locator('[type=submit]').click();page.wait_for_url('**/index1.html')
  other=ctx.new_page();other.goto(URL+'/account/taikhoan.html',wait_until='domcontentloaded');other.locator('#fullname').wait_for()
  page.goto(URL+'/account/taikhoan.html',wait_until='domcontentloaded');page.locator('#fullname').wait_for()
  page.on('dialog',lambda dialog:dialog.accept(password) if dialog.type=='prompt' else dialog.accept())
  page.locator('#delete-account-btn').click();page.locator('#profile-error').filter(has_text='Bạn còn đơn').wait_for()
  assert sql(f'SELECT deleted_at IS NULL FROM users WHERE id={uid}')=='1'
  print('PASS closure button explains active bookings without changing account or UI layout')
  page.goto(URL+'/booking/detail.html?code='+code,wait_until='domcontentloaded');page.locator('#cancel-detail').click();page.wait_for_function("document.querySelector('.badge')?.textContent.includes('Đã hủy')")
  page.goto(URL+'/account/taikhoan.html',wait_until='domcontentloaded');page.locator('#fullname').wait_for()
  page.evaluate("sessionStorage.setItem('threek_checkout',JSON.stringify({email:'private@example.invalid',note:'private draft'}))")
  page.locator('#delete-account-btn').click();page.wait_for_url('**/index1.html')
  assert sql(f'SELECT deleted_at IS NOT NULL FROM users WHERE id={uid}')=='1'
  assert page.evaluate("sessionStorage.getItem('threek_checkout')===null && localStorage.getItem('threek_demo_session_v1')===null")
  other.reload(wait_until='domcontentloaded');other.wait_for_url('**/auth/login.html?next=*')
  assert sql(f"SELECT COUNT(*) FROM bookings WHERE code='{code}' AND status='cancelled'")=='1'
  assert not errors,errors
  print('PASS cancelled hotel-pay booking allows UI closure; private draft/cache cleared, other tab logged out, history retained')
  browser.close()
finally:
 if uid:sql(f'DELETE FROM reviews WHERE user_id={uid};DELETE FROM bookings WHERE user_id={uid};DELETE FROM audit_logs WHERE actor_id={uid};DELETE FROM users WHERE id={uid}')
 if hotel:sql(f'DELETE FROM hotels WHERE id={hotel}')
 sql(f"DELETE FROM mail_outbox WHERE recipient='{email}';DELETE FROM registration_challenges WHERE email='{email}'")
