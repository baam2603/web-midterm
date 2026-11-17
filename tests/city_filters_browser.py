"""Real catalog API + city filter UI, with no external network or live data changes."""
import json
import secrets
import subprocess
import urllib.request
from playwright.sync_api import sync_playwright
from registration_helpers import test_sql as sql

ROOT='http://127.0.0.1:8001';run=secrets.token_hex(5);hotels=[]
def catalog(city,extra=''):
    with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(ROOT+'/api/hotels/index.php?city='+city+extra) as r:
        return {h['slug']:h for h in json.load(r)['data']}
try:
    for city in ['dalat','vungtau']:
        for suffix,address,stars,features,breakfast in [
            ('full','Gần Hồ Tuyền Lâm' if city=='dalat' else 'Đường Thùy Vân, Bãi Sau',4,['Bãi đỗ xe','BBQ','View thung lũng','View hồ'] if city=='dalat' else ['Bãi đỗ xe','Hồ bơi','Sea view','View hoàng hôn'],1),
            ('center','Trung tâm thành phố',3,['Không có hồ bơi','Không có view hồ'],0),
        ]:
            slug=f'filter-{run}-{city}-{suffix}'
            sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,price_per_night,is_active) VALUES('{slug}','Filter {city} {suffix}','{city}','hotel',{stars},'{address}',900000,1)")
            hid=int(sql(f"SELECT id FROM hotels WHERE slug='{slug}'"));hotels.append(hid)
            payload=json.dumps(features,ensure_ascii=False).replace("'","''")
            sql(f"INSERT INTO room_types(hotel_id,code,name,capacity,total_rooms,price_per_night,is_active,features_json,breakfast_included) VALUES({hid},'room','Filter Room',2,5,900000,1,'{payload}',{breakfast})")
        data=catalog(city);full=data[f'filter-{run}-{city}-full'];center=data[f'filter-{run}-{city}-center']
        expected=['breakfast','parking','fireplace','valley','lake'] if city=='dalat' else ['breakfast','parking','pool','sea','sunset']
        assert set(expected)<=set(full['filter_amenities']),full
        assert ('forest' if city=='dalat' else 'beach') in full['zones'] and 'center' in center['zones']
        assert 'pool' not in center['filter_amenities'] and 'lake' not in center['filter_amenities']
        # An attribute on an unavailable room must not qualify a hotel for those dates.
        hid=hotels[-1]
        sql(f"INSERT INTO room_types(hotel_id,code,name,capacity,total_rooms,price_per_night,is_active,features_json,breakfast_included) VALUES({hid},'closed','Sold out pool',2,0,900000,1,'[\"Hồ bơi\"]',1)")
        assert 'pool' not in catalog(city)[f'filter-{run}-{city}-center']['filter_amenities']
        print('PASS',city,'SQL room features, breakfast, location and negative/unavailable amenities')
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        for city in ['dalat','vungtau']:
            c=browser.new_context();c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ROOT) else r.abort())
            page=c.new_page();page.set_default_timeout(12000);calls=[];errors=[]
            page.on('request',lambda r:calls.append(r.url) if '/api/hotels/index.php' in r.url else None)
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(ROOT+f'/destinations/{city}.html',wait_until='domcontentloaded')
            slug=f'filter-{run}-{city}-full';center=f'filter-{run}-{city}-center'
            page.locator(f'.hotel-card[data-id="{slug}"]').wait_for()
            page.evaluate("slug=>window.keptCard=document.querySelector('.hotel-card[data-id=\"'+slug+'\"]')",slug)
            def settled():page.evaluate("()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))")
            def present(name):return page.locator(f'.tk-list .hotel-card[data-id="{name}"]').count()>0
            zone='forest' if city=='dalat' else 'beach'
            page.locator(f'[data-group=zones][value={zone}]').check();settled()
            page.wait_for_function("slug=>!document.querySelector('.tk-list .hotel-card[data-id=\"'+slug+'\"]')",arg=center)
            assert present(slug)
            assert page.evaluate("window.keptCard===document.querySelector('.hotel-card[data-id=\"'+window.keptCard.dataset.id+'\"]')")
            page.locator('#tk-reset').click();page.locator(f'.hotel-card[data-id="{center}"]').wait_for()
            amenities=['breakfast','parking','fireplace','valley','lake'] if city=='dalat' else ['breakfast','parking','pool','sea','sunset']
            for value in amenities:
                checkbox=page.locator(f'[data-group=amenities][value={value}]');checkbox.locator("..").click();settled();assert checkbox.is_checked()
                page.wait_for_function("slug=>!document.querySelector('.tk-list .hotel-card[data-id=\"'+slug+'\"]')",arg=center)
                assert present(slug),value
                assert page.evaluate("window.keptCard===document.querySelector('.hotel-card[data-id=\"'+window.keptCard.dataset.id+'\"]')")
                checkbox.locator("..").click();settled();assert not checkbox.is_checked()
            page.locator('#tk-reset').click();page.locator(f'.hotel-card[data-id="{center}"]').wait_for()
            page.locator('[data-group=stars][value="4"]').locator('..').click();settled()
            page.wait_for_function("slug=>!document.querySelector('.tk-list .hotel-card[data-id=\"'+slug+'\"]')",arg=center);assert present(slug)
            page.locator('#tk-reset').click();page.locator(f'.hotel-card[data-id="{center}"]').wait_for()
            before=len(calls)
            page.evaluate('''() => {
              window.cardChanges=0;window.filterObserver=new MutationObserver(records=>window.cardChanges+=records.filter(r=>r.target.classList?.contains('tk-list')).length);
              filterObserver.observe(document.querySelector('.tk-list'),{childList:true,subtree:true});
              const slider=document.querySelector('#tk-price');for(let i=0;i<100;i++){slider.value=i%2?100:95;slider.dispatchEvent(new Event('input',{bubbles:true}));}
            }''')
            page.evaluate('()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
            assert len(calls)==before,'filter interaction caused new catalog requests'
            assert page.evaluate('window.cardChanges')==0,'unchanged slider results rebuilt cards'
            assert page.evaluate("window.keptCard===document.querySelector('.hotel-card[data-id=\"'+window.keptCard.dataset.id+'\"]')")
            assert page.locator('.tk-list .tk-fade').count()==0
            assert not errors,errors
            c.close();print('PASS',city,'all lower filters, persistent card nodes, no replayed animation/API flood and 100 slider inputs')
        browser.close()
finally:
    if hotels:
        ids=','.join(map(str,hotels));sql(f'DELETE FROM hotels WHERE id IN ({ids})')
