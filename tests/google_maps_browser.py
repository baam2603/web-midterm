"""Public list/detail use official SDK and SQL coordinates, never unauthenticated tiles."""
import secrets,subprocess
from playwright.sync_api import sync_playwright
from google_maps_fixture import route_with_google
URL='http://127.0.0.1:8001';DB='web-midterm-admin-db'
def sql(q):return subprocess.check_output(['docker','exec','-i',DB,'mariadb','-uroot','-N','threek_booking'],input=q.encode()).decode().strip()
run=secrets.token_hex(6);hotel=None
try:
 sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,price_per_night,is_active,latitude,longitude,maps_provider) VALUES('public-map-{run}','Public Google Hotel','dalat','hotel',3,'Test Street',900000,1,11.9404,108.4583,'manual')")
 hotel=int(sql(f"SELECT id FROM hotels WHERE slug='public-map-{run}'"))
 sql(f"INSERT INTO room_types(hotel_id,code,name,capacity,total_rooms,price_per_night,is_active) VALUES({hotel},'standard','Map Room',2,5,900000,1)")
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=browser.new_context();ctx.route('**/*',route_with_google(URL));page=ctx.new_page();page.set_default_timeout(12000);errors=[];urls=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:urls.append(r.url))
  page.goto(URL+'/destinations/dalat.html',wait_until='domcontentloaded');page.locator('.map-canvas[data-google-map=ready]').wait_for();page.wait_for_function("window.testGoogleMarkers?.some(m=>m.title==='Public Google Hotel')")
  assert not any('mt1.google.com' in u or 'tile.openstreetmap.org' in u or 'leaflet' in u for u in urls)
  print('PASS public catalog uses official Google SDK with markers from SQL, no legacy tile scraping/Leaflet')
  page.goto(URL+f'/hotel/hotel.html?city=dalat&id=public-map-{run}',wait_until='domcontentloaded');page.locator('#hotel-google-map[data-google-map=ready]').wait_for()
  assert page.evaluate("testGoogleMarkers.some(m=>m.title==='Public Google Hotel' && m.position.lat===11.9404 && m.position.lng===108.4583)")
  assert 'destination=11.9404,108.4583' in page.locator('.map-card__btn').get_attribute('href')
  page.evaluate('gm_authFailure()');page.locator('#hotel-google-map').filter(has_text='Google Maps từ chối key').wait_for()
  print('PASS hotel detail and directions use exact SQL coordinates; denied browser key has a clear error')
  sql(f'UPDATE hotels SET latitude=NULL,longitude=NULL WHERE id={hotel}')
  page.reload(wait_until='domcontentloaded');page.locator('#hotel-google-map').filter(has_text='chưa có tọa độ').wait_for()
  assert page.locator('#hotel-google-map[data-google-map=ready]').count()==0
  assert not errors,errors
  print('PASS old hotel without coordinates does not invent a marker or guess a wrong hotel');browser.close()
finally:
 if hotel:sql(f'DELETE FROM hotels WHERE id={hotel}')
