-- THREEK: tai khoan chi dung de cham bai/demo local.
-- Chon database threek_booking; import sau schema va tat ca migration trong README.
-- admin (admin@gmail.com) : admin       (admin)
-- a (a@gmail.com)         : 52400283    (customer)
-- b (b@gmail.com)         : 52400283    (customer)
-- Mat khau duoc bam bang PHP password_hash(), khong luu plaintext trong users.
-- Chay lai khong doi mat khau/quyen cua email da ton tai.
-- Khong import tren he thong cong khai hoac database co tai khoan that.
SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO users (email, password_hash, full_name, display_name, role)
SELECT 'admin@gmail.com', '$2y$10$n5ifKM3FShNEQpaGX3loGu8453.iHO2T8alPKvQ93dCVYQ6Lo7jYq',
       'Quản trị demo', 'Admin demo', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gmail.com');

INSERT INTO users (email, password_hash, full_name, display_name, role)
SELECT 'a@gmail.com', '$2y$10$UgVDIjeTzOFBG9AxCMxaaOcKuSfB/hzjvkTpknif/qg3mrhNMDucC',
       'Khách hàng A', 'Khách A', 'customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'a@gmail.com');

INSERT INTO users (email, password_hash, full_name, display_name, role)
SELECT 'b@gmail.com', '$2y$10$UgVDIjeTzOFBG9AxCMxaaOcKuSfB/hzjvkTpknif/qg3mrhNMDucC',
       'Khách hàng B', 'Khách B', 'customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'b@gmail.com');

COMMIT;
