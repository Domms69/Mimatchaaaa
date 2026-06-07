<?php
/**
 * MiMatcha Database Configuration
 * Connection script untuk PHP PDO PostgreSQL
 * 
 * Semua credential dibaca dari environment variable.
 * Untuk hosting, set variabel berikut:
 *   DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
 * 
 * Untuk development lokal, bisa pakai .env file di root project
 */

// Load .env file from project root (development only)
function loadEnv($path = null) {
    if (!$path) {
        $path = dirname(__DIR__) . '/.env';
    }
    if (!file_exists($path)) return;
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) continue;
        
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) continue;
        
        $key = trim($parts[0]);
        $value = trim($parts[1]);
        
        // Remove quotes if present
        if (strlen($value) > 1 && in_array($value[0], ['"', "'"]) && $value[0] === $value[-1]) {
            $value = substr($value, 1, -1);
        }
        
        putenv("$key=$value");
        $_ENV[$key] = $value;
    }
}

loadEnv();

/**
 * Database Credentials — baca dari environment variable
 * 
 * Hosting (Railway): DATABASE_URL otomatis dari PostgreSQL addon
 *   Format: postgresql://user:password@host:port/database
 * 
 * Hosting (manual): set DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
 * Local:            set via .env file di root project, atau pakai default (Laragon)
 * 
 * PostgreSQL default (Laragon):
 *   Host: 127.0.0.1
 *   Port: 5432
 *   User: postgres
 *   Pass: (kosong)
 */
$host = '127.0.0.1';
$port = '5432';
$user = 'postgres';
$pass = '';
$dbname = 'mimatcha_db';

// Priority: DATABASE_URL (Railway) > DB_HOST/DB_PORT/... > local defaults
$databaseUrl = getenv('DATABASE_URL');
if ($databaseUrl) {
    // Parse DATABASE_URL: postgresql://user:password@host:port/database?sslmode=require
    $parts = parse_url($databaseUrl);
    $host = $parts['host'] ?? $host;
    $port = $parts['port'] ?? $port;
    $user = $parts['user'] ?? $user;
    $pass = $parts['pass'] ?? $pass;
    $dbname = ltrim($parts['path'] ?? '', '/') ?: $dbname;
} else {
    $host = getenv('DB_HOST') ?: $host;
    $port = getenv('DB_PORT') ?: $port;
    $user = getenv('DB_USER') ?: $user;
    $pass = getenv('DB_PASS') ?: $pass;
    $dbname = getenv('DB_NAME') ?: $dbname;
}

// OpenRouter API Key
if (!defined('OPENROUTER_API_KEY')) {
    define('OPENROUTER_API_KEY', getenv('OPENROUTER_API_KEY') ?: '');
}

try {
    $conn = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    die("Koneksi Gagal: " . $e->getMessage());
}

/**
 * Auto-initialize database schema jika tabel belum ada.
 */
$tables_exist = $conn->query("SELECT 1 FROM information_schema.tables WHERE table_name = 'produk' AND table_schema = 'public'")->fetch();
if (!$tables_exist) {
    $schema_path = dirname(__DIR__) . '/database/migrasi_postgresql.sql';
    if (file_exists($schema_path)) {
        $sql = file_get_contents($schema_path);
        
        // Hapus baris yang gak relevan (CREATE DATABASE, komentar) biar gak konflik
        $lines = explode("\n", $sql);
        $filtered = [];
        foreach ($lines as $line) {
            $trimmed = trim($line);
            if (preg_match('/^(CREATE DATABASE|USE|SOURCE)/i', $trimmed)) continue;
            if (preg_match('/^--/i', $trimmed)) continue;
            $filtered[] = $line;
        }
        
        $clean_sql = implode("\n", $filtered);
        // PDO PostgreSQL mengeksekusi multi-statement via exec()
        try {
            $conn->exec($clean_sql);
        } catch (PDOException $e) {
            error_log("MiMatcha DB Init Warning: " . $e->getMessage());
        }
    }
}

function getAllProducts() {
    global $conn;
    $result = $conn->query("SELECT * FROM produk ORDER BY kategori, nama_produk");
    return $result->fetchAll();
}

function getProductById($id) {
    global $conn;
    $stmt = $conn->prepare("SELECT * FROM produk WHERE id_produk = ?");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function getAllCustomers() {
    global $conn;
    $result = $conn->query("SELECT * FROM pelanggan ORDER BY nama");
    return $result->fetchAll();
}

function getAllTransactions() {
    global $conn;
    $result = $conn->query("
        SELECT p.*, pel.nama as nama_pelanggan 
        FROM pesanan p 
        LEFT JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan 
        ORDER BY p.tanggal_pesanan DESC
    ");
    return $result->fetchAll();
}

function saveTransaction($data) {
    global $conn;
    
    $conn->beginTransaction();
    
    try {
        $stmt = $conn->prepare("INSERT INTO pesanan (id_pelanggan, tanggal_pesanan, total_pembayaran, status_pesanan, metode_pembayaran, kasir) VALUES (?, ?, ?, 'lunas', ?, ?)");
        $tanggal = date('Y-m-d');
        $stmt->execute([$data['id_pelanggan'], $tanggal, $data['total'], $data['metode'], $data['kasir']]);
        
        $pesanan_id = $conn->lastInsertId();
        
        foreach ($data['items'] as $item) {
            $stmt2 = $conn->prepare("INSERT INTO detail_pesanan (id_pesanan, id_produk, jumlah_produk, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)");
            $stmt2->execute([$pesanan_id, $item['id'], $item['qty'], $item['harga'], $item['subtotal']]);
            
            $stmtStock = $conn->prepare("UPDATE produk SET stok = stok - ? WHERE id_produk = ?");
            $stmtStock->execute([$item['qty'], $item['id']]);
        }
        
        $conn->commit();
        return ['success' => true, 'id' => $pesanan_id];
        
    } catch (Exception $e) {
        $conn->rollBack();
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function saveContract($data) {
    global $conn;
    
    $stmt = $conn->prepare("INSERT INTO kontrak (id_pesanan, nama_pihak_kedua, email_pihak, tanggal_kontrak, masa_berlaku, nilai_kontrak, isi_kontrak, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')");
    
    if ($stmt->execute([$data['id_pesanan'], $data['nama'], $data['email'], $data['tanggal'], $data['masa'], $data['nilai'], $data['isi']])) {
        return ['success' => true, 'id' => $conn->lastInsertId()];
    }
    return ['success' => false, 'error' => 'Failed to save contract'];
}

function getContracts() {
    global $conn;
    $result = $conn->query("SELECT * FROM kontrak ORDER BY tanggal_kontrak DESC");
    return $result->fetchAll();
}
?>
