-- =============================================================================
-- MIMATCHA — Database Schema
-- Database: mimatcha_db
-- Engine: MySQL / MariaDB
-- Port: 3308 (default untuk development lokal)
-- =============================================================================
-- Cara pakai:
--   1. Buka MySQL client (phpMyAdmin / command line)
--   2. Copy-paste atau source file ini
--   3. Atau: mysql -u root -p --port=3308 < database/schema.sql
-- =============================================================================

CREATE DATABASE IF NOT EXISTS mimatcha_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE mimatcha_db;

-- =============================================================================
-- 1. PRODUK (Products)
-- =============================================================================
CREATE TABLE IF NOT EXISTS produk (
    id_produk       INT             NOT NULL AUTO_INCREMENT,
    nama_produk     VARCHAR(255)    NOT NULL,
    harga           DECIMAL(10,2)   NOT NULL,
    stok            INT             NOT NULL DEFAULT 0,
    kategori        VARCHAR(100)    DEFAULT NULL,
    deskripsi       TEXT            DEFAULT NULL,
    gambar          LONGTEXT        DEFAULT NULL COMMENT 'Base64 image — LONGTEXT supaya muat gambar besar',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_produk),
    INDEX idx_kategori (kategori),
    INDEX idx_nama_produk (nama_produk)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. PELANGGAN (Customers)
-- =============================================================================
CREATE TABLE IF NOT EXISTS pelanggan (
    id_pelanggan    INT             NOT NULL AUTO_INCREMENT,
    nama            VARCHAR(255)    NOT NULL,
    alamat          TEXT            DEFAULT NULL,
    nomor_telepon   VARCHAR(20)     DEFAULT NULL,
    email           VARCHAR(255)    DEFAULT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_pelanggan),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. PESANAN (Orders)
-- =============================================================================
CREATE TABLE IF NOT EXISTS pesanan (
    id_pesanan          INT             NOT NULL AUTO_INCREMENT,
    id_pelanggan        INT             DEFAULT NULL,
    tanggal_pesanan     DATE            NOT NULL,
    total_pembayaran    DECIMAL(10,2)   NOT NULL,
    status_pesanan      VARCHAR(50)     NOT NULL DEFAULT 'pending' COMMENT 'pending | lunas | batal',
    metode_pembayaran   VARCHAR(50)     DEFAULT NULL,
    kasir               VARCHAR(100)    DEFAULT NULL,
    payment_reference   VARCHAR(255)    DEFAULT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_pesanan),
    INDEX idx_tanggal (tanggal_pesanan),
    INDEX idx_status (status_pesanan),
    INDEX idx_payment_ref (payment_reference),
    CONSTRAINT fk_pesanan_pelanggan
        FOREIGN KEY (id_pelanggan) REFERENCES pelanggan (id_pelanggan)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. DETAIL PESANAN (Order Items)
-- =============================================================================
CREATE TABLE IF NOT EXISTS detail_pesanan (
    id_detail       INT             NOT NULL AUTO_INCREMENT,
    id_pesanan      INT             NOT NULL,
    id_produk       INT             NOT NULL,
    jumlah_produk   INT             NOT NULL,
    harga_satuan    DECIMAL(10,2)   NOT NULL,
    subtotal        DECIMAL(10,2)   NOT NULL,
    PRIMARY KEY (id_detail),
    INDEX idx_id_pesanan (id_pesanan),
    INDEX idx_id_produk (id_produk),
    CONSTRAINT fk_detail_pesanan
        FOREIGN KEY (id_pesanan) REFERENCES pesanan (id_pesanan)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detail_produk
        FOREIGN KEY (id_produk) REFERENCES produk (id_produk)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. KONTRAK (Contracts)
-- =============================================================================
CREATE TABLE IF NOT EXISTS kontrak (
    id_kontrak          INT             NOT NULL AUTO_INCREMENT,
    nomor_kontrak       VARCHAR(50)     DEFAULT NULL,
    tipe_kontrak        VARCHAR(100)    DEFAULT NULL,
    id_pesanan          INT             DEFAULT NULL,
    nama_pihak_kedua    VARCHAR(255)    DEFAULT NULL,
    email_pihak         VARCHAR(255)    DEFAULT NULL,
    tanggal_kontrak     DATE            DEFAULT NULL,
    masa_berlaku        DATE            DEFAULT NULL,
    nilai_kontrak       DECIMAL(15,2)   DEFAULT NULL,
    isi_kontrak         TEXT            DEFAULT NULL,
    catatan             TEXT            DEFAULT NULL,
    status              VARCHAR(50)     NOT NULL DEFAULT 'draft' COMMENT 'draft | aktif | berakhir | batal',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_kontrak),
    INDEX idx_status (status),
    INDEX idx_masa_berlaku (masa_berlaku),
    INDEX idx_nomor_kontrak (nomor_kontrak),
    CONSTRAINT fk_kontrak_pesanan
        FOREIGN KEY (id_pesanan) REFERENCES pesanan (id_pesanan)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. PAYMENT TRANSACTIONS (Riwayat Pembayaran via Pakasir)
-- =============================================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id                      INT             NOT NULL AUTO_INCREMENT,
    id_pesanan              INT             NOT NULL,
    payment_reference       VARCHAR(255)    NOT NULL,
    payment_method          VARCHAR(50)     NOT NULL COMMENT 'qris | va_bca | va_bni | va_mandiri | va_bri | va_permata | cash',
    amount                  DECIMAL(10,2)   NOT NULL,
    status                  VARCHAR(50)     NOT NULL DEFAULT 'pending' COMMENT 'pending | paid | expired | failed | cancelled',
    qr_code_url             TEXT            DEFAULT NULL COMMENT 'URL gambar QR (untuk QRIS)',
    qr_string               TEXT            DEFAULT NULL COMMENT 'QRIS content string (untuk QRIS)',
    va_number               VARCHAR(100)    DEFAULT NULL COMMENT 'Nomor Virtual Account (untuk VA)',
    va_bank                 VARCHAR(50)     DEFAULT NULL COMMENT 'Nama bank VA (BCA/BNI/Mandiri/dll)',
    expired_at              DATETIME        DEFAULT NULL,
    paid_at                 DATETIME        DEFAULT NULL,
    pakasir_transaction_id  VARCHAR(255)    DEFAULT NULL,
    pakasir_response        TEXT            DEFAULT NULL COMMENT 'Raw JSON response dari Pakasir',
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_payment_ref (payment_reference),
    INDEX idx_status (status),
    INDEX idx_id_pesanan (id_pesanan),
    CONSTRAINT fk_payment_pesanan
        FOREIGN KEY (id_pesanan) REFERENCES pesanan (id_pesanan)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. PAYMENT WEBHOOKS (Log Notifikasi dari Pakasir)
-- =============================================================================
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id                  INT             NOT NULL AUTO_INCREMENT,
    payment_reference   VARCHAR(255)    DEFAULT NULL,
    event_type          VARCHAR(100)    DEFAULT NULL,
    webhook_data        TEXT            DEFAULT NULL COMMENT 'Raw JSON dari Pakasir',
    ip_address          VARCHAR(50)     DEFAULT NULL,
    user_agent          TEXT            DEFAULT NULL,
    processed           BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_payment_ref (payment_reference),
    INDEX idx_processed (processed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. SETTINGS (Pengaturan Aplikasi)
-- =============================================================================
CREATE TABLE IF NOT EXISTS settings (
    id              INT             NOT NULL AUTO_INCREMENT,
    setting_key     VARCHAR(100)    NOT NULL,
    setting_value   TEXT            DEFAULT NULL,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. NOTIFICATIONS (Notifikasi Sistem)
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              INT             NOT NULL AUTO_INCREMENT,
    type            VARCHAR(50)     NOT NULL COMMENT 'order | stock | contract | payment | system',
    title           VARCHAR(255)    NOT NULL,
    message         TEXT            NOT NULL,
    link            VARCHAR(500)    DEFAULT NULL,
    role_filter     VARCHAR(50)     DEFAULT NULL COMMENT 'NULL=semua role | owner | kasir | staff_gudang | admin_keuangan',
    is_read         TINYINT(1)     NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_type (type),
    INDEX idx_role (role_filter),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 10. USERS (Akun Login)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id          INT             NOT NULL AUTO_INCREMENT,
    email       VARCHAR(255)    NOT NULL,
    password    VARCHAR(255)    NOT NULL,
    nama        VARCHAR(255)    DEFAULT NULL,
    role        VARCHAR(50)     NOT NULL DEFAULT 'user' COMMENT 'owner | admin | kasir | user',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- DATA AWAL (Seeders) — Opsional, jalankan hanya untuk database baru
-- =============================================================================

-- Default admin user (password: admin123)
-- INSERT INTO users (email, password, nama, role)
-- VALUES ('admin@mimatcha.id', 'admin123', 'Admin MiMatcha', 'owner');

-- Walk-in customer default
-- INSERT INTO pelanggan (nama, alamat, nomor_telepon, email)
-- VALUES ('Walk-in Customer', '-', '-', 'walkin@mimatcha.id');
