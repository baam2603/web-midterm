-- Import once into threek_booking; does not drop existing data.
CREATE TABLE IF NOT EXISTS bookings (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 code VARCHAR(50) NOT NULL UNIQUE,
 user_id INT NOT NULL,
 hotel_id INT NOT NULL,
 room_type_id INT NOT NULL,
 checkin DATE NOT NULL,
 checkout DATE NOT NULL,
 rooms INT NOT NULL,
 guests INT NOT NULL,
 total DECIMAL(12,2) NOT NULL,
 status ENUM('pending','confirmed','checked_in','completed','cancelled') NOT NULL DEFAULT 'pending',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 completed_at DATETIME NULL,
 INDEX idx_user (user_id), INDEX idx_hotel (hotel_id),
 CONSTRAINT fk_book_user FOREIGN KEY(user_id) REFERENCES users(id),
 CONSTRAINT fk_book_hotel FOREIGN KEY(hotel_id) REFERENCES hotels(id),
 CONSTRAINT fk_book_room FOREIGN KEY(room_type_id) REFERENCES room_types(id),
 CONSTRAINT chk_dates CHECK(checkout > checkin),
 CONSTRAINT chk_counts CHECK(rooms > 0 AND guests > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS reviews (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 booking_id BIGINT UNSIGNED NOT NULL UNIQUE,
 user_id INT NOT NULL,
 hotel_id INT NOT NULL,
 score TINYINT UNSIGNED NOT NULL,
 comment TEXT NOT NULL,
 status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 moderated_at DATETIME NULL,
 INDEX idx_review_hotel (hotel_id,status,created_at),
 CONSTRAINT fk_review_booking FOREIGN KEY(booking_id) REFERENCES bookings(id),
 CONSTRAINT fk_review_user FOREIGN KEY(user_id) REFERENCES users(id),
 CONSTRAINT fk_review_hotel FOREIGN KEY(hotel_id) REFERENCES hotels(id),
 CONSTRAINT chk_score CHECK(score BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
