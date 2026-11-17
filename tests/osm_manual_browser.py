"""Manual fallback and public OSM marker flow; block providers, use real Leaflet and PHP/SQL."""
import json,secrets,subprocess
from playwright.sync_api import sync_playwright
from registration_helpers import register_test_user
URL='http://127.0.0.1:8001';DB='web-midterm-admin-db'
def sql(q):return subprocess.check_output(['docker','exec','-i',DB,'mariadb','-uroot','-N','threek_booking'],input=q.encode()).decode().strip()
run=secrets.token_hex(6);email=f'manual-browser-{run}@example.invalid';pw=secrets.token_urlsafe(20)+'A1';uid=hotel=None
try:
 register_test_user({'email':email,'password':pw,'fullName':'Manual Browser'},URL);uid=int(sql(f"SELECT id FROM users WHERE email='{email}'"));sql(f"UPDATE users SET role='admin' WHERE id={uid}")
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=browser.new_context();mode=['empty'];requests=[]
  def route(r):
   requests.append(r.request.url)
   if not r.request.url.startswith(URL):r.abort();return
   if '/api/admin/places-search.php' in r.request.url:
    if mode[0]=='error':r.fulfill(status=502,content_type='application/json',body=json.dumps({'status':'error','message':'OSM fixture temporarily unavailable'}))
    elif mode[0]=='address':r.fulfill(status=200,content_type='application/json',body=json.dumps({'status':'success','data':{'places':[{'placeId':'osm-N12345','name':'Office building','address':'12 Building Street, Da Lat','kind':'address','canSelect':False,'lat':11.9404,'lng':108.4583}]}}))
    else:r.fulfill(status=200,content_type='application/json',body=json.dumps({'status':'success','data':{'places':[]}}))
   else:r.continue_()
  ctx.route('**/*',route);page=ctx.new_page();page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(URL+'/auth/login.html',wait_until='domcontentloaded');page.locator('#email').fill(email);page.locator('#password').fill(pw);page.locator('[type=submit]').click();page.wait_for_url('**/admin/index.html');page.locator('[data-tab=hotels]').click();page.locator('#tk-open-create-hotel').click()
  form=page.locator('#tk-create-hotel-db');page.locator('#tk-admin-hotel-map.leaflet-container').wait_for()
  form.locator('#tk-maps-search').fill('Missing hotel');form.locator('#tk-maps-search-button').click();form.locator('[data-location-manual]').click();assert form.locator('[name=location_mode]').input_value()=='manual'
  print('PASS empty OSM results expose a usable manual fallback without requiring Google')
  form.locator('[name=location_mode]').select_option('osm');mode[0]='error';form.locator('#tk-maps-search').fill('Provider unavailable');form.locator('#tk-maps-search-button').click();form.locator('[data-location-manual]').click()
  print('PASS manual mode stays available when the OSM provider fails')
  form.locator('[name=location_mode]').select_option('osm');mode[0]='address';form.locator('#tk-maps-search').fill('Building Street');form.locator('#tk-maps-search-button').click();form.locator('#tk-maps-results button').click()
  assert form.locator('[name=location_mode]').input_value()=='manual' and form.locator('[name=google_place_id]').input_value()=='' and form.locator('[name=name]').input_value()==''
  print('PASS address/building result only selects a reference point, never a hotel identity')
  form.locator('[name=name]').fill('Missing OSM Hotel '+run);form.locator('[name=slug]').fill('manual-browser-'+run)
  form.locator('[name=address]').fill('34 Confirmed Street, Da Lat');form.locator('[name=latitude]').fill('11.9404');form.locator('[name=longitude]').fill('108.4583');form.locator('[name=price_per_night]').fill('900000')
  form.locator('[name=location_confirmed]').check();form.locator('[name=address]').fill('35 Confirmed Street, Da Lat');assert not form.locator('[name=location_confirmed]').is_checked();form.locator('[name=location_confirmed]').check()
  form.locator('[type=submit]').click();page.locator('#tk-admin-feedback').filter(has_text='thành công').wait_for();hotel=int(sql(f"SELECT id FROM hotels WHERE slug='manual-browser-{run}'"))
  assert sql(f"SELECT maps_provider='manual' AND google_place_id IS NULL FROM hotels WHERE id={hotel}")=='1'
  page.locator(f'[data-hotel-edit-db="{hotel}"]').click();edit=page.locator('#admin-hotel-edit-form');edit.locator('[name=location_mode]').select_option('manual');edit.locator('[data-edit-map].leaflet-container').wait_for();edit.locator('[data-edit-map]').click(position={'x':130,'y':100})
  assert edit.locator('[name=latitude]').input_value()!=''
  edit.locator('[name=address]').fill('36 Corrected Street, Da Lat');edit.locator('[name=latitude]').fill('11.95');edit.locator('[name=longitude]').fill('108.46');edit.locator('[name=location_confirmed]').check();edit.locator('[type=submit]').click();page.locator('#tk-admin-feedback').filter(has_text='Đã cập nhật khách sạn').wait_for()
  assert sql(f'SELECT address FROM hotels WHERE id={hotel}')=='36 Corrected Street, Da Lat'
  print('PASS manual add/edit with pin/coordinates persists SQL and changing location invalidates confirmation')
  sql(f"INSERT INTO room_types(hotel_id,code,name,capacity,total_rooms,price_per_night,is_active) VALUES({hotel},'standard','Manual Browser Room',2,5,900000,1);UPDATE hotels SET is_active=1 WHERE id={hotel}")
  page.goto(URL+'/destinations/dalat.html',wait_until='domcontentloaded');page.locator('.map-canvas.leaflet-container').wait_for();page.locator('.map-canvas .leaflet-marker-icon').filter(has=page.locator('.tk-pin')).first.wait_for()
  page.goto(URL+f'/hotel/hotel.html?city=dalat&id=manual-browser-{run}',wait_until='domcontentloaded');page.locator('#hotel-osm-map.leaflet-container').wait_for();page.locator('#hotel-osm-map .leaflet-marker-icon').wait_for()
  assert 'mlat=11.95' in page.locator('.map-card__btn').get_attribute('href')
  assert not any(any(host in url for host in ['maps.googleapis.com','mt1.google.com','google.com/maps']) for url in requests)
  page.goto(URL+'/destinations/dalat.html',wait_until='domcontentloaded');page.locator('.map-canvas.leaflet-container').wait_for()
  sql(f'UPDATE hotels SET latitude=NULL,longitude=NULL WHERE id={hotel}')
  assert page.evaluate("async slug=>{await HotelAPI.loadCity('dalat');return CITY_DATA.dalat.hotels.find(h=>h.id===slug).lat}",'manual-browser-'+run) is None
  print('PASS missing SQL coordinates do not borrow stale/demo coordinates from the prior catalog')
  page.goto(URL+f'/hotel/hotel.html?city=dalat&id=manual-browser-{run}',wait_until='domcontentloaded');page.locator('#hotel-osm-map').filter(has_text='chưa có tọa độ').wait_for()
  assert not errors,errors
  print('PASS public catalog/detail use OSM and SQL position; missing coordinates show no invented marker');browser.close()
finally:
 if hotel:sql(f'DELETE FROM hotels WHERE id={hotel}')
 if uid:sql(f'DELETE FROM audit_logs WHERE actor_id={uid};DELETE FROM users WHERE id={uid}')
 sql(f"DELETE FROM registration_challenges WHERE email='{email}';DELETE FROM mail_outbox WHERE recipient='{email}'")
