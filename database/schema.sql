-- Current MariaDB schema; no account or booking data. Import into an empty database.
SET NAMES utf8mb4;
CREATE TABLE `amenities` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `label` varchar(100) NOT NULL,
  `icon` varchar(80) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `bookings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL,
  `user_id` int(11) NOT NULL,
  `hotel_id` int(11) NOT NULL,
  `room_type_id` int(11) NOT NULL,
  `checkin` date NOT NULL,
  `checkout` date NOT NULL,
  `rooms` int(11) NOT NULL,
  `guests` int(11) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `status` enum('pending','confirmed','checked_in','completed','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `hotels` (
  `id` int(11) NOT NULL,
  `slug` varchar(80) NOT NULL,
  `name` varchar(150) NOT NULL,
  `city` varchar(30) NOT NULL,
  `type` varchar(30) NOT NULL,
  `stars` tinyint(3) UNSIGNED NOT NULL,
  `address` varchar(255) NOT NULL,
  `google_place_id` varchar(255) DEFAULT NULL,
  `price_per_night` decimal(12,2) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `checkin_time` time DEFAULT NULL,
  `checkout_time` time DEFAULT NULL,
  `rules_json` longtext DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `hotel_amenities` (
  `hotel_id` int(11) NOT NULL,
  `amenity_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `hotel_images` (
  `id` int(11) NOT NULL,
  `hotel_id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_cover` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `hotel_id` int(11) NOT NULL,
  `score` tinyint(3) UNSIGNED NOT NULL,
  `comment` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `moderated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `room_images` (
  `id` int(11) NOT NULL,
  `room_type_id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_cover` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `room_types` (
  `id` int(11) NOT NULL,
  `hotel_id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(120) NOT NULL,
  `capacity` int(11) NOT NULL,
  `total_rooms` int(11) NOT NULL DEFAULT 0,
  `price_per_night` decimal(12,2) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `area_m2` smallint(5) UNSIGNED DEFAULT NULL,
  `bed_type` varchar(120) DEFAULT NULL,
  `breakfast_included` tinyint(1) NOT NULL DEFAULT 0,
  `free_cancellation` tinyint(1) NOT NULL DEFAULT 0,
  `features_json` longtext DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `display_name` varchar(60) DEFAULT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `role` enum('customer','admin') NOT NULL DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `amenities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_hotel` (`hotel_id`),
  ADD KEY `fk_book_room` (`room_type_id`);

ALTER TABLE `hotels`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `uq_hotels_google_place_id` (`google_place_id`),
  ADD KEY `idx_city` (`city`);

ALTER TABLE `hotel_amenities`
  ADD PRIMARY KEY (`hotel_id`,`amenity_id`),
  ADD KEY `amenity_id` (`amenity_id`);

ALTER TABLE `hotel_images`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_hotel_image` (`hotel_id`,`image_path`);

ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `booking_id` (`booking_id`),
  ADD KEY `idx_review_hotel` (`hotel_id`,`status`,`created_at`),
  ADD KEY `fk_review_user` (`user_id`);

ALTER TABLE `room_images`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_room_image` (`room_type_id`,`image_path`);

ALTER TABLE `room_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_hotel_room` (`hotel_id`,`code`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`);

ALTER TABLE `amenities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `bookings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `hotels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `hotel_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `room_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `room_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_book_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`),
  ADD CONSTRAINT `fk_book_room` FOREIGN KEY (`room_type_id`) REFERENCES `room_types` (`id`),
  ADD CONSTRAINT `fk_book_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `hotel_amenities`
  ADD CONSTRAINT `hotel_amenities_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hotel_amenities_ibfk_2` FOREIGN KEY (`amenity_id`) REFERENCES `amenities` (`id`) ON DELETE CASCADE;

ALTER TABLE `hotel_images`
  ADD CONSTRAINT `fk_image_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE;

ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_review_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `fk_review_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`),
  ADD CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `room_images`
  ADD CONSTRAINT `fk_room_images_room` FOREIGN KEY (`room_type_id`) REFERENCES `room_types` (`id`) ON DELETE CASCADE;

ALTER TABLE `room_types`
  ADD CONSTRAINT `fk_room_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE;
