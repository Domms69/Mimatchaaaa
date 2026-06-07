-- =============================================================================
-- MIMATCHA — Migrasi dari MySQL ke PostgreSQL
-- =============================================================================
-- Cara pakai:
--   1. Install PostgreSQL (bisa via Laragon > Menu > Tools > Quick Add > PostgreSQL)
--   2. Buka terminal: psql -U postgres
--   3. Jalankan: \i 'C:/Users/Mas Ajid/Downloads/Mimatcha/mimatcha/database/migrasi_postgresql.sql'
--   4. Atau copy-paste ke query tool (pgAdmin / DBeaver)
-- =============================================================================

-- Buat database (jalankan dari psql sebagai superuser)
-- CREATE DATABASE mimatcha_db;

-- =============================================================================
-- 1. PRODUK (Products)
-- =============================================================================
CREATE TABLE IF NOT EXISTS produk (
    id_produk       INT             NOT NULL GENERATED ALWAYS AS IDENTITY,
    nama_produk     VARCHAR(255)    NOT NULL,
    harga           DECIMAL(10,2)   NOT NULL,
    stok            INT             NOT NULL DEFAULT 0,
    kategori        VARCHAR(100)    DEFAULT NULL,
    deskripsi       TEXT            DEFAULT NULL,
    gambar          TEXT            DEFAULT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_produk)
);

CREATE INDEX IF NOT EXISTS idx_produk_kategori ON produk (kategori);
CREATE INDEX IF NOT EXISTS idx_produk_nama ON produk (nama_produk);

-- =============================================================================
-- 2. PELANGGAN (Customers)
-- =============================================================================
CREATE TABLE IF NOT EXISTS pelanggan (
    id_pelanggan    INT             NOT NULL GENERATED ALWAYS AS IDENTITY,
    nama            VARCHAR(255)    NOT NULL,
    alamat          TEXT            DEFAULT NULL,
    nomor_telepon   VARCHAR(20)     DEFAULT NULL,
    email           VARCHAR(255)    DEFAULT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_pelanggan)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pelanggan_email ON pelanggan (email);

-- =============================================================================
-- 3. PESANAN (Orders)
-- =============================================================================
CREATE TABLE IF NOT EXISTS pesanan (
    id_pesanan          INT             NOT NULL GENERATED ALWAYS AS IDENTITY,
    id_pelanggan        INT             DEFAULT NULL,
    tanggal_pesanan     DATE            NOT NULL,
    total_pembayaran    DECIMAL(10,2)   NOT NULL,
    status_pesanan      VARCHAR(50)     NOT NULL DEFAULT 'pending',
    metode_pembayaran   VARCHAR(50)     DEFAULT NULL,
    kasir               VARCHAR(100)    DEFAULT NULL,
    payment_reference   VARCHAR(255)    DEFAULT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_pesanan),
    CONSTRAINT fk_pesanan_pelanggan
        FOREIGN KEY (id_pelanggan) REFERENCES pelanggan (id_pelanggan)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pesanan_tanggal ON pesanan (tanggal_pesanan);
CREATE INDEX IF NOT EXISTS idx_pesanan_status ON pesanan (status_pesanan);
CREATE INDEX IF NOT EXISTS idx_pesanan_payment_ref ON pesanan (payment_reference);

-- =============================================================================
-- 4. DETAIL PESANAN (Order Items)
-- =============================================================================
CREATE TABLE IF NOT EXISTS detail_pesanan (
    id_detail       INT             NOT NULL GENERATED ALWAYS AS IDENTITY,
    id_pesanan      INT             NOT NULL,
    id_produk       INT             NOT NULL,
    jumlah_produk   INT             NOT NULL,
    harga_satuan    DECIMAL(10,2)   NOT NULL,
    subtotal        DECIMAL(10,2)   NOT NULL,
    PRIMARY KEY (id_detail),
    CONSTRAINT fk_detail_pesanan
        FOREIGN KEY (id_pesanan) REFERENCES pesanan (id_pesanan)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detail_produk
        FOREIGN KEY (id_produk) REFERENCES produk (id_produk)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_detail_pesanan_id ON detail_pesanan (id_pesanan);
CREATE INDEX IF NOT EXISTS idx_detail_produk_id ON detail_pesanan (id_produk);

-- =============================================================================
-- 5. KONTRAK (Contracts)
-- =============================================================================
CREATE TABLE IF NOT EXISTS kontrak (
    id_kontrak          INT             NOT NULL GENERATED ALWAYS AS IDENTITY,
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
    status              VARCHAR(50)     NOT NULL DEFAULT 'draft',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_kontrak),
    CONSTRAINT fk_kontrak_pesanan
        FOREIGN KEY (id_pesanan) REFERENCES pesanan (id_pesanan)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kontrak_status ON kontrak (status);
CREATE INDEX IF NOT EXISTS idx_kontrak_masa_berlaku ON kontrak (masa_berlaku);
CREATE INDEX IF NOT EXISTS idx_kontrak_nomor ON kontrak (nomor_kontrak);

-- =============================================================================
-- 6. PAYMENT TRANSACTIONS (Riwayat Pembayaran via Pakasir)
-- =============================================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id                      INT             NOT NULL GENERATED ALWAYS AS IDENTITY,
    id_pesanan              INT             NOT NULL,
    payment_reference       VARCHAR(255)    NOT NULL,
    payment_method          VARCHAR(50)     NOT NULL,
    amount                  DECIMAL(10,2)   NOT NULL,
    status                  VARCHAR(50)     NOT NULL DEFAULT 'pending',
    qr_code_url             TEXT            DEFAULT NULL,
    qr_string               TEXT            DEFAULT NULL,
    va_number               VARCHAR(100)    DEFAULT NULL,
    va_bank                 VARCHAR(50)     DEFAULT NULL,
    expired_at              TIMESTAMP       DEFAULT NULL,
    paid_at                 TIMESTAMP       DEFAULT NULL,
    pakasir_transaction_id  VARCHAR(255)    DEFAULT NULL,
    pakasir_response        TEXT            DEFAULT NULL,
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_payment_pesanan
        FOREIGN KEY (id_pesanan) REFERENCES pesanan (id_pesanan)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_ref ON payment_transactions (payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_transactions (status);
CREATE INDEX IF NOT EXISTS idx_payment_id_pesanan ON payment_transactions (id_pesanan);

-- =============================================================================
-- 7. PAYMENT WEBHOOKS (Log Notifikasi dari Pakasir)
-- =============================================================================
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id                  INT             NOT NULL GENERATED ALWAYS AS IDENTITY,
    payment_reference   VARCHAR(255)    DEFAULT NULL,
    event_type          VARCHAR(100)    DEFAULT NULL,
    webhook_data        TEXT            DEFAULT NULL,
    ip_address          VARCHAR(50)     DEFAULT NULL,
    user_agent          TEXT            DEFAULT NULL,
    processed           BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_payment_ref ON payment_webhooks (payment_reference);
CREATE INDEX IF NOT EXISTS idx_webhook_processed ON payment_webhooks (processed);

-- =============================================================================
-- 8. SETTINGS (Pengaturan Aplikasi)
-- =============================================================================
CREATE TABLE IF NOT EXISTS settings (
    id              INT             NOT NULL GENERATED ALWAYS AS IDENTITY,
    setting_key     VARCHAR(100)    NOT NULL,
    setting_value   TEXT            DEFAULT NULL,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_key ON settings (setting_key);

-- Trigger untuk auto-update updated_at di settings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_settings_updated_at ON settings;
CREATE TRIGGER trigger_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 9. NOTIFICATIONS (Notifikasi Sistem)
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              INT             NOT NULL GENERATED ALWAYS AS IDENTITY,
    type            VARCHAR(50)     NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    message         TEXT            NOT NULL,
    link            VARCHAR(500)    DEFAULT NULL,
    role_filter     VARCHAR(50)     DEFAULT NULL,
    is_read         SMALLINT        NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_notif_type ON notifications (type);
CREATE INDEX IF NOT EXISTS idx_notif_role ON notifications (role_filter);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications (created_at);

-- =============================================================================
-- 10. USERS (Akun Login)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id          INT             NOT NULL GENERATED ALWAYS AS IDENTITY,
    email       VARCHAR(255)    NOT NULL,
    password    VARCHAR(255)    NOT NULL,
    nama        VARCHAR(255)    DEFAULT NULL,
    role        VARCHAR(50)     NOT NULL DEFAULT 'user',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- =============================================================================
-- SEEDER — Data Awal (Wajib untuk aplikasi berfungsi)
-- =============================================================================

-- Users default (password plain text — sesuai gaya MySQL original)
INSERT INTO users (email, password, nama, role) VALUES
    ('owner@mimatcha.id', 'owner123', 'Owner MiMatcha', 'owner'),
    ('kasir@mimatcha.id', 'kasir123', 'Kasir MiMatcha', 'kasir'),
    ('gudang@mimatcha.id', 'gudang123', 'Staff Gudang', 'staff_gudang'),
    ('keuangan@mimatcha.id', 'keuangan123', 'Admin Keuangan', 'admin_keuangan')
ON CONFLICT (email) DO NOTHING;

-- Walk-in customer
INSERT INTO pelanggan (nama, alamat, nomor_telepon, email) VALUES
    ('Walk-in Customer', '-', '-', 'walkin@mimatcha.id')
ON CONFLICT (email) DO NOTHING;

-- Notifikasi awal
INSERT INTO notifications (type, title, message, link, role_filter) VALUES
    ('system', 'Selamat Datang di MiMatcha!', 'Sistem manajemen bisnis siap digunakan. Kelola produk, pesanan, dan pantau bisnis Anda.', '/dashboard', NULL),
    ('system', 'Konfigurasi Awal', 'Pastikan data produk dan pengaturan toko sudah diisi dengan benar.', '/settings', 'owner');
