<?php

function makeSubsequentRequests($baseUrl, $endpointPath, $start, $end, $totalPages) {
    for ($page = 1; $page <= $totalPages; $page++) {
        $url = "$baseUrl/$endpointPath?startTime=$start&endTime=$end&page=$page";
        $response = file_get_contents($url);

        // Process the response data as needed

        // Check and update the startTime and endTime for the next request
        $jsonResponse = json_decode($response, true);
        // Extract startTime and endTime from the JSON response

        // For demonstration purposes, print the details
        echo "Page $page processed. New startTime: $start, new endTime: $end\n";
    }
}

$baseUrl = "YOUR_BASE_URL";
$endpointPath = "rest-of-your-endpoint-path";
$start = "2022-11-14T20:00:45.061Z";
$end = "2023-11-21T20:00:45.061Z";
$totalPages = 23;

makeSubsequentRequests($baseUrl, $endpointPath, $start, $end, $totalPages);
