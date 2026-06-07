<?php
/**
 * MiMatcha API Handler
 * Full CRUD API for frontend with Payment Gateway
 */

// Clear OPcache to ensure fresh code
if (function_exists('opcache_reset')) {
    opcache_reset();
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';
require_once 'pakasir_config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Login handler
if ($action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? AND password = ?");
    $stmt->execute([$email, $password]);
    
    if ($row = $stmt->fetch()) {
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $row['id'],
                'email' => $row['email'],
                'name' => $row['nama'],
                'role' => $row['role']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
    }
    exit;
}

// ==================== USER MANAGEMENT ====================

// Get all users (owner only)
if ($action === 'get_users') {
    $result = $conn->query("SELECT id, email, nama, role, created_at FROM users ORDER BY role, nama");
    echo json_encode(['success' => true, 'users' => $result->fetchAll()]);
    exit;
}

// Get single user
if ($action === 'get_user') {
    $id = $_GET['id'] ?? 0;
    $stmt = $conn->prepare("SELECT id, email, nama, role, created_at FROM users WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'user' => $stmt->fetch()]);
    exit;
}

// Add user
if ($action === 'add_user') {
    $data = json_decode(file_get_contents('php://input'), true);
    $nama = $data['nama'] ?? '';
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? 'kasir';
    
    if (empty($nama) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'error' => 'Nama, email, dan password wajib diisi']);
        exit;
    }
    
    // Check duplicate email
    $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $check->execute([$email]);
    if ($check->rowCount() > 0) {
        echo json_encode(['success' => false, 'error' => 'Email sudah terdaftar']);
        exit;
    }
    
    $stmt = $conn->prepare("INSERT INTO users (email, password, nama, role) VALUES (?, ?, ?, ?)");
    if ($stmt->execute([$email, $password, $nama, $role])) {
        echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
    } else {
        echo json_encode(['success' => false, 'error' => implode(', ', $conn->errorInfo())]);
    }
    exit;
}

// Update user
if ($action === 'update_user') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? 0;
    $nama = $data['nama'] ?? '';
    $email = $data['email'] ?? '';
    $role = $data['role'] ?? 'kasir';
    $password = $data['password'] ?? '';
    
    if (empty($nama) || empty($email) || $id <= 0) {
        echo json_encode(['success' => false, 'error' => 'Data tidak lengkap']);
        exit;
    }
    
    if (!empty($password)) {
        $stmt = $conn->prepare("UPDATE users SET email=?, password=?, nama=?, role=? WHERE id=?");
        $success = $stmt->execute([$email, $password, $nama, $role, $id]);
    } else {
        $stmt = $conn->prepare("UPDATE users SET email=?, nama=?, role=? WHERE id=?");
        $success = $stmt->execute([$email, $nama, $role, $id]);
    }
    echo json_encode(['success' => $success]);
    exit;
}

// Delete user
if ($action === 'delete_user') {
    $id = $_GET['id'] ?? 0;
    if ($id <= 0) {
        echo json_encode(['success' => false, 'error' => 'ID tidak valid']);
        exit;
    }
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    echo json_encode(['success' => $stmt->execute([$id])]);
    exit;
}

// ==================== END USER MANAGEMENT ====================

// Get products
if ($action === 'get_products') {
    $result = $conn->query("SELECT * FROM produk ORDER BY kategori, nama_produk");
    echo json_encode($result->fetchAll());
    exit;
}

// Get single product
if ($action === 'get_product') {
    $id = $_GET['id'] ?? 0;
    $stmt = $conn->prepare("SELECT * FROM produk WHERE id_produk = ?");
    $stmt->execute([$id]);
    echo json_encode($stmt->fetch());
    exit;
}

// Add product
if ($action === 'add_product') {
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(['success' => false, 'error' => 'Invalid JSON: ' . json_last_error_msg()]);
        exit;
    }
    
    $nama_produk = $data['nama_produk'] ?? $data['nama'] ?? '';
    $harga = $data['harga'] ?? 0;
    $stok = $data['stok'] ?? 0;
    $kategori = $data['kategori'] ?? '';
    $deskripsi = $data['deskripsi'] ?? '';
    $gambar = $data['gambar'] ?? '';
    
    if (empty($nama_produk)) {
        echo json_encode(['success' => false, 'error' => 'Product name is required']);
        exit;
    }
    
    $stmt = $conn->prepare("INSERT INTO produk (nama_produk, harga, stok, kategori, deskripsi, gambar) VALUES (?, ?, ?, ?, ?, ?)");
    if ($stmt->execute([$nama_produk, $harga, $stok, $kategori, $deskripsi, $gambar])) {
        echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
    } else {
        echo json_encode(['success' => false, 'error' => implode(', ', $conn->errorInfo())]);
    }
    exit;
}

// Update product
if ($action === 'update_product') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $nama_produk = $data['nama_produk'] ?? $data['nama'] ?? '';
    $harga = $data['harga'] ?? 0;
    $stok = $data['stok'] ?? 0;
    $kategori = $data['kategori'] ?? '';
    $deskripsi = $data['deskripsi'] ?? '';
    $gambar = $data['image'] ?? $data['gambar'] ?? '';
    $id = $data['id_produk'] ?? $data['id'] ?? 0;
    
    if (empty($nama_produk) || $id <= 0) {
        echo json_encode(['success' => false, 'error' => 'Product name and ID are required']);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE produk SET nama_produk=?, harga=?, stok=?, kategori=?, deskripsi=?, gambar=? WHERE id_produk=?");
    echo json_encode(['success' => $stmt->execute([$nama_produk, $harga, $stok, $kategori, $deskripsi, $gambar, $id])]);
    exit;
}

// Delete product
if ($action === 'delete_product') {
    header('Content-Type: application/json');
    http_response_code(200);
    
    $response = [
        'success' => true,
        'message' => 'PHP handler reached!',
        'received_id' => $_GET['id'] ?? 'NO_ID',
        'file' => __FILE__,
        'php_version' => phpversion()
    ];
    echo json_encode($response);
    exit;
}

// Get customers
if ($action === 'get_customers') {
    $result = $conn->query("SELECT * FROM pelanggan ORDER BY nama");
    echo json_encode($result->fetchAll());
    exit;
}

// Add customer
if ($action === 'add_customer') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        echo json_encode(['success' => false, 'error' => 'Invalid request data']);
        exit;
    }
    $stmt = $conn->prepare("INSERT INTO pelanggan (nama, alamat, nomor_telepon, email) VALUES (?, ?, ?, ?)");
    $stmt->execute([$data['nama'], $data['alamat'], $data['telepon'], $data['email']]);
    echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
    exit;
}

// Update customer
if ($action === 'update_customer') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        echo json_encode(['success' => false, 'error' => 'Invalid request data']);
        exit;
    }
    $stmt = $conn->prepare("UPDATE pelanggan SET nama=?, alamat=?, nomor_telepon=?, email=? WHERE id_pelanggan=?");
    echo json_encode(['success' => $stmt->execute([$data['nama'], $data['alamat'], $data['telepon'], $data['email'], $data['id']])]);
    exit;
}

// Delete customer
if ($action === 'delete_customer') {
    $id = $_GET['id'] ?? 0;
    $stmt = $conn->prepare("DELETE FROM pelanggan WHERE id_pelanggan = ?");
    echo json_encode(['success' => $stmt->execute([$id])]);
    exit;
}

// Get orders
if ($action === 'get_orders') {
    $result = $conn->query("
        SELECT p.*, pel.nama as nama_pelanggan 
        FROM pesanan p 
        LEFT JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan 
        ORDER BY p.tanggal_pesanan DESC
    ");
    echo json_encode($result->fetchAll());
    exit;
}

// Get order details
if ($action === 'get_order_details') {
    $id = intval($_GET['id'] ?? 0);
    $stmt = $conn->prepare("
        SELECT dp.*, pr.nama_produk 
        FROM detail_pesanan dp 
        JOIN produk pr ON dp.id_produk = pr.id_produk 
        WHERE dp.id_pesanan = ?
    ");
    $stmt->execute([$id]);
    echo json_encode($stmt->fetchAll());
    exit;
}

// Create order (checkout)
if ($action === 'create_order') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['items']) || !is_array($data['items'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid request data']);
        exit;
    }
    
    $conn->beginTransaction();
    try {
        $id_pelanggan = $data['id_pelanggan'] ?? null;
        
        if (!$id_pelanggan || $id_pelanggan === 'null') {
            $walkInStmt = $conn->prepare("SELECT id_pelanggan FROM pelanggan WHERE email = ? LIMIT 1");
            $walkInStmt->execute(['walkin@mimatcha.id']);
            $walkInRow = $walkInStmt->fetch();
            if ($walkInRow) {
                $id_pelanggan = $walkInRow['id_pelanggan'];
            } else {
                $conn->prepare("INSERT INTO pelanggan (nama, alamat, nomor_telepon, email) VALUES (?, ?, ?, ?)")->execute(['Walk-in Customer', '-', '-', 'walkin@mimatcha.id']);
                $id_pelanggan = $conn->lastInsertId();
            }
        }
        
        $stmt = $conn->prepare("INSERT INTO pesanan (id_pelanggan, tanggal_pesanan, total_pembayaran, status_pesanan, metode_pembayaran, kasir) VALUES (?, ?, ?, ?, ?, ?)");
        $tanggal = date('Y-m-d');
        $metode = $data['metode_pembayaran'] ?? 'pending';
        $kasir = $data['kasir'] ?? 'Kasir';
        $status = $data['status'] ?? 'pending';
        $stmt->execute([$id_pelanggan, $tanggal, $data['total'], $status, $metode, $kasir]);
        
        $pesanan_id = $conn->lastInsertId();
        
        foreach ($data['items'] as $item) {
            $stmt2 = $conn->prepare("INSERT INTO detail_pesanan (id_pesanan, id_produk, jumlah_produk, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)");
            $stmt2->execute([$pesanan_id, $item['id_produk'], $item['jumlah'], $item['harga'], $item['subtotal']]);
            
            $stmtStock = $conn->prepare("UPDATE produk SET stok = stok - ? WHERE id_produk = ?");
            $stmtStock->execute([$item['jumlah'], $item['id_produk']]);
        }
        
        $conn->commit();
        
        $notifMsg = "Pesanan baru #$pesanan_id telah dibuat.";
        $stmtNotif = $conn->prepare("INSERT INTO notifications (type, title, message, link, role_filter) VALUES (?, ?, ?, ?, NULL)");
        $stmtNotif->execute(['order', 'Pesanan Baru', $notifMsg, '/orders']);
        
        echo json_encode(['success' => true, 'id' => $pesanan_id]);
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// Update order status
if ($action === 'update_order_status') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        echo json_encode(['success' => false, 'error' => 'Invalid request data']);
        exit;
    }
    $stmt = $conn->prepare("UPDATE pesanan SET status_pesanan = ? WHERE id_pesanan = ?");
    $success = $stmt->execute([$data['status'], $data['id']]);
    
    if ($success && $data['status'] === 'lunas') {
        $orderId = intval($data['id']);
        $notifMsg = "Pembayaran untuk pesanan #$orderId telah diterima.";
        $stmtNotif = $conn->prepare("INSERT INTO notifications (type, title, message, link, role_filter) VALUES (?, ?, ?, ?, NULL)");
        $stmtNotif->execute(['payment', 'Pembayaran Diterima', $notifMsg, '/orders']);
    }
    
    echo json_encode(['success' => $success]);
    exit;
}

// Get dashboard stats
if ($action === 'get_dashboard_stats') {
    $today = date('Y-m-d');
    $month = date('Y-m');
    $monthStart = $month . '-01';
    $monthEnd = date('Y-m-t', strtotime($monthStart));
    
    $stmt = $conn->prepare("SELECT COALESCE(SUM(total_pembayaran), 0) as total FROM pesanan WHERE tanggal_pesanan = ? AND status_pesanan = 'lunas'");
    $stmt->execute([$today]);
    $pendapatan_hari_ini = $stmt->fetch()['total'];
    
    $stmt2 = $conn->prepare("SELECT COALESCE(SUM(total_pembayaran), 0) as total FROM pesanan WHERE tanggal_pesanan >= ? AND tanggal_pesanan <= ? AND status_pesanan = 'lunas'");
    $stmt2->execute([$monthStart, $monthEnd]);
    $pendapatan_bulan = $stmt2->fetch()['total'];
    
    $stmt3 = $conn->prepare("SELECT COUNT(*) as total FROM pesanan WHERE tanggal_pesanan = ?");
    $stmt3->execute([$today]);
    $total_pesanan = $stmt3->fetch()['total'];
    
    $result4 = $conn->query("SELECT COUNT(*) as total FROM pelanggan");
    $total_pelanggan = $result4->fetch()['total'];
    
    $stmt5 = $conn->prepare("
        SELECT p.*, pel.nama as nama_pelanggan 
        FROM pesanan p 
        LEFT JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan 
        ORDER BY p.tanggal_pesanan DESC LIMIT 5
    ");
    $stmt5->execute();
    $pesanan_terbaru = $stmt5->fetchAll();
    
    $result6 = $conn->query("
        SELECT pr.nama_produk, SUM(dp.jumlah_produk) as total_terjual, SUM(dp.subtotal) as total_pendapatan
        FROM detail_pesanan dp
        JOIN produk pr ON dp.id_produk = pr.id_produk
        GROUP BY dp.id_produk, pr.nama_produk
        ORDER BY total_terjual DESC
        LIMIT 5
    ");
    $produk_terlaris = $result6->fetchAll();
    
    echo json_encode([
        'pendapatan_hari_ini' => $pendapatan_hari_ini,
        'pendapatan_bulan' => $pendapatan_bulan,
        'total_pesanan_hari_ini' => $total_pesanan,
        'total_pelanggan' => $total_pelanggan,
        'pesanan_terbaru' => $pesanan_terbaru,
        'produk_terlaris' => $produk_terlaris
    ]);
    exit;
}

// Get analytics
if ($action === 'get_analytics') {
    $type = $_GET['type'] ?? 'weekly';
    
    if ($type === 'weekly') {
        $start = date('Y-m-d', strtotime('-7 days'));
    } elseif ($type === 'monthly') {
        $start = date('Y-m-01');
    } else {
        $start = date('Y-01-01');
    }
    
    $stmt = $conn->prepare("
        SELECT DATE(tanggal_pesanan) as date, SUM(total_pembayaran) as total, COUNT(*) as jumlah
        FROM pesanan
        WHERE tanggal_pesanan >= ? AND status_pesanan = 'lunas'
        GROUP BY DATE(tanggal_pesanan)
        ORDER BY date
    ");
    $stmt->execute([$start]);
    $penjualan = $stmt->fetchAll();
    
    $stmt2 = $conn->prepare("
        SELECT pr.kategori, SUM(dp.subtotal) as total
        FROM detail_pesanan dp
        JOIN produk pr ON dp.id_produk = pr.id_produk
        JOIN pesanan p ON dp.id_pesanan = p.id_pesanan
        WHERE p.tanggal_pesanan >= ? AND p.status_pesanan = 'lunas'
        GROUP BY pr.kategori
    ");
    $stmt2->execute([$start]);
    $kategori = $stmt2->fetchAll();
    
    echo json_encode([
        'penjualan' => $penjualan,
        'kategori' => $kategori
    ]);
    exit;
}

// Get inventory
if ($action === 'get_inventory') {
    $result = $conn->query("SELECT * FROM produk ORDER BY stok ASC");
    echo json_encode($result->fetchAll());
    exit;
}

// Update stock
if ($action === 'update_stock') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        echo json_encode(['success' => false, 'error' => 'Invalid request data']);
        exit;
    }
    $stmt = $conn->prepare("UPDATE produk SET stok = ? WHERE id_produk = ?");
    echo json_encode(['success' => $stmt->execute([$data['stok'], $data['id']])]);
    exit;
}

// Get settings
if ($action === 'get_settings') {
    $result = $conn->query("SELECT * FROM settings ORDER BY setting_key");
    $settings = [];
    while ($row = $result->fetch()) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
    echo json_encode(['success' => true, 'settings' => $settings]);
    exit;
}

// Update settings
if ($action === 'update_settings') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !is_array($data)) {
        echo json_encode(['success' => false, 'error' => 'Invalid request data']);
        exit;
    }
    
    foreach ($data as $key => $value) {
        $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value");
        $stmt->execute([$key, $value]);
    }
    
    echo json_encode(['success' => true]);
    exit;
}

// ==================== CONTRACT MANAGEMENT ENDPOINTS ====================

// Get all contracts with filters
if ($action === 'get_contracts') {
    $status = $_GET['status'] ?? null;
    $tipe = $_GET['tipe'] ?? null;
    $search = $_GET['search'] ?? null;
    
    $sql = "SELECT * FROM kontrak WHERE 1=1";
    $params = [];
    
    if ($status) {
        $sql .= " AND status = ?";
        $params[] = $status;
    }
    if ($tipe) {
        $sql .= " AND tipe_kontrak = ?";
        $params[] = $tipe;
    }
    if ($search) {
        $sql .= " AND (nama_pihak_kedua LIKE ? OR nomor_kontrak LIKE ?)";
        $searchParam = "%$search%";
        $params[] = $searchParam;
        $params[] = $searchParam;
    }
    
    $sql .= " ORDER BY tanggal_kontrak DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll());
    exit;
}

// Get single contract by ID
if ($action === 'get_contract') {
    $id = $_GET['id'] ?? 0;
    $stmt = $conn->prepare("SELECT * FROM kontrak WHERE id_kontrak = ?");
    $stmt->execute([$id]);
    echo json_encode($stmt->fetch());
    exit;
}

// Create new contract
if ($action === 'create_contract') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        echo json_encode(['success' => false, 'error' => 'Invalid request data']);
        exit;
    }
    
    $year = date('Y');
    $stmtYear = $conn->prepare("SELECT COUNT(*) as total FROM kontrak WHERE EXTRACT(YEAR FROM tanggal_kontrak) = ?");
    $stmtYear->execute([$year]);
    $row = $stmtYear->fetch();
    $nomor = sprintf("KTR/%s/%03d", $year, $row['total'] + 1);
    
    $stmt = $conn->prepare("INSERT INTO kontrak 
        (nomor_kontrak, tipe_kontrak, nama_pihak_kedua, email_pihak, tanggal_kontrak, 
         masa_berlaku, nilai_kontrak, isi_kontrak, catatan, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')");
    
    if ($stmt->execute([
        $nomor,
        $data['tipe_kontrak'],
        $data['nama_pihak_kedua'],
        $data['email_pihak'],
        $data['tanggal_kontrak'],
        $data['masa_berlaku'],
        $data['nilai_kontrak'],
        $data['isi_kontrak'],
        $data['catatan']
    ])) {
        echo json_encode(['success' => true, 'id' => $conn->lastInsertId(), 'nomor_kontrak' => $nomor]);
    } else {
        echo json_encode(['success' => false, 'error' => implode(', ', $conn->errorInfo())]);
    }
    exit;
}

// Update contract
if ($action === 'update_contract') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        echo json_encode(['success' => false, 'error' => 'Invalid request data']);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE kontrak SET 
        tipe_kontrak = ?,
        nama_pihak_kedua = ?,
        email_pihak = ?,
        tanggal_kontrak = ?,
        masa_berlaku = ?,
        nilai_kontrak = ?,
        isi_kontrak = ?,
        catatan = ?,
        status = ?
        WHERE id_kontrak = ?");
    
    echo json_encode(['success' => $stmt->execute([
        $data['tipe_kontrak'],
        $data['nama_pihak_kedua'],
        $data['email_pihak'],
        $data['tanggal_kontrak'],
        $data['masa_berlaku'],
        $data['nilai_kontrak'],
        $data['isi_kontrak'],
        $data['catatan'],
        $data['status'],
        $data['id_kontrak']
    ])]);
    exit;
}

// Update contract status only
if ($action === 'update_contract_status') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        echo json_encode(['success' => false, 'error' => 'Invalid request data']);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE kontrak SET status = ? WHERE id_kontrak = ?");
    
    echo json_encode(['success' => $stmt->execute([$data['status'], $data['id_kontrak']])]);
    exit;
}

// Delete contract
if ($action === 'delete_contract') {
    $id = $_GET['id'] ?? 0;
    $stmt = $conn->prepare("DELETE FROM kontrak WHERE id_kontrak = ?");
    echo json_encode(['success' => $stmt->execute([$id])]);
    exit;
}

// Get expiring contracts
if ($action === 'get_expiring_contracts') {
    $days = intval($_GET['days'] ?? 30);
    $stmt = $conn->prepare("SELECT * FROM kontrak 
            WHERE status = 'aktif' 
            AND masa_berlaku IS NOT NULL
            AND masa_berlaku BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day' * ?
            ORDER BY masa_berlaku ASC");
    $stmt->execute([$days]);
    echo json_encode($stmt->fetchAll());
    exit;
}

// Get contract statistics
if ($action === 'get_contract_stats') {
    $stats = [
        'total' => 0,
        'aktif' => 0,
        'draft' => 0,
        'berakhir' => 0,
        'total_nilai' => 0,
        'expiring_soon' => 0
    ];
    
    $result = $conn->query("SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as aktif,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'berakhir' THEN 1 ELSE 0 END) as berakhir,
        SUM(CASE WHEN status = 'aktif' THEN nilai_kontrak ELSE 0 END) as total_nilai
        FROM kontrak");
    
    $row = $result->fetch();
    $stats = array_merge($stats, $row);
    
    $result2 = $conn->query("SELECT COUNT(*) as expiring FROM kontrak 
        WHERE status = 'aktif' 
        AND masa_berlaku BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'");
    $row2 = $result2->fetch();
    $stats['expiring_soon'] = $row2['expiring'];
    
    echo json_encode($stats);
    exit;
}

// Save contract (legacy - keep for backward compatibility)
if ($action === 'save_contract') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        echo json_encode(['success' => false, 'error' => 'Invalid request data']);
        exit;
    }
    $stmt = $conn->prepare("INSERT INTO kontrak (id_pesanan, nama_pihak_kedua, email_pihak, tanggal_kontrak, masa_berlaku, nilai_kontrak, isi_kontrak, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')");
    $stmt->execute([$data['id_pesanan'], $data['nama'], $data['email'], $data['tanggal'], $data['masa'], $data['nilai'], $data['isi']]);
    echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
    exit;
}

// ==================== PAYMENT GATEWAY ENDPOINTS ====================

// Create Payment (QRIS or Virtual Account) - Real Pakasir Integration
if ($action === 'create_payment') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id_pesanan = $data['id_pesanan'] ?? null;
    $amount = $data['amount'] ?? 0;
    $payment_method = $data['payment_method'] ?? 'qris';
    $customer_name = $data['customer_name'] ?? 'Customer';
    
    if (!$id_pesanan || $amount <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid order ID or amount']);
        exit;
    }
    
    $order_id = 'MM-' . $id_pesanan . '-' . date('Hms') . '-' . substr(md5(uniqid()), 0, 4);
    $expired_at = date('Y-m-d H:i:s', time() + 3600);
    
    $pakasir_method = getPakasirPaymentMethod($payment_method);
    
    $pakasirResult = pakasirCreateTransaction($order_id, $amount, $pakasir_method);
    
    if (!$pakasirResult['success']) {
        echo json_encode([
            'success' => false, 
            'error' => 'Pakasir API error: ' . ($pakasirResult['error'] ?? 'Unknown'),
            'http_code' => $pakasirResult['http_code'] ?? null,
            'raw_response' => $pakasirResult['raw'] ?? null,
            'debug' => [
                'order_id' => $order_id,
                'amount' => $amount,
                'pakasir_method' => $pakasir_method
            ]
        ]);
        exit;
    }
    
    $paymentData = $pakasirResult['data'];
    $pakasir_transaction_id = $paymentData['order_id'] ?? $order_id;
    
    $qr_code_url = '';
    $qr_string = '';
    $va_number = '';
    
    if ($payment_method === 'qris' && isset($paymentData['payment_number'])) {
        $qr_string = $paymentData['payment_number'];
        $qr_code_url = pakasirGetQRCodeUrl($qr_string);
    }
    
    if (strpos($payment_method, 'va_') === 0 && isset($paymentData['payment_number'])) {
        $va_number = $paymentData['payment_number'];
    }
    
    $is_qris = ($payment_method === 'qris');
    $payment_url = pakasirGetPaymentUrl($order_id, $amount, $is_qris);
    
    $fee = $paymentData['fee'] ?? 0;
    $total_payment = $paymentData['total_payment'] ?? $amount;
    $expired_at_pakasir = $paymentData['expired_at'] ?? null;
    if ($expired_at_pakasir) {
        $expired_at = date('Y-m-d H:i:s', strtotime($expired_at_pakasir));
    }
    
    $stmt = $conn->prepare("INSERT INTO payment_transactions (id_pesanan, payment_reference, payment_method, amount, status, qr_code_url, qr_string, expired_at, pakasir_transaction_id, pakasir_response) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)");
    
    $pakasir_response = json_encode($paymentData);
    
    if ($stmt->execute([
        $id_pesanan, 
        $order_id, 
        $payment_method, 
        $amount, 
        $qr_code_url, 
        $qr_string, 
        $expired_at,
        $pakasir_transaction_id,
        $pakasir_response
    ])) {
        $stmtUpdPesanan = $conn->prepare("UPDATE pesanan SET payment_reference = ? WHERE id_pesanan = ?");
        $stmtUpdPesanan->execute([$order_id, $id_pesanan]);
        
        $response = [
            'success' => true,
            'payment_reference' => $order_id,
            'payment_method' => $payment_method,
            'amount' => $amount,
            'fee' => $fee,
            'total_payment' => $total_payment,
            'expired_at' => $expired_at,
            'payment_url' => $payment_url,
            'qr_code_url' => $qr_code_url,
            'qr_string' => $qr_string,
            'pakasir_transaction_id' => $pakasir_transaction_id
        ];
        
        if (strpos($payment_method, 'va_') === 0 && !empty($va_number)) {
            $bank = strtoupper(str_replace('va_', '', $payment_method));
            $response['va_bank'] = $bank;
            $response['va_number'] = $va_number;
        }
        
        echo json_encode($response);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to save payment: ' . implode(', ', $conn->errorInfo())]);
    }
    exit;
}

// Check Payment Status (also checks with Pakasir API)
if ($action === 'check_payment_status') {
    $payment_reference = $_GET['payment_reference'] ?? '';
    
    if (!$payment_reference) {
        echo json_encode(['success' => false, 'error' => 'Payment reference required']);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT * FROM payment_transactions WHERE payment_reference = ?");
    $stmt->execute([$payment_reference]);
    $result = $stmt->fetch();
    
    if (!$result) {
        echo json_encode(['success' => false, 'error' => 'Payment not found']);
        exit;
    }
    
    if ($result['status'] === 'pending') {
        $pakasirStatus = pakasirCheckStatus($payment_reference, $result['amount']);
        
        if ($pakasirStatus['success'] && isset($pakasirStatus['data'])) {
            $pakasir_data = $pakasirStatus['data'];
            $pakasir_status = $pakasir_data['status'] ?? 'pending';
            
            if ($pakasir_status === 'completed' || $pakasir_status === 'paid' || $pakasir_status === 'success') {
                $paid_at = date('Y-m-d H:i:s');
                $stmtUpd = $conn->prepare("UPDATE payment_transactions SET status = 'paid', paid_at = ? WHERE payment_reference = ?");
                $stmtUpd->execute([$paid_at, $payment_reference]);
                $stmtUpd2 = $conn->prepare("UPDATE pesanan SET status_pesanan = 'lunas' WHERE payment_reference = ?");
                $stmtUpd2->execute([$payment_reference]);
                $result['status'] = 'paid';
                $result['paid_at'] = $paid_at;
            } elseif ($pakasir_status === 'expired') {
                $stmtUpd = $conn->prepare("UPDATE payment_transactions SET status = 'expired' WHERE payment_reference = ?");
                $stmtUpd->execute([$payment_reference]);
                $result['status'] = 'expired';
            } elseif ($pakasir_status === 'failed' || $pakasir_status === 'cancelled') {
                $stmtUpd = $conn->prepare("UPDATE payment_transactions SET status = 'failed' WHERE payment_reference = ?");
                $stmtUpd->execute([$payment_reference]);
                $result['status'] = 'failed';
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'payment' => $result
    ]);
    exit;
}

// Get Payment History
if ($action === 'get_payment_history') {
    $id_pesanan = $_GET['id_pesanan'] ?? null;
    
    if ($id_pesanan) {
        $stmt = $conn->prepare("SELECT * FROM payment_transactions WHERE id_pesanan = ? ORDER BY created_at DESC");
        $stmt->execute([$id_pesanan]);
        $result = $stmt->fetchAll();
    } else {
        $result = $conn->query("SELECT pt.*, p.tanggal_pesanan, pel.nama as customer_name FROM payment_transactions pt LEFT JOIN pesanan p ON pt.id_pesanan = p.id_pesanan LEFT JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan ORDER BY pt.created_at DESC LIMIT 50")->fetchAll();
    }
    
    echo json_encode(['success' => true, 'payments' => $result]);
    exit;
}

// Simulate Payment Success (for testing)
if ($action === 'simulate_payment_success') {
    $payment_reference = $_POST['payment_reference'] ?? '';
    
    if (!$payment_reference) {
        echo json_encode(['success' => false, 'error' => 'Payment reference required']);
        exit;
    }
    
    $paid_at = date('Y-m-d H:i:s');
    $stmtUpd1 = $conn->prepare("UPDATE payment_transactions SET status = 'paid', paid_at = ? WHERE payment_reference = ?");
    $stmtUpd1->execute([$paid_at, $payment_reference]);
    $stmtUpd2 = $conn->prepare("UPDATE pesanan SET status_pesanan = 'lunas' WHERE payment_reference = ?");
    $stmtUpd2->execute([$payment_reference]);
    
    echo json_encode(['success' => true, 'message' => 'Payment marked as paid']);
    exit;
}

// Webhook Handler from Pakasir.com
if ($action === 'webhook') {
    $rawBody = file_get_contents('php://input');
    $webhookData = json_decode($rawBody, true);
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    $payment_ref = $webhookData['order_id'] ?? $webhookData['external_id'] ?? '';
    $event_type = 'payment_notification';
    $webhook_json = $rawBody;
    
    $stmt = $conn->prepare("INSERT INTO payment_webhooks (payment_reference, event_type, webhook_data, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$payment_ref, $event_type, $webhook_json, $ip_address, $user_agent]);
    $webhook_id = $conn->lastInsertId();
    
    if ($payment_ref && isset($webhookData['status'])) {
        $status = strtolower($webhookData['status']);
        $payment_method_pakasir = $webhookData['payment_method'] ?? '';
        
        if ($status === 'paid' || $status === 'success' || $status === 'completed') {
            $paid_at = date('Y-m-d H:i:s');
            
            if ($payment_method_pakasir) {
                $stmt = $conn->prepare("UPDATE payment_transactions SET status = 'paid', paid_at = ?, payment_method = ? WHERE payment_reference = ?");
                $stmt->execute([$paid_at, $payment_method_pakasir, $payment_ref]);
            } else {
                $stmt = $conn->prepare("UPDATE payment_transactions SET status = 'paid', paid_at = ? WHERE payment_reference = ?");
                $stmt->execute([$paid_at, $payment_ref]);
            }
            
            $stmt = $conn->prepare("UPDATE pesanan SET status_pesanan = 'lunas' WHERE payment_reference = ?");
            $stmt->execute([$payment_ref]);
            
            $stmtWh = $conn->prepare("UPDATE payment_webhooks SET processed = TRUE WHERE id = ?");
            $stmtWh->execute([$webhook_id]);
        } elseif ($status === 'expired') {
            $stmt = $conn->prepare("UPDATE payment_transactions SET status = 'expired' WHERE payment_reference = ?");
            $stmt->execute([$payment_ref]);
        } elseif ($status === 'failed' || $status === 'cancelled') {
            $stmt = $conn->prepare("UPDATE payment_transactions SET status = 'failed' WHERE payment_reference = ?");
            $stmt->execute([$payment_ref]);
        }
    }
    
    echo json_encode([
        'success' => true, 
        'message' => 'Webhook received',
        'order_id' => $payment_ref,
        'webhook_id' => $webhook_id
    ]);
    exit;
}

// Get available payment methods
if ($action === 'get_payment_methods') {
    $payment_methods = [
        ['id' => 'qris', 'name' => 'QRIS', 'type' => 'qris', 'icon' => 'qr_code', 'fee_percent' => 0.7],
        ['id' => 'va_bca', 'name' => 'Virtual Account BCA', 'type' => 'va', 'bank' => 'BCA', 'fee_fixed' => 4000],
        ['id' => 'va_bni', 'name' => 'Virtual Account BNI', 'type' => 'va', 'bank' => 'BNI', 'fee_fixed' => 4000],
        ['id' => 'va_mandiri', 'name' => 'Virtual Account Mandiri', 'type' => 'va', 'bank' => 'Mandiri', 'fee_fixed' => 4000],
        ['id' => 'va_bri', 'name' => 'Virtual Account BRI', 'type' => 'va', 'bank' => 'BRI', 'fee_fixed' => 4000],
        ['id' => 'va_permata', 'name' => 'Virtual Account Permata', 'type' => 'va', 'bank' => 'Permata', 'fee_fixed' => 4000],
        ['id' => 'cash', 'name' => 'Tunai', 'type' => 'cash', 'icon' => 'money']
    ];
    
    $result = $conn->query("SELECT setting_value FROM settings WHERE setting_key = 'payment_methods_enabled'");
    if ($row = $result->fetch()) {
        $enabled = json_decode($row['setting_value'], true);
        if (is_array($enabled)) {
            $payment_methods = array_filter($payment_methods, function($m) use ($enabled) {
                return in_array($m['id'], $enabled) || $m['id'] === 'cash';
            });
        }
    }
    
    echo json_encode(['success' => true, 'methods' => array_values($payment_methods)]);
    exit;
}

// ==================== NOTIFICATIONS ====================

// Auto-generate system notifications for current events
function autoGenerateNotifications($conn) {
    $today = date('Y-m-d');
    $generated = [];
    
    // 1. New orders today (for owner, kasir)
    $orderStmt = $conn->prepare("SELECT COUNT(*) as cnt FROM pesanan WHERE DATE(created_at) = ? AND status_pesanan = 'pending'");
    $orderStmt->execute([$today]);
    $row = $orderStmt->fetch();
    if ($row && $row['cnt'] > 0) {
        $existsStmt = $conn->prepare("SELECT id FROM notifications WHERE type='order' AND DATE(created_at) = ? AND message LIKE 'Ada%pesanan%'");
        $existsStmt->execute([$today]);
        if ($existsStmt->rowCount() === 0) {
            $notifMsg = "Ada {$row['cnt']} pesanan baru yang perlu diproses.";
            $stmt = $conn->prepare("INSERT INTO notifications (type, title, message, link, role_filter) VALUES (?, ?, ?, ?, NULL)");
            $stmt->execute(['order', 'Pesanan Baru', $notifMsg, '/orders']);
            $generated[] = 'order';
        }
    }
    
    // 2. Low stock items (for owner, staff_gudang)
    $stockStmt = $conn->prepare("SELECT COUNT(*) as cnt FROM produk WHERE stok > 0 AND stok <= 10");
    $stockStmt->execute();
    $row = $stockStmt->fetch();
    if ($row && $row['cnt'] > 0) {
        $existsStmt = $conn->prepare("SELECT id FROM notifications WHERE type='stock' AND DATE(created_at) = ? AND message LIKE '%stok menipis%'");
        $existsStmt->execute([$today]);
        if ($existsStmt->rowCount() === 0) {
            $notifMsg = "{$row['cnt']} item dengan stok menipis. Segera lakukan restok.";
            $stmt = $conn->prepare("INSERT INTO notifications (type, title, message, link, role_filter) VALUES (?, ?, ?, ?, NULL)");
            $stmt->execute(['stock', 'Stok Menipis', $notifMsg, '/inventory']);
            $generated[] = 'stock';
        }
    }
    
    // 3. Expiring contracts (for owner, admin_keuangan)
    $contractStmt = $conn->prepare("SELECT COUNT(*) as cnt FROM kontrak WHERE masa_berlaku BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' AND status = 'aktif'");
    $contractStmt->execute();
    $row = $contractStmt->fetch();
    if ($row && $row['cnt'] > 0) {
        $existsStmt = $conn->prepare("SELECT id FROM notifications WHERE type='contract' AND DATE(created_at) = ? AND message LIKE '%kontrak%berakhir%'");
        $existsStmt->execute([$today]);
        if ($existsStmt->rowCount() === 0) {
            $notifMsg = "{$row['cnt']} kontrak akan berakhir dalam 30 hari ke depan.";
            $stmt = $conn->prepare("INSERT INTO notifications (type, title, message, link, role_filter) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute(['contract', 'Kontrak Akan Berakhir', $notifMsg, '/contracts', 'owner']);
            $generated[] = 'contract';
        }
    }
    
    return $generated;
}

// GET / POST notifications
if ($action === 'get_notifications') {
    autoGenerateNotifications($conn);
    
    $role = $_GET['role'] ?? $_POST['role'] ?? '';
    $limit = intval($_GET['limit'] ?? $_POST['limit'] ?? 50);
    
    $sql = "SELECT * FROM notifications WHERE (role_filter IS NULL OR role_filter = '' OR role_filter = ?) ORDER BY created_at DESC LIMIT ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$role, $limit]);
    
    $notifications = $stmt->fetchAll();
    
    $unreadSql = "SELECT COUNT(*) as cnt FROM notifications WHERE (role_filter IS NULL OR role_filter = '' OR role_filter = ?) AND is_read = 0";
    $unreadStmt = $conn->prepare($unreadSql);
    $unreadStmt->execute([$role]);
    $unreadCount = $unreadStmt->fetch()['cnt'];
    
    echo json_encode([
        'success' => true,
        'notifications' => $notifications,
        'unread_count' => (int)$unreadCount
    ]);
    exit;
}

// Mark single notification as read
if ($action === 'mark_notification_read') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? $_GET['id'] ?? 0);
    
    if ($id > 0) {
        $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
        $stmt->execute([$id]);
    }
    
    echo json_encode(['success' => true]);
    exit;
}

// Mark all notifications as read
if ($action === 'mark_all_notifications_read') {
    $role = $_GET['role'] ?? $_POST['role'] ?? '';
    
    if ($role) {
        $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE (role_filter IS NULL OR role_filter = '' OR role_filter = ?)");
        $stmt->execute([$role]);
    } else {
        $conn->query("UPDATE notifications SET is_read = 1");
    }
    
    echo json_encode(['success' => true]);
    exit;
}

// Add notification (can be called from frontend when events happen)
if ($action === 'add_notification') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $type = $data['type'] ?? 'system';
    $title = $data['title'] ?? '';
    $message = $data['message'] ?? '';
    $link = $data['link'] ?? '';
    $role_filter = $data['role_filter'] ?? '';
    
    if ($title && $message) {
        $roleFilterValue = $role_filter ?: null;
        $stmt = $conn->prepare("INSERT INTO notifications (type, title, message, link, role_filter) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$type, $title, $message, $link, $roleFilterValue]);
        echo json_encode(['success' => true, 'id' => $conn->lastInsertId()]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Title and message required']);
    }
    exit;
}

// Default response
echo json_encode(['success' => false, 'error' => 'Unknown action: ' . $action]);
