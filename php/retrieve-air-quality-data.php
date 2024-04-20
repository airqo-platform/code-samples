<?php
$gridId = 'your_grid_id'; // Replace with the grid ID for City X
$accessToken = 'your_access_token'; // Replace with your access token

$apiUrl = "https://api.airqo.net/api/v2/devices/measurements/grids/$gridId?token=$accessToken";

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);

if ($response) {
    $data = json_decode($response, true);
    if ($data && isset($data['data'])) {
        foreach ($data['data'] as $measurement) {
            echo "Date: " . $measurement['date'] . "\n";
            echo "PM2.5: " . $measurement['pm25'] . "\n";
            // Include more data fields as needed
            echo "\n";
        }
    } else {
        echo "Error: Unable to fetch data\n";
    }
} else {
    echo "Error: cURL request failed\n";
}

curl_close($ch);
?>
