# Add the Leaflet forecast map to an existing website

This guide explains how to add `leaflet-with-forecast.html` to a website that is already running. The page can be hosted on any domain, but its AirQo requests must pass through a server-side proxy to avoid browser CORS errors and keep the API token private.

## How it works

```text
Website visitor
    -> https://example.com/airqo-api/...
    -> leaflet-forecast-server.js (private Node service)
    -> https://api.airqo.net/...
```

The browser uses same-origin paths. The Node service adds the AirQo API token and forwards the response. Do not include `leaflet-forecast-server.js` in a browser `<script>` tag.

> [!IMPORTANT]
> The current HTML requires `leaflet-forecast-server.js` to be running, unless the existing website backend implements equivalent `/airqo-config` and `/airqo-api/*` routes. Nginx only forwards requests to Node; it does not replace the Node proxy.

## Requirements

- An existing website and access to its server or backend configuration.
- Node.js 18 or newer on the server.
- A valid AirQo API token and grid ID.
- Nginx, another reverse proxy, or an existing backend capable of routing requests to Node.

## Files to deploy

| File | Recommended location | Purpose |
| --- | --- | --- |
| `leaflet-with-forecast.html` | Existing website's public directory | Page visitors open or embed |
| `leaflet-forecast-server.js` | Private application directory | Adds the token and forwards approved AirQo requests |
| `leaflet-forecast-nginx.conf.example` | Reference only; do not publish | Example routes to add to an existing Nginx configuration |

This guide uses `example.com`; replace it with the website's real domain. It also uses `/opt/leaflet-forecast` as an example private directory and port `8081` for the internal Node service.

## Existing website deployment checklist

For an existing domain:

1. Place `leaflet-with-forecast.html` in the public website directory.
2. Place `leaflet-forecast-server.js` in a private application directory on the server.
3. Run the Node file on an internal port such as `127.0.0.1:8081`.
4. Route `/airqo-config` and `/airqo-api/*` from the existing website to that internal port.
5. Keep the Node process running with systemd, PM2, Docker, or the hosting platform.
6. Open `https://example.com/leaflet-with-forecast.html`.

The existing website continues handling every other URL. Do not route the entire domain to this sample server.

## 1. Add the HTML page

Copy `leaflet-with-forecast.html` into the website's public directory. For example, placing it in the public root should make it available at:

```text
https://example.com/leaflet-with-forecast.html
```

Keep `leaflet-forecast-server.js` outside the publicly served directory when possible. It is backend code and contains the proxy logic.

For example:

```text
/var/www/example.com/leaflet-with-forecast.html  # Public page
/opt/leaflet-forecast/leaflet-forecast-server.js # Private Node service
```

## 2. Configure and start the Node proxy

Set the credentials as server environment variables. Do not put a production token in the HTML or commit it to source control.

When running from the repository root in Windows PowerShell:

```powershell
$env:AIRQO_API_TOKEN = "your-access-token"
$env:AIRQO_GRID_ID = "your-grid-id"
node .\javascript\leaflet-forecast-server.js
```

On Linux:

```bash
cd /opt/leaflet-forecast

NODE_ENV=production \
HOST=127.0.0.1 \
PORT=8081 \
AIRQO_API_TOKEN="your-access-token" \
AIRQO_GRID_ID="your-grid-id" \
node ./leaflet-forecast-server.js
```

On Windows PowerShell:

```powershell
Set-Location "C:\path\to\leaflet-forecast"

$env:NODE_ENV = "production"
$env:HOST = "127.0.0.1"
$env:PORT = "8081"
$env:AIRQO_API_TOKEN = "your-access-token"
$env:AIRQO_GRID_ID = "your-grid-id"
node .\leaflet-forecast-server.js
```

The service should print:

```text
Leaflet forecast server listening on 127.0.0.1:8081
```

Use systemd, PM2, Docker, or the hosting platform's service manager to keep the Node process running after the terminal closes.

Confirm the internal service before changing the website configuration:

```bash
curl http://127.0.0.1:8081/healthz
```

Expected response:

```json
{"status":"ok"}
```

## 3. Connect the existing website to the proxy

If the website uses Nginx, add the contents of [`leaflet-forecast-nginx.conf.example`](./leaflet-forecast-nginx.conf.example) inside the existing domain's `server {}` block. The essential routes are:

```nginx
location = /airqo-config {
    proxy_pass http://127.0.0.1:8081;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}

location ^~ /airqo-api/ {
    proxy_pass http://127.0.0.1:8081;
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_set_header Host $host;
}
```

Validate and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Only `/airqo-config` and `/airqo-api/*` are sent to Node. The existing website continues handling all other pages and assets.

If the website uses Apache, IIS, Next.js, Express, Django, Laravel, WordPress, or another platform, create equivalent same-origin routes in that backend. Do not enable an unrestricted public CORS proxy.

## 4. Open or embed the map

Open the standalone page:

```text
https://example.com/leaflet-with-forecast.html
```

To display it inside an existing page, use an iframe:

```html
<iframe
  src="/leaflet-with-forecast.html"
  title="Air quality forecast map"
  style="width: 100%; height: 700px; border: 0;"
  loading="lazy"
></iframe>
```

## 5. Verify the deployment

Check the proxy health endpoint:

```bash
curl https://example.com/healthz
```

Expected response:

```json
{"status":"ok"}
```

Check the browser's Network panel after opening the map. Requests to `/airqo-config` and `/airqo-api/...` should return successful responses from the website's own domain. Browser requests should not contain the AirQo token.

## Troubleshooting

### The console still reports `origin 'null'`

The HTML was opened as a local `file://` URL. Open the deployed `https://` URL instead.

### `/airqo-config` or `/airqo-api/...` returns 404

The website is not forwarding those paths to the Node service. Check the reverse-proxy routes and confirm that the Node process is running on the configured host and port.

### The proxy returns 502

The Node service could not reach `https://api.airqo.net`. Check outbound network access, DNS, the API status, and server logs.

### The server exits during startup

In production, both `AIRQO_API_TOKEN` and `AIRQO_GRID_ID` must be set as environment variables. Also confirm that `PORT` is available and Node.js is version 18 or newer.

### The website is static-only

A static host cannot securely run this proxy. Deploy `leaflet-forecast-server.js` as a separate backend or serverless service, then route the website's `/airqo-config` and `/airqo-api/*` paths to it through the hosting platform. Never place the API token in public HTML.
