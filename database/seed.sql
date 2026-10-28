-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3308
-- Generation Time: Oct 28, 2026 at 05:21 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `threek_booking`
--

--
-- Dumping data for table `amenities`
--

INSERT INTO `amenities` (`id`, `code`, `label`, `icon`) VALUES
(1, 'wifi', 'Wifi miễn phí', 'wifi'),
(2, 'parking', 'Bãi đỗ xe', 'local_parking'),
(3, 'breakfast', 'Bữa sáng', 'free_breakfast'),
(4, 'pool', 'Hồ bơi', 'pool'),
(5, 'restaurant', 'Nhà hàng', 'restaurant'),
(6, 'fireplace', 'Lò sưởi', 'fireplace'),
(7, 'valley', 'View thung lũng', 'landscape'),
(8, 'lake', 'View hồ', 'waves'),
(9, 'sea', 'View biển', 'waves'),
(10, 'sunset', 'View hoàng hôn', 'bedtime'),
(11, 'garden', 'Vườn riêng', 'yard'),
(12, 'shuttle', 'Đưa đón sân bay', 'local_taxi'),
(13, 'checkin24', 'Nhận phòng 24h', 'gpp_good');

--
-- Dumping data for table `hotels`
--

INSERT INTO `hotels` (`id`, `slug`, `name`, `city`, `type`, `stars`, `address`, `price_per_night`, `description`, `created_at`) VALUES
(1, 'grand-mercure', 'Đồi Thông Retreat', 'dalat', 'resort', 5, 'Phường 5, gần Hồ Tuyền Lâm', 999000.00, 'Khu nghỉ dưỡng gần rừng thông Đà Lạt', '2026-10-28 10:52:24'),
(2, 'lan-suong', 'Làn Sương Boutique Hotel', 'dalat', 'hotel', 4, 'Trung tâm, cạnh Hồ Xuân Hương', 980000.00, 'Khách sạn boutique tại trung tâm Đà Lạt', '2026-10-28 10:52:24'),
(3, 'sample-vungtau', 'Sóng Biển Resort', 'vungtau', 'resort', 5, 'Bãi Sau, sát bờ biển', 1450000.00, 'Khu nghỉ dưỡng gần biển Vũng Tàu', '2026-10-28 10:52:24'),
(4, 'anh-duong', 'Ánh Dương Boutique Hotel', 'vungtau', 'hotel', 4, 'Trung tâm, gần Bãi Trước', 890000.00, 'Khách sạn boutique gần Bãi Trước', '2026-10-28 10:52:24'),
(17, 'cao-nguyen', 'Lữ Quán Cao Nguyên', 'dalat', 'homestay', 3, 'Đường Trần Hưng Đạo', 760000.00, NULL, '2026-10-28 13:38:21'),
(18, 'thung-lung-xanh', 'Thung Lũng Xanh Villa', 'dalat', 'villa', 5, 'Đường Khe Sanh, Phường 10', 3200000.00, NULL, '2026-10-28 13:38:21'),
(19, 'ho-xuan-huong-view', 'Hồ Xuân Hương View Hotel', 'dalat', 'hotel', 4, 'Quanh Hồ Xuân Hương, Phường 1', 1480000.00, NULL, '2026-10-28 13:38:21'),
(20, 'cho-dem-homestay', 'Chợ Đêm Homestay', 'dalat', 'homestay', 2, 'Gần Chợ đêm, Nguyễn Thị Minh Khai', 520000.00, NULL, '2026-10-28 13:38:21'),
(21, 'tuyen-lam-resort', 'Tuyền Lâm Lakeside Resort', 'dalat', 'resort', 5, 'Ven Hồ Tuyền Lâm, Phường 4', 2650000.00, NULL, '2026-10-28 13:38:21'),
(22, 'doi-cu-inn', 'Đồi Cù Inn', 'dalat', 'hotel', 3, 'Gần Đồi Cù, Phù Đổng Thiên Vương', 690000.00, NULL, '2026-10-28 13:38:21'),
(23, 'hai-au', 'Hải Âu Homestay', 'vungtau', 'homestay', 3, 'Đường Thùy Vân', 650000.00, NULL, '2026-10-28 13:38:21'),
(24, 'hoang-hon-villa', 'Hoàng Hôn Sea Villa', 'vungtau', 'villa', 5, 'Đường Trần Phú, ven biển', 3600000.00, NULL, '2026-10-28 13:38:21'),
(25, 'bai-truoc-grand', 'Bãi Trước Grand Hotel', 'vungtau', 'hotel', 5, 'Đường Quang Trung, Bãi Trước', 2100000.00, NULL, '2026-10-28 13:38:21'),
(26, 'thi-sach-inn', 'Thi Sách Inn', 'vungtau', 'hotel', 3, 'Đường Thi Sách, khu phố ẩm thực', 560000.00, NULL, '2026-10-28 13:38:21'),
(27, 'thuy-van-apartment', 'Thùy Vân Sea Apartment', 'vungtau', 'villa', 4, 'Đường Thùy Vân, Bãi Sau', 1180000.00, NULL, '2026-10-28 13:38:21'),
(28, 'lhp-homestay', 'Lê Hồng Phong Homestay', 'vungtau', 'homestay', 2, 'Đường Lê Hồng Phong, trung tâm', 480000.00, NULL, '2026-10-28 13:38:21');

--
-- Dumping data for table `hotel_images`
--

INSERT INTO `hotel_images` (`id`, `hotel_id`, `image_path`, `sort_order`, `is_cover`) VALUES
(1, 1, 'sources/dalat1.jpg', 1, 1),
(2, 1, 'sources/dalat2.jpg', 2, 0),
(3, 3, 'sources/vungtau.jpg', 1, 1);

--
-- Dumping data for table `room_types`
--

INSERT INTO `room_types` (`id`, `hotel_id`, `code`, `name`, `capacity`, `total_rooms`, `price_per_night`, `description`, `created_at`) VALUES
(1, 1, 'deluxe', 'Deluxe Garden', 2, 6, 1250000.00, 'Phòng hướng vườn', '2026-10-28 11:36:30'),
(2, 1, 'family-suite', 'Family Suite', 4, 3, 2100000.00, 'Phòng gia đình', '2026-10-28 11:37:08'),
(3, 2, 'standard', 'Standard Double', 2, 8, 980000.00, 'Phòng tiêu chuẩn', '2026-10-28 11:38:05'),
(4, 2, 'deluxe', 'Deluxe City View', 2, 5, 1350000.00, 'Phòng hướng thành phố', '2026-10-28 11:38:36');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
