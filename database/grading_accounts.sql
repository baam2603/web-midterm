-- LOCAL GRADING DATABASE ONLY. Import after all schema migrations.
-- Admin: nguyentuankhoi2603@gmail.com / TKi@17022603
-- Customer: b@gmail.com / admin123
-- Published grading credentials; do not use for personal accounts or public hosting.
-- Existing owner-changed passwords and existing roles are not overwritten.
SET NAMES utf8mb4;
START TRANSACTION;
INSERT INTO users (email,password_hash,full_name,display_name,role)
SELECT 'nguyentuankhoi2603@gmail.com',
       '$2y$10$q7PPMSvv3JA1DKlZbf6aG.1DcyHVIjP1qFzNITKCL6I3zUhNRI9j6',
       'Nguyễn Tuấn Khôi','Quản trị viên','admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='nguyentuankhoi2603@gmail.com');
INSERT INTO users (email,password_hash,full_name,display_name,role)
SELECT 'b@gmail.com',
       '$2y$10$nk5YeWjl61YOKqnl2hicOO7ikOFY0c.N1rqR/HhtoUmzHyZehS1l.',
       'Khách hàng demo','Khách demo','customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='b@gmail.com');
-- Upgrade ONLY the original published b@gmail.com/customer123 demo account.
UPDATE users
SET password_hash='$2y$10$nk5YeWjl61YOKqnl2hicOO7ikOFY0c.N1rqR/HhtoUmzHyZehS1l.',
    session_version=session_version+1
WHERE email='b@gmail.com' AND role='customer' AND deleted_at IS NULL
AND BINARY password_hash='$2y$10$bK.dpKPfQoaNR8rv9.8HJe1WQ/18/lqfW8OOnL/djMraDlj.zGC2a';
COMMIT;
