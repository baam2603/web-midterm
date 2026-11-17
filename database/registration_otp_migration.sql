-- Additive, repeatable MariaDB migration. Existing users remain verified/usable.
CREATE TABLE IF NOT EXISTS registration_challenges (
 email varchar(150) NOT NULL PRIMARY KEY,
 challenge_id char(64) NOT NULL UNIQUE,
 full_name varchar(120) DEFAULT NULL,
 password_hash varchar(255) DEFAULT NULL,
 phone varchar(20) DEFAULT NULL,
 birthday date DEFAULT NULL,
 otp_hash varchar(255) DEFAULT NULL,
 expires_at datetime NOT NULL,
 last_sent_at datetime NOT NULL,
 window_started_at datetime NOT NULL,
 send_count int NOT NULL DEFAULT 0,
 failed_attempts int NOT NULL DEFAULT 0,
 mail_id bigint unsigned DEFAULT NULL,
 consumed_at datetime DEFAULT NULL,
 INDEX idx_registration_window(window_started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS registration_rate_limits (
 ip_hash char(64) NOT NULL PRIMARY KEY,
 window_started_at datetime NOT NULL,
 send_count int NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
ALTER TABLE mail_outbox ADD COLUMN IF NOT EXISTS expires_at datetime DEFAULT NULL;
