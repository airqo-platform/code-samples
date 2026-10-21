# AGENTS.md — AirQo AI Frontend

Operating guide for coding agents. Read this and `.opencode/runtime/{plan,decisions,evidence}.md` before editing.

## Scope and working directory

This guide applies only to the `frontend/` Next.js project. It is intentionally not a guide for the sibling sample applications in the repository root. The file lives at `frontend/AGENTS.md`; run project commands from `frontend/`.

The durable runtime notes are shared at `../.opencode/runtime/{plan,decisions,evidence}.md`. Read them together with this guide before editing, but treat the checked-in source and `package.json` as the source of truth when they disagree with historical notes.

Before changing code, inspect `git status --short`, state the goal, known facts, scope, acceptance checks, and limits, then search for an existing implementation. Preserve unrelated user changes. Do not commit, push, or delete unrelated files unless explicitly asked.

## 1. Project Overview

AirQo AI frontend — a multi-route Next.js 16 App Router application for air quality monitoring across African cities.

- **Stack:** Next.js 16, React 18, TypeScript 5, Tailwind 3.4, Radix primitives (shadcn-style), `lucide-react`, Leaflet + react-leaflet, Mapbox raster tiles, `html2canvas`, `jspdf`, `recharts`, `axios`, `papaparse`.
- **Single light UI theme only** — no UI dark mode, theme toggle, or `prefers-color-scheme`. The map may still offer a dark basemap style; that is data/map presentation, not a second app theme.
- **Node 24.x** required (`engines` in `package.json`).
- **Commands (run in `frontend/`):**
  - `npm ci` — install the locked dependency tree from `package-lock.json`
  - `npm run dev` — local dev server
  - `npm run start` — serve a successful production build
  - `npm run build` — production build
  - `npm run lint` — eslint
  - `npx tsc --noEmit` — type-check (0 errors required)
  - `node --test` — run Node's discovered tests when the test runner is needed
- **No new dependencies without approval.**

### Local configuration

Copy `.env.example` to `.env.local` for local work. `API_TOKEN` is server-only and must never be read by client components, embedded in browser URLs, or committed. `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_AQI_API_URL`, and `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` are browser-visible by design; do not put secrets in any `NEXT_PUBLIC_*` variable. If the Mapbox token is absent, map tiles intentionally fall back to OpenStreetMap.

## 2. Routes and boundaries

App Router pages currently include:

- `/` home
- `/map` live map and `/map/interactive-mapping` marketing entry
- `/reports` reports and visualizations
- `/locate` and `/locate/optimal-site-location`
- `/categorize` and `/categorize/site-categorization`
- `/models`, `/analytics/data-analytics`, and `/billboard`
- `/comingsoon` and `/comingsoon/health-impact` placeholders

Route handlers are separate from page components: `/api/airqo/[...path]` is the allow-listed AirQo proxy, `/api/billboard` serves the lightweight billboard payload, and `/website-map-integration` serves the standalone embed document from `src/embed/map.html`.

## 3. Repository Map

```
frontend/
├── src/
│   ├── app/                    # Routes (App Router)
│   │   ├── page.tsx            # Home
│   │   ├── map/                # /map, /map/interactive-mapping
│   │   ├── reports/            # /reports
│   │   ├── categorize/         # /categorize, /categorize/site-categorization
│   │   ├── locate/             # /locate, /locate/optimal-site-location
│   │   ├── models/             # /models
│   │   ├── analytics/          # /analytics/data-analytics
│   │   ├── billboard/          # /billboard
│   │   ├── comingsoon/         # /comingsoon/* (placeholder)
│   │   ├── api/                 # Server proxies
│   │   │   ├── airqo/[...path]/route.ts   # Upstream AirQo API proxy
│   │   │   └── billboard/route.ts
│   │   └── website-map-integration/route.ts  # Standalone embed HTML
│   ├── components/
│   │   ├── ui/                  # Primitives (see section 5)
│   │   ├── layout/              # PageShell, Container, Section, SectionHeading, SiteFooter, AppLoader
│   │   ├── marketing/           # FeaturePage, FeatureCard, ProcessCard
│   │   ├── navigation/          # Navigation (Sheet drawer on mobile)
│   │   ├── mapping/             # LeafletMap, MapOverlayControls, MapLayerControl, NavigationControls
│   │   ├── controls/            # ControlPanel, FileUpload, PriorityLocationSearch, SearchBar
│   │   ├── reports/             # nexus-date-range-picker, pm25-calendar-plot, report-data-modal, report-loading-screen, error-popup
│   │   ├── charts/              # AirQualityChart
│   │   ├── billboard/           # Billboard 3D scene components
│   │   ├── analytics/           # GoogleAnalytics
│   │   └── app/                 # AppDataWarmup
│   ├── hooks/                   # use-toast, use-site-settings
│   ├── lib/                     # api.ts, api-service.ts, api-shared.ts, airqo-grid-cache.ts, browser-api-cache.ts, map-config.ts, report-retry.ts, types.ts, utils.ts, ...
│   ├── styles/globals.css       # Semantic HSL tokens, loader classes, map styles
│   ├── types/                   # css.d.ts, leaflet-geosearch.d.ts
│   └── embed/                   # Standalone map HTML (website-map-integration)
├── package.json
└── tailwind.config.ts
```

- **`.opencode/runtime/{plan,decisions,evidence}.md`** lives at the **repository root** (outside `frontend/`) — root-level durable agent state; read it before editing.
- **Kebab-case filenames** (e.g., `leaflet-map.tsx`, `page-shell.tsx`).
- **No loose components directly under `src/components/`** — every component lives in a feature folder.

## 4. Design System (Nexus Alignment) — Mandatory

- **Semantic HSL tokens** in `src/styles/globals.css` (`:root`): `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--success`, `--warning`, `--border`, `--ring`, `--text`, `--heading`.
- **`--radius: 0.5rem`**; radius scale: `sm` 4px, `md` 6px, `lg` 8px. Legacy `xl`/`2xl`/`3xl` are **capped at `--radius` (8px max)** in `tailwind.config.ts`.
- **Typography:** Inter (`next/font/google`); heading weight 500; compact 20–36px headings; `text-2xl` page titles.
- **Header:** 48px inset card with `px-2 pt-2 pb-2` viewport gutters; inner bar is `h-12 rounded-md border border-border bg-card shadow-sm` with 12px inner padding (`px-3`). Never a full-bleed border bar.
- **Loaders:**
  - `Spinner` (`components/ui/spinner.tsx`) = inline/indicator; inherits `currentColor`, only standalone contexts add `text-primary`.
  - `AppLoader` (`components/layout/app-loader.tsx`) = full route/page loader.
  - `LoadingOverlay` (`components/ui/loading-overlay.tsx`) = blocking overlay.
  - `.SecondaryMainloader` — conic ring (general + route loading).
  - `.route-loader` — delayed fade + spin.
- **Visual restraint:** neutral surfaces, one primary accent (`--primary: 221 100% 54%`), subtle borders/shadows. **No** decorative gradients, glow shadows, rainbow accents, oversized bold display headings, or pill-heavy AI-looking UI.
- **AQI colors/legends are data encoding** — may remain colorful.

## 5. Reuse Rules — No Duplication

**Before adding any UI component, search for an existing equivalent.** Do not copy/paste.

- **Primitives (`components/ui/`):** `button`, `card`, `badge`, `input`, `textarea`, `select`, `dialog`, `sheet`, `accordion`, `alert`, `field`, `search-field`, `radio-group`, `spinner`, `toast`, `toaster`, `loading-overlay`, `loading-state`, `checkbox`, `label`, `popover`, `switch`, `tabs`.
- **Layout:** `PageShell`, `Container`, `Section`, `SectionHeading`, `SiteFooter`, `AppLoader`.
- **Marketing:** `FeaturePage`, `FeatureCard`, `ProcessCard`.
- **Mapping:** `LeafletMap`, `MapOverlayControls`, `MapLayerControl`, `NavigationControls`, `map-config`.
- **Reports:** `nexus-date-range-picker`, `pm25-calendar-plot`, `report-data-modal`, `report-loading-screen`.
- **Charts:** `AirQualityChart`.
- If a variant is needed, **extend the shared component via props/slots**, or create a named component in the correct folder. Never implement a one-off button/card/loader/marker/search/table/dialog.

## 6. Architecture / API Patterns

- **Client components only when needed** — `"use client"` for state/effects/browser APIs (Leaflet, html2canvas, localStorage). Keep route shells server-friendly.
- **All AirQo API traffic** goes through `src/lib/api.ts` (fetch-based, site-locator/categorize) or `src/lib/api-service.ts` (axios-based, map/forecast/reports) → server proxy `src/app/api/airqo/[...path]/route.ts`. **Never expose `API_TOKEN` or call upstream directly from client code.**
- **Known server-side exceptions:** the browser calls `/api/billboard` for the billboard payload, while that route uses the server transport/cache layer. The standalone `src/embed/map.html` calls the allow-listed `/api/airqo/...` paths directly. Preserve these boundaries and validate any new proxy path in `src/app/api/airqo/[...path]/route.ts`.
- **Retries** (shared constants in `api-shared.ts`): retryable statuses = `{429, 500, 502, 503, 504}`. GET max 3 attempts; **no 401 retries**. POST site-location max 2. Report retry only network/408/429/5xx.
  - **Attempt caps:** report requests use `REPORT_REQUEST_RETRIES = 3` (4 total attempts, 5s delay); active fires use a 30s failure cooldown (`ACTIVE_FIRES_FAILURE_COOLDOWN_MS`); heatmap failures set a 5-minute cooldown before another attempt; satellite max attempts = 3; map readings/daily forecast max = 3.
- **Caching:**
  - Module-level in-flight request dedupe + TTL caches in `api-service.ts`.
  - Browser cache via `browser-api-cache.ts` (Cache Storage → localStorage fallback).
  - Server `unstable_cache` (`airqo-grid-cache.ts`) — 300s revalidate for cacheable grid routes.
  - CDN: `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600` for cacheable public GETs (grid, map, forecast, heatmap, active-fire, and billboard responses); exactly `Cache-Control: no-store, max-age=0` for proxied non-cacheable requests, especially user-specific POSTs.
- **Server-side transport:** `src/lib/airqo-server-transport.ts` is the server-side upstream fetch wrapper used by the proxy/cache layer (`app/api/airqo/[...path]/route.ts`, `airqo-grid-cache.ts`).
- **Report UI is localized** via the `t()` helper in `reports/page.tsx` + `lib/report-translations.ts` — do not hardcode new report strings without checking translations first.
- **No request loops:** stable `useEffect` deps, `isActive`/abort guards, dedupe in-flight requests, don't fetch on every render, don't prefetch outside `/map` and `/reports`.
- **App warmup** (`AppDataWarmup`) is scoped to `/map` and `/reports` — calls `prefetchMapAndReportData()`.
- **Pagination must be bounded** — return partial data instead of unbounded loops. Existing billboard measurements and forecast requests are capped at 10 pages; billboard grid discovery is capped at 20 pages. Add an explicit cap to any new pagination path, and keep useful partial results when a later page fails.

## 7. Map-Specific Rules

- **Engine:** Leaflet + react-leaflet + Mapbox raster tiles (OSM fallback when no token). Do not replace the engine casually.
- **Node identity:** use `site_id` as the stable map-reading identity. Do not join, deduplicate, or select map nodes by `_id`; upstream map payloads may omit it or provide a device/site identifier with different semantics.
- **Clustering** (`leaflet-map.tsx`): cluster click zooms in. `CLUSTER_ZOOM_THRESHOLD = 12`: at/above this zoom the grid threshold is disabled so readings render as solo nodes; below it `getClusterParams(zoom)` groups nearby readings.
- **AQI image assets** (same-origin, `public/images/`): `/images/GoodAir.png`, `/images/Moderate.png`, `/images/UnhealthySG.png`, `/images/Unhealthy.png`, `/images/VeryUnhealthy.png`, `/images/Hazardous.png` — keep them same-origin for CORS-safe capture.
- **Hover popups** must use container-level `highPopupPane` (z-index 1300, created as sibling of `.leaflet-map-pane`) so filters/controls don't cover them. Fire popups also use `highPopupPane` (they spread `customPopupOptions` in `bindPopup`).
- **Controls layout:**
  - Top-left: pollutant/provider pills.
  - Top-right: Layers / Copy / Refresh / Capture (Copy hidden on mobile).
  - Bottom-right: geolocate + zoom.
  - Bottom-left: legend (desktop open, mobile hidden).
  - **No Home/reset control.**
- **Search** (`leaflet-geosearch` + Mapbox provider) sits below top-left pills (`top: 60px`, `left: 12px` via `.map-page-geosearch`), never under top-right controls.
- **Screenshot** (`html2canvas`) captures only the Leaflet map canvas (tiles + markers), not UI chrome. Uses CORS-safe tile loading and validates the blob.
- **Side panel** must stay open on node click; stop map click propagation to avoid accidental close.

## 8. Accessibility

- Exactly one visible/informative `h1` per route (visually hidden `h1` on `/map`).
- One `main#main-content` with `tabIndex={-1}` per page shell/tool page.
- Skip link (`href="#main-content"`) in root layout — works.
- `aria-label` on all icon buttons; no keyboard traps; `:focus-visible` ring styles (scoped to not override input/select native rings).
- Mobile drawer/side panel closes via Escape / overlay click / close button.

## 9. Quality Gates

| Gate | Requirement |
|------|-------------|
| `npx tsc --noEmit` | 0 errors |
| `npm run lint` | 0 errors (warnings reported, not hidden) |
| `npm run build` | success; smoke key routes; unknown route 404 |
| `node --test` | pass the repository's discovered `*.test.cjs` tests when behavior or server utilities change |
| Browser checks | 390 / 768 / 1024 / 1440 — no horizontal overflow, no console errors, header/map gutters correct, controls not overlapping, screenshot/copy flow works |
| Honesty | Report passes, failures, and unavailable environments honestly — do not claim unverified fixes |

## 10. Agent Workflow & Cleanup

1. Read `AGENTS.md` + `../.opencode/runtime/{plan,decisions,evidence}.md` first.
2. **Inspect before editing** — state GOAL / KNOWN FACTS / SCOPE / ACCEPTANCE / LIMITS.
3. Prefer the **smallest coherent change** that preserves existing behavior.
4. **Do not duplicate components** or implement one-off variants of shared UI.
5. **Do not commit, push, or delete unrelated files** unless explicitly asked.
6. Clean generated QA screenshots/logs, `.next` build artifacts, and temp files before handoff.
7. Update `../.opencode/runtime/{plan,evidence,decisions}.md` after meaningful milestones; record what was verified and any remaining uncertainty.

## 11. Known Commands / Constraints

- **Node 24.x**; run all commands in `frontend/`.
- **No new runtime dependencies** without approval. Reproduce patterns with existing Tailwind / CSS / lucide.
- Keep sibling sample apps and `artwork/`, `scripts/`, `public/` assets intact.
- Root skip link, `AppDataWarmup`, `Toaster`, and `GoogleAnalytics` are mounted in `src/app/layout.tsx`.

## 12. Change-specific checks

- **UI or route work:** reuse the existing primitive/layout component, preserve the light Nexus tokens, check the route's single `h1` and `main#main-content`, and test at the four required viewport widths.
- **API or data work:** update the allow-list/types/transforms together, keep credentials server-only, preserve retry and cache semantics, and test malformed, empty, unauthorized, and upstream-failure responses. If a cache TTL changes, update the relevant tests and README documentation in the same change.
- **Map work:** keep Leaflet and the existing Mapbox/OSM fallback, preserve `site_id` identity, verify cluster behavior and popup layering, and ensure screenshot capture excludes control chrome while live controls remain usable.
- **Embed work:** keep `src/embed/map.html` same-origin asset/API behavior, preserve `grid_id` validation and response size limits, and verify `/website-map-integration` with and without a valid grid ID.
