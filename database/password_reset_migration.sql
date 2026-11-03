-- Run once inside threek_booking; do NOT re-import schema.sql.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  user_id INT(11) NOT NULL,
  otp_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  requested_at DATETIME NOT NULL,
  failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
