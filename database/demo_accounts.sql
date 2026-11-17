-- THREEK: tai khoan chi dung de cham bai/demo local.
-- Chon database threek_booking; import sau schema va tat ca migration trong README.
-- admin@gmail.com : admin123       (admin)
-- a@gmail.com     : customer123    (customer)
-- b@gmail.com     : customer123    (customer)
-- Mat khau duoc bam bang PHP password_hash(), khong luu plaintext trong users.
-- Chay lai khong doi mat khau/quyen cua email da ton tai.
-- Khong import tren he thong cong khai hoac database co tai khoan that.
SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO users (email, password_hash, full_name, display_name, role)
SELECT 'admin@gmail.com', '$2y$10$pVTVaBZrQWJ9kDSaVqxu5.N4ua4b2B6K9Oe9/C8o.kixrDwZyUYoS',
       'Quản trị demo', 'Admin demo', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gmail.com');

INSERT INTO users (email, password_hash, full_name, display_name, role)
SELECT 'a@gmail.com', '$2y$10$bK.dpKPfQoaNR8rv9.8HJe1WQ/18/lqfW8OOnL/djMraDlj.zGC2a',
       'Khách hàng A', 'Khách A', 'customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'a@gmail.com');

INSERT INTO users (email, password_hash, full_name, display_name, role)
SELECT 'b@gmail.com', '$2y$10$bK.dpKPfQoaNR8rv9.8HJe1WQ/18/lqfW8OOnL/djMraDlj.zGC2a',
       'Khách hàng B', 'Khách B', 'customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'b@gmail.com');

COMMIT;
