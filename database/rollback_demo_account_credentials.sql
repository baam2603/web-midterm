-- LOCAL DEMO ONLY: undo passwords introduced by commit 16ea4d2.
-- Only needed if demo_account_credentials_migration.sql was previously imported,
-- or the three demo accounts were created using the temporary username version.
-- New databases can use demo_accounts.sql directly instead.
-- Restores admin@gmail.com/admin123 and a,b@gmail.com/customer123.
-- Does not overwrite passwords changed by the account owner.
-- Revokes old sessions for accounts whose password is restored.
SET NAMES utf8mb4;
START TRANSACTION;
UPDATE users
SET password_hash='$2y$10$pVTVaBZrQWJ9kDSaVqxu5.N4ua4b2B6K9Oe9/C8o.kixrDwZyUYoS',
    session_version=session_version+1
WHERE email='admin@gmail.com' AND role='admin' AND deleted_at IS NULL
AND BINARY password_hash='$2y$10$n5ifKM3FShNEQpaGX3loGu8453.iHO2T8alPKvQ93dCVYQ6Lo7jYq';
UPDATE users
SET password_hash='$2y$10$bK.dpKPfQoaNR8rv9.8HJe1WQ/18/lqfW8OOnL/djMraDlj.zGC2a',
    session_version=session_version+1
WHERE email IN ('a@gmail.com','b@gmail.com') AND role='customer' AND deleted_at IS NULL
AND BINARY password_hash='$2y$10$UgVDIjeTzOFBG9AxCMxaaOcKuSfB/hzjvkTpknif/qg3mrhNMDucC';
COMMIT;
