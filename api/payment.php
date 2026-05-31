<?php
/**
 * MiMatcha Payment Gateway API
 * Integration with Pakasir.com
 * Supports: QRIS, Virtual Account (BCA, BNI, Mandiri, BRI, Permata)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';

// Pakasir.com Configuration
define('PAKASIR_API_KEY', 'j6Md3oJGJm4CP16fVL2rWFv3ZroEI7ta');
define('PAKASIR_BASE_URL', 'https://api.pakasir.com/v1');
define('WEBHOOK_URL', 'https://surrogate-rascal-idealness.ngrok-free.dev/testtt/api/payment.php?action=webhook'); // Will be updated with ngrok URL

$action = $_GET['action'] ?? $_POST['action'] ?? '';

/**
 * Helper function to call Pakasir API
 */
function callPakasirAPI($endpoint, $method = 'POST', $data = null) {
    $url = PAKASIR_BASE_URL . $endpoint;
    
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . PAKASIR_API_KEY,
        'Accept: application/json'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } elseif ($method === 'GET') {
        curl_setopt($ch, CURLOPT_HTTPGET, true);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'error' => $error, 'http_code' => $httpCode];
    }
    
    $result = json_decode($response, true);
    return $result ?: ['success' => false, 'error' => 'Invalid response', 'http_code' => $httpCode];
}

/**
 * Generate unique payment reference
 */
function generatePaymentReference() {
    return 'PAY-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
}

/**
 * Create Payment - QRIS or Virtual Account
 */
if ($action === 'create_payment') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id_pesanan = $data['id_pesanan'] ?? null;
    $amount = $data['amount'] ?? 0;
    $payment_method = $data['payment_method'] ?? 'qris'; // qris, va_bca, va_bni, va_mandiri, va_bri, va_permata
    $customer_name = $data['customer_name'] ?? 'Customer';
    $customer_email = $data['customer_email'] ?? '';
    $customer_phone = $data['customer_phone'] ?? '';
    
    if (!$id_pesanan || $amount <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid order ID or amount']);
        exit;
    }
    
    // Generate payment reference
    $payment_reference = generatePaymentReference();
    
    // Prepare Pakasir API request
    $pakasirData = [
        'external_id' => $payment_reference,
        'amount' => (int)$amount,
        'description' => 'MiMatcha Order #' . $id_pesanan,
        'customer_name' => $customer_name,
        'customer_email' => $customer_email,
        'customer_phone' => $customer_phone,
        'callback_url' => WEBHOOK_URL,
        'expired_time' => 3600 // 1 hour
    ];
    
    // Call appropriate Pakasir endpoint based on payment method
    if ($payment_method === 'qris') {
        $endpoint = '/qris/create';
        $pakasirResponse = callPakasirAPI($endpoint, 'POST', $pakasirData);
        
        if (isset($pakasirResponse['success']) && $pakasirResponse['success']) {
            // Save to database
            $stmt = $conn->prepare("INSERT INTO payment_transactions (id_pesanan, payment_reference, payment_method, amount, status, qr_code_url, qr_string, expired_at, pakasir_transaction_id, pakasir_response) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)");
            
            $qr_code_url = $pakasirResponse['data']['qr_code_url'] ?? '';
            $qr_string = $pakasirResponse['data']['qr_string'] ?? '';
            $expired_at = date('Y-m-d H:i:s', time() + 3600);
            $pakasir_id = $pakasirResponse['data']['id'] ?? '';
            $response_json = json_encode($pakasirResponse);
            
            $stmt->bind_param("isssdssss", $id_pesanan, $payment_reference, $payment_method, $amount, $qr_code_url, $qr_string, $expired_at, $pakasir_id, $response_json);
            
            if ($stmt->execute()) {
                // Update pesanan with payment reference
                $conn->query("UPDATE pesanan SET payment_reference = '$payment_reference' WHERE id_pesanan = $id_pesanan");
                
                echo json_encode([
                    'success' => true,
                    'payment_reference' => $payment_reference,
                    'payment_method' => $payment_method,
                    'qr_code_url' => $qr_code_url,
                    'qr_string' => $qr_string,
                    'amount' => $amount,
                    'expired_at' => $expired_at,
                    'pakasir_data' => $pakasirResponse['data'] ?? []
                ]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to save payment transaction']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => $pakasirResponse['error'] ?? 'Failed to create QRIS payment']);
        }
        
    } elseif (strpos($payment_method, 'va_') === 0) {
        // Virtual Account
        $bank = str_replace('va_', '', $payment_method);
        $endpoint = '/va/create';
        $pakasirData['bank_code'] = strtoupper($bank);
        
        $pakasirResponse = callPakasirAPI($endpoint, 'POST', $pakasirData);
        
        if (isset($pakasirResponse['success']) && $pakasirResponse['success']) {
            // Save to database
            $stmt = $conn->prepare("INSERT INTO payment_transactions (id_pesanan, payment_reference, payment_method, amount, status, va_number, va_bank, expired_at, pakasir_transaction_id, pakasir_response) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)");
            
            $va_number = $pakasirResponse['data']['va_number'] ?? '';
            $va_bank = strtoupper($bank);
            $expired_at = date('Y-m-d H:i:s', time() + 3600);
            $pakasir_id = $pakasirResponse['data']['id'] ?? '';
            $response_json = json_encode($pakasirResponse);
            
            $stmt->bind_param("issdssss", $id_pesanan, $payment_reference, $payment_method, $amount, $va_number, $va_bank, $expired_at, $pakasir_id, $response_json);
            
            if ($stmt->execute()) {
                // Update pesanan with payment reference
                $conn->query("UPDATE pesanan SET payment_reference = '$payment_reference' WHERE id_pesanan = $id_pesanan");
                
                echo json_encode([
                    'success' => true,
                    'payment_reference' => $payment_reference,
                    'payment_method' => $payment_method,
                    'va_number' => $va_number,
                    'va_bank' => $va_bank,
                    'amount' => $amount,
                    'expired_at' => $expired_at,
                    'pakasir_data' => $pakasirResponse['data'] ?? []
                ]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to save payment transaction']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => $pakasirResponse['error'] ?? 'Failed to create VA payment']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid payment method']);
    }
    exit;
}

/**
 * Check Payment Status
 */
if ($action === 'check_payment_status') {
    $payment_reference = $_GET['payment_reference'] ?? '';
    
    if (!$payment_reference) {
        echo json_encode(['success' => false, 'error' => 'Payment reference required']);
        exit;
    }
    
    // Get from database
    $stmt = $conn->prepare("SELECT * FROM payment_transactions WHERE payment_reference = ?");
    $stmt->bind_param("s", $payment_reference);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    if (!$result) {
        echo json_encode(['success' => false, 'error' => 'Payment not found']);
        exit;
    }
    
    // Check with Pakasir API
    $pakasir_id = $result['pakasir_transaction_id'];
    if ($pakasir_id) {
        $endpoint = '/transaction/status/' . $pakasir_id;
        $pakasirResponse = callPakasirAPI($endpoint, 'GET');
        
        if (isset($pakasirResponse['success']) && $pakasirResponse['success']) {
            $status = $pakasirResponse['data']['status'] ?? 'pending';
            
            // Update database if status changed
            if ($status === 'paid' && $result['status'] !== 'paid') {
                $paid_at = date('Y-m-d H:i:s');
                $conn->query("UPDATE payment_transactions SET status = 'paid', paid_at = '$paid_at' WHERE payment_reference = '$payment_reference'");
                $conn->query("UPDATE pesanan SET status_pesanan = 'lunas' WHERE payment_reference = '$payment_reference'");
            }
            
            $result['status'] = $status;
        }
    }
    
    echo json_encode([
        'success' => true,
        'payment' => $result
    ]);
    exit;
}

/**
 * Webhook Handler - Receive payment notifications from Pakasir
 */
if ($action === 'webhook') {
    $webhookData = json_decode(file_get_contents('php://input'), true);
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    // Log webhook
    $stmt = $conn->prepare("INSERT INTO payment_webhooks (payment_reference, event_type, webhook_data, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)");
    $payment_ref = $webhookData['external_id'] ?? '';
    $event_type = $webhookData['event'] ?? 'payment_notification';
    $webhook_json = json_encode($webhookData);
    $stmt->bind_param("sssss", $payment_ref, $event_type, $webhook_json, $ip_address, $user_agent);
    $stmt->execute();
    
    // Process webhook
    if ($payment_ref && isset($webhookData['status'])) {
        $status = $webhookData['status'];
        
        if ($status === 'paid' || $status === 'success') {
            $paid_at = date('Y-m-d H:i:s');
            
            // Update payment transaction
            $conn->query("UPDATE payment_transactions SET status = 'paid', paid_at = '$paid_at' WHERE payment_reference = '$payment_ref'");
            
            // Update order status
            $conn->query("UPDATE pesanan SET status_pesanan = 'lunas' WHERE payment_reference = '$payment_ref'");
            
            // Mark webhook as processed
            $conn->query("UPDATE payment_webhooks SET processed = TRUE WHERE payment_reference = '$payment_ref' ORDER BY id DESC LIMIT 1");
        } elseif ($status === 'expired') {
            $conn->query("UPDATE payment_transactions SET status = 'expired' WHERE payment_reference = '$payment_ref'");
        } elseif ($status === 'failed') {
            $conn->query("UPDATE payment_transactions SET status = 'failed' WHERE payment_reference = '$payment_ref'");
        }
    }
    
    // Return success to Pakasir
    echo json_encode(['success' => true, 'message' => 'Webhook received']);
    exit;
}

/**
 * Get Payment History
 */
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

/**
 * Cancel Payment
 */
if ($action === 'cancel_payment') {
    $payment_reference = $_POST['payment_reference'] ?? '';
    
    if (!$payment_reference) {
        echo json_encode(['success' => false, 'error' => 'Payment reference required']);
        exit;
    }
    
    $conn->query("UPDATE payment_transactions SET status = 'cancelled' WHERE payment_reference = '$payment_reference'");
    
    echo json_encode(['success' => true, 'message' => 'Payment cancelled']);
    exit;
}

// Default response
echo json_encode(['success' => false, 'error' => 'Unknown action']);
?>

