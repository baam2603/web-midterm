-- MariaDB 10.4+, repeatable. Retain hotels, rooms, bookings and legacy references.
ALTER TABLE hotels
 ADD COLUMN IF NOT EXISTS maps_provider varchar(20) NOT NULL DEFAULT 'legacy',
 ADD COLUMN IF NOT EXISTS maps_verified_at datetime DEFAULT NULL;
UPDATE hotels SET maps_provider='osm'
 WHERE google_place_id LIKE 'osm-%' AND maps_provider IN ('legacy','manual');
