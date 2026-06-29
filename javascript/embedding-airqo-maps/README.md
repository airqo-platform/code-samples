# Embedding AirQo Maps

This folder contains a standalone AirQo map embed that can be dropped into a plain HTML page. It renders live grid measurements, AQI markers, an optional heatmap layer, search, and a 7-day PM2.5 forecast panel for sites in the selected grid.

## Files

- `embedding-airqo-maps-demo.html` - interactive demo for testing an access token and grid ID.
- `embedding-airqo-maps.html` - iframe target page that reads `accessToken` and `gridId` from the URL.
- `embedding-airqo-maps.js` - reusable browser script that exposes `EmbeddingAirQoMaps`.
- `api-pagination-call.js` - sample pagination helper for API calls.
- `retrieveAirQualityData.js` - sample React-style data retrieval snippet.

## Requirements

- A valid AirQo API access token.
- A valid AirQo grid ID.
- Leaflet CSS and JavaScript loaded before `embedding-airqo-maps.js`.
- A browser environment with access to `https://api.airqo.net/api/v2`.

The widget calls these AirQo API paths:

- `/devices/measurements/grids/{GRID_ID}`
- `/spatial/heatmaps/{GRID_ID}`
- `/predict/daily-forecasting/{GRID_ID}`

## Try The Demo

Open `embedding-airqo-maps-demo.html` in a browser, enter an access token and grid ID, then select **Load map**.

If browser security settings block local requests, serve the folder with any static file server and open the demo from `http://localhost`.

## Iframe Embed

Use `embedding-airqo-maps.html` when you want the map isolated inside an iframe.

```html
<iframe
  src="embedding-airqo-maps.html?accessToken=YOUR_ACCESS_TOKEN&gridId=YOUR_GRID_ID"
  width="100%"
  height="450"
  style="border:0;"
  loading="lazy"
></iframe>
```

The iframe page also accepts `token` instead of `accessToken`, and `grid` instead of `gridId`.

## Auto-Mount Embed

Use a data attribute target when the script is loaded on the same page as the map container.

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="./embedding-airqo-maps.js"></script>

<div
  data-embedding-airqo-maps
  data-access-token="YOUR_ACCESS_TOKEN"
  data-grid-id="YOUR_GRID_ID"
  data-height="450px"
></div>
```

The script automatically mounts every element with `data-embedding-airqo-maps` or `data-airqo-forecast-widget`.

## JavaScript API

Use `EmbeddingAirQoMaps.init()` when you need to mount, refresh, or destroy the widget manually.

```html
<div id="embedding-airqo-maps" style="height: 520px;"></div>

<script>
  var embeddedMap = EmbeddingAirQoMaps.init({
    elementId: "embedding-airqo-maps",
    accessToken: "YOUR_ACCESS_TOKEN",
    gridId: "YOUR_GRID_ID",
    height: "520px",
  });

  // Reload measurements, heatmap, and forecast data.
  embeddedMap.refresh();

  // Remove the Leaflet map and clear the container.
  embeddedMap.destroy();
</script>
```

Accepted options:

- `elementId` or `element` - target DOM element. Defaults to `embedding-airqo-maps`.
- `accessToken` or `token` - AirQo API access token.
- `gridId`, `gridID`, or `grid` - AirQo grid ID.
- `height` - CSS height value or number of pixels for the target element.

## Token Handling

These examples place the token in the browser because they are client-side code samples. For production integrations, prefer issuing embeds from a trusted backend or using a short-lived token strategy so long-lived credentials are not exposed in public HTML.

## Troubleshooting

- `EmbeddingAirQoMaps requires Leaflet...` means Leaflet was not loaded before `embedding-airqo-maps.js`.
- `Enter both accessToken and gridId.` means the widget did not receive both required values.
- `Missing accessToken and gridId in the iframe URL.` means the iframe URL is missing one or both query parameters.
- `Unable to load live measurements.` usually means the token, grid ID, network access, or API authorization needs to be checked.
