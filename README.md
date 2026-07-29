# Air Quality API Code Samples

Welcome to the Air Quality API code samples repository! In this monorepo, you'll find code samples and examples in various programming languages for accessing the Air Quality API provided by AirQo. These code snippets demonstrate how to integrate air quality data into your applications and projects.

## Subfolders

This monorepo is organized into subfolders, each containing code samples for a specific programming language or framework:

1. **javascript**: Code samples for accessing the Air Quality API using JavaScript.

2. **dart**: Code samples for integrating air quality data into mobile applications using Dart.

3. **php**: Code samples demonstrating how to access the Air Quality API with PHP.

4. **python**: Code samples for Python applications

## Getting Started

To get started with any of the code samples, navigate to the respective subfolder and follow the instructions provided in the README or code comments. Each subfolder contains code examples and explanations specific to the programming language or framework.

### Run the Leaflet forecast sample

Node.js 18 or newer is required. From the repository root, configure your AirQo credentials and start the server in PowerShell:

```powershell
$env:AIRQO_API_TOKEN = "your-access-token"
$env:AIRQO_GRID_ID = "your-grid-id"

copy this in the terminal
node .\javascript\leaflet-forecast-server.js
```

Keep the terminal running, then open <http://127.0.0.1:8080/> in a browser. Do not open `leaflet-with-forecast.html` directly as a `file://` URL because the server-side proxy is required for the AirQo API requests.

## Code Samples

- [**javascript**](./javascript): Explore code samples for JavaScript.
- [**dart**](./dart): Get code examples for building mobile apps with Dart.
- [**php**](./php): Find PHP code samples for accessing air quality data from the API.
- [**python**](./python): Discover code samples for Python applications 

Feel free to explore, use, and adapt these code samples to integrate air quality data into your own projects. If you have any questions or need further assistance, please don't hesitate to reach out.

## About AirQo

AirQo provides comprehensive air quality data and analytics to support environmental monitoring and decision-making. Visit the [AirQo website](https://www.airqo.net/) to learn more about their services and APIs.

## License

This repository is licensed under the [MIT License](LICENSE). 
