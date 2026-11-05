from registration_helpers import register_test_user, read_registration_otp
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
 register_test_user({'fullName':'Browser Customer','email':email,'password':pw,'phone':'0900000000'},URL);uid=int(sql(f"SELECT id FROM users WHERE email='{email}'"))
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
  search_query=urllib.parse.urlencode({'street':'SQL Browser Hotel '+run,'checkin':'2099-03-01','checkout':'2099-03-03','adults':2,'rooms':1,'sort':1,'stars':'4','maxPrice':1400000,'guestFilter':1})
  page.goto(URL+'/destinations/dalat.html?'+search_query,wait_until='domcontentloaded')
  page.locator(f'.hotel-card[data-id="customer-browser-{run}"] .btn-view').click();page.wait_for_url('**/hotel/hotel.html?*')
  page.locator('#back-to-hotels').click();page.wait_for_url('**/destinations/dalat.html?*')
  page.locator(f'.hotel-card[data-id="customer-browser-{run}"]').wait_for()
  assert page.locator('#street').input_value()=='SQL Browser Hotel '+run
  assert page.locator('[data-group=stars][value="4"]').is_checked()
  assert page.locator('.results-head select').evaluate('(el)=>el.selectedIndex')==1
  assert '2099' in urllib.parse.unquote(page.url)
  page.locator(f'.hotel-card[data-id="customer-browser-{run}"] .btn-view').click();page.wait_for_url('**/hotel/hotel.html?*')
  page.locator('[data-room=sql-only-room]').first.click();page.wait_for_url('**/hotel/Booking.html?*')
  page.locator('[name=phone]').fill('0912345678');page.locator('[data-f=note]').fill('Keep my navigation draft')
  page.locator('[data-hotel-return]').last.click();page.wait_for_url('**/hotel/hotel.html?*')
  assert urllib.parse.parse_qs(urllib.parse.urlsplit(page.url).query)['checkin']==['2099-03-01']
  page.locator('[data-room=sql-only-room]').first.click();page.wait_for_url('**/hotel/Booking.html?*')
  page.locator('#booking-form').wait_for();assert page.locator('[name=phone]').input_value()=='0912345678' and page.locator('[data-f=note]').input_value()=='Keep my navigation draft'
  print('PASS explicit list/hotel return links preserve filters, dates and booking draft')
  page.locator('#booking-form').wait_for();page.locator('[name=phone]').fill('0912345678');page.locator('#bkLeft [data-next]').click();page.locator('[name=pay][value=hotel]').check();page.locator('#bkLeft [data-next]').click();page.wait_for_url('**/payment/payment.html')
  page.locator('[data-pay]:not([disabled])').wait_for();assert page.locator('#pPrice .price-lines').count()==1 and page.locator('#pSummary .summary-list').count()==1;assert page.locator('#pStepper li').count()==3;print('PASS original checkout stepper, price breakdown and sidebar retained');
  first_key=page.evaluate("JSON.parse(sessionStorage.getItem('threek_checkout')).requestKey")
  page.get_by_role('button',name='Sửa thông tin đặt phòng').click();page.wait_for_url('**/hotel/Booking.html?*');page.locator('#booking-form').wait_for()
  assert page.locator('[data-f=note]').input_value()=='Keep my navigation draft'
  page.locator('#bkLeft [data-next]').click();page.locator('#bkLeft [data-next]').click();page.wait_for_url('**/payment/payment.html');page.locator('[data-pay]:not([disabled])').wait_for()
  assert page.evaluate("JSON.parse(sessionStorage.getItem('threek_checkout')).requestKey")==first_key
  print('PASS edit-details navigation retains draft and stable request key')
  checkout_draft=page.evaluate("JSON.parse(sessionStorage.getItem('threek_checkout'))")
  assert page.locator('[name=pay]').count()==4 and page.locator('[name=wallet][value=vnpay]').count()==0
  if os.environ.get('CUSTOMER_TEST_OFFLINE')=='1':
   assert not page.locator('[name=method][value=online]').is_visible();print('PASS operation-only mode shows no online-payment option')
  page.locator('[data-pay]').click();page.wait_for_url('**/payment/payment.html?code=*');page.locator('#pLeft .done h2').filter(has_text='Đặt phòng thành công').wait_for();code=page.url.split('code=')[1]
  assert sql(f"SELECT COUNT(*) FROM bookings WHERE code='{code}' AND user_id={uid}")=='1';print('PASS SQL-only hotel → room → checkout → persistent success page')
  page.reload(wait_until='domcontentloaded');page.locator('.done__code').filter(has_text=code).wait_for();print('PASS original payment confirmation survives reload without localStorage booking')
  page.goto(URL+'/payment/success.html?code='+code,wait_until='domcontentloaded');page.locator('.booking-card__id strong').filter(has_text=code).wait_for();assert page.locator('.success-icon').count()==1 and page.locator('.booking-card__details .detail-item').count()==2;print('PASS original receipt markup populated from SQL')
  page.goto(URL+'/booking/detail.html?code='+code,wait_until='domcontentloaded');page.locator('#cancel-detail').wait_for();page.once('dialog',lambda d:d.accept());page.locator('#cancel-detail').click();page.wait_for_function("document.querySelector('.badge')?.textContent.includes('Đã hủy')")
  assert sql(f"SELECT status FROM bookings WHERE code='{code}'")=='cancelled';print('PASS customer cancellation and server status')
  page.goto(URL+'/account/notifications.html',wait_until='domcontentloaded');page.get_by_text('Đã hủy đặt phòng',exact=True).wait_for();print('PASS customer notifications from SQL')
  page.goto(URL+'/account/taikhoan.html',wait_until='domcontentloaded');page.locator('#fullname').fill('Updated Browser Customer');page.locator('#displayname').fill('Updated');page.locator('button[form=profile-form]').click();page.wait_for_function("document.getElementById('toast').textContent.includes('Đã lưu')");assert page.locator('#fullname').input_value()=='Updated Browser Customer';print('PASS profile save retains fields')
  checkout_draft['requestKey']=secrets.token_hex(16);checkout_draft['pay']='card'
  page.evaluate("draft=>sessionStorage.setItem('threek_checkout',JSON.stringify(draft))",checkout_draft)
  page.goto(URL+'/payment/payment.html',wait_until='domcontentloaded');page.locator('[data-pay]:not([disabled])').wait_for()
  page.locator('[data-c=name]').fill('TEST CUSTOMER');page.locator('[data-c=number]').fill('4111111111111111');page.locator('[data-c=exp]').fill('12/99');page.locator('[data-c=cvv]').fill('123')
  with page.expect_request('**/api/bookings/create.php') as sent:
   page.locator('[data-pay]').click()
  payload=sent.value.post_data_json
  assert payload['payMethod']=='card_demo' and not any(k in payload for k in ['card','number','cvv','exp'])
  page.wait_for_url('**/payment/payment.html?code=*');demo_code=page.url.split('code=')[1]
  page.reload(wait_until='domcontentloaded');page.locator('.done__code').filter(has_text=demo_code).wait_for()
  assert sql(f"SELECT payment_status FROM bookings WHERE code='{demo_code}'")=='unpaid'
  assert sql(f"SELECT COUNT(*) FROM mail_outbox WHERE recipient='{email}'")=='0'
  print('PASS original card demo UI saves unpaid SQL booking without card data or email')
  assert not errors,errors;browser.close();print('PASS no customer JavaScript errors')
finally:
 if uid:
  sql(f'DELETE p FROM payments p JOIN bookings b ON b.id=p.booking_id WHERE b.user_id={uid};DELETE FROM reviews WHERE user_id={uid};DELETE FROM bookings WHERE user_id={uid};')
  if hotel:sql(f'DELETE FROM hotels WHERE id={hotel}')
  sql(f"DELETE FROM mail_outbox WHERE recipient='{email}';DELETE FROM users WHERE id={uid}")
