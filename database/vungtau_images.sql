-- Vung Tau photos supplied in hotel_images/. Import AFTER demo_hotels_ready.sql.
-- Resolve IDs by slug + room code, for fresh or existing databases.
-- Add missing paths only; preserve existing images, cover choices, prices and bookings.
-- Photo 1 is the default cover ONLY if no cover exists yet.
SET NAMES utf8mb4;
START TRANSACTION;


-- the-imperial-hotel-vung-tau

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/imperial_vungtau/imperial1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='the-imperial-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/imperial_vungtau/imperial1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/imperial_vungtau/imperial2.jpg',1,0
FROM hotels h WHERE h.slug='the-imperial-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/imperial_vungtau/imperial2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/imperial_vungtau/imperial3.jpg',2,0
FROM hotels h WHERE h.slug='the-imperial-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/imperial_vungtau/imperial3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/imperial_vungtau/imperial4.jpg',3,0
FROM hotels h WHERE h.slug='the-imperial-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/imperial_vungtau/imperial4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/imperial_vungtau/imperial5.jpg',4,0
FROM hotels h WHERE h.slug='the-imperial-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/imperial_vungtau/imperial5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/imperial_vungtau/deluxe_king.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='the-imperial-hotel-vung-tau' AND h.city='vungtau' AND r.code='deluxe'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/imperial_vungtau/deluxe_king.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/imperial_vungtau/deluxe_ocean.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='the-imperial-hotel-vung-tau' AND h.city='vungtau' AND r.code='grand-deluxe-ocean-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/imperial_vungtau/deluxe_ocean.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/imperial_vungtau/suite_imperial.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='the-imperial-hotel-vung-tau' AND h.city='vungtau' AND r.code='imperial-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/imperial_vungtau/suite_imperial.jpg');

-- fusion-suites-vung-tau

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/fusion_suites_vungtau/fusion1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='fusion-suites-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/fusion_suites_vungtau/fusion1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/fusion_suites_vungtau/fusion2.jpg',1,0
FROM hotels h WHERE h.slug='fusion-suites-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/fusion_suites_vungtau/fusion2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/fusion_suites_vungtau/fusion3.jpg',2,0
FROM hotels h WHERE h.slug='fusion-suites-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/fusion_suites_vungtau/fusion3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/fusion_suites_vungtau/fusion4.jpg',3,0
FROM hotels h WHERE h.slug='fusion-suites-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/fusion_suites_vungtau/fusion4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/fusion_suites_vungtau/fusion5.jpg',4,0
FROM hotels h WHERE h.slug='fusion-suites-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/fusion_suites_vungtau/fusion5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/fusion_suites_vungtau/fusion_suite.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='fusion-suites-vung-tau' AND h.city='vungtau' AND r.code='fusion-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/fusion_suites_vungtau/fusion_suite.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/fusion_suites_vungtau/deluxe.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='fusion-suites-vung-tau' AND h.city='vungtau' AND r.code='deluxe-ocean-view-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/fusion_suites_vungtau/deluxe.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/fusion_suites_vungtau/penthouse.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='fusion-suites-vung-tau' AND h.city='vungtau' AND r.code='premium-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/fusion_suites_vungtau/penthouse.jpg');

-- new-wave-vung-tau

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/new_wave_vungtau/newwave1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='new-wave-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/new_wave_vungtau/newwave1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/new_wave_vungtau/newwave2.jpg',1,0
FROM hotels h WHERE h.slug='new-wave-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/new_wave_vungtau/newwave2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/new_wave_vungtau/newwave3.jpg',2,0
FROM hotels h WHERE h.slug='new-wave-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/new_wave_vungtau/newwave3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/new_wave_vungtau/newwave4.jpg',3,0
FROM hotels h WHERE h.slug='new-wave-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/new_wave_vungtau/newwave4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/new_wave_vungtau/newwwave5.jpg',4,0
FROM hotels h WHERE h.slug='new-wave-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/new_wave_vungtau/newwwave5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/new_wave_vungtau/superior.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='new-wave-vung-tau' AND h.city='vungtau' AND r.code='superior'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/new_wave_vungtau/superior.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/new_wave_vungtau/deluxe.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='new-wave-vung-tau' AND h.city='vungtau' AND r.code='deluxe-ocean-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/new_wave_vungtau/deluxe.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/new_wave_vungtau/luxury.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='new-wave-vung-tau' AND h.city='vungtau' AND r.code='premium-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/new_wave_vungtau/luxury.jpg');

-- pullman-vung-tau

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/pull_man_vungtau/pullman1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='pullman-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/pull_man_vungtau/pullman1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/pull_man_vungtau/pullman2.jpg',1,0
FROM hotels h WHERE h.slug='pullman-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/pull_man_vungtau/pullman2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/pull_man_vungtau/pullman3.jpg',2,0
FROM hotels h WHERE h.slug='pullman-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/pull_man_vungtau/pullman3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/pull_man_vungtau/pullman4.jpg',3,0
FROM hotels h WHERE h.slug='pullman-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/pull_man_vungtau/pullman4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/pull_man_vungtau/pullman5.jpg',4,0
FROM hotels h WHERE h.slug='pullman-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/pull_man_vungtau/pullman5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/pull_man_vungtau/superior.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='pullman-vung-tau' AND h.city='vungtau' AND r.code='superior'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/pull_man_vungtau/superior.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/pull_man_vungtau/deluxe.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='pullman-vung-tau' AND h.city='vungtau' AND r.code='deluxe-ocean-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/pull_man_vungtau/deluxe.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/pull_man_vungtau/suite.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='pullman-vung-tau' AND h.city='vungtau' AND r.code='pullman-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/pull_man_vungtau/suite.jpg');

-- oyster-bay-vung-tau

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/oyster_bay_vungtau/oyster1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='oyster-bay-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/oyster_bay_vungtau/oyster1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/oyster_bay_vungtau/oyster2.jpg',1,0
FROM hotels h WHERE h.slug='oyster-bay-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/oyster_bay_vungtau/oyster2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/oyster_bay_vungtau/oyster3.jpg',2,0
FROM hotels h WHERE h.slug='oyster-bay-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/oyster_bay_vungtau/oyster3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/oyster_bay_vungtau/oyster4.jpg',3,0
FROM hotels h WHERE h.slug='oyster-bay-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/oyster_bay_vungtau/oyster4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/oyster_bay_vungtau/oyster5.jpg',4,0
FROM hotels h WHERE h.slug='oyster-bay-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/oyster_bay_vungtau/oyster5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/oyster_bay_vungtau/deluxe.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='oyster-bay-vung-tau' AND h.city='vungtau' AND r.code='deluxe-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/oyster_bay_vungtau/deluxe.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/oyster_bay_vungtau/exective.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='oyster-bay-vung-tau' AND h.city='vungtau' AND r.code='executive-ocean-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/oyster_bay_vungtau/exective.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/oyster_bay_vungtau/suite.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='oyster-bay-vung-tau' AND h.city='vungtau' AND r.code='premium-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/oyster_bay_vungtau/suite.jpg');

-- mercure-vung-tau

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/mercure_vungtau/mercure1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='mercure-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/mercure_vungtau/mercure1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/mercure_vungtau/mercure2.jpg',1,0
FROM hotels h WHERE h.slug='mercure-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/mercure_vungtau/mercure2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/mercure_vungtau/mercure3.jpg',2,0
FROM hotels h WHERE h.slug='mercure-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/mercure_vungtau/mercure3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/mercure_vungtau/mercure4.jpg',3,0
FROM hotels h WHERE h.slug='mercure-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/mercure_vungtau/mercure4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/mercure_vungtau/mercure5.jpg',4,0
FROM hotels h WHERE h.slug='mercure-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/mercure_vungtau/mercure5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/mercure_vungtau/superior.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='mercure-vung-tau' AND h.city='vungtau' AND r.code='superior-hill-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/mercure_vungtau/superior.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/mercure_vungtau/deluxe.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='mercure-vung-tau' AND h.city='vungtau' AND r.code='deluxe-ocean-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/mercure_vungtau/deluxe.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/mercure_vungtau/executive.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='mercure-vung-tau' AND h.city='vungtau' AND r.code='executive-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/mercure_vungtau/executive.jpg');

-- mermaid-seaside-vung-tau

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/mermaid_seaside_vungtau/mermaid1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='mermaid-seaside-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/mermaid_seaside_vungtau/mermaid1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/mermaid_seaside_vungtau/mermaid2.jpg',1,0
FROM hotels h WHERE h.slug='mermaid-seaside-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/mermaid_seaside_vungtau/mermaid2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/mermaid_seaside_vungtau/mermaid3.jpg',2,0
FROM hotels h WHERE h.slug='mermaid-seaside-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/mermaid_seaside_vungtau/mermaid3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/mermaid_seaside_vungtau/mermaid4.jpg',3,0
FROM hotels h WHERE h.slug='mermaid-seaside-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/mermaid_seaside_vungtau/mermaid4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/mermaid_seaside_vungtau/mermaid5.jpg',4,0
FROM hotels h WHERE h.slug='mermaid-seaside-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/mermaid_seaside_vungtau/mermaid5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/mermaid_seaside_vungtau/superior.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='mermaid-seaside-vung-tau' AND h.city='vungtau' AND r.code='superior-sea-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/mermaid_seaside_vungtau/superior.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/mermaid_seaside_vungtau/deluxe.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='mermaid-seaside-vung-tau' AND h.city='vungtau' AND r.code='deluxe-ocean-front'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/mermaid_seaside_vungtau/deluxe.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/mermaid_seaside_vungtau/suite.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='mermaid-seaside-vung-tau' AND h.city='vungtau' AND r.code='premium-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/mermaid_seaside_vungtau/suite.jpg');

-- the-cap-hotel-vung-tau

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/the_cap_vungtau/cap1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='the-cap-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/the_cap_vungtau/cap1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/the_cap_vungtau/cap2.jpg',1,0
FROM hotels h WHERE h.slug='the-cap-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/the_cap_vungtau/cap2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/the_cap_vungtau/cap3.jpg',2,0
FROM hotels h WHERE h.slug='the-cap-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/the_cap_vungtau/cap3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/the_cap_vungtau/cap4.jpg',3,0
FROM hotels h WHERE h.slug='the-cap-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/the_cap_vungtau/cap4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/the_cap_vungtau/cap5.jpg',4,0
FROM hotels h WHERE h.slug='the-cap-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/the_cap_vungtau/cap5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/the_cap_vungtau/superior.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='the-cap-hotel-vung-tau' AND h.city='vungtau' AND r.code='superior'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/the_cap_vungtau/superior.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/the_cap_vungtau/deluxe.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='the-cap-hotel-vung-tau' AND h.city='vungtau' AND r.code='deluxe-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/the_cap_vungtau/deluxe.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/the_cap_vungtau/suite.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='the-cap-hotel-vung-tau' AND h.city='vungtau' AND r.code='premium-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/the_cap_vungtau/suite.jpg');

-- petro-house-vung-tau

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/petro_vungtau/petro1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='petro-house-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/petro_vungtau/petro1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/petro_vungtau/petro2.jpg',1,0
FROM hotels h WHERE h.slug='petro-house-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/petro_vungtau/petro2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/petro_vungtau/petro3.jpg',2,0
FROM hotels h WHERE h.slug='petro-house-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/petro_vungtau/petro3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/petro_vungtau/petro4.jpg',3,0
FROM hotels h WHERE h.slug='petro-house-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/petro_vungtau/petro4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/petro_vungtau/petro5.jpg',4,0
FROM hotels h WHERE h.slug='petro-house-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/petro_vungtau/petro5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/petro_vungtau/standard.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='petro-house-vung-tau' AND h.city='vungtau' AND r.code='standard'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/petro_vungtau/standard.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/petro_vungtau/superior.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='petro-house-vung-tau' AND h.city='vungtau' AND r.code='superior-city-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/petro_vungtau/superior.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/petro_vungtau/suite.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='petro-house-vung-tau' AND h.city='vungtau' AND r.code='premium-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/petro_vungtau/suite.jpg');

-- vias-hotel-vung-tau

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/vias_vungtau/vias1.jpg',0,NOT EXISTS (SELECT 1 FROM hotel_images c WHERE c.hotel_id=h.id AND c.is_cover=1)
FROM hotels h WHERE h.slug='vias-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/vias_vungtau/vias1.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/vias_vungtau/vias2.jpg',1,0
FROM hotels h WHERE h.slug='vias-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/vias_vungtau/vias2.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/vias_vungtau/vias3.jpg',2,0
FROM hotels h WHERE h.slug='vias-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/vias_vungtau/vias3.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/vias_vungtau/vias4.jpg',3,0
FROM hotels h WHERE h.slug='vias-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/vias_vungtau/vias4.jpg');

INSERT INTO hotel_images (hotel_id,image_path,sort_order,is_cover)
SELECT h.id,'hotel_images/vias_vungtau/vias5.jpg',4,0
FROM hotels h WHERE h.slug='vias-hotel-vung-tau' AND h.city='vungtau'
AND NOT EXISTS (SELECT 1 FROM hotel_images x WHERE x.hotel_id=h.id AND x.image_path='hotel_images/vias_vungtau/vias5.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/vias_vungtau/deluxe.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='vias-hotel-vung-tau' AND h.city='vungtau' AND r.code='deluxe-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/vias_vungtau/deluxe.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/vias_vungtau/executive.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='vias-hotel-vung-tau' AND h.city='vungtau' AND r.code='executive-ocean-view'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/vias_vungtau/executive.jpg');

INSERT INTO room_images (room_type_id,image_path,sort_order,is_cover)
SELECT r.id,'hotel_images/vias_vungtau/suite.jpg',0,NOT EXISTS (SELECT 1 FROM room_images c WHERE c.room_type_id=r.id AND c.is_cover=1)
FROM room_types r JOIN hotels h ON h.id=r.hotel_id WHERE h.slug='vias-hotel-vung-tau' AND h.city='vungtau' AND r.code='premium-suite'
AND NOT EXISTS (SELECT 1 FROM room_images x WHERE x.room_type_id=r.id AND x.image_path='hotel_images/vias_vungtau/suite.jpg');

COMMIT;
