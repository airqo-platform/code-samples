<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Air Quality Map</title>
    <!-- Include Leaflet CSS and JS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    <!-- Include jQuery -->
    <script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
    <style>
        #map {
            height: 400px;
        }
    </style>
</head>
<body>
    <div id="map"></div>

    <script>
        // Initialize Leaflet map
        var map = L.map('map').setView([0, 0], 2); // Set initial view

        // Add OpenStreetMap as the base layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Sample API response
        var apiResponse = <?php echo json_encode($apiResponse); ?>;

        // Loop through measurements and add markers to the map
        apiResponse.measurements.forEach(function(measurement) {
            var lat = measurement.siteDetails.approximate_latitude;
            var lon = measurement.siteDetails.approximate_longitude;
            var pm25Value = measurement.pm2_5.value;
            var siteName = measurement.siteDetails.formatted_name;

            // Create a marker
            var marker = L.marker([lat, lon]).addTo(map)
                .bindPopup('<b>' + siteName + '</b><br>PM2.5 Value: ' + pm25Value);

            // Add a click event to the marker
            marker.on('click', function() {
                alert('PM2.5 Value at ' + siteName + ': ' + pm25Value);
            });
        });
    </script>
</body>
</html>
