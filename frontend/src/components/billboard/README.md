# Live billboard

Open `/billboard` to search grids or enter a cohort ID, then open or copy the generated display link. A home-page action links to the builder. Displays use named locations rather than averaging unrelated monitors. Locations rotate every 15 seconds by default. Users can pause or resume, including inside fullscreen. Selecting a location manually pauses rotation. Reduced-motion preferences stop illustration animations.

The server uses `API_TOKEN` and the same upstream forecast API as the existing site. Forecasts and their weather fields require AirQo Premium access. Missing forecast data does not prevent available readings from appearing. The display refreshes every 60 minutes and upstream responses are cached for an hour. Measurement timestamps remain visible without age warnings; previously loaded data remains visible with a warning if refresh fails.

Any valid cohort ID can be entered directly, with no local allowlist. AirQo still applies the server token's permissions. A cohort ID is an identifier, not a password: this display publishes the data the server account can retrieve for that cohort. No credentials appear in copied links or embeds.

The display supports fullscreen and iframe embedding. Dates and times use the viewer's browser timezone. Daily forecast weather stays tied to the selected location and day. The display shows the weekly forecast only, with no hourly forecast control.

The theme selector offers Navy, Light and Forest. The choice is remembered locally and included in copied links and embeds. Fullscreen targets only the Air Quality Live panel, including its weekly forecast and weather; surrounding page controls stay outside fullscreen. Exit with Escape or the panel's Exit fullscreen button.

The navy display uses the same six category face PNGs as the map (235,492 bytes combined), native weather emoji, and a small CSS halo animation with reduced-motion support. It adds no map SDK, video, animation library, external image service or font. The API sends the latest reading per site instead of seven days of history, and only the forecast fields used by the UI. Default JSON responses are capped at 1,000,000 bytes to reserve space for shared assets within the 2 MB target; oversized scopes return a message asking for a smaller scope. Shared framework assets and deployment analytics must also be included when measuring total browser transfer.

Current-condition guidance is category-based; daily advisory text uses the API when supplied. Health guidance should receive editorial review before public launch.

Run `node --test src/lib/billboard.test.cjs` for normalization, access-control, pagination and partial-failure checks.

Local production measurement with the Lagos grid (33 locations): 1,743 bytes HTML + 366,096 bytes shared static assets + 82,180 bytes data + 235,492 bytes for all six faces = 685,511 bytes transferred with gzip requested. This conservatively includes unused category faces; it excludes third-party analytics/extensions. Sizes vary with the scope and build.


The Illustration selector offers Category faces or Activity scenes. Activity scenes are inline animated SVGs, with a preferred good-air activity of running, football or yoga. Moderate air uses gentle walking; higher categories use indoor yoga, reading, rest or window-closing scenes. The selected visual and good-air preference travel in shared links. These illustrations are contextual cues, not personalised exercise advice.

Credential handling: server callers and persistent cache keys use clean URLs. `fetchAirQo` adds AirQo-required query credentials only inside Node HTTPS request options, bypassing Next fetch instrumentation. Raw upstream errors are discarded, reflected tokens are redacted from response bodies, and cross-origin upstreams/redirects are rejected. The token therefore never enters a logged `URLSearchParams` object. AirQo itself still receives its required query token over HTTPS. Rotate any token that has already appeared in terminal output or shared logs.
