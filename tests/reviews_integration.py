"""Public review CRUD and ownership, against the isolated Docker DB only."""
import http.cookiejar
import json
import secrets
import subprocess
import urllib.request
import urllib.error
from registration_helpers import register_test_user, test_sql as sql

URL='http://127.0.0.1:8001'
run=secrets.token_hex(6);uids=[];hotel=None

def client():
    return urllib.request.build_opener(urllib.request.ProxyHandler({}), urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

def call(c,path,body=None,status=200,token=None,origin=None):
    headers={'Content-Type':'application/json'}
    if token:headers['X-CSRF-Token']=token
    if origin:headers['Origin']=origin
    req=urllib.request.Request(URL+path,data=None if body is None else json.dumps(body).encode(),headers=headers)
    try:response=c.open(req,timeout=20)
    except urllib.error.HTTPError as e:response=e
    with response:
        data=json.load(response);assert response.status==status,(path,response.status,data);return data

try:
    owner,other,admin,guest=client(),client(),client(),client()
    for i,c in enumerate([owner,other,admin]):
        address=f'reviews-{run}-{i}@example.invalid'
        register_test_user({'fullName':'Review User','email':address,'password':'ReviewFixture123'},URL,c)
        uids.append(int(sql(f"SELECT id FROM users WHERE email='{address}'")))
    sql(f"UPDATE users SET role='admin' WHERE id={uids[2]}")
    sql(f"INSERT INTO hotels(slug,name,city,type,stars,address,price_per_night,is_active) VALUES('reviews-{run}','Review Hotel','dalat','hotel',3,'Test Street',900000,1)")
    hotel=int(sql(f"SELECT id FROM hotels WHERE slug='reviews-{run}'"))
    path=f'/api/reviews/index.php?city=dalat&hotelId=reviews-{run}'
    body={'city':'dalat','hotelId':'reviews-'+run,'score':5,'comment':'Rất tốt'}
    call(guest,'/api/reviews/create.php',body,401)
    call(owner,'/api/reviews/create.php',body,403,origin='https://evil.invalid')
    for change in [{'score':0},{'score':6},{'score':2.5},{'comment':' '},{'comment':'x'*1501},{'hotelId':'missing-hotel'}]:
        call(owner,'/api/reviews/create.php',{**body,**change},404 if 'hotelId' in change else 400)
    assert call(owner,f'/api/reviews/eligibility.php?city=dalat&hotelId=reviews-{run}')['data']['requiresBooking'] is False
    rid=call(owner,'/api/reviews/create.php',body,201)['data']['id']
    assert sql(f'SELECT COUNT(*) FROM bookings WHERE user_id={uids[0]}')=='0'
    assert sql(f"SELECT booking_id IS NULL AND status='approved' FROM reviews WHERE id={rid}")=='1'
    public=call(guest,path)['data'];assert public['count']==1 and public['average']==5 and not public['canReview'] and not public['reviews'][0]['canDelete']
    assert call(owner,path)['data']['reviews'][0]['canDelete'] is True
    assert call(other,path)['data']['reviews'][0]['canDelete'] is False
    assert call(admin,path)['data']['reviews'][0]['canDelete'] is True
    print('PASS logged-in user reviews without booking; immediate public display and server-derived ownership')
    rid2=call(owner,'/api/reviews/create.php',{**body,'score':1,'comment':'Ý kiến khác'},201)['data']['id']
    assert call(guest,path)['data']['average']==3
    detail=call(guest,'/api/hotels/detail.php?slug=reviews-'+run)['data']
    assert float(detail['hotel']['rating'])==3 and int(detail['hotel']['review_count'])==2
    call(guest,'/api/reviews/delete.php',{'id':rid},401)
    call(other,'/api/reviews/delete.php',{'id':rid,'user_id':uids[0],'role':'admin'},403)
    call(owner,'/api/reviews/delete.php',{'id':rid},403,origin='https://evil.invalid')
    call(owner,'/api/reviews/delete.php',{'id':rid})
    assert call(guest,path)['data']['average']==1
    call(owner,'/api/reviews/delete.php',{'id':rid},404)
    print('PASS multiple comments allowed; owner delete, spoofed ownership, CSRF and rating recalculation')
    call(other,'/api/admin/operations.php?section=reviews',status=403)
    call(admin,'/api/admin/operations.php?section=reviews',{'id':rid2,'action':'delete'},403)
    token=call(admin,'/api/admin/csrf.php')['data']['csrfToken']
    call(admin,'/api/reviews/moderate.php',{'id':rid2,'status':'approved'},410,token)
    call(admin,'/api/admin/operations.php?section=reviews',{'id':rid2,'status':'rejected'},422,token)
    assert any(int(x['id'])==rid2 for x in call(admin,'/api/admin/operations.php?section=reviews')['data']['items'])
    call(admin,'/api/admin/operations.php?section=reviews',{'id':rid2,'action':'delete'},token=token)
    assert call(guest,path)['data']['count']==0 and call(guest,path)['data']['average'] is None
    assert sql(f"SELECT COUNT(*) FROM audit_logs WHERE action='review.delete' AND entity_id='{rid2}'")=='1'
    print('PASS admin sees unbooked reviews and can delete with CSRF; all old moderation routes disabled')
    direct=call(owner,'/api/reviews/create.php',body,201)['data']['id']
    call(admin,'/api/reviews/delete.php',{'id':direct},403)
    call(admin,'/api/reviews/delete.php',{'id':direct},token=token)
    assert call(guest,path)['data']['count']==0
    print('PASS administrator delete from the hotel endpoint also requires CSRF')
    # Legacy visibility migration is additive and repeatable: pending publishes; rejected stays hidden.
    sql(f"INSERT INTO reviews(user_id,hotel_id,score,comment,status) VALUES({uids[0]},{hotel},4,'Legacy pending','pending'),({uids[0]},{hotel},1,'Legacy hidden','rejected')")
    with open('database/public_reviews_migration.sql','rb') as migration:
        subprocess.run(['docker','exec','-i','web-midterm-admin-db','mariadb','-uroot','threek_booking'],stdin=migration,check=True)
    assert call(guest,path)['data']['count']==1 and call(guest,path)['data']['reviews'][0]['comment']=='Legacy pending'
    for i in range(24):
        sql(f"INSERT INTO reviews(user_id,hotel_id,score,comment,status) VALUES({uids[0]},{hotel},5,'Page fixture {i}','approved')")
    first=call(guest,path)['data'];second=call(guest,path+'&page=2')['data']
    assert first['count']==25 and len(first['reviews'])==20 and len(second['reviews'])==5
    assert not set(x['id'] for x in first['reviews']) & set(x['id'] for x in second['reviews'])
    assert first['average']==second['average']==4.96
    print('PASS pending migration, hidden legacy reviews, stable pagination and average across all pages')
finally:
    if hotel:sql(f'DELETE FROM reviews WHERE hotel_id={hotel};DELETE FROM hotels WHERE id={hotel}')
    if uids:
        ids=','.join(map(str,uids));sql(f'DELETE FROM audit_logs WHERE actor_id IN ({ids});DELETE FROM users WHERE id IN ({ids})')
