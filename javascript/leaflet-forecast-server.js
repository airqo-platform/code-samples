"use strict";

const http = require("node:http");
const fs = require("node:fs/promises");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");

// Cloud/container platforms normally inject PORT and require binding to all interfaces.
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 8080);
const isProduction = process.env.NODE_ENV === "production";

// Option 1 (recommended): set AIRQO_API_TOKEN and AIRQO_GRID_ID environment variables.
// Option 2: replace the fallback values below and run this file directly.
const apiToken = process.env.AIRQO_API_TOKEN || "<<access-token>>";
const gridId = process.env.AIRQO_GRID_ID || "<<grid-id>>";
const proxyPrefix = "/airqo-api/";
const sampleFile = __dirname + "/leaflet-with-forecast.html";
const encodedGridId = encodeURIComponent(gridId || "");
const allowedApiPaths = new Set([
  `/api/v2/devices/measurements/grids/${encodedGridId}`,
  `/api/v2/predict/daily-forecasting/${encodedGridId}`,
  `/api/v2/spatial/heatmaps/${encodedGridId}`,
]);

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function isPlaceholder(value) {
  return !value || value.startsWith("<<") || value.startsWith("your-");
}

async function proxyAirQo(request, response, requestUrl) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Only GET requests are supported." });
    return;
  }

  const apiPath = "/" + requestUrl.pathname.slice(proxyPrefix.length);
  if (!allowedApiPaths.has(apiPath)) {
    sendJson(response, 404, { error: "AirQo API route not allowed." });
    return;
  }

  const upstreamUrl = new URL(apiPath, "https://api.airqo.net");
  requestUrl.searchParams.forEach((value, key) => {
    if (key !== "token") upstreamUrl.searchParams.append(key, value);
  });
  upstreamUrl.searchParams.set("token", apiToken);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(30000),
    });
    response.writeHead(upstreamResponse.status, {
      "Content-Type": upstreamResponse.headers.get("content-type") || "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    });

    if (upstreamResponse.body) {
      await pipeline(Readable.fromWeb(upstreamResponse.body), response);
    } else {
      response.end();
    }
  } catch (error) {
    console.error("AirQo request failed:", error);
    if (!response.headersSent) {
      sendJson(response, 502, { error: "Could not reach the AirQo API." });
    } else {
      response.destroy(error);
    }
  }
}

async function serveSample(request, response) {
  const body = await fs.readFile(sampleFile);
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  if (request.method === "HEAD") response.end();
  else response.end(body);
}

if (isProduction && (!process.env.AIRQO_API_TOKEN || !process.env.AIRQO_GRID_ID)) {
  console.error(
    "Production requires AIRQO_API_TOKEN and AIRQO_GRID_ID environment variables."
  );
  process.exitCode = 1;
} else if (isPlaceholder(apiToken) || isPlaceholder(gridId)) {
  console.error(
    "Configure AIRQO_API_TOKEN and AIRQO_GRID_ID, or replace the fallback values in leaflet-forecast-server.js."
  );
  process.exitCode = 1;
} else if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("PORT must be an integer between 1 and 65535.");
  process.exitCode = 1;
} else {
  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url, "http://localhost");

      if (requestUrl.pathname === "/healthz" && request.method === "GET") {
        sendJson(response, 200, { status: "ok" });
      } else if (requestUrl.pathname === "/airqo-config" && request.method === "GET") {
        sendJson(response, 200, { gridId });
      } else if (requestUrl.pathname.startsWith(proxyPrefix)) {
        await proxyAirQo(request, response, requestUrl);
      } else if (
        (request.method === "GET" || request.method === "HEAD") &&
        (requestUrl.pathname === "/" || requestUrl.pathname === "/leaflet-with-forecast.html")
      ) {
        await serveSample(request, response);
      } else {
        sendJson(response, 404, { error: "Not found." });
      }
    } catch (error) {
      console.error("Request failed:", error);
      if (!response.headersSent) sendJson(response, 500, { error: "Internal server error." });
      else response.end();
    }
  });

  server.listen(port, host, () => {
    console.log(`Leaflet forecast server listening on ${host}:${port}`);
  });
}
