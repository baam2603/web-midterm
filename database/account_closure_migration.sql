-- MariaDB 10.4+, additive and repeatable. Keep existing users and booking history.
-- Run after admin_migration.sql, customer_migration.sql and registration_otp_migration.sql.
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at DATETIME DEFAULT NULL;
