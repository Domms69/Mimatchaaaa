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
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

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
    $stmt->bind_param("ss", $email, $password);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
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

// Get products
if ($action === 'get_products') {
    $result = $conn->query("SELECT * FROM produk ORDER BY kategori, nama_produk");
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    exit;
}

// Get single product
if ($action === 'get_product') {
    $id = $_GET['id'] ?? 0;
    $stmt = $conn->prepare("SELECT * FROM produk WHERE id_produk = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_assoc());
    exit;
}

// Add product
if ($action === 'add_product') {
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    
    // If JSON decode fails, try to parse manually or return error
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(['success' => false, 'error' => 'Invalid JSON: ' . json_last_error_msg()]);
        exit;
    }
    
    // Support both 'nama' and 'nama_produk' field names for backward compatibility
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
    $stmt->bind_param("sdisss", $nama_produk, $harga, $stok, $kategori, $deskripsi, $gambar);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
    exit;
}

// Update product
if ($action === 'update_product') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Support both 'nama' and 'nama_produk' field names for backward compatibility
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
    $stmt->bind_param("sdisssi", $nama_produk, $harga, $stok, $kategori, $deskripsi, $gambar, $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit;
}

// Delete product
if ($action === 'delete_product') {
    $id = $_GET['id'] ?? 0;
    $stmt = $conn->prepare("DELETE FROM produk WHERE id_produk = ?");
    $stmt->bind_param("i", $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit;
}

// Get customers
if ($action === 'get_customers') {
    $result = $conn->query("SELECT * FROM pelanggan ORDER BY nama");
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    exit;
}

// Add customer
if ($action === 'add_customer') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $conn->prepare("INSERT INTO pelanggan (nama, alamat, nomor_telepon, email) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $data['nama'], $data['alamat'], $data['telepon'], $data['email']);
    echo json_encode(['success' => $stmt->execute(), 'id' => $conn->insert_id]);
    exit;
}

// Update customer
if ($action === 'update_customer') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $conn->prepare("UPDATE pelanggan SET nama=?, alamat=?, nomor_telepon=?, email=? WHERE id_pelanggan=?");
    $stmt->bind_param("ssssi", $data['nama'], $data['alamat'], $data['telepon'], $data['email'], $data['id']);
    echo json_encode(['success' => $stmt->execute()]);
    exit;
}

// Delete customer
if ($action === 'delete_customer') {
    $id = $_GET['id'] ?? 0;
    $stmt = $conn->prepare("DELETE FROM pelanggan WHERE id_pelanggan = ?");
    $stmt->bind_param("i", $id);
    echo json_encode(['success' => $stmt->execute()]);
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
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    exit;
}

// Get order details
if ($action === 'get_order_details') {
    $id = $_GET['id'] ?? 0;
    $result = $conn->query("
        SELECT dp.*, pr.nama_produk 
        FROM detail_pesanan dp 
        JOIN produk pr ON dp.id_produk = pr.id_produk 
        WHERE dp.id_pesanan = $id
    ");
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    exit;
}

// Create order (checkout)
if ($action === 'create_order') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $conn->begin_transaction();
    try {
        // Handle NULL customer - use Walk-in Customer
        $id_pelanggan = $data['id_pelanggan'] ?? null;
        
        if (!$id_pelanggan || $id_pelanggan === 'null') {
            $walkInResult = $conn->query("SELECT id_pelanggan FROM pelanggan WHERE email = 'walkin@mimatcha.id' LIMIT 1");
            if ($walkInResult && $walkInResult->num_rows > 0) {
                $id_pelanggan = $walkInResult->fetch_assoc()['id_pelanggan'];
            } else {
                $conn->query("INSERT INTO pelanggan (nama, alamat, nomor_telepon, email) VALUES ('Walk-in Customer', '-', '-', 'walkin@mimatcha.id')");
                $id_pelanggan = $conn->insert_id;
            }
        }
        
        $stmt = $conn->prepare("INSERT INTO pesanan (id_pelanggan, tanggal_pesanan, total_pembayaran, status_pesanan, metode_pembayaran, kasir) VALUES (?, ?, ?, ?, ?, ?)");
        $tanggal = date('Y-m-d');
        $metode = $data['metode_pembayaran'] ?? 'pending';
        $kasir = $data['kasir'] ?? 'Kasir';
        $status = $data['status'] ?? 'pending';
        $stmt->bind_param("isdsss", $id_pelanggan, $tanggal, $data['total'], $status, $metode, $kasir);
        $stmt->execute();
        
        $pesanan_id = $conn->insert_id;
        
        foreach ($data['items'] as $item) {
            $stmt2 = $conn->prepare("INSERT INTO detail_pesanan (id_pesanan, id_produk, jumlah_produk, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)");
            $stmt2->bind_param("iiidd", $pesanan_id, $item['id_produk'], $item['jumlah'], $item['harga'], $item['subtotal']);
            $stmt2->execute();
            
            $conn->query("UPDATE produk SET stok = stok - " . $item['jumlah'] . " WHERE id_produk = " . $item['id_produk']);
        }
        
        $conn->commit();
        echo json_encode(['success' => true, 'id' => $pesanan_id]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// Update order status
if ($action === 'update_order_status') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $conn->prepare("UPDATE pesanan SET status_pesanan = ? WHERE id_pesanan = ?");
    $stmt->bind_param("si", $data['status'], $data['id']);
    echo json_encode(['success' => $stmt->execute()]);
    exit;
}

// Get dashboard stats
if ($action === 'get_dashboard_stats') {
    $today = date('Y-m-d');
    $month = date('Y-m');
    
    $pendapatan_hari_ini = $conn->query("SELECT COALESCE(SUM(total_pembayaran), 0) as total FROM pesanan WHERE tanggal_pesanan = '$today' AND status_pesanan = 'lunas'")->fetch_assoc()['total'];
    
    $pendapatan_bulan = $conn->query("SELECT COALESCE(SUM(total_pembayaran), 0) as total FROM pesanan WHERE tanggal_pesanan LIKE '$month%' AND status_pesanan = 'lunas'")->fetch_assoc()['total'];
    
    $total_pesanan = $conn->query("SELECT COUNT(*) as total FROM pesanan WHERE tanggal_pesanan = '$today'")->fetch_assoc()['total'];
    
    $total_pelanggan = $conn->query("SELECT COUNT(*) as total FROM pelanggan")->fetch_assoc()['total'];
    
    $pesanan_terbaru = $conn->query("
        SELECT p.*, pel.nama as nama_pelanggan 
        FROM pesanan p 
        LEFT JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan 
        ORDER BY p.tanggal_pesanan DESC LIMIT 5
    ")->fetch_all(MYSQLI_ASSOC);
    
    $produk_terlaris = $conn->query("
        SELECT pr.nama_produk, SUM(dp.jumlah_produk) as total_terjual, SUM(dp.subtotal) as total_pendapatan
        FROM detail_pesanan dp
        JOIN produk pr ON dp.id_produk = pr.id_produk
        GROUP BY dp.id_produk
        ORDER BY total_terjual DESC
        LIMIT 5
    ")->fetch_all(MYSQLI_ASSOC);
    
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
    
    $penjualan = $conn->query("
        SELECT DATE(tanggal_pesanan) as date, SUM(total_pembayaran) as total, COUNT(*) as jumlah
        FROM pesanan
        WHERE tanggal_pesanan >= '$start' AND status_pesanan = 'lunas'
        GROUP BY DATE(tanggal_pesanan)
        ORDER BY date
    ")->fetch_all(MYSQLI_ASSOC);
    
    $kategori = $conn->query("
        SELECT pr.kategori, SUM(dp.subtotal) as total
        FROM detail_pesanan dp
        JOIN produk pr ON dp.id_produk = pr.id_produk
        JOIN pesanan p ON dp.id_pesanan = p.id_pesanan
        WHERE p.tanggal_pesanan >= '$start' AND p.status_pesanan = 'lunas'
        GROUP BY pr.kategori
    ")->fetch_all(MYSQLI_ASSOC);
    
    echo json_encode([
        'penjualan' => $penjualan,
        'kategori' => $kategori
    ]);
    exit;
}

// Get inventory
if ($action === 'get_inventory') {
    $result = $conn->query("SELECT * FROM produk ORDER BY stok ASC");
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    exit;
}

// Update stock
if ($action === 'update_stock') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $conn->prepare("UPDATE produk SET stok = ? WHERE id_produk = ?");
    $stmt->bind_param("ii", $data['stok'], $data['id']);
    echo json_encode(['success' => $stmt->execute()]);
    exit;
}

// Get settings
if ($action === 'get_settings') {
    $result = $conn->query("SELECT * FROM settings ORDER BY setting_key");
    $settings = [];
    while ($row = $result->fetch_assoc()) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
    echo json_encode(['success' => true, 'settings' => $settings]);
    exit;
}

// Update settings
if ($action === 'update_settings') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    foreach ($data as $key => $value) {
        $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->bind_param("sss", $key, $value, $value);
        $stmt->execute();
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
    
    if ($status) {
        $sql .= " AND status = '$status'";
    }
    if ($tipe) {
        $sql .= " AND tipe_kontrak = '$tipe'";
    }
    if ($search) {
        $sql .= " AND (nama_pihak_kedua LIKE '%$search%' OR nomor_kontrak LIKE '%$search%')";
    }
    
    $sql .= " ORDER BY tanggal_kontrak DESC";
    
    $result = $conn->query($sql);
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    exit;
}

// Get single contract by ID
if ($action === 'get_contract') {
    $id = $_GET['id'] ?? 0;
    $stmt = $conn->prepare("SELECT * FROM kontrak WHERE id_kontrak = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_assoc());
    exit;
}

// Create new contract
if ($action === 'create_contract') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $year = date('Y');
    $result = $conn->query("SELECT COUNT(*) as total FROM kontrak WHERE YEAR(tanggal_kontrak) = $year");
    $row = $result->fetch_assoc();
    $nomor = sprintf("KTR/%s/%03d", $year, $row['total'] + 1);
    
    $stmt = $conn->prepare("INSERT INTO kontrak 
        (nomor_kontrak, tipe_kontrak, nama_pihak_kedua, email_pihak, tanggal_kontrak, 
         masa_berlaku, nilai_kontrak, isi_kontrak, catatan, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')");
    
    $stmt->bind_param("ssssssdss", 
        $nomor,
        $data['tipe_kontrak'],
        $data['nama_pihak_kedua'],
        $data['email_pihak'],
        $data['tanggal_kontrak'],
        $data['masa_berlaku'],
        $data['nilai_kontrak'],
        $data['isi_kontrak'],
        $data['catatan']
    );
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $conn->insert_id, 'nomor_kontrak' => $nomor]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
    exit;
}

// Update contract
if ($action === 'update_contract') {
    $data = json_decode(file_get_contents('php://input'), true);
    
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
    
    $stmt->bind_param("sssssdsssi",
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
    );
    
    echo json_encode(['success' => $stmt->execute()]);
    exit;
}

// Update contract status only
if ($action === 'update_contract_status') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $conn->prepare("UPDATE kontrak SET status = ? WHERE id_kontrak = ?");
    $stmt->bind_param("si", $data['status'], $data['id_kontrak']);
    
    echo json_encode(['success' => $stmt->execute()]);
    exit;
}

// Delete contract
if ($action === 'delete_contract') {
    $id = $_GET['id'] ?? 0;
    $stmt = $conn->prepare("DELETE FROM kontrak WHERE id_kontrak = ?");
    $stmt->bind_param("i", $id);
    echo json_encode(['success' => $stmt->execute()]);
    exit;
}

// Get expiring contracts
if ($action === 'get_expiring_contracts') {
    $days = $_GET['days'] ?? 30;
    $sql = "SELECT * FROM kontrak 
            WHERE status = 'aktif' 
            AND masa_berlaku IS NOT NULL
            AND masa_berlaku BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL $days DAY)
            ORDER BY masa_berlaku ASC";
    
    $result = $conn->query($sql);
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
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
    
    $row = $result->fetch_assoc();
    $stats = array_merge($stats, $row);
    
    $result2 = $conn->query("SELECT COUNT(*) as expiring FROM kontrak 
        WHERE status = 'aktif' 
        AND masa_berlaku BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)");
    $row2 = $result2->fetch_assoc();
    $stats['expiring_soon'] = $row2['expiring'];
    
    echo json_encode($stats);
    exit;
}

// Save contract (legacy - keep for backward compatibility)
if ($action === 'save_contract') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $conn->prepare("INSERT INTO kontrak (id_pesanan, nama_pihak_kedua, email_pihak, tanggal_kontrak, masa_berlaku, nilai_kontrak, isi_kontrak, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')");
    $stmt->bind_param("issssds", $data['id_pesanan'], $data['nama'], $data['email'], $data['tanggal'], $data['masa'], $data['nilai'], $data['isi']);
    echo json_encode(['success' => $stmt->execute(), 'id' => $conn->insert_id]);
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
    
    // Generate order_id for Pakasir (must be unique)
    $order_id = 'MM-' . $id_pesanan . '-' . date('Hms') . '-' . substr(md5(uniqid()), 0, 4);
    $expired_at = date('Y-m-d H:i:s', time() + 3600);
    
    // Get Pakasir payment method
    $pakasir_method = getPakasirPaymentMethod($payment_method);
    
    // Create transaction at Pakasir.com using official API
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
    
    // Extract payment data from Pakasir response
    $paymentData = $pakasirResult['data'];
    $pakasir_transaction_id = $paymentData['order_id'] ?? $order_id;
    
    // Get QR code URL and QRIS string from Pakasir response
    $qr_code_url = '';
    $qr_string = '';
    $va_number = '';
    
    // For QRIS: payment_number contains the QRIS string with embedded amount
    if ($payment_method === 'qris' && isset($paymentData['payment_number'])) {
        $qr_string = $paymentData['payment_number'];
        $qr_code_url = pakasirGetQRCodeUrl($qr_string);
    }
    
    // For VA: payment_number contains the VA number
    if (strpos($payment_method, 'va_') === 0 && isset($paymentData['payment_number'])) {
        $va_number = $paymentData['payment_number'];
    }
    
    // Payment URL for redirect (fallback)
    $is_qris = ($payment_method === 'qris');
    $payment_url = pakasirGetPaymentUrl($order_id, $amount, $is_qris);
    
    // Get fee and total from Pakasir
    $fee = $paymentData['fee'] ?? 0;
    $total_payment = $paymentData['total_payment'] ?? $amount;
    $expired_at_pakasir = $paymentData['expired_at'] ?? null;
    if ($expired_at_pakasir) {
        $expired_at = date('Y-m-d H:i:s', strtotime($expired_at_pakasir));
    }
    
    // Save to database
    $stmt = $conn->prepare("INSERT INTO payment_transactions (id_pesanan, payment_reference, payment_method, amount, status, qr_code_url, qr_string, expired_at, pakasir_transaction_id, pakasir_response) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)");
    
    $pakasir_response = json_encode($paymentData);
    
    $stmt->bind_param("issdsssss", 
        $id_pesanan, 
        $order_id, 
        $payment_method, 
        $amount, 
        $qr_code_url, 
        $qr_string, 
        $expired_at,
        $pakasir_transaction_id,
        $pakasir_response
    );
    
    if ($stmt->execute()) {
        $conn->query("UPDATE pesanan SET payment_reference = '$order_id' WHERE id_pesanan = $id_pesanan");
        
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
        
        // For VA, include VA number
        if (strpos($payment_method, 'va_') === 0 && !empty($va_number)) {
            $bank = strtoupper(str_replace('va_', '', $payment_method));
            $response['va_bank'] = $bank;
            $response['va_number'] = $va_number;
        }
        
        echo json_encode($response);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to save payment: ' . $conn->error]);
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
    $stmt->bind_param("s", $payment_reference);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    if (!$result) {
        echo json_encode(['success' => false, 'error' => 'Payment not found']);
        exit;
    }
    
    // If still pending, check with Pakasir API
    if ($result['status'] === 'pending') {
        $pakasirStatus = pakasirCheckStatus($payment_reference, $result['amount']);
        
        if ($pakasirStatus['success'] && isset($pakasirStatus['data'])) {
            $pakasir_data = $pakasirStatus['data'];
            $pakasir_status = $pakasir_data['status'] ?? 'pending';
            
            // Map Pakasir status to our status
            if ($pakasir_status === 'completed' || $pakasir_status === 'paid' || $pakasir_status === 'success') {
                $paid_at = date('Y-m-d H:i:s');
                $conn->query("UPDATE payment_transactions SET status = 'paid', paid_at = '$paid_at' WHERE payment_reference = '$payment_reference'");
                $conn->query("UPDATE pesanan SET status_pesanan = 'lunas' WHERE payment_reference = '$payment_reference'");
                $result['status'] = 'paid';
                $result['paid_at'] = $paid_at;
            } elseif ($pakasir_status === 'expired') {
                $conn->query("UPDATE payment_transactions SET status = 'expired' WHERE payment_reference = '$payment_reference'");
                $result['status'] = 'expired';
            } elseif ($pakasir_status === 'failed' || $pakasir_status === 'cancelled') {
                $conn->query("UPDATE payment_transactions SET status = 'failed' WHERE payment_reference = '$payment_reference'");
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
        $stmt->bind_param("i", $id_pesanan);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    } else {
        $result = $conn->query("SELECT pt.*, p.tanggal_pesanan, pel.nama as customer_name FROM payment_transactions pt LEFT JOIN pesanan p ON pt.id_pesanan = p.id_pesanan LEFT JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan ORDER BY pt.created_at DESC LIMIT 50")->fetch_all(MYSQLI_ASSOC);
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
    $conn->query("UPDATE payment_transactions SET status = 'paid', paid_at = '$paid_at' WHERE payment_reference = '$payment_reference'");
    $conn->query("UPDATE pesanan SET status_pesanan = 'lunas' WHERE payment_reference = '$payment_reference'");
    
    echo json_encode(['success' => true, 'message' => 'Payment marked as paid']);
    exit;
}

// Webhook Handler from Pakasir.com
if ($action === 'webhook') {
    $rawBody = file_get_contents('php://input');
    $webhookData = json_decode($rawBody, true);
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    // Pakasir webhook format:
    // {
    //   "order_id": "MM-1-050548-097e",
    //   "amount": 15000,
    //   "status": "completed" | "pending" | "failed",
    //   "payment_method": "qris" | "bca_va" | etc,
    //   "completed_at": "2026-05-13T...",
    //   "project": "test"
    // }
    
    $payment_ref = $webhookData['order_id'] ?? $webhookData['external_id'] ?? '';
    $event_type = 'payment_notification';
    $webhook_json = $rawBody;
    
    // Log webhook
    $stmt = $conn->prepare("INSERT INTO payment_webhooks (payment_reference, event_type, webhook_data, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $payment_ref, $event_type, $webhook_json, $ip_address, $user_agent);
    $stmt->execute();
    $webhook_id = $conn->insert_id;
    
    // Process webhook
    if ($payment_ref && isset($webhookData['status'])) {
        $status = strtolower($webhookData['status']);
        $payment_method_pakasir = $webhookData['payment_method'] ?? '';
        
        if ($status === 'paid' || $status === 'success' || $status === 'completed') {
            $paid_at = date('Y-m-d H:i:s');
            
            // Update payment_method if Pakasir provides it
            if ($payment_method_pakasir) {
                $stmt = $conn->prepare("UPDATE payment_transactions SET status = 'paid', paid_at = ?, payment_method = ? WHERE payment_reference = ?");
                $stmt->bind_param("sss", $paid_at, $payment_method_pakasir, $payment_ref);
                $stmt->execute();
            } else {
                $stmt = $conn->prepare("UPDATE payment_transactions SET status = 'paid', paid_at = ? WHERE payment_reference = ?");
                $stmt->bind_param("ss", $paid_at, $payment_ref);
                $stmt->execute();
            }
            
            // Update order status
            $stmt = $conn->prepare("UPDATE pesanan SET status_pesanan = 'lunas' WHERE payment_reference = ?");
            $stmt->bind_param("s", $payment_ref);
            $stmt->execute();
            
            // Mark webhook processed
            $conn->query("UPDATE payment_webhooks SET processed = TRUE WHERE id = $webhook_id");
        } elseif ($status === 'expired') {
            $stmt = $conn->prepare("UPDATE payment_transactions SET status = 'expired' WHERE payment_reference = ?");
            $stmt->bind_param("s", $payment_ref);
            $stmt->execute();
        } elseif ($status === 'failed' || $status === 'cancelled') {
            $stmt = $conn->prepare("UPDATE payment_transactions SET status = 'failed' WHERE payment_reference = ?");
            $stmt->bind_param("s", $payment_ref);
            $stmt->execute();
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
    if ($result && $row = $result->fetch_assoc()) {
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

// Default response
echo json_encode(['success' => false, 'error' => 'Unknown action: ' . $action]);
