<?php
/**
 * MiMatcha - Railway Entry Point
 * 
 * Router untuk PHP built-in server (digunakan Railway).
 * - Meneruskan request /api/* ke file API yang sesuai
 * - Melayani file statis dari dist/
 * - Fallback ke SPA untuk client-side routing
 */

$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// --- API Routes ---
if (strpos($path, '/api/') === 0) {
    $apiFile = __DIR__ . '/../api/' . substr($path, 5);
    
    if (file_exists($apiFile) && !is_dir($apiFile)) {
        $_SERVER['SCRIPT_NAME'] = '/api/' . basename($apiFile);
        $_SERVER['SCRIPT_FILENAME'] = $apiFile;
        
        if (basename($apiFile) !== 'config.php') {
            require_once __DIR__ . '/../api/config.php';
        }
        
        require $apiFile;
        exit;
    }
    
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'API endpoint not found']);
    exit;
}

// --- Static Files (from dist/) ---
$distPath = __DIR__ . '/dist';

// Serve static files from dist/ with proper MIME types
$filePath = $distPath . $path;
if ($path !== '/' && file_exists($filePath) && !is_dir($filePath)) {
    // Determine MIME type
    $ext = pathinfo($filePath, PATHINFO_EXTENSION);
    $mimeTypes = [
        'js'    => 'application/javascript',
        'css'   => 'text/css',
        'json'  => 'application/json',
        'png'   => 'image/png',
        'jpg'   => 'image/jpeg',
        'jpeg'  => 'image/jpeg',
        'gif'   => 'image/gif',
        'svg'   => 'image/svg+xml',
        'ico'   => 'image/x-icon',
        'webp'  => 'image/webp',
        'woff'  => 'font/woff',
        'woff2' => 'font/woff2',
        'txt'   => 'text/plain',
        'html'  => 'text/html',
        'xml'   => 'application/xml',
        'map'   => 'application/json',
    ];
    
    if (isset($mimeTypes[$ext])) {
        header('Content-Type: ' . $mimeTypes[$ext]);
    }
    
    readfile($filePath);
    exit;
}

// --- SPA Fallback ---
$indexFile = $distPath . '/index.html';
if (file_exists($indexFile)) {
    require $indexFile;
} else {
    http_response_code(500);
    echo '<h1>500 - Build belum dijalankan</h1>';
    echo '<p>Jalankan <code>npm run build</code> terlebih dahulu.</p>';
    echo '<br><small>Pastikan folder <code>public/dist/</code> berisi file hasil build.</small>';
}
