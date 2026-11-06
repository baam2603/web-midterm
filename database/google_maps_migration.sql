-- Additive MariaDB migration; keep all current hotels/rooms/bookings and legacy OSM references.
ALTER TABLE hotels
 ADD COLUMN IF NOT EXISTS maps_provider varchar(12) NOT NULL DEFAULT 'manual',
 ADD COLUMN IF NOT EXISTS maps_verified_at datetime DEFAULT NULL;
UPDATE hotels SET maps_provider='osm' WHERE google_place_id LIKE 'osm-%' AND maps_provider='manual';
