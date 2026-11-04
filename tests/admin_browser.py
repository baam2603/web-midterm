"""Real Chromium UI checks against the isolated admin test database."""
import json,subprocess,urllib.request,urllib.error,http.cookiejar,secrets,os
from playwright.sync_api import sync_playwright
URL=os.environ.get('ADMIN_TEST_URL','http://127.0.0.1:8001');DB='web-midterm-admin-db';WEB='web-midterm-admin-web'
def sql(q):return subprocess.check_output(['docker','exec','-i',DB,'mariadb','-uroot','-N','threek_booking'],input=q.encode()).decode().strip()
def api(path,body):
 r=urllib.request.Request(URL+path,data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(r) as r:return json.load(r)
run=secrets.token_hex(6);email=f'browser-{run}@example.invalid';password=secrets.token_urlsafe(18)+'A1';uid=None;hotel=None
try:
 api('/api/auth/register.php',{'fullName':'Browser Test','email':email,'password':password})
 uid=int(sql(f"SELECT id FROM users WHERE email='{email}';"));sql(f"UPDATE users SET role='admin' WHERE id={uid};")
 # Provider fixture exercises our real search/verification/create endpoints without depending on OSM availability.
 fixture='''<?php require '/app/api/admin/places-service.php';
 $params=['osm_ids'=>'N999999999999','format'=>'jsonv2','addressdetails'=>1,'namedetails'=>1,'accept-language'=>'vi'];
 $url=NOMINATIM_URL.'lookup?'.http_build_query($params,'','&',PHP_QUERY_RFC3986);
 $p=['osm_type'=>'node','osm_id'=>999999999999,'lat'=>'11.9404','lon'=>'108.4583','class'=>'tourism','type'=>'hotel','name'=>'Browser OSM Hotel','display_name'=>'12 Test Street, Dalat, Vietnam','address'=>['country_code'=>'vn']];
 osmCacheWrite(osmCacheDir().'/'.sha1('nominatim:'.$url).'.json',[$p]);
 $ql='[out:json][timeout:12];('.osmLodgingQl('["name"]','(around:1800,11.940400,108.458300)').');out center tags 60;';
 osmCacheWrite(osmCacheDir().'/'.sha1('overpass:'.$ql).'.json',['elements'=>[['type'=>'node','id'=>999999999999,'lat'=>11.9404,'lon'=>108.4583,'tags'=>['name'=>'Browser OSM Hotel','tourism'=>'hotel']]]]);
 '''
 subprocess.run(['docker','exec','-i',WEB,'php'],input=fixture.encode(),check=True)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  context=browser.new_context()
  context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(URL) else route.abort())
  page=context.new_page();page.set_default_timeout(10000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(URL+'/auth/login.html',wait_until='domcontentloaded');page.locator('#email').fill(email);page.locator('#password').fill(password);page.locator('button[type=submit],input[type=submit]').first.click()
  page.wait_for_url('**/admin/index.html');page.locator('#tk-admin-app').wait_for(state='visible');page.locator('[data-tab=hotels]').click();page.locator('#tk-open-create-hotel').click()
  page.locator('#tk-map-find-nearby').wait_for();page.locator('#tk-map-find-nearby').click();page.locator('#tk-map-nearby-list button').first.click()
  page.wait_for_function("document.querySelector('[name=google_place_id]').value === 'osm-N999999999999'")
  print('PASS browser Leaflet map → nearby search → verified selection (provider fixture)')
  page.locator('#tk-maps-search').fill('osm-N999999999999');page.locator('#tk-maps-search-button').click();page.locator('#tk-maps-results button').first.click();
  assert page.locator('[name=google_place_id]').input_value()=='osm-N999999999999'
  page.locator('#tk-create-hotel-db [name=slug]').fill('browser-'+run);page.locator('#tk-create-hotel-db [name=price_per_night]').fill('900000');page.locator('#tk-create-hotel-db [type=submit]').click()
  page.locator('#tk-admin-feedback').filter(has_text='thành công').wait_for()
  hotel=int(sql(f"SELECT id FROM hotels WHERE slug='browser-{run}';"));print('PASS browser OSM search → select → SQL hotel creation (provider fixture)')
  page.locator('[data-tab=rooms]').click();page.locator('#tk-create-room-db').wait_for()
  form=page.locator('#tk-create-room-db')
  form.locator('[name=hotel_id]').select_option(str(hotel));
  for name,value in {'code':'browser-room','name':'Browser Room','capacity':'2','total_rooms':'3','price_per_night':'900000','area_m2':'28','bed_type':'Double'}.items():form.locator(f'[name={name}]').fill(value)
  form.locator('button[type=submit]').click();page.locator('#tk-admin-feedback').filter(has_text='Đã thêm').wait_for()
  room=int(sql(f'SELECT id FROM room_types WHERE hotel_id={hotel};'))
  page.locator(f'[data-room-edit="{room}"]').click();edit=page.locator('#tk-update-room-db');edit.locator('[name=name]').fill('Updated Browser Room');edit.locator('[name=price_per_night]').fill('1350000');edit.locator('button[type=submit]').click()
  try:page.locator('#tk-admin-feedback').filter(has_text='Đã cập nhật').wait_for()
  except Exception:
   print('ROOM_SAVE_DEBUG',page.locator('#tk-room-edit-validation').all_text_contents(),page.locator('#tk-admin-feedback').all_text_contents(),errors)
   raise
  page.reload(wait_until='domcontentloaded');page.locator(f'[data-room-edit="{room}"]').wait_for()
  assert sql(f'SELECT price_per_night FROM room_types WHERE id={room};')=='1350000.00'
  assert page.get_by_text('Updated Browser Room',exact=True).count()>=1;print('PASS browser room create/edit → SQL persists after reload')
  page.locator('[data-tab=hotels]').click();page.locator(f'[data-hotel-edit-db="{hotel}"]').click()
  editHotel=page.locator('#admin-hotel-edit-form');editHotel.locator('[name=name]').fill('Edited Browser Hotel');editHotel.locator('[name=type]').select_option('villa');editHotel.locator('[type=submit]').click()
  page.locator('#tk-admin-feedback').filter(has_text='Đã cập nhật khách sạn').wait_for()
  assert sql(f'SELECT type FROM hotels WHERE id={hotel};')=='villa';print('PASS browser hotel editor saves SQL')
  sql(f"INSERT INTO bookings(code,user_id,hotel_id,room_type_id,checkin,checkout,rooms,guests,total,status) VALUES('browser-{run}',{uid},{hotel},{room},'2020-01-01','2020-01-02',1,1,900000,'checked_in')")
  booking=int(sql(f"SELECT id FROM bookings WHERE code='browser-{run}'"))
  page.locator('[data-tab=bookings]').click();page.locator(f'[data-op-id="{booking}"][data-op-status="completed"]').wait_for()
  page.once('dialog',lambda dialog:dialog.accept());page.locator(f'[data-op-id="{booking}"][data-op-status="completed"]').click()
  page.wait_for_function("document.querySelector('#admin-op-message')?.textContent.includes('kết quả') && !document.querySelector('[data-op-status=completed]')")
  assert sql(f'SELECT status FROM bookings WHERE id={booking}')=='completed';print('PASS browser completes a stay in SQL')
  for tab in ['bookings','payments','calendar','reviews','support','audit']:
   page.locator(f'[data-tab={tab}]').click();page.locator('#admin-op-message').wait_for();page.wait_for_function("!document.querySelector('#admin-op-message').textContent.includes('Đang tải')")
   assert 'Lỗi' not in page.locator('#admin-op-message').inner_text();print('PASS browser tab',tab)
  assert not errors,errors
  browser.close();print('PASS no browser script errors')
finally:
 if hotel:sql(f'DELETE FROM bookings WHERE hotel_id={hotel}; DELETE FROM hotels WHERE id={hotel};')
 if uid:sql(f'DELETE FROM audit_logs WHERE actor_id={uid}; DELETE FROM users WHERE id={uid};')
