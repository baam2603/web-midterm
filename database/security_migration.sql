-- Additive and repeatable. No changes to existing users, hotels or bookings.
CREATE TABLE IF NOT EXISTS security_rate_limits (
    bucket CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
    attempts INT UNSIGNED NOT NULL DEFAULT 0,
    reset_at DATETIME NOT NULL,
    INDEX idx_security_rate_reset (reset_at)
) ENGINE=InnoDB;
