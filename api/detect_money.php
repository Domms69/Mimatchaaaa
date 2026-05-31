<?php
/**
 * Money Detection API using OpenRouter AI
 * Detects authenticity and denomination of Indonesian Rupiah using vision AI
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// OpenRouter Configuration
define('OPENROUTER_API_URL', 'https://openrouter.ai/api/v1/chat/completions');

// Models to try in order (fallback if rate-limited)
$models = [
    'google/gemma-4-26b-a4b-it:free',
    'google/gemma-4-31b-it:free',
    'nvidia/nemotron-nano-12b-v2-vl:free'
];

// Get image data from request
$input = json_decode(file_get_contents('php://input'), true);
$imageBase64 = $input['image'] ?? '';

if (!$imageBase64) {
    echo json_encode(['success' => false, 'error' => 'No image provided']);
    exit;
}

// Make sure image has data:image/... prefix
if (strpos($imageBase64, 'data:image') !== 0) {
    $imageBase64 = 'data:image/jpeg;base64,' . $imageBase64;
}

// Prompt for AI - request strict JSON response
$prompt = <<<PROMPT
You are a Indonesian Rupiah (IDR) currency authenticity detector. Analyze the image carefully.

Indonesian Rupiah denominations and their dominant colors:
- Rp 1.000: Green, with Tjut Meutiah portrait
- Rp 2.000: Grey, with Mohammad Hoesni Thamrin portrait  
- Rp 5.000: Brown, with Tuanku Imam Bonjol portrait
- Rp 10.000: Purple, with Sultan Mahmud Badaruddin II portrait
- Rp 20.000: Green, with Sam Ratulangi portrait
- Rp 50.000: Blue, with Djuanda Kartawidjaja portrait
- Rp 100.000: Red, with Soekarno-Hatta portraits

Analyze the image and respond ONLY with a valid JSON object in this exact format (no markdown, no explanation, just JSON):
{
  "is_money": true/false,
  "is_real": true/false,
  "denomination": <number 0/1000/2000/5000/10000/20000/50000/100000>,
  "confidence": <0-100>,
  "notes": "<brief 1 sentence reason>"
}

Rules:
- If image does not contain Indonesian Rupiah, set is_money=false, is_real=false, denomination=0
- If banknote is detected but appears damaged/fake/photocopy, set is_real=false
- Set confidence based on how clearly you can see security features
- Detection should consider: printing quality, color accuracy, paper texture, security features (watermark, hologram, micro text)
PROMPT;

// Try each model until success
$success = false;
$lastError = '';

foreach ($models as $model) {
    $body = [
        'model' => $model,
        'messages' => [
            [
                'role' => 'user',
                'content' => [
                    [
                        'type' => 'text',
                        'text' => $prompt
                    ],
                    [
                        'type' => 'image_url',
                        'image_url' => [
                            'url' => $imageBase64
                        ]
                    ]
                ]
            ]
        ],
        'max_tokens' => 300,
        'temperature' => 0.2
    ];

    $headers = [
        'Authorization: Bearer ' . OPENROUTER_API_KEY,
        'Content-Type: application/json',
        'HTTP-Referer: http://localhost:5173',
        'X-Title: MiMatcha POS'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, OPENROUTER_API_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        $lastError = "cURL Error with $model: $error";
        continue;
    }

    $result = json_decode($response, true);

    if ($httpCode === 429) {
        $lastError = "$model rate-limited, trying next...";
        continue;
    }

    if ($httpCode >= 400 || isset($result['error'])) {
        $lastError = "$model error: " . ($result['error']['message'] ?? "HTTP $httpCode");
        continue;
    }

    if (isset($result['choices'][0]['message']['content'])) {
        $aiResponse = $result['choices'][0]['message']['content'];
        
        // Try to extract JSON from AI response
        // Sometimes AI wraps response in markdown ```json ... ```
        $aiResponse = preg_replace('/```json\s*/', '', $aiResponse);
        $aiResponse = preg_replace('/```\s*$/', '', $aiResponse);
        $aiResponse = trim($aiResponse);
        
        // Find JSON object pattern
        if (preg_match('/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/s', $aiResponse, $matches)) {
            $aiResponse = $matches[0];
        }
        
        $analysis = json_decode($aiResponse, true);
        
        if ($analysis && isset($analysis['is_money'])) {
            echo json_encode([
                'success' => true,
                'model_used' => $model,
                'analysis' => $analysis,
                'raw_response' => $result['choices'][0]['message']['content']
            ]);
            $success = true;
            break;
        } else {
            // AI responded but not in expected format
            $lastError = "Failed to parse AI response: " . substr($aiResponse, 0, 200);
            continue;
        }
    }
}

if (!$success) {
    echo json_encode([
        'success' => false,
        'error' => 'All models failed',
        'last_error' => $lastError
    ]);
}
