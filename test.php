<?php
header('Content-Type: application/json');

// Simple test to verify PHP is working
$test = [
    'status' => 'PHP is working',
    'time' => date('Y-m-d H:i:s'),
    'curl_available' => function_exists('curl_init') ? 'Yes' : 'No',
    'can_write' => is_writable(__DIR__) ? 'Yes' : 'No'
];

echo json_encode($test, JSON_PRETTY_PRINT);
?>