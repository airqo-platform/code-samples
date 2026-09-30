<?php
// Local development only: php -S 127.0.0.1:8080 -t php php/leaflet-forecast-router.php
// Never fall back to static serving: the adjacent Node source must stay private.
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

function routerError($status, $message)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(array('error' => $message));
}

if ($method !== 'GET' && $method !== 'HEAD') {
    header('Allow: GET, HEAD');
    routerError(405, 'Only GET and HEAD requests are supported.');
    return;
}

if ($path === '/' || $path === '/leaflet-with-forecast.php') {
    require __DIR__ . '/leaflet-with-forecast.php';
    return;
}

if ($path !== '/airqo-config' && $path !== '/healthz' && strpos($path, '/airqo-api/') !== 0) {
    routerError(404, 'Not found.');
    return;
}

// Fixed loopback destination; the Node service validates the permitted API paths.
$context = stream_context_create(array('http' => array(
    'method' => 'GET',
    'header' => "Accept: application/json\r\nConnection: close\r\n",
    'timeout' => 35,
    'ignore_errors' => true,
    'follow_location' => 0,
)));
$body = @file_get_contents('http://127.0.0.1:8081' . $_SERVER['REQUEST_URI'], false, $context);
if ($body === false) {
    routerError(502, 'Cannot reach the Node service on port 8081. Start leaflet-forecast-server.js with PORT=8081 and enable allow_url_fopen in PHP.');
    return;
}

$status = 502;
foreach ($http_response_header as $line) {
    if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $line, $matches)) {
        $status = (int) $matches[1];
    }
}
http_response_code($status);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if ($method !== 'HEAD') {
    echo $body;
}
