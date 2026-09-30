# PHP Leaflet map with forecasts

`leaflet-with-forecast.php` preserves the JavaScript example's map, site search,
daily forecasts, and heatmap. Serve it with your existing PHP website.
`leaflet-forecast-server.js` runs separately as a private Node.js service and adds
the AirQo API token to upstream requests.

## Local Windows testing without Nginx

Copy `.env.example` to `.env` in this folder and replace the token and grid ID:

```powershell
cd "D:\AIRQO\GIT REPOSITORY\ai-frontend\code-samples"
Copy-Item .\php\.env.example .\php\.env
notepad .\php\.env
```

Keep `PORT=8081` and `HOST=127.0.0.1`. The Node service loads `.env`
automatically with Node.js 20.12 or newer. Shell environment variables take
precedence over `.env`; remove stale values from the Node terminal if needed:

```powershell
Remove-Item Env:AIRQO_API_TOKEN -ErrorAction SilentlyContinue
Remove-Item Env:AIRQO_GRID_ID -ErrorAction SilentlyContinue
```

The `.env`
file is ignored by Git, and the local PHP router blocks access to it. Do not
copy `.env` into a publicly served directory when deploying the site.

From the repository root, start Node in one PowerShell terminal and leave it open:

```powershell
node .\php\leaflet-forecast-server.js
```

In another terminal, also at the repository root, start PHP with the local router
and leave it open:

```powershell
php -S 127.0.0.1:8080 -t php php/leaflet-forecast-router.php
```

Check http://127.0.0.1:8081/healthz and
http://127.0.0.1:8080/airqo-config, then open
http://127.0.0.1:8080/leaflet-with-forecast.php. The router serves the page
and forwards its configuration/API requests to Node on port 8081. It denies
requests for all other files, including the Node source. PHP's `allow_url_fopen`
must be enabled (the default). This built-in server is for local development;
use the deployment setup below for a public website.

## Deployment

Requirements: PHP hosting, Node.js 20.12 or newer for `.env` loading (Node.js
18 or newer when credentials are injected as environment variables), an AirQo
token and grid ID, and
access to the website's reverse-proxy configuration.

1. Copy `leaflet-with-forecast.php` to the website's public directory.
2. Put `leaflet-forecast-server.js` **outside the public directory**, for example
   `/opt/airqo/leaflet-forecast-server.js`. Never load it with a `<script>` tag.
3. Set environment variables on the server and start the Node service:

   ```bash
   NODE_ENV=production HOST=127.0.0.1 PORT=8081 \
   AIRQO_API_TOKEN="your-access-token" AIRQO_GRID_ID="your-grid-id" \
   node /opt/airqo/leaflet-forecast-server.js
   ```

   Keep production credentials in the private service environment. Never commit
   an actual token. Use a service manager to keep Node running.

4. Route `/airqo-config` and `/airqo-api/*` on the PHP website's domain to
   `http://127.0.0.1:8081`. For Nginx, add the locations in
   [`leaflet-forecast-nginx.conf.example`](./leaflet-forecast-nginx.conf.example)
   inside the existing site's `server` block, validate with `nginx -t`, and reload.
   Keep the site's existing PHP handler. Apache or IIS can supply equivalent
   reverse-proxy routes. Node only serves API/configuration routes, never PHP files.
5. Open `https://example.com/leaflet-with-forecast.php` (or the subdirectory where
   you installed it). The API routes above must still exist at the domain root.

The request flow is browser → same-domain proxy → AirQo. The browser receives
the grid ID and map data, but no configured API token. Requests are restricted to
GET and the three AirQo endpoints for your configured grid. The proxy endpoints
are publicly callable; use website authentication or rate limits if you need to
restrict who can retrieve the data.

PHP-only shared hosting cannot run this Node service. It needs a separate Node
backend with same-domain routing, or a PHP implementation of the proxy routes.
Do not publish this entire sample directory as static files.

## Verify

- `curl http://127.0.0.1:8081/healthz` should return `{"status":"ok"}`.
- Open the PHP page and check that `/airqo-config` and `/airqo-api/...` succeed
  in the browser's Network panel, with no token in requests or page source.
- Confirm that the server `.js` file cannot be downloaded from your website.
- A 404 on the configuration/API paths usually means proxy routing is missing;
  a 502 means the Node service cannot reach AirQo.

To embed the map in another PHP page:

```html
<iframe src="/leaflet-with-forecast.php" title="Air quality forecast map"
        style="width: 100%; height: 700px; border: 0;" loading="lazy"></iframe>
```
