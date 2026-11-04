-- MariaDB 10.4+. Additive and safe to repeat on the supplied SQL_3K database.
SET NAMES utf8mb4;
ALTER TABLE hotels
 ADD COLUMN IF NOT EXISTS google_place_id varchar(255) DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS is_active tinyint(1) NOT NULL DEFAULT 1,
 ADD COLUMN IF NOT EXISTS checkin_time time DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS checkout_time time DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS rules_json longtext DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS latitude decimal(10,7) DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS longitude decimal(10,7) DEFAULT NULL;
ALTER TABLE room_types
 ADD COLUMN IF NOT EXISTS area_m2 smallint unsigned DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS bed_type varchar(120) DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS breakfast_included tinyint(1) NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS free_cancellation tinyint(1) NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS features_json longtext DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS is_active tinyint(1) NOT NULL DEFAULT 1;
CREATE TABLE IF NOT EXISTS room_images (
 id int NOT NULL AUTO_INCREMENT PRIMARY KEY, room_type_id int NOT NULL,
 image_path varchar(255) NOT NULL, sort_order int NOT NULL DEFAULT 0,
 is_cover tinyint(1) NOT NULL DEFAULT 0,
 CONSTRAINT fk_room_images_room FOREIGN KEY(room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS support_tickets (
 id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id int NOT NULL, topic varchar(120) NOT NULL, message text NOT NULL,
 booking_code varchar(50) DEFAULT NULL,
 status enum('open','answered','closed') NOT NULL DEFAULT 'open',
 reply text DEFAULT NULL, replied_by int DEFAULT NULL,
 created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, replied_at datetime DEFAULT NULL,
 INDEX idx_ticket_status(status,created_at),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(replied_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS audit_logs (
 id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
 actor_id int DEFAULT NULL, action varchar(80) NOT NULL,
 entity_type varchar(40) NOT NULL, entity_id varchar(80) NOT NULL,
 details_json longtext NOT NULL, created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_audit_created(created_at),
 FOREIGN KEY(actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX IF NOT EXISTS idx_bookings_availability ON bookings(room_type_id,status,checkin,checkout);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at,id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_hotels_google_place_id ON hotels(google_place_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_hotel_room ON room_types(hotel_id,code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_room_image ON room_images(room_type_id,image_path);
