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

        // Sample API endpoint and access token
        var apiEndpoint = 'https://api.airqo.net/api/v2/devices/measurements/grids/{GRID_ID}';
        var accessToken = '{ACCESS_TOKEN}';

        // Make API request
        $.ajax({
            url: apiEndpoint.replace('{GRID_ID}', 'your_grid_id').concat('?token=' + accessToken),
            method: 'GET',
            success: function(apiResponse) {
                // Loop through measurements and add markers to the map
                apiResponse.measurements.forEach(function(measurement) {
                    var lat = measurement.siteDetails.approximate_latitude;
                    var lon = measurement.siteDetails.approximate_longitude;
                    var pm25Value = measurement.pm2_5.value;
                    var siteName = measurement.siteDetails.formatted_name;
                    var aqiCategory = measurement.aqi_category;
                    var aqiColor = measurement.aqi_color;

                    // Create a marker with different colors based on AQI category
                    var marker = L.marker([lat, lon], {
                        icon: L.divIcon({
                            className: 'custom-marker',
                            html: '<div class="marker" style="background-color: ' + aqiColor + '"></div>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10],
                        })
                    }).addTo(map)
                        .bindPopup('<b>' + siteName + '</b><br>PM2.5 Value: ' + pm25Value + '<br>AQI Category: ' + aqiCategory);

                    // Add a click event to the marker
                    marker.on('click', function() {
                        alert('PM2.5 Value at ' + siteName + ': ' + pm25Value + '\nAQI Category: ' + aqiCategory);
                    });
                });
            },
            error: function(error) {
                console.error('Error fetching data:', error);
            }
        });
    </script>
</body>
</html>
