-- LOCAL DEMO ONLY: update the original published demo passwords.
-- Import after the account_closure/customer migrations, into threek_booking.
-- Accounts with passwords changed by their owners are left untouched.
-- username admin / password admin; username a,b / password 52400283.
-- Applying this update revokes old sessions for the affected demo accounts.
SET NAMES utf8mb4;
START TRANSACTION;
UPDATE users SET password_hash='$2y$10$n5ifKM3FShNEQpaGX3loGu8453.iHO2T8alPKvQ93dCVYQ6Lo7jYq', session_version=session_version+1
WHERE email='admin@gmail.com' AND role='admin' AND deleted_at IS NULL
AND BINARY password_hash='$2y$10$pVTVaBZrQWJ9kDSaVqxu5.N4ua4b2B6K9Oe9/C8o.kixrDwZyUYoS';
UPDATE users SET password_hash='$2y$10$UgVDIjeTzOFBG9AxCMxaaOcKuSfB/hzjvkTpknif/qg3mrhNMDucC', session_version=session_version+1
WHERE email IN ('a@gmail.com','b@gmail.com') AND role='customer' AND deleted_at IS NULL
AND BINARY password_hash='$2y$10$bK.dpKPfQoaNR8rv9.8HJe1WQ/18/lqfW8OOnL/djMraDlj.zGC2a';
COMMIT;
