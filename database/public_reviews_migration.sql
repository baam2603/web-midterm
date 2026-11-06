-- MariaDB 10.4+: keep all existing reviews and booking references.
ALTER TABLE reviews MODIFY COLUMN booking_id BIGINT UNSIGNED NULL DEFAULT NULL;
ALTER TABLE reviews MODIFY COLUMN status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved';
-- Publish old pending reviews. Previously removed/hidden reviews remain hidden.
UPDATE reviews v JOIN users u ON u.id=v.user_id
SET v.status='approved' WHERE v.status='pending' AND u.deleted_at IS NULL;
