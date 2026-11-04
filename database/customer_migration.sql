-- Apply AFTER admin_migration.sql. MariaDB 10.4+. Additive, repeatable.
ALTER TABLE bookings
 ADD COLUMN IF NOT EXISTS guest_name varchar(120) DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS guest_email varchar(150) DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS guest_phone varchar(25) DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS guest_note text DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS pay_method varchar(30) NOT NULL DEFAULT 'hotel',
 ADD COLUMN IF NOT EXISTS payment_status varchar(30) NOT NULL DEFAULT 'unpaid',
 ADD COLUMN IF NOT EXISTS refundable tinyint(1) DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS subtotal decimal(12,2) DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS discount decimal(12,2) NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS tax decimal(12,2) DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS request_key varchar(80) DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS request_hash char(64) DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS payment_expires_at datetime DEFAULT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_request ON bookings(user_id,request_key);
CREATE TABLE IF NOT EXISTS favorites (
 user_id int NOT NULL, hotel_id int NOT NULL,
 created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,hotel_id),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS notifications (
 id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id int NOT NULL,
 title varchar(150) NOT NULL, message text NOT NULL, booking_code varchar(50) DEFAULT NULL,
 read_at datetime DEFAULT NULL, created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_notification_user(user_id,created_at),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS password_resets (
 id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY, user_id int NOT NULL,
 token_hash char(64) NOT NULL UNIQUE, expires_at datetime NOT NULL, used_at datetime DEFAULT NULL,
 created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_reset_user(user_id,created_at),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS mail_outbox (
 id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
 recipient varchar(150) NOT NULL, subject varchar(200) NOT NULL, html_body mediumtext NOT NULL,
 status enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
 attempts int NOT NULL DEFAULT 0, last_error varchar(250) DEFAULT NULL,
 created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, sent_at datetime DEFAULT NULL,
 INDEX idx_outbox_status(status,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS payments (
 id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY, booking_id bigint unsigned NOT NULL UNIQUE,
 txn_ref varchar(80) NOT NULL UNIQUE, amount decimal(12,2) NOT NULL,
 status enum('pending','paid','failed','review','refund_requested','refunded') NOT NULL DEFAULT 'pending',
 provider_transaction varchar(100) DEFAULT NULL UNIQUE, paid_at datetime DEFAULT NULL,
 created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(booking_id) REFERENCES bookings(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE mail_outbox ADD COLUMN IF NOT EXISTS last_attempt_at datetime DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version int NOT NULL DEFAULT 1;
ALTER TABLE payments
 ADD COLUMN IF NOT EXISTS refund_reference varchar(120) DEFAULT NULL,
 ADD COLUMN IF NOT EXISTS refunded_at datetime DEFAULT NULL;
