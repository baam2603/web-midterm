"""Offline DOM smoke: inject local scripts into Chromium about:blank because HTTP navigation is blocked in this environment.
This is NOT a substitute for complete browser E2E on a real local server.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
paths=['admin/index.html','booking/lookup.html','account/notifications.html','support/index.html','info/policies.html','booking/myBooking.html','booking/detail.html','hotel/hotel.html','auth/forgot.html']
polyfill='''<script>const mock={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>mock[k]??null,setItem:(k,v)=>{mock[k]=String(v)},removeItem:k=>{delete mock[k]}}});Object.defineProperty(window,'sessionStorage',{configurable:true,value:{getItem:k=>mock['s:'+k]??null,setItem:(k,v)=>{mock['s:'+k]=String(v)},removeItem:k=>{delete mock['s:'+k]}}});</script>'''
def inline(path):
 src=(ROOT/path).read_text();soup=BeautifulSoup(src,'html.parser')
 for tag in soup.find_all('script'):
  if tag.has_attr('src'):
   asset=tag['src']
   if asset.startswith(('http:','https:')):tag.decompose();continue
   target=(ROOT/path.parent/asset).resolve()
   if not target.is_relative_to(ROOT) or not target.exists():print('MISSING',path,asset);continue
   script=target.read_text()
   if asset.endswith('header.js'):script=script.replace('document.currentScript.src',"'http://example.com/common/header.js'")
   tag.attrs.pop('src');tag.string=script
 for a in soup.find_all('link'):
  if a.get('href','').startswith('http'):a.decompose()
 soup.head.insert(0,BeautifulSoup(polyfill,'html.parser'))
 return str(soup)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for path in paths:
   page=b.new_page();errs=[];page.on('pageerror',lambda error:errs.append(str(error)))
   try:
    page.set_content(inline(Path(path)),wait_until='domcontentloaded',timeout=15000)
    if path=='admin/index.html':
     page.locator('#tk-enter-admin').click();page.locator('[data-tab="hotels"]').click()
     assert page.locator('#tk-create-hotel').count()==1
     page.locator('#tk-create-hotel input[name=name]').fill('Khách sạn Thử nghiệm UI')
     page.locator('#tk-create-hotel input[name=address]').fill('123 Nguyễn Văn Linh, Đà Lạt')
     page.locator('#tk-create-hotel button[type=submit], #tk-create-hotel button:not([type])').first.click()
     assert page.locator('#tk-admin-feedback').inner_text().startswith('Đã thêm'),page.locator('#tk-admin-feedback').inner_text()
     assert page.locator('#tk-hotel-picker option').count()==17
     page.locator('[data-tab="rooms"]').click();assert page.locator('#tk-edit-room').count()==1
     page.locator('#tk-edit-room input[name=price]').fill('1360000')
     page.locator('#tk-edit-room button').click()
     assert page.locator('#tk-admin-feedback').inner_text().startswith('Đã lưu'),page.locator('#tk-admin-feedback').inner_text()
     page.locator('[data-tab="calendar"]').click();assert page.locator('#tk-calendar-form').count()==1
    if path=='support/index.html':
     assert page.locator('#tk-ticket-form').count()==1
     page.locator('#tk-ticket-form input[name=name]').fill('Khách thử')
     page.locator('#tk-ticket-form input[name=email]').fill('test@example.com')
     page.locator('#tk-ticket-form textarea[name=message]').fill('Tôi muốn hỏi về một đơn đặt phòng tại Đà Lạt.')
     page.locator('#tk-ticket-form button').click()
     assert 'Đã ghi nhận yêu cầu demo' in page.locator('#tk-ticket-status').inner_text()
    if path=='auth/forgot.html':assert page.locator('#tk-forgot-request').count()==1
    if path=='hotel/hotel.html':
     # no query => hotel not found; expected intentionally
     assert page.locator('#hotel-root').count()==1
    print('RENDER',path,('OK' if not errs else 'ERR '+str(errs[:2])))
   except Exception as e:print('RENDER',path,'ERROR',type(e).__name__,str(e)[:250]);
   page.close()
 finally:b.close()
