"""Build the live, insert-only demo catalog from the reviewed SQL drafts."""
import json,re
from pathlib import Path
root=Path(__file__).resolve().parents[2]
source=(root/'database/real_hotels.sql').read_text()
rows=[json.loads(b.replace("''","'").replace('\\\\','\\')) for _,b in re.findall(r"VALUES \('([^']+)',\s*'((?:''|[^'])*)'\)\nON DUPLICATE",source,re.S)]
assert len(rows)==20 and len({h['slug'] for h in rows})==20

def q(v):
 if v is None:return 'NULL'
 if isinstance(v,(int,float)):return str(v)
 return "'"+str(v).replace('\\','\\\\').replace("'","''")+"'"
def js(v):return json.dumps(v,ensure_ascii=False)
slugs=','.join(q(h['slug']) for h in rows)
sql=['''-- ThreeK: live fixed-demo catalog, 20 hotels / 60 room types / 1084 managed units.
-- DATA ONLY: select your existing threek_booking database in phpMyAdmin before import.
-- Requires the current main schema/migrations. Back up first.
-- Hides ALL hotels outside this list; retains their IDs, rooms, bookings and accounts.
-- Insert-only on slug + room code: reruns never reset prices, stock, edits or booking history.
-- No fake reviews, provider IDs, photos, deposits or seasonal cancellation fees.
-- Capacity uses MAX ADULTS because this app has one total-guests field, not child ages.
SET NAMES utf8mb4;
START TRANSACTION;''']
for h in rows:
 rules=['Dữ liệu cố định dùng cho đồ án/demo; ảnh được bổ sung sau.','Chỉ hủy đơn chờ/đã xác nhận trước ngày nhận phòng theo ngày lịch, không phải mốc đủ 24 giờ.','Đơn đã thanh toán chỉ hủy được nếu có quyền hoàn hủy. Chính sách phí theo mùa và đặt cọc chưa áp dụng.','Giới hạn đặt phòng trên demo tính theo số người lớn; thông tin trẻ em cần liên hệ để xác nhận.']
 if h.get('contact_phone'):rules.append('Liên hệ: '+h['contact_phone'])
 vals=[h[k] for k in ['slug','name','city','type','stars','address','price_per_night','description','latitude','longitude','checkin_time','checkout_time']]+[js(rules),1]
 sql.append('INSERT INTO hotels (slug,name,city,type,stars,address,price_per_night,description,latitude,longitude,checkin_time,checkout_time,rules_json,is_active)\nSELECT '+','.join(map(q,vals))+'\nWHERE NOT EXISTS (SELECT 1 FROM hotels WHERE slug='+q(h['slug'])+');')
 for r in h['rooms']:
  assert r['actual_room_name'] and r['price_per_night']>0 and r['total_rooms']>0
  refundable=int(r['free_cancellation'])
  policy='Demo: hủy trước ngày nhận phòng; đơn đã thanh toán chỉ hủy được khi có quyền hoàn hủy.' if refundable else 'Demo: hủy trước ngày nhận phòng khi chưa thanh toán; đơn đã thanh toán không hoàn hủy.'
  features=list(dict.fromkeys(r.get('reported_features',[])+['Đã bao gồm bữa sáng',r['bed_type'],f"Giới hạn đặt trên demo: {r['max_adults']} người lớn/phòng."]))
  desc=r['description']+' '+policy
  bed_label=r['bed_type'].split(';',1)[0]
  assert len(bed_label)<=120
  vals=[r['code'],r['name'],r['max_adults'],r['total_rooms'],r['price_per_night'],desc,r.get('area_m2'),bed_label,1,refundable,js(features),1]
  sql.append('INSERT INTO room_types (hotel_id,code,name,capacity,total_rooms,price_per_night,description,area_m2,bed_type,breakfast_included,free_cancellation,features_json,is_active)\nSELECT h.id,'+','.join(map(q,vals))+' FROM hotels h WHERE h.slug='+q(h['slug'])+' AND NOT EXISTS (SELECT 1 FROM room_types r WHERE r.hotel_id=h.id AND r.code='+q(r['code'])+');')
# Do visibility changes last, so a data insertion error cannot hide the old catalog before COMMIT.
sql.append('UPDATE hotels SET is_active=0 WHERE slug NOT IN ('+slugs+');')
sql.append('UPDATE hotels SET is_active=1 WHERE slug IN ('+slugs+');')
sql+=['COMMIT;','-- Verify public catalog: 20 selected active hotels; previous records remain in admin/history.','SELECT city,COUNT(*) AS active_hotels FROM hotels WHERE is_active=1 GROUP BY city;']
(root/'database/demo_hotels_ready.sql').write_text('\n\n'.join(sql)+'\n')
print('Generated database/demo_hotels_ready.sql')
