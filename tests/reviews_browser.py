"""Hotel review UI: guests, owner, other customer, admin and mobile."""
import secrets
from playwright.sync_api import sync_playwright
from registration_helpers import register_test_user, test_sql as sql

URL='http://127.0.0.1:8001';run=secrets.token_hex(6);uids=[];hotel=None
password='ReviewBrowser123';emails=[f'review-ui-{run}-{i}@example.invalid' for i in range(3)]
try:
    for address in emails:
        register_test_user({'fullName':'Review Browser','email':address,'password':password})
        uids.append(int(sql(f"SELECT id FROM users WHERE email='{address}'")))
    sql(f"UPDATE users SET role='admin' WHERE id={uids[2]}")
    slug='review-ui-'+run
    sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,price_per_night,is_active) VALUES('{slug}','Review UI Hotel','dalat','hotel',3,'Test Street',900000,1)")
    hotel=int(sql(f"SELECT id FROM hotels WHERE slug='{slug}'"))
    sql(f"INSERT INTO room_types(hotel_id,code,name,capacity,total_rooms,price_per_night,is_active) VALUES({hotel},'standard','Room',2,2,900000,1)")
    hotelPath=f'/hotel/hotel.html?city=dalat&id={slug}'
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        contexts=[]
        def view(address=None,mobile=False):
            c=browser.new_context(viewport={'width':360 if mobile else 1280,'height':800},reduced_motion='reduce');contexts.append(c)
            c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(URL) else r.abort())
            page=c.new_page();page.set_default_timeout(12000)
            if address:
                page.goto(URL+'/auth/login.html',wait_until='domcontentloaded');page.locator('#email').fill(address);page.locator('#password').fill(password);page.locator('[type=submit]').click()
                page.wait_for_url(URL+('/admin/index.html' if address==emails[2] else '/index1.html'))
            page.goto(URL+hotelPath,wait_until='domcontentloaded');page.locator('#reviews h2').filter(has_text='Bình luận').wait_for()
            return page
        guest=view()
        assert guest.locator('#tk-review-form').count()==0
        assert guest.locator('#reviews a').filter(has_text='Đăng nhập').count()==1
        owner=view(emails[0],True);errors=[];owner.on('pageerror',lambda e:errors.append(str(e)))
        assert sql(f'SELECT COUNT(*) FROM bookings WHERE user_id={uids[0]}')=='0'
        assert owner.locator('#tk-review-form select[name=code]').count()==0
        comment='<img src=x onerror="window.reviewXss=1"> Phòng đẹp'
        owner.locator('#tk-review-form [name=score]').select_option('4');owner.locator('#tk-review-form [name=comment]').fill(comment);owner.locator('#tk-review-form [type=submit]').click()
        owner.locator('#tk-review-global-feedback').filter(has_text='đã được đăng').wait_for()
        row=owner.locator('[data-review-id]').filter(has_text=comment)
        assert row.count()==1 and row.locator('img').count()==0
        assert owner.evaluate('window.reviewXss') is None
        assert owner.locator('.rating-card__count').inner_text()=='1 đánh giá'
        assert owner.locator('.rating-card__top .score').inner_text()=='4'
        assert owner.locator('[data-review-delete]').count()==1
        owner.locator('#reviews').screenshot(path='/tmp/web-midterm-review-mobile.png')
        print('PASS mobile customer posts without a booking; appears immediately, escapes HTML and refreshes rating')
        guest.reload(wait_until='domcontentloaded');guest.locator('[data-review-id]').wait_for()
        assert guest.locator('[data-review-delete]').count()==0
        other=view(emails[1]);assert other.locator('[data-review-delete]').count()==0
        assert other.locator('#tk-review-form').count()==1
        owner.once('dialog',lambda d:d.accept());owner.locator('[data-review-delete]').click()
        owner.locator('#tk-review-global-feedback').filter(has_text='Đã xóa').wait_for()
        assert owner.locator('[data-review-id]').count()==0 and owner.locator('.rating-card__count').inner_text()=='0 đánh giá'
        print('PASS guest/other customer cannot delete; owner deletes and rating becomes empty')
        owner.locator('#tk-review-form [name=comment]').fill('Review for admin deletion');owner.locator('#tk-review-form [type=submit]').click()
        owner.locator('#tk-review-global-feedback').filter(has_text='đã được đăng').wait_for()
        admin=view(emails[2]);assert admin.locator('[data-review-delete]').count()==1
        admin.goto(URL+'/admin/index.html',wait_until='domcontentloaded');admin.locator('#tk-admin-app').wait_for(state='visible');admin.locator('[data-tab=reviews]').click()
        button=admin.locator('[data-op-review-delete]').first;button.wait_for()
        assert admin.locator('[data-op-status=approved],[data-op-status=rejected]').count()==0
        assert admin.locator('#admin-op-filter [name=status]').count()==0
        admin.once('dialog',lambda d:d.accept());button.click()
        admin.wait_for_function("!document.querySelector('[data-op-review-delete]')")
        assert sql(f'SELECT COUNT(*) FROM reviews WHERE hotel_id={hotel}')=='0'
        assert not errors,errors
        print('PASS admin has delete-only review management, including reviews without bookings')
        for c in contexts:c.close()
        browser.close()
finally:
    if hotel:sql(f'DELETE FROM reviews WHERE hotel_id={hotel};DELETE FROM hotels WHERE id={hotel}')
    if uids:
        ids=','.join(map(str,uids));sql(f'DELETE FROM audit_logs WHERE actor_id IN ({ids});DELETE FROM users WHERE id IN ({ids})')
