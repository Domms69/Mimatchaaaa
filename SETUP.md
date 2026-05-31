# MiMatcha Setup Guide

## Struktur Project

```
mimatcha/
├── api/                    # Backend API (PHP)
│   ├── index.php          # Main API handler
│   ├── config.php         # Database configuration
│   ├── pakasir_config.php # Payment gateway config
│   └── .htaccess          # Apache rewrite rules
├── src/                   # Frontend (React)
│   ├── api/
│   │   └── service.js     # API service layer
│   ├── pages/
│   │   └── Products.jsx   # Product management page
│   └── ...
└── vite.config.js         # Vite configuration
```

## Prerequisites

1. **XAMPP/WAMP** dengan:
   - PHP 7.4+
   - MySQL/MariaDB
   - Apache Web Server

2. **Node.js** 16+ dan npm

## Setup Instructions

### 1. Database Setup

Pastikan MySQL berjalan di port **3308** (sesuai config.php):

```sql
CREATE DATABASE mimatcha_db;
USE mimatcha_db;

-- Tabel produk
CREATE TABLE produk (
    id_produk INT AUTO_INCREMENT PRIMARY KEY,
    nama_produk VARCHAR(255) NOT NULL,
    harga DECIMAL(10,2) NOT NULL,
    stok INT NOT NULL DEFAULT 0,
    kategori VARCHAR(100),
    deskripsi TEXT,
    gambar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pelanggan
CREATE TABLE pelanggan (
    id_pelanggan INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    alamat TEXT,
    nomor_telepon VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pesanan
CREATE TABLE pesanan (
    id_pesanan INT AUTO_INCREMENT PRIMARY KEY,
    id_pelanggan INT,
    tanggal_pesanan DATE NOT NULL,
    total_pembayaran DECIMAL(10,2) NOT NULL,
    status_pesanan VARCHAR(50) DEFAULT 'pending',
    metode_pembayaran VARCHAR(50),
    kasir VARCHAR(100),
    payment_reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pelanggan) REFERENCES pelanggan(id_pelanggan)
);

-- Tabel detail pesanan
CREATE TABLE detail_pesanan (
    id_detail INT AUTO_INCREMENT PRIMARY KEY,
    id_pesanan INT NOT NULL,
    id_produk INT NOT NULL,
    jumlah_produk INT NOT NULL,
    harga_satuan DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pesanan) REFERENCES pesanan(id_pesanan),
    FOREIGN KEY (id_produk) REFERENCES produk(id_produk)
);

-- Tabel kontrak
CREATE TABLE kontrak (
    id_kontrak INT AUTO_INCREMENT PRIMARY KEY,
    nomor_kontrak VARCHAR(50),
    tipe_kontrak VARCHAR(100),
    id_pesanan INT,
    nama_pihak_kedua VARCHAR(255),
    email_pihak VARCHAR(255),
    tanggal_kontrak DATE,
    masa_berlaku DATE,
    nilai_kontrak DECIMAL(15,2),
    isi_kontrak TEXT,
    catatan TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pesanan) REFERENCES pesanan(id_pesanan)
);

-- Tabel payment transactions
CREATE TABLE payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pesanan INT NOT NULL,
    payment_reference VARCHAR(255) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    qr_code_url TEXT,
    qr_string TEXT,
    expired_at DATETIME,
    paid_at DATETIME,
    pakasir_transaction_id VARCHAR(255),
    pakasir_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pesanan) REFERENCES pesanan(id_pesanan)
);

-- Tabel payment webhooks
CREATE TABLE payment_webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_reference VARCHAR(255),
    event_type VARCHAR(100),
    webhook_data TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel settings
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Konfigurasi Database

Edit `api/config.php` jika perlu mengubah koneksi database:

```php
$host = '127.0.0.1';
$port = '3308';  // Sesuaikan dengan port MySQL Anda
$user = 'root';
$pass = '';      // Password MySQL Anda
$dbname = 'mimatcha_db';
```

### 3. Setup Apache

Pastikan folder `api` dapat diakses melalui web server. Jika menggunakan XAMPP:

1. Copy folder `mimatcha` ke `C:\xampp\htdocs\`
2. Akses API melalui: `http://localhost/mimatcha/api/index.php`

Atau gunakan proxy Vite (sudah dikonfigurasi).

### 4. Install Dependencies Frontend

```bash
cd C:\Users\Mas Ajid\Downloads\testtt\mimatcha
npm install
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Frontend akan berjalan di: `http://localhost:5173`

## Cara Kerja

1. **Frontend (React + Vite)** berjalan di port 5173
2. **Backend API (PHP)** diakses melalui proxy Vite ke `http://localhost:80/api`
3. **Database (MySQL)** berjalan di port 3308

## Testing Add Product

1. Buka browser: `http://localhost:5173/products`
2. Klik tombol "Add New Product"
3. Isi form:
   - Product Name: contoh "Matcha Latte"
   - Category: pilih kategori
   - Price: contoh 25000
   - Initial Stock: contoh 50
   - Upload gambar (opsional)
4. Klik "Save Product"

## Troubleshooting

### Error: "Failed to fetch"
- Pastikan Apache/XAMPP berjalan
- Cek apakah MySQL berjalan di port 3308
- Cek file `api/config.php` untuk koneksi database

### Error: "Product name is required"
- Pastikan semua field required terisi
- Cek console browser untuk error detail

### Error: Database connection failed
- Pastikan MySQL berjalan
- Cek username, password, dan port di `api/config.php`
- Pastikan database `mimatcha_db` sudah dibuat

### API tidak bisa diakses
- Pastikan Apache mod_rewrite aktif
- Cek file `.htaccess` di folder `api/`
- Cek error log Apache

## API Endpoints

- `GET /api/index.php?action=get_products` - Get all products
- `POST /api/index.php?action=add_product` - Add new product
- `POST /api/index.php?action=update_product` - Update product
- `GET /api/index.php?action=delete_product&id={id}` - Delete product
- Dan lainnya...

## Notes

- API URL dikonfigurasi di `src/api/service.js`
- Proxy dikonfigurasi di `vite.config.js`
- Database config di `api/config.php`
- Payment gateway config di `api/pakasir_config.php`
