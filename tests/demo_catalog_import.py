"""Run against a DISPOSABLE MariaDB container; never the user's database.
Usage: python3 tests/demo_catalog_import.py <container>
"""
import json,subprocess,sys,time
from pathlib import Path
root=Path(__file__).resolve().parents[1];container=sys.argv[1]
def sql(q):return subprocess.check_output(['docker','exec','-i',container,'mariadb','-uroot','-N'],input=q.encode()).decode().strip()
for _ in range(30):
 try:sql('SELECT 1');break
 except subprocess.CalledProcessError:time.sleep(1)
else:raise RuntimeError('Test database not ready')
sql('CREATE DATABASE ready_catalog_test CHARACTER SET utf8mb4;')
def run(q):return sql('USE ready_catalog_test;'+q)
run((root/'database/schema.sql').read_text())
run((root/'database/seed.sql').read_text())
for name in ['admin','customer','registration_otp','account_closure','public_reviews','osm_location']:
 run((root/f'database/{name}_migration.sql').read_text())
# A preexisting real relation must survive hiding the old seed catalog.
run("INSERT INTO users(email,password_hash,full_name,role) VALUES('sql-test@example.invalid','not-a-login-hash','SQL test','customer');INSERT INTO bookings(code,user_id,hotel_id,room_type_id,checkin,checkout,rooms,guests,total,status) VALUES('OLD-KEEP',LAST_INSERT_ID(),1,1,'2030-11-10','2030-11-12',1,2,2500000,'confirmed');")
original=run("SELECT CONCAT(b.id,':',b.hotel_id,':',b.room_type_id,':',u.email) FROM bookings b JOIN users u ON u.id=b.user_id WHERE b.code='OLD-KEEP';")
file=(root/'database/demo_hotels_ready.sql').read_text();run(file)
assert run('SELECT COUNT(*) FROM hotels WHERE is_active=1;')=='20'
assert run('SELECT COUNT(*) FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.is_active=1 AND r.is_active=1;')=='60'
assert run('SELECT SUM(r.total_rooms) FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.is_active=1;')=='1084'
assert run('SELECT GROUP_CONCAT(n ORDER BY city) FROM (SELECT city,COUNT(*) n FROM hotels WHERE is_active=1 GROUP BY city) t;')=='10,10'
assert run('SELECT is_active FROM hotels WHERE id=1;')=='0'
assert run("SELECT CONCAT(b.id,':',b.hotel_id,':',b.room_type_id,':',u.email) FROM bookings b JOIN users u ON u.id=b.user_id WHERE b.code='OLD-KEEP';")==original
assert run("SELECT capacity FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='fusion-suites-vung-tau' AND r.code='premium-suite';")=='4'
assert run("SELECT free_cancellation FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='best-western-premier-imperial-dalat' AND r.code='suite';")=='0'
# Reruns preserve local admin edits and referenced stock; never reset existing inventory.
run("UPDATE room_types r JOIN hotels h ON h.id=r.hotel_id SET r.total_rooms=7,r.price_per_night=1234567 WHERE h.slug='cicilia-rouge-dalat' AND r.code='standard';")
run(file)
assert run('SELECT COUNT(*) FROM hotels WHERE is_active=1;')=='20'
assert run('SELECT COUNT(*) FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.is_active=1;')=='60'
assert run("SELECT CONCAT(r.total_rooms,':',r.price_per_night) FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='cicilia-rouge-dalat' AND r.code='standard';")=='7:1234567.00'
assert run("SELECT COUNT(*) FROM bookings WHERE code='OLD-KEEP';")=='1'
print('PASS import/reimport: 20 hotels, 60 room types, initial 1084 units; legacy booking/user preserved; existing price/stock edits retained')
# Real public PHP endpoints using this isolated database, no source changes or mocked DB.
def api(path,params):
 code='$_GET=json_decode('+json.dumps(json.dumps(params))+',true);$_SERVER["REQUEST_METHOD"]="GET";require "/app/'+path+'";'
 raw=subprocess.check_output(['docker','run','--rm','--network','container:'+container,'-v',str(root)+':/app:ro','-e','DB_HOST=127.0.0.1','-e','DB_PORT=3306','-e','DB_NAME=ready_catalog_test','-e','DB_USER=root','-e','DB_PASSWORD=','web-midterm-php','php','-r',code])
 return json.loads(raw)
for city in ['dalat','vungtau']:
 data=api('api/hotels/index.php',{'city':city})
 assert data['status']=='success' and len(data['data'])==10,data
 for h in data['data']:assert h['latitude'] is not None and h['longitude'] is not None
 data=api('api/hotels/detail.php',{'city':city,'slug':data['data'][0]['slug']})
 assert data['status']=='success',data
 print('PASS public hotel listing/detail PHP endpoints:',city)
