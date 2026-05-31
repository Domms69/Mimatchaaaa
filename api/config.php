<?php
/**
 * MiMatcha Database Configuration
 * Connection script untuk PHP MySQLi
 */

// Load .env file from project root
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

// OpenRouter API Key
if (!defined('OPENROUTER_API_KEY')) {
    define('OPENROUTER_API_KEY', getenv('OPENROUTER_API_KEY') ?: '');
}

$host = '127.0.0.1';
$port = '3308';
$user = 'root';
$pass = '';
$dbname = 'mimatcha_db';

$conn = new mysqli($host, $user, $pass, $dbname, $port);

if ($conn->connect_error) {
    die("Koneksi Gagal: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");

function getAllProducts() {
    global $conn;
    $result = $conn->query("SELECT * FROM produk ORDER BY kategori, nama_produk");
    return $result->fetch_all(MYSQLI_ASSOC);
}

function getProductById($id) {
    global $conn;
    $stmt = $conn->prepare("SELECT * FROM produk WHERE id_produk = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}

function getAllCustomers() {
    global $conn;
    $result = $conn->query("SELECT * FROM pelanggan ORDER BY nama");
    return $result->fetch_all(MYSQLI_ASSOC);
}

function getAllTransactions() {
    global $conn;
    $result = $conn->query("
        SELECT p.*, pel.nama as nama_pelanggan 
        FROM pesanan p 
        LEFT JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan 
        ORDER BY p.tanggal_pesanan DESC
    ");
    return $result->fetch_all(MYSQLI_ASSOC);
}

function saveTransaction($data) {
    global $conn;
    
    $conn->begin_transaction();
    
    try {
        $stmt = $conn->prepare("INSERT INTO pesanan (id_pelanggan, tanggal_pesanan, total_pembayaran, status_pesanan, metode_pembayaran, kasir) VALUES (?, ?, ?, 'lunas', ?, ?)");
        $tanggal = date('Y-m-d');
        $stmt->bind_param("isdss", $data['id_pelanggan'], $tanggal, $data['total'], $data['metode'], $data['kasir']);
        $stmt->execute();
        
        $pesanan_id = $conn->insert_id;
        
        foreach ($data['items'] as $item) {
            $stmt2 = $conn->prepare("INSERT INTO detail_pesanan (id_pesanan, id_produk, jumlah_produk, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)");
            $stmt2->bind_param("iiidd", $pesanan_id, $item['id'], $item['qty'], $item['harga'], $item['subtotal']);
            $stmt2->execute();
            
            $conn->query("UPDATE produk SET stok = stok - " . $item['qty'] . " WHERE id_produk = " . $item['id']);
        }
        
        $conn->commit();
        return ['success' => true, 'id' => $pesanan_id];
        
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function saveContract($data) {
    global $conn;
    
    $stmt = $conn->prepare("INSERT INTO kontrak (id_pesanan, nama_pihak_kedua, email_pihak, tanggal_kontrak, masa_berlaku, nilai_kontrak, isi_kontrak, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')");
    $stmt->bind_param("issssds", $data['id_pesanan'], $data['nama'], $data['email'], $data['tanggal'], $data['masa'], $data['nilai'], $data['isi']);
    
    if ($stmt->execute()) {
        return ['success' => true, 'id' => $conn->insert_id];
    }
    return ['success' => false, 'error' => $conn->error];
}

function getContracts() {
    global $conn;
    $result = $conn->query("SELECT * FROM kontrak ORDER BY tanggal_kontrak DESC");
    return $result->fetch_all(MYSQLI_ASSOC);
}
?>