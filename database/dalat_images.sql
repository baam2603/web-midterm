-- Da Lat photos supplied in hotel_images/. Import AFTER demo_hotels_ready.sql.
-- Resolve IDs by slug + room code, so this works on both fresh and existing DBs.
-- Add missing paths only; preserve existing images, cover choices, prices and bookings.
-- First supplied hotel photo is the default cover ONLY if no cover exists yet.
SET NAMES utf8mb4;
START TRANSACTION;


-- cicilia-rouge-dalat

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/cicilia_rouge_dalat/cicilia1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='cicilia-rouge-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/cicilia_rouge_dalat/cicilia1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/cicilia_rouge_dalat/cicilia2.jpg',1,0
FROM hotels h WHERE h.slug='cicilia-rouge-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/cicilia_rouge_dalat/cicilia2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/cicilia_rouge_dalat/cicilia3.jpg',2,0
FROM hotels h WHERE h.slug='cicilia-rouge-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/cicilia_rouge_dalat/cicilia3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/cicilia_rouge_dalat/cicilia4.jpg',3,0
FROM hotels h WHERE h.slug='cicilia-rouge-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/cicilia_rouge_dalat/cicilia4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/cicilia_rouge_dalat/cicilia5.jpg',4,0
FROM hotels h WHERE h.slug='cicilia-rouge-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/cicilia_rouge_dalat/cicilia5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/cicilia_rouge_dalat/The Cosy.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='cicilia-rouge-dalat' AND h.city='dalat' AND r.code='standard'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/cicilia_rouge_dalat/The Cosy.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/cicilia_rouge_dalat/Vintage Bancony.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='cicilia-rouge-dalat' AND h.city='dalat' AND r.code='midrange'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/cicilia_rouge_dalat/Vintage Bancony.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/cicilia_rouge_dalat/Signature Suite.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='cicilia-rouge-dalat' AND h.city='dalat' AND r.code='premium'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/cicilia_rouge_dalat/Signature Suite.jpg');

-- merperle-dalat-hotel

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/merperle_dalat/merperle1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='merperle-dalat-hotel' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/merperle_dalat/merperle1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/merperle_dalat/merperle2.jpg',1,0
FROM hotels h WHERE h.slug='merperle-dalat-hotel' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/merperle_dalat/merperle2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/merperle_dalat/merperle3.jpg',2,0
FROM hotels h WHERE h.slug='merperle-dalat-hotel' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/merperle_dalat/merperle3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/merperle_dalat/merperle4.jpg',3,0
FROM hotels h WHERE h.slug='merperle-dalat-hotel' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/merperle_dalat/merperle4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/merperle_dalat/merperle5.jpg',4,0
FROM hotels h WHERE h.slug='merperle-dalat-hotel' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/merperle_dalat/merperle5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/merperle_dalat/deluxe.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='merperle-dalat-hotel' AND h.city='dalat' AND r.code='deluxe'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/merperle_dalat/deluxe.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/merperle_dalat/premier.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='merperle-dalat-hotel' AND h.city='dalat' AND r.code='midrange'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/merperle_dalat/premier.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/merperle_dalat/merperle suite.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='merperle-dalat-hotel' AND h.city='dalat' AND r.code='suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/merperle_dalat/merperle suite.jpg');

-- best-western-premier-imperial-dalat

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/best_western_premier_imperial_dalat/bestwestern1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='best-western-premier-imperial-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/best_western_premier_imperial_dalat/bestwestern1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/best_western_premier_imperial_dalat/bestwestern2.jpg',1,0
FROM hotels h WHERE h.slug='best-western-premier-imperial-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/best_western_premier_imperial_dalat/bestwestern2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/best_western_premier_imperial_dalat/bestwestern3.jpg',2,0
FROM hotels h WHERE h.slug='best-western-premier-imperial-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/best_western_premier_imperial_dalat/bestwestern3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/best_western_premier_imperial_dalat/bestwestern4.jpg',3,0
FROM hotels h WHERE h.slug='best-western-premier-imperial-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/best_western_premier_imperial_dalat/bestwestern4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/best_western_premier_imperial_dalat/bestwestern5.jpg',4,0
FROM hotels h WHERE h.slug='best-western-premier-imperial-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/best_western_premier_imperial_dalat/bestwestern5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/best_western_premier_imperial_dalat/superior.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='best-western-premier-imperial-dalat' AND h.city='dalat' AND r.code='deluxe'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/best_western_premier_imperial_dalat/superior.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/best_western_premier_imperial_dalat/executive.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='best-western-premier-imperial-dalat' AND h.city='dalat' AND r.code='midrange'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/best_western_premier_imperial_dalat/executive.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/best_western_premier_imperial_dalat/president.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='best-western-premier-imperial-dalat' AND h.city='dalat' AND r.code='suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/best_western_premier_imperial_dalat/president.jpg');

-- hotel-colline-dalat

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/colline_dalat/colline1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='hotel-colline-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/colline_dalat/colline1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/colline_dalat/colline2.jpg',1,0
FROM hotels h WHERE h.slug='hotel-colline-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/colline_dalat/colline2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/colline_dalat/colline3.jpg',2,0
FROM hotels h WHERE h.slug='hotel-colline-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/colline_dalat/colline3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/colline_dalat/colline4.jpg',3,0
FROM hotels h WHERE h.slug='hotel-colline-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/colline_dalat/colline4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/colline_dalat/colline5.jpg',4,0
FROM hotels h WHERE h.slug='hotel-colline-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/colline_dalat/colline5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/colline_dalat/superior.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='hotel-colline-dalat' AND h.city='dalat' AND r.code='superior'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/colline_dalat/superior.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/colline_dalat/deluxe.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='hotel-colline-dalat' AND h.city='dalat' AND r.code='midrange'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/colline_dalat/deluxe.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/colline_dalat/studio.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='hotel-colline-dalat' AND h.city='dalat' AND r.code='suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/colline_dalat/studio.jpg');

-- swiss-belresort-tuyen-lam-dalat

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/swiss_belresort/swiss1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='swiss-belresort-tuyen-lam-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/swiss_belresort/swiss1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/swiss_belresort/swiss2.jpg',1,0
FROM hotels h WHERE h.slug='swiss-belresort-tuyen-lam-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/swiss_belresort/swiss2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/swiss_belresort/swiss3.jpg',2,0
FROM hotels h WHERE h.slug='swiss-belresort-tuyen-lam-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/swiss_belresort/swiss3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/swiss_belresort/swiss4.jpg',3,0
FROM hotels h WHERE h.slug='swiss-belresort-tuyen-lam-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/swiss_belresort/swiss4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/swiss_belresort/swiss5.jpg',4,0
FROM hotels h WHERE h.slug='swiss-belresort-tuyen-lam-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/swiss_belresort/swiss5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/swiss_belresort/deluxe_golf.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='swiss-belresort-tuyen-lam-dalat' AND h.city='dalat' AND r.code='deluxe-golf-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/swiss_belresort/deluxe_golf.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/swiss_belresort/delux_mountian.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='swiss-belresort-tuyen-lam-dalat' AND h.city='dalat' AND r.code='grand-deluxe-mountain-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/swiss_belresort/delux_mountian.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/swiss_belresort/penthouse.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='swiss-belresort-tuyen-lam-dalat' AND h.city='dalat' AND r.code='premium-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/swiss_belresort/penthouse.jpg');

-- new-life-hotel-dalat

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/new_life_dalat/newlife1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='new-life-hotel-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/new_life_dalat/newlife1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/new_life_dalat/newlife2.jpg',1,0
FROM hotels h WHERE h.slug='new-life-hotel-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/new_life_dalat/newlife2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/new_life_dalat/newlife3.jpg',2,0
FROM hotels h WHERE h.slug='new-life-hotel-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/new_life_dalat/newlife3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/new_life_dalat/newlife4.jpg',3,0
FROM hotels h WHERE h.slug='new-life-hotel-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/new_life_dalat/newlife4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/new_life_dalat/newlife5.jpg',4,0
FROM hotels h WHERE h.slug='new-life-hotel-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/new_life_dalat/newlife5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/new_life_dalat/superior.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='new-life-hotel-dalat' AND h.city='dalat' AND r.code='superior'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/new_life_dalat/superior.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/new_life_dalat/deluxe.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='new-life-hotel-dalat' AND h.city='dalat' AND r.code='deluxe-valley-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/new_life_dalat/deluxe.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/new_life_dalat/suite_family.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='new-life-hotel-dalat' AND h.city='dalat' AND r.code='premium-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/new_life_dalat/suite_family.jpg');

-- ngoc-phat-dalat

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/ngocphat_dalat/ngocphat1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='ngoc-phat-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/ngocphat_dalat/ngocphat1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/ngocphat_dalat/ngocphat2.jpg',1,0
FROM hotels h WHERE h.slug='ngoc-phat-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/ngocphat_dalat/ngocphat2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/ngocphat_dalat/ngocphat3.jpg',2,0
FROM hotels h WHERE h.slug='ngoc-phat-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/ngocphat_dalat/ngocphat3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/ngocphat_dalat/ngocphat4.jpg',3,0
FROM hotels h WHERE h.slug='ngoc-phat-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/ngocphat_dalat/ngocphat4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/ngocphat_dalat/ngocphat5.jpg',4,0
FROM hotels h WHERE h.slug='ngoc-phat-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/ngocphat_dalat/ngocphat5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/ngocphat_dalat/superior_lake.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='ngoc-phat-dalat' AND h.city='dalat' AND r.code='superior-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/ngocphat_dalat/superior_lake.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/ngocphat_dalat/deluxe_park.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='ngoc-phat-dalat' AND h.city='dalat' AND r.code='deluxe-park-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/ngocphat_dalat/deluxe_park.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/ngocphat_dalat/suite.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='ngoc-phat-dalat' AND h.city='dalat' AND r.code='premium-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/ngocphat_dalat/suite.jpg');

-- golden-sun-dalat

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/golden_sun_dalat/golden1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='golden-sun-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/golden_sun_dalat/golden1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/golden_sun_dalat/golden2.jpg',1,0
FROM hotels h WHERE h.slug='golden-sun-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/golden_sun_dalat/golden2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/golden_sun_dalat/golden3.jpg',2,0
FROM hotels h WHERE h.slug='golden-sun-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/golden_sun_dalat/golden3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/golden_sun_dalat/golden4.jpg',3,0
FROM hotels h WHERE h.slug='golden-sun-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/golden_sun_dalat/golden4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/golden_sun_dalat/golden5.jpg',4,0
FROM hotels h WHERE h.slug='golden-sun-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/golden_sun_dalat/golden5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/golden_sun_dalat/standard.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='golden-sun-dalat' AND h.city='dalat' AND r.code='standard-double'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/golden_sun_dalat/standard.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/golden_sun_dalat/deluxe.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='golden-sun-dalat' AND h.city='dalat' AND r.code='deluxe-balcony'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/golden_sun_dalat/deluxe.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/golden_sun_dalat/suite_family.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='golden-sun-dalat' AND h.city='dalat' AND r.code='premium-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/golden_sun_dalat/suite_family.jpg');

-- lens-dalat

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/lens_dalat/len1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='lens-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/lens_dalat/len1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/lens_dalat/len2.jpg',1,0
FROM hotels h WHERE h.slug='lens-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/lens_dalat/len2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/lens_dalat/len3.jpg',2,0
FROM hotels h WHERE h.slug='lens-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/lens_dalat/len3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/lens_dalat/len4.jpg',3,0
FROM hotels h WHERE h.slug='lens-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/lens_dalat/len4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/lens_dalat/len5.jpg',4,0
FROM hotels h WHERE h.slug='lens-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/lens_dalat/len5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/lens_dalat/standard.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='lens-dalat' AND h.city='dalat' AND r.code='standard'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/lens_dalat/standard.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/lens_dalat/superior.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='lens-dalat' AND h.city='dalat' AND r.code='superior-city-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/lens_dalat/superior.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/lens_dalat/suite.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='lens-dalat' AND h.city='dalat' AND r.code='executive-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/lens_dalat/suite.jpg');

-- olive-dalat

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/olive_dalat/olive1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='olive-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/olive_dalat/olive1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/olive_dalat/olive2.jpg',1,0
FROM hotels h WHERE h.slug='olive-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/olive_dalat/olive2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/olive_dalat/olive3.jpg',2,0
FROM hotels h WHERE h.slug='olive-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/olive_dalat/olive3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/olive_dalat/olive4.jpg',3,0
FROM hotels h WHERE h.slug='olive-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/olive_dalat/olive4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/olive_dalat/olive5.jpg',4,0
FROM hotels h WHERE h.slug='olive-dalat' AND h.city='dalat'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/olive_dalat/olive5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/olive_dalat/standard.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='olive-dalat' AND h.city='dalat' AND r.code='standard-double'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/olive_dalat/standard.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/olive_dalat/deluxe.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='olive-dalat' AND h.city='dalat' AND r.code='deluxe-valley-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/olive_dalat/deluxe.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/olive_dalat/suite.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='olive-dalat' AND h.city='dalat' AND r.code='suite-panorama-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/olive_dalat/suite.jpg');

COMMIT;
