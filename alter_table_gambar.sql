-- ========================================
-- BACKUP & ALTER TABLE SCRIPT
-- Database: mimatcha_db
-- Table: produk
-- Action: Change column 'gambar' to LONGTEXT
-- Date: 2026-05-14
-- ========================================

-- STEP 1: Backup existing data (optional but recommended)
-- You can export the table first via phpMyAdmin or:
-- mysqldump -u root -p --port=3308 mimatcha_db produk > backup_produk_20260514.sql

-- STEP 2: Check current column type
SHOW COLUMNS FROM produk LIKE 'gambar';

-- STEP 3: Alter column to LONGTEXT
ALTER TABLE produk MODIFY COLUMN gambar LONGTEXT;

-- STEP 4: Verify the change
SHOW COLUMNS FROM produk LIKE 'gambar';

-- STEP 5: Check if existing data is intact
SELECT id_produk, nama_produk, 
       CASE 
           WHEN gambar IS NULL THEN 'NULL'
           WHEN gambar = '' THEN 'EMPTY'
           ELSE CONCAT('HAS DATA (', LENGTH(gambar), ' bytes)')
       END as gambar_status
FROM produk
ORDER BY id_produk DESC
LIMIT 5;

-- ========================================
-- EXPECTED RESULT:
-- Column 'gambar' should now be LONGTEXT
-- Max size: 4GB (4,294,967,295 bytes)
-- ========================================
