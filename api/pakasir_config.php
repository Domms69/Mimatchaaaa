<?php
/**
 * Pakasir.com Configuration
 * Documentation: https://pakasir.com/p/docs
 * 
 * Untuk hosting, set environment variable:
 *   PAKASIR_API_KEY   — API key dari dashboard Pakasir
 *   PAKASIR_PROJECT   — slug project dari dashboard Pakasir
 *   WEBHOOK_URL       — URL webhook (URL hosting anda + ?action=webhook)
 */

// Pakasir API Configuration — baca dari environment variable
define('PAKASIR_API_KEY', getenv('PAKASIR_API_KEY') ?: 'j6Md3oJGJm4CP16fVL2rWFv3ZroEI7ta');
define('PAKASIR_PROJECT', getenv('PAKASIR_PROJECT') ?: 'i-dont-know');
define('PAKASIR_BASE_URL', getenv('PAKASIR_BASE_URL') ?: 'https://app.pakasir.com');
define('PAKASIR_API_URL', getenv('PAKASIR_API_URL') ?: 'https://app.pakasir.com/api');

// Webhook URL — set sesuai environment
define('WEBHOOK_URL', getenv('WEBHOOK_URL') ?: '');

/**
 * Create transaction at Pakasir.com
 * Using official API: POST /api/transactioncreate/{method}
 * Returns QR string with embedded amount for QRIS
 */
function pakasirCreateTransaction($order_id, $amount, $payment_method = 'qris') {
    $url = PAKASIR_API_URL . '/transactioncreate/' . $payment_method;
    
    $data = [
        'project' => PAKASIR_PROJECT,
        'order_id' => $order_id,
        'amount' => (int)$amount,
        'api_key' => PAKASIR_API_KEY
    ];
    
    $headers = [
        'Content-Type: application/json',
        'Accept: application/json'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    // Log for debugging
    error_log("Pakasir API Response: " . $response);
    
    if ($error) {
        return ['success' => false, 'error' => 'cURL Error: ' . $error];
    }
    
    $result = json_decode($response, true);
    
    if ($httpCode >= 200 && $httpCode < 300 && isset($result['payment'])) {
        return [
            'success' => true, 
            'data' => $result['payment'],
            'raw' => $result
        ];
    }
    
    return ['success' => false, 'error' => $result['message'] ?? 'Unknown error', 'http_code' => $httpCode, 'raw' => $result];
}

/**
 * Get payment URL for Pakasir (for redirect/iframe)
 * Format: /pay/{slug}/{amount}?order_id={order_id}&qris_only=1
 */
function pakasirGetPaymentUrl($order_id, $amount, $qris_only = false) {
    $url = PAKASIR_BASE_URL . '/pay/' . PAKASIR_PROJECT . '/' . (int)$amount . '?order_id=' . urlencode($order_id);
    if ($qris_only) {
        $url .= '&qris_only=1';
    }
    return $url;
}

/**
 * Generate QR code image URL from QRIS string
 * Uses QR server API to convert QR string to image
 */
function pakasirGetQRCodeUrl($qr_string) {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($qr_string);
}

/**
 * Check transaction status from Pakasir
 * GET /api/transactiondetail?project={slug}&amount={amount}&order_id={order_id}&api_key={api_key}
 */
function pakasirCheckStatus($order_id, $amount) {
    $url = PAKASIR_API_URL . '/transactiondetail?project=' . PAKASIR_PROJECT . '&amount=' . (int)$amount . '&order_id=' . urlencode($order_id) . '&api_key=' . PAKASIR_API_KEY;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if ($httpCode >= 200 && $httpCode < 300 && isset($result['transaction'])) {
        return ['success' => true, 'data' => $result['transaction']];
    }
    
    return ['success' => false, 'error' => $result['message'] ?? 'Failed to check status'];
}

/**
 * Map payment method to Pakasir format
 */
function getPakasirPaymentMethod($method) {
    $mapping = [
        'qris' => 'qris',
        'va_bca' => 'cimb_niaga_va', // Pakasir doesn't have BCA, use CIMB
        'va_bni' => 'bni_va',
        'va_mandiri' => 'permata_va', // Pakasir doesn't have Mandiri, use Permata
        'va_bri' => 'bri_va',
        'va_permata' => 'permata_va',
        'va_cimb' => 'cimb_niaga_va',
        'va_bnc' => 'bnc_va',
        'va_maybank' => 'maybank_va',
        'va_sampoerna' => 'sampoerna_va',
        'va_atm_bersama' => 'atm_bersama_va',
        'va_artha_graha' => 'artha_graha_va'
    ];
    
    return $mapping[$method] ?? 'qris';
}
