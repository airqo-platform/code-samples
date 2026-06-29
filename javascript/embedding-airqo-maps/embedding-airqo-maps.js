(function (window, document) {
  "use strict";

  var styleInjected = false;
  var instanceCounter = 0;
  var apiBaseUrl = "https://api.airqo.net/api/v2";
  var gridMeasurementsPageLimit = 1000;

  var AQI_INDEX_COLORS = {
    good: "#00e400",
    moderate: "#ffff00",
    u4sg: "#ff7e00",
    unhealthy: "#ff0000",
    very_unhealthy: "#8f3f97",
    hazardous: "#7e0023",
  };

  function init(config) {
    if (!window.L) {
      throw new Error("EmbeddingAirQoMaps requires Leaflet to be loaded before embedding-airqo-maps.js.");
    }

    var options = config || {};
    var root = resolveElement(options.elementId || options.element || "embedding-airqo-maps");
    var accessToken = String(options.accessToken || options.token || "").trim();
    var gridId = String(options.gridId || options.gridID || options.grid || "").trim();

    if (!root) {
      throw new Error("EmbeddingAirQoMaps could not find the target element.");
    }

    if (!accessToken || !gridId) {
      root.innerHTML = '<div class="airqo-widget-error">Enter both accessToken and gridId.</div>';
      injectStyles();
      return null;
    }

    injectStyles();

    if (options.height) {
      root.style.height = typeof options.height === "number" ? options.height + "px" : String(options.height);
    }

    instanceCounter += 1;

    var state = {
      id: "airqo-widget-" + instanceCounter,
      root: root,
      accessToken: accessToken,
      gridId: gridId,
      apiResponse: null,
      forecastBySiteId: {},
      markersBySiteId: {},
      siteMarkers: [],
      heatmapLayer: null,
      heatmapBounds: null,
      heatmapEnabled: false,
      heatmapToggleInput: null,
      heatmapControlElement: null,
      heatmapRequest: null,
      legendAdded: false,
    };

    renderShell(state);

    state.map = window.L.map(state.mapEl, { attributionControl: false }).setView([0, 20], 3);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "",
    }).addTo(state.map);

    window.L.control.attribution({
      prefix: '<a href="https://analytics.airqo.net/" target="_blank" rel="noopener">Powered by AirQo</a>',
      position: "bottomright",
    }).addTo(state.map);

    addHeatmapControl(state);
    bindSearch(state);
    fetchHeatmap(state, false);
    fetchLiveMeasurements(state);
    fetchDailyForecast(state);

    return {
      refresh: function () {
        clearMarkers(state);
        state.forecastBySiteId = {};
        fetchHeatmap(state, false);
        fetchLiveMeasurements(state);
        fetchDailyForecast(state);
      },
      destroy: function () {
        if (state.map) state.map.remove();
        state.root.innerHTML = "";
      },
    };
  }

  function resolveElement(element) {
    if (typeof element === "string") return document.getElementById(element);
    return element && element.nodeType === 1 ? element : null;
  }

  function renderShell(state) {
    state.root.classList.add("airqo-widget");
    state.root.innerHTML =
      '<div class="airqo-widget-map"></div>' +
      '<div class="airqo-widget-search">' +
        '<input class="airqo-widget-search-input" type="text" placeholder="Search for a place..." />' +
        '<button class="airqo-widget-search-button" type="button">Search</button>' +
      "</div>" +
      '<div class="airqo-widget-search-results"></div>' +
      '<div class="airqo-widget-forecast-panel">' +
        '<div class="airqo-widget-forecast-header">' +
          "<div>" +
            '<h3 class="airqo-widget-forecast-site-name">FORECAST</h3>' +
            '<p class="airqo-widget-forecast-subtitle">Click a site marker to view its 7-day PM<sub>2.5</sub> forecast.</p>' +
          "</div>" +
          '<button class="airqo-widget-forecast-close" type="button" aria-label="Close forecast">x</button>' +
        "</div>" +
        '<div class="airqo-widget-forecast-content">' +
          '<h4 class="airqo-widget-forecast-section-title">7-DAY FORECAST</h4>' +
          '<div class="airqo-widget-forecast-days"></div>' +
          '<div class="airqo-widget-forecast-detail"></div>' +
        "</div>" +
      "</div>";

    state.mapEl = state.root.querySelector(".airqo-widget-map");
    state.searchInput = state.root.querySelector(".airqo-widget-search-input");
    state.searchButton = state.root.querySelector(".airqo-widget-search-button");
    state.searchResults = state.root.querySelector(".airqo-widget-search-results");
    state.forecastPanel = state.root.querySelector(".airqo-widget-forecast-panel");
    state.forecastSiteName = state.root.querySelector(".airqo-widget-forecast-site-name");
    state.forecastSubtitle = state.root.querySelector(".airqo-widget-forecast-subtitle");
    state.forecastDays = state.root.querySelector(".airqo-widget-forecast-days");
    state.forecastDetail = state.root.querySelector(".airqo-widget-forecast-detail");

    state.root.querySelector(".airqo-widget-forecast-close").addEventListener("click", function () {
      state.forecastPanel.style.display = "none";
    });
  }

  function getUrl(state, path) {
    return apiBaseUrl + path.replace("{GRID_ID}", encodeURIComponent(state.gridId)) +
      "?token=" + encodeURIComponent(state.accessToken);
  }

  function addHeatmapControl(state) {
    var HeatmapControl = window.L.Control.extend({
      options: { position: "topleft" },
      onAdd: function () {
        var container = window.L.DomUtil.create("label", "airqo-widget-heatmap-control is-hidden");
        container.innerHTML = '<input type="checkbox" aria-label="Toggle AQI heatmap" />' +
          '<span class="airqo-widget-heatmap-control-label">Heatmap</span>';
        state.heatmapControlElement = container;
        state.heatmapToggleInput = container.querySelector("input");

        window.L.DomEvent.disableClickPropagation(container);
        window.L.DomEvent.disableScrollPropagation(container);
        window.L.DomEvent.on(state.heatmapToggleInput, "change", function () {
          setHeatmapEnabled(state, state.heatmapToggleInput.checked);
        });

        return container;
      },
    });

    state.map.addControl(new HeatmapControl());
  }

  function setHeatmapEnabled(state, enabled) {
    state.heatmapEnabled = enabled;

    if (!enabled) {
      if (state.heatmapLayer && state.map.hasLayer(state.heatmapLayer)) {
        state.map.removeLayer(state.heatmapLayer);
      }
      setSiteMarkersVisible(state, true);
      setHeatmapControlState(state, "", "Heatmap");
      return;
    }

    if (state.heatmapLayer) {
      state.heatmapLayer.addTo(state.map);
      setSiteMarkersVisible(state, true);
      if (state.heatmapBounds) state.map.fitBounds(state.heatmapBounds, { padding: [20, 20] });
      setHeatmapControlState(state, "active", "Heatmap on");
      return;
    }

    fetchHeatmap(state, true);
  }

  function fetchHeatmap(state, activateAfterLoad) {
    if (state.heatmapRequest) return;

    if (activateAfterLoad) setHeatmapControlState(state, "loading", "Loading...");
    if (state.heatmapToggleInput) state.heatmapToggleInput.disabled = true;

    state.heatmapRequest = fetch(getUrl(state, "/spatial/heatmaps/{GRID_ID}"))
      .then(assertOk)
      .then(function (response) { return response.json(); })
      .then(function (response) {
        var data = response.data || response;
        var bounds = data.bounds;
        var image = data.image;

        if (!isValidHeatmapBounds(bounds) || typeof image !== "string" || !image.startsWith("data:image/")) {
          throw new Error("The heatmap API returned invalid bounds or image data.");
        }

        state.heatmapBounds = window.L.latLngBounds(bounds);
        state.heatmapLayer = window.L.imageOverlay(image, state.heatmapBounds, {
          opacity: 0.78,
          interactive: false,
          zIndex: 350,
        });
        state.heatmapControlElement.classList.remove("is-hidden");

        if (activateAfterLoad && state.heatmapEnabled) {
          state.heatmapLayer.addTo(state.map);
          setSiteMarkersVisible(state, true);
          state.map.fitBounds(state.heatmapBounds, { padding: [20, 20] });
          setHeatmapControlState(state, "active", "Heatmap on");
        } else {
          setHeatmapControlState(state, "", "Heatmap");
        }
      })
      .catch(function (error) {
        console.error("Error fetching AQI heatmap:", error);
        state.heatmapEnabled = false;
        if (state.heatmapToggleInput) state.heatmapToggleInput.checked = false;
        setSiteMarkersVisible(state, true);
        if (state.heatmapControlElement) state.heatmapControlElement.classList.add("is-hidden");
      })
      .finally(function () {
        state.heatmapRequest = null;
        if (state.heatmapToggleInput) state.heatmapToggleInput.disabled = false;
      });
  }

  function setHeatmapControlState(state, status, label) {
    if (!state.heatmapControlElement) return;
    state.heatmapControlElement.classList.remove("is-loading", "is-active", "is-error");
    if (status) state.heatmapControlElement.classList.add("is-" + status);
    state.heatmapControlElement.querySelector(".airqo-widget-heatmap-control-label").textContent = label;
  }

  function setSiteMarkersVisible(state, visible) {
    state.siteMarkers.forEach(function (marker) {
      if (visible && !state.map.hasLayer(marker)) marker.addTo(state.map);
      if (!visible && state.map.hasLayer(marker)) state.map.removeLayer(marker);
    });
  }

  function fetchLiveMeasurements(state) {
    fetch(getGridMeasurementsUrl(state, 1))
      .then(assertOk)
      .then(function (response) { return response.json(); })
      .then(function (response) {
        return fetchRemainingGridMeasurementPages(state, response).then(function (pages) {
          var measurements = mergeGridMeasurementPages(pages);
          state.apiResponse = buildMergedGridMeasurementResponse(response, measurements);
          renderLiveMeasurements(state, measurements);
        });
      })
      .catch(function (error) {
        console.error("Error fetching live measurements:", error);
        state.root.insertAdjacentHTML("beforeend", '<div class="airqo-widget-error">Unable to load live measurements.</div>');
      });
  }

  function getGridMeasurementsUrl(state, page) {
    return getUrl(state, "/devices/measurements/grids/{GRID_ID}") +
      "&page=" + encodeURIComponent(page) +
      "&limit=" + encodeURIComponent(gridMeasurementsPageLimit);
  }

  function fetchRemainingGridMeasurementPages(state, firstResponse) {
    var totalPages = getTotalGridMeasurementPages(firstResponse);
    var pageRequests = [];

    for (var page = 2; page <= totalPages; page += 1) {
      pageRequests.push(fetch(getGridMeasurementsUrl(state, page)).then(assertOk).then(function (response) {
        return response.json();
      }));
    }

    if (pageRequests.length === 0) return Promise.resolve([firstResponse]);

    return Promise.allSettled(pageRequests).then(function (results) {
      return [firstResponse].concat(results
        .filter(function (result) { return result.status === "fulfilled"; })
        .map(function (result) { return result.value; }));
    });
  }

  function getTotalGridMeasurementPages(response) {
    var meta = getGridMeasurementMeta(response);
    var explicitPages = Number(meta.pages || meta.total_pages || meta.totalPages || meta.page_count || meta.pageCount);

    if (Number.isFinite(explicitPages) && explicitPages > 0) return Math.ceil(explicitPages);

    var total = Number(meta.total || meta.total_results || meta.totalResults);
    var limit = Number(meta.limit || meta.page_size || meta.pageSize || gridMeasurementsPageLimit);

    if (Number.isFinite(total) && Number.isFinite(limit) && limit > 0) {
      return Math.max(1, Math.ceil(total / limit));
    }

    return 1;
  }

  function getGridMeasurementMeta(response) {
    var data = response.data || {};
    return response.meta || response.metadata || response.pagination ||
      data.meta || data.metadata || data.pagination || {};
  }

  function getGridMeasurements(response) {
    var data = response.data || {};
    if (Array.isArray(response.measurements)) return response.measurements;
    if (Array.isArray(data.measurements)) return data.measurements;
    if (Array.isArray(data)) return data;
    return [];
  }

  function mergeGridMeasurementPages(pages) {
    return pages.reduce(function (measurements, pageResponse) {
      return measurements.concat(getGridMeasurements(pageResponse));
    }, []);
  }

  function buildMergedGridMeasurementResponse(response, measurements) {
    var mergedResponse = JSON.parse(JSON.stringify(response || {}));
    if (Array.isArray(mergedResponse.data)) {
      mergedResponse.data = measurements;
    } else if (mergedResponse.data && Array.isArray(mergedResponse.data.measurements)) {
      mergedResponse.data.measurements = measurements;
    } else {
      mergedResponse.measurements = measurements;
    }
    return mergedResponse;
  }

  function renderLiveMeasurements(state, measurements) {
    var siteCoordinates = [];

    measurements.forEach(function (measurement) {
      var siteDetails = measurement.siteDetails || measurement.site_details || {};
      var lat = Number(siteDetails.approximate_latitude || siteDetails.latitude);
      var lon = Number(siteDetails.approximate_longitude || siteDetails.longitude);
      var pm25Value = Math.round(Number((measurement.pm2_5 || {}).value));
      var siteName = siteDetails.description || siteDetails.site_name || siteDetails.name || "Unknown site";
      var siteId = getSiteId(measurement);
      var aqiCategory = measurement.aqi_category || getAqiCategoryFromPm25(pm25Value);
      var aqiColor = normalizeAqiColor(measurement.aqi_color_name || measurement.aqi_color || aqiCategory);

      if (!isValidCoordinate(lat, lon)) return;

      createMarker(state, lat, lon, aqiColor, aqiCategory, pm25Value, siteName, siteId);
      siteCoordinates.push([lat, lon]);
    });

    if (!state.heatmapEnabled) setInitialSiteView(state, siteCoordinates);

    if (!state.legendAdded) {
      addLegend(state);
      state.legendAdded = true;
    }
  }

  function fetchDailyForecast(state) {
    fetch(getUrl(state, "/predict/daily-forecasting/{GRID_ID}"))
      .then(assertOk)
      .then(function (response) { return response.json(); })
      .then(function (response) {
        var data = response.data || response;
        var siteForecasts = data.forecasts || [];

        siteForecasts.forEach(function (siteForecast) {
          var siteDetails = siteForecast.site_details || siteForecast.siteDetails || {};
          var siteId = siteDetails.site_id || siteDetails._id || siteForecast.site_id;
          if (siteId) state.forecastBySiteId[siteId] = siteForecast;
        });
      })
      .catch(function (error) {
        console.error("Error fetching daily forecast:", error);
      });
  }

  function createMarker(state, lat, lon, aqiColor, aqiCategory, pm25Value, siteName, siteId) {
    var markerSummaryHtml =
      '<div class="airqo-widget-marker-tooltip-content">' +
      '<span class="airqo-widget-marker-tooltip-site">' + escapeHtml(siteName) + "</span>" +
      '<div class="airqo-widget-marker-tooltip-row"><span>PM<sub>2.5</sub></span><strong>' +
      (isNaN(pm25Value) ? "N/A" : pm25Value + " ug/m3") + "</strong></div>" +
      '<div class="airqo-widget-marker-tooltip-row"><span>AQI</span><span class="airqo-widget-marker-tooltip-aqi">' +
      '<span class="airqo-widget-marker-tooltip-dot" style="background:' + aqiColor + ';"></span>' +
      escapeHtml(aqiCategory) + "</span></div></div>";

    var marker = window.L.marker([lat, lon], {
      icon: window.L.divIcon({
        className: "airqo-widget-custom-marker",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -26],
        html: '<span class="airqo-widget-marker-icon" style="background:' + aqiColor +
          ';" role="img" aria-label="' + escapeHtml(aqiCategory) + '">' +
          getAqiEmoji(aqiCategory) + "</span>",
      }),
    })
      .addTo(state.map)
      .bindPopup(markerSummaryHtml, {
        className: "airqo-widget-marker-popup",
        offset: [0, -2],
      })
      .bindTooltip(markerSummaryHtml, {
        direction: "top",
        offset: [0, -24],
        opacity: 1,
        className: "airqo-widget-marker-tooltip",
      });

    marker.on("click", function () {
      showForecast(state, siteId, siteName, pm25Value, aqiCategory, aqiColor);
    });

    state.siteMarkers.push(marker);
    if (siteId) state.markersBySiteId[siteId] = marker;
  }

  function showForecast(state, siteId, siteName, livePm25, liveCategory, liveColor) {
    var siteForecast = state.forecastBySiteId[siteId];
    var siteMarker = state.markersBySiteId[siteId];

    if (siteMarker) state.map.setView(siteMarker.getLatLng(), 14);

    var category = liveCategory || "AQI";
    var categoryColor = normalizeAqiColor(liveColor || category);

    state.forecastPanel.style.display = "block";
    state.forecastSiteName.textContent = siteName || "FORECAST";
    state.forecastSubtitle.innerHTML =
      "Current PM<sub>2.5</sub>: " +
      (isNaN(livePm25) ? "N/A" : livePm25 + " ug/m3") +
      ' <span class="airqo-widget-live-aqi" style="color:' + categoryColor + ';">' +
      '<span class="airqo-widget-live-aqi-dot" style="background:' + categoryColor + ';"></span>' +
      '<span class="airqo-widget-live-aqi-category" style="background:' + categoryColor + '; color:' +
      readableTextColor(categoryColor) + ';">' + escapeHtml(category) + "</span></span>";

    state.forecastDays.innerHTML = "";
    state.forecastDetail.innerHTML = "";

    if (!siteForecast || !siteForecast.forecasts || siteForecast.forecasts.length === 0) {
      state.forecastDetail.innerHTML =
        '<div class="airqo-widget-forecast-guidance">No daily forecast found for this site. Confirm that the live site_id matches the forecast site_id.</div>';
      return;
    }

    siteForecast.forecasts.forEach(function (day, index) {
      var f = day.forecast || {};
      var aqi = day.aqi || {};
      var mean = Math.round(Number(f.pm2_5_mean));
      var dateObj = new Date(day.date + "T00:00:00");
      var dow = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      var dateNum = dateObj.getDate();
      var card = document.createElement("button");

      card.type = "button";
      card.className = "airqo-widget-forecast-day-card" + (index === 0 ? " active" : "");
      card.innerHTML =
        '<span class="airqo-widget-forecast-dow">' + dow + "</span>" +
        '<span class="airqo-widget-forecast-date-num">' + dateNum + "</span>" +
        '<span class="airqo-widget-forecast-icon-wrap" style="background:' + getAqiCategoryColor(aqi.aqi_category) +
        '; border-color:' + getAqiCategoryBorderColor(aqi.aqi_category) + ';">' +
        airqoPmIcon(aqi.aqi_category) + "</span>" +
        '<span class="airqo-widget-forecast-pm25">' + (isNaN(mean) ? "N/A" : mean) + "</span>";

      card.addEventListener("click", function () {
        state.forecastDays.querySelectorAll(".airqo-widget-forecast-day-card").forEach(function (item) {
          item.classList.remove("active");
        });
        card.classList.add("active");
        showForecastDetail(state, day);
      });

      state.forecastDays.appendChild(card);
    });

    showForecastDetail(state, siteForecast.forecasts[0]);
  }

  function showForecastDetail(state, day) {
    var f = day.forecast || {};
    var aqi = day.aqi || {};
    var met = day.met || {};
    var aqiColor = aqi.aqi_color || normalizeAqiColor(aqi.aqi_color_name || aqi.aqi_category || "moderate");
    var category = aqi.aqi_category || "AQI";

    state.forecastDetail.innerHTML =
      '<div><strong>' + formatDate(day.date) + '</strong><span class="airqo-widget-aqi-pill" style="background:' +
      aqiColor + "; color:" + readableTextColor(aqiColor) + ';">' + escapeHtml(category) + "</span></div>" +
      '<div class="airqo-widget-forecast-detail-grid">' +
      forecastMetric("Average PM<sub>2.5</sub>", valueOrNA(f.pm2_5_mean) + " ug/m3") +
      forecastMetric("Expected Range", valueOrNA(f.pm2_5_low) + " - " + valueOrNA(f.pm2_5_high) + " ug/m3") +
      '<div class="airqo-widget-forecast-guidance">' +
      '<span class="airqo-widget-forecast-guidance-title">Health guidance</span>' +
      '<p class="airqo-widget-forecast-guidance-text">' +
      escapeHtml(aqi.label || "No health guidance is available for this forecast.") +
      "</p></div>" +
      forecastConfidence(f.forecast_confidence, f.pm2_5_low, f.pm2_5_high) +
      "</div>" +
      '<div class="airqo-widget-met-title">Meteorological conditions</div>' +
      '<div class="airqo-widget-met-row">' +
      weatherMetric("&#127777;&#65039;", valueOrNA(met.air_temperature) + " C", "Temperature") +
      weatherMetric("&#9730;", valueOrNA(met.precipitation_amount) + " mm", "Rain") +
      weatherMetric("&#128167;", valueOrNA(met.relative_humidity) + "%", "Humidity") +
      weatherMetric("&#9729;", valueOrNA(met.cloud_area_fraction) + "%", "Cloud") +
      weatherMetric("&#8779;", valueOrNA(met.wind_speed) + " m/s<br>" + escapeHtml(met.wind_direction_compass || ""), "Wind") +
      "</div>" +
      (aqi.trend_message
        ? '<div class="airqo-widget-forecast-guidance airqo-widget-forecast-guidance-trend">' +
          '<span class="airqo-widget-forecast-guidance-title">Trend</span>' +
          '<p class="airqo-widget-forecast-guidance-text">' + escapeHtml(aqi.trend_message) + "</p></div>"
        : "");
  }

  function forecastMetric(label, value) {
    return '<div class="airqo-widget-forecast-metric"><span>' + label + "</span><strong>" + value + "</strong></div>";
  }

  function forecastConfidence(confidence, low, high) {
    var value = Number(confidence);
    var hasConfidence = Number.isFinite(value);
    var percentage = hasConfidence ? Math.max(0, Math.min(100, value)) : 0;
    var color = percentage >= 75 ? "#16a34a" : percentage >= 50 ? "#f59e0b" : "#dc2626";
    var range = valueOrNA(low) + "-" + valueOrNA(high) + " ug/m3";

    return '<div class="airqo-widget-forecast-confidence">' +
      '<div class="airqo-widget-confidence-header"><span>Forecast confidence</span><strong>' +
      (hasConfidence ? value.toFixed(1) + "%" : "N/A") + "</strong></div>" +
      '<div class="airqo-widget-confidence-track"><div class="airqo-widget-confidence-fill" style="width:' + percentage +
      "%; background:" + color + ';"></div></div>' +
      '<p class="airqo-widget-confidence-description">Probability PM<sub>2.5</sub> remains within the ' +
      range + " expected range.</p></div>";
  }

  function weatherMetric(icon, value, label) {
    return '<div class="airqo-widget-met-item" title="' + escapeHtml(label) + '"><span class="airqo-widget-met-icon">' + icon +
      '</span><strong class="airqo-widget-met-value">' + value + "</strong></div>";
  }

  function bindSearch(state) {
    state.searchInput.addEventListener("keyup", function (event) {
      if (event.key === "Enter") state.searchButton.click();
    });

    state.searchButton.addEventListener("click", function () {
      if (!state.apiResponse || !state.apiResponse.measurements) {
        displaySearchResults(state, []);
        return;
      }

      var searchQuery = state.searchInput.value.toLowerCase().trim();
      var matchingResults = state.apiResponse.measurements.filter(function (measurement) {
        var siteDetails = measurement.siteDetails || measurement.site_details || {};
        var siteName = siteDetails.description || siteDetails.site_name || siteDetails.name || "";
        return siteName.toLowerCase().indexOf(searchQuery) !== -1;
      });

      displaySearchResults(state, matchingResults);
    });
  }

  function displaySearchResults(state, results) {
    state.searchResults.innerHTML = "";

    if (results.length === 0) {
      state.searchResults.innerHTML = '<div class="airqo-widget-search-result">No results found.</div>';
    } else {
      results.forEach(function (result) {
        var siteDetails = result.siteDetails || result.site_details || {};
        var siteName = siteDetails.description || siteDetails.site_name || siteDetails.name || "Unknown site";
        var lat = siteDetails.approximate_latitude || siteDetails.latitude;
        var lon = siteDetails.approximate_longitude || siteDetails.longitude;
        var siteId = getSiteId(result);
        var resultElement = document.createElement("button");

        resultElement.type = "button";
        resultElement.className = "airqo-widget-search-result";
        resultElement.textContent = siteName;

        resultElement.addEventListener("click", function () {
          setHeatmapEnabled(state, false);
          zoomToLocation(state, lat, lon);

          if (state.markersBySiteId[siteId]) {
            state.markersBySiteId[siteId].openPopup();
            state.markersBySiteId[siteId].fire("click");
          }

          state.searchResults.style.display = "none";
        });

        state.searchResults.appendChild(resultElement);
      });
    }

    state.searchResults.style.display = "block";
  }

  function addLegend(state) {
    var legend = window.L.control({ position: "bottomleft" });

    legend.onAdd = function () {
      var div = window.L.DomUtil.create("div", "airqo-widget-legend");
      div.tabIndex = 0;
      div.setAttribute("aria-label", "Air quality index legend");
      div.innerHTML =
        '<div class="airqo-widget-legend-title">Air quality index' +
        '<span class="airqo-widget-legend-subtitle">AirQo PM<sub>2.5</sub> categories</span></div>' +
        "<ul>" +
        legendItem("Good") +
        legendItem("Moderate") +
        legendItem("Unhealthy for Sensitive Groups") +
        legendItem("Unhealthy") +
        legendItem("Very Unhealthy") +
        legendItem("Hazardous") +
        "</ul>";
      return div;
    };

    legend.addTo(state.map);
  }

  function legendItem(label) {
    var color = getAqiCategoryColor(label);
    var borderColor = getAqiCategoryBorderColor(label);

    return '<li title="' + escapeHtml(label) + '"><span class="airqo-widget-legend-icon-wrap" style="background:' + color +
      '; border-color:' + borderColor + ';"><span class="airqo-widget-legend-icon" role="img" aria-label="' +
      escapeHtml(label) + '">' + getAqiEmoji(label) + '</span></span><span class="airqo-widget-legend-label">' +
      escapeHtml(label) + "</span></li>";
  }

  function clearMarkers(state) {
    state.siteMarkers.forEach(function (marker) {
      state.map.removeLayer(marker);
    });
    state.siteMarkers = [];
    state.markersBySiteId = {};
  }

  function assertOk(response) {
    if (!response.ok) throw new Error("Request failed with status " + response.status);
    return response;
  }

  function isValidHeatmapBounds(bounds) {
    if (!Array.isArray(bounds) || bounds.length !== 2) return false;
    return bounds.every(function (coordinate) {
      return Array.isArray(coordinate) && coordinate.length === 2 &&
        isValidCoordinate(Number(coordinate[0]), Number(coordinate[1]));
    });
  }

  function isValidCoordinate(lat, lon) {
    return Number.isFinite(lat) && Number.isFinite(lon) &&
      lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  function setInitialSiteView(state, siteCoordinates) {
    if (siteCoordinates.length === 1) {
      state.map.setView(siteCoordinates[0], 14);
    } else if (siteCoordinates.length > 1) {
      state.map.fitBounds(siteCoordinates, { padding: [35, 35], maxZoom: 13 });
    } else {
      state.map.setView([0, 20], 3);
    }
  }

  function zoomToLocation(state, lat, lon) {
    var latitude = Number(lat);
    var longitude = Number(lon);
    if (isValidCoordinate(latitude, longitude)) state.map.setView([latitude, longitude], 14);
  }

  function getSiteId(measurement) {
    var siteDetails = measurement.siteDetails || measurement.site_details || {};
    return siteDetails.site_id || siteDetails._id || measurement.site_id || measurement.siteId || measurement._id;
  }

  function normalizeAqiColor(value) {
    if (!value) return AQI_INDEX_COLORS.moderate;
    var text = String(value).toLowerCase().replace(/\s+/g, "_");
    if (text.indexOf("#") === 0) return value;
    if (text.indexOf("good") !== -1 || text === "green") return AQI_INDEX_COLORS.good;
    if (text.indexOf("moderate") !== -1 || text === "yellow") return AQI_INDEX_COLORS.moderate;
    if (text.indexOf("sensitive") !== -1 || text.indexOf("u4sg") !== -1 || text === "orange") return AQI_INDEX_COLORS.u4sg;
    if (text.indexOf("very_unhealthy") !== -1 || text === "purple") return AQI_INDEX_COLORS.very_unhealthy;
    if (text.indexOf("hazardous") !== -1 || text === "maroon") return AQI_INDEX_COLORS.hazardous;
    if (text.indexOf("unhealthy") !== -1 || text === "red") return AQI_INDEX_COLORS.unhealthy;
    return value;
  }

  function getAqiCategoryFromPm25(pm25) {
    if (isNaN(pm25)) return "Unknown";
    if (pm25 <= 12) return "Good";
    if (pm25 <= 35.4) return "Moderate";
    if (pm25 <= 55.4) return "Unhealthy for Sensitive Groups";
    if (pm25 <= 150.4) return "Unhealthy";
    if (pm25 <= 250.4) return "Very Unhealthy";
    return "Hazardous";
  }

  function readableTextColor(hexColor) {
    var color = String(hexColor || "").replace("#", "");
    if (color.length !== 6) return "#111827";
    var r = parseInt(color.substring(0, 2), 16);
    var g = parseInt(color.substring(2, 4), 16);
    var b = parseInt(color.substring(4, 6), 16);
    var brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 145 ? "#111827" : "#ffffff";
  }

  function getAqiEmoji(aqiCategory) {
    var category = String(aqiCategory || "").toLowerCase();
    if (category === "good") return "&#x1F60A;";
    if (category === "moderate") return "&#x1F610;";
    if (category === "unhealthy for sensitive groups") return "&#x1F637;";
    if (category === "unhealthy") return "&#x1F915;";
    if (category === "very unhealthy") return "&#x1F922;";
    if (category === "hazardous") return "&#x2620;&#xFE0F;";
    return "&#x2753;";
  }

  function getAqiCategoryColor(aqiCategory) {
    var category = String(aqiCategory || "").toLowerCase();
    if (category === "good") return AQI_INDEX_COLORS.good;
    if (category === "moderate") return AQI_INDEX_COLORS.moderate;
    if (category === "unhealthy for sensitive groups") return AQI_INDEX_COLORS.u4sg;
    if (category === "unhealthy") return AQI_INDEX_COLORS.unhealthy;
    if (category === "very unhealthy") return AQI_INDEX_COLORS.very_unhealthy;
    if (category === "hazardous") return AQI_INDEX_COLORS.hazardous;
    return "#e5e7eb";
  }

  function getAqiCategoryBorderColor(aqiCategory) {
    var color = getAqiCategoryColor(aqiCategory);
    return color === AQI_INDEX_COLORS.moderate ? "#d4a900" : color;
  }

  function airqoPmIcon(aqiCategory) {
    return '<span class="airqo-widget-forecast-icon" role="img" aria-label="' +
      escapeHtml(aqiCategory || "Air quality") + '">' + getAqiEmoji(aqiCategory) + "</span>";
  }

  function valueOrNA(value) {
    var number = Number(value);
    return isNaN(number) ? "N/A" : number.toFixed(1);
  }

  function formatDate(dateString) {
    var dateObj = new Date(dateString + "T00:00:00");
    if (isNaN(dateObj.getTime())) return dateString || "Date";
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function injectStyles() {
    if (styleInjected) return;
    styleInjected = true;

    var style = document.createElement("style");
    style.textContent =
      ".airqo-widget{position:relative;width:100%;min-height:520px;height:100%;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;overflow:hidden}" +
      ".airqo-widget *{box-sizing:border-box}" +
      ".airqo-widget-map{width:100%;height:100%;min-height:520px}" +
      ".airqo-widget-search{position:absolute;top:10px;right:10px;z-index:1000;display:flex;gap:6px}" +
      ".airqo-widget-search-input{height:32px;min-width:230px;padding:5px 10px;border:1px solid #ccc;border-radius:3px}" +
      ".airqo-widget-search-button{padding:5px 12px;border:1px solid #ccc;border-radius:3px;background:#0f52ba;color:#fff;cursor:pointer;font-size:15px}" +
      ".airqo-widget-search-results{position:absolute;top:60px;right:10px;z-index:1000;display:none;width:260px;max-height:320px;overflow-y:auto;background:#fff;border:1px solid #d0d5dd;border-radius:8px;box-shadow:0 12px 30px rgba(15,23,42,.16)}" +
      ".airqo-widget-search-result{display:block;width:100%;padding:10px;border:0;border-bottom:1px solid #eef2f6;background:#fff;color:#101828;text-align:left;cursor:pointer;font-size:14px}" +
      ".airqo-widget-search-result:hover{background:#f8f8f8}" +
      ".airqo-widget-heatmap-control{display:flex;min-width:126px;padding:8px 10px;align-items:center;gap:8px;border:1px solid #dbe3ee;border-radius:10px;background:rgba(255,255,255,.96);box-shadow:0 6px 18px rgba(15,23,42,.16);color:#344054;cursor:pointer;font:700 12px/1.2 Arial,Helvetica,sans-serif}" +
      ".airqo-widget-heatmap-control.is-hidden{display:none}.airqo-widget-heatmap-control input{width:15px;height:15px;margin:0;accent-color:#2563eb;cursor:pointer}.airqo-widget-heatmap-control.is-loading{cursor:wait;opacity:.72}.airqo-widget-heatmap-control.is-active{border-color:#93c5fd;background:#eff6ff;color:#1d4ed8}" +
      ".airqo-widget-custom-marker{background:transparent;border:0}.airqo-widget-marker-icon{display:flex;width:44px;height:44px;align-items:center;justify-content:center;border:2px solid #fff;border-radius:50%;font-family:'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif;font-size:23px;filter:drop-shadow(0 5px 7px rgba(15,23,42,.28));transition:transform .16s ease,filter .16s ease}.airqo-widget-custom-marker:hover .airqo-widget-marker-icon{transform:scale(1.14);filter:drop-shadow(0 7px 10px rgba(15,23,42,.34))}" +
      ".airqo-widget-marker-tooltip,.airqo-widget-marker-popup .leaflet-popup-content-wrapper{padding:0;overflow:hidden;border:1px solid #e2e8f0;border-radius:10px;background:rgba(255,255,255,.98);box-shadow:0 8px 24px rgba(15,23,42,.2)}.airqo-widget-marker-popup .leaflet-popup-content{min-width:160px;margin:0}.airqo-widget-marker-tooltip-content{padding:9px 10px;color:#344054;font-size:11px;line-height:1.45}.airqo-widget-marker-tooltip-site{display:block;margin-bottom:5px;color:#101828;font-size:12px;font-weight:800}.airqo-widget-marker-tooltip-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.airqo-widget-marker-tooltip-aqi{display:inline-flex;align-items:center;gap:5px;font-weight:700}.airqo-widget-marker-tooltip-dot{width:8px;height:8px;flex:0 0 8px;border-radius:50%}" +
      ".airqo-widget-forecast-panel{position:absolute;top:78px;right:16px;z-index:999;display:none;width:390px;max-width:calc(100vw - 32px);max-height:calc(100% - 110px);overflow-y:auto;background:rgba(255,255,255,.97);border:1px solid #e4e7ec;border-radius:18px;box-shadow:0 18px 40px rgba(15,23,42,.18)}" +
      ".airqo-widget-forecast-header{display:flex;justify-content:space-between;gap:12px;padding:16px;border-bottom:1px solid #eef2f6}.airqo-widget-forecast-site-name{margin:0;color:#101828;font-size:17px}.airqo-widget-forecast-subtitle{margin:4px 0 0;color:#344054;font-size:15px;font-weight:700;line-height:1.5}.airqo-widget-forecast-close{width:30px;height:30px;border:0;border-radius:50%;background:#f2f4f7;color:#344054;cursor:pointer;font-size:18px}.airqo-widget-forecast-content{padding:14px 16px 16px}.airqo-widget-forecast-section-title{margin:0 0 10px;color:#344054;font-size:13px;font-weight:800;letter-spacing:.3px}.airqo-widget-forecast-days{display:flex;gap:7px;overflow-x:auto;padding:2px 0 8px}" +
      ".airqo-widget-forecast-day-card{display:flex;min-width:50px;height:88px;flex-direction:column;align-items:center;border:1.5px solid #f2c15f;border-radius:24px;background:#fffdf8;color:#111827;text-align:center;cursor:pointer;box-shadow:0 3px 8px rgba(16,24,40,.05)}.airqo-widget-forecast-day-card.active{background:#3478f6;color:#fff;border-color:#3478f6}.airqo-widget-forecast-dow{padding-top:7px;font-size:10px;font-weight:800}.airqo-widget-forecast-date-num{font-size:10px;font-weight:900;line-height:1}.airqo-widget-forecast-icon-wrap{display:flex;width:20px;height:20px;margin:5px auto 1px;align-items:center;justify-content:center;border:1px solid transparent;border-radius:50%;background:#f2f4f7}.airqo-widget-forecast-icon{font-family:'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif;font-size:13px;line-height:1}.airqo-widget-forecast-pm25{font-size:15px;font-weight:900;line-height:1.15}" +
      ".airqo-widget-forecast-detail{margin-top:8px;padding:12px;border:1px solid #e6eaf2;border-radius:14px;background:#fff;color:#344054;font-size:13px}.airqo-widget-aqi-pill{display:inline-block;margin-left:6px;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:800}.airqo-widget-forecast-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.airqo-widget-forecast-metric{min-width:0;padding:10px 11px;border:1px solid #e4e7ec;border-radius:11px;background:#f8fafc}.airqo-widget-forecast-metric span{display:block;margin-bottom:4px;color:#667085;font-size:11px}.airqo-widget-forecast-metric strong{display:block;color:#101828;font-size:13px;font-weight:800;line-height:1.3;white-space:nowrap}" +
      ".airqo-widget-live-aqi{display:inline-flex;align-items:center;gap:5px}.airqo-widget-live-aqi-dot{width:10px;height:10px;border-radius:50%}.airqo-widget-live-aqi-category{padding:3px 8px;border-radius:999px;font-size:11px;font-weight:800;text-transform:uppercase}.airqo-widget-forecast-guidance{margin-top:10px;padding:9px 10px 10px;border:1px solid #f4c36a;border-radius:7px;background:#fff8eb;color:#344054;font-size:11px;line-height:1.55}.airqo-widget-forecast-guidance-title{display:block;margin-bottom:3px;color:#64748b;font-size:9px;font-weight:800;letter-spacing:.35px;text-transform:uppercase}.airqo-widget-forecast-guidance-text{margin:0}.airqo-widget-forecast-detail-grid>.airqo-widget-forecast-guidance{grid-column:1/-1;margin-top:0}.airqo-widget-forecast-guidance-trend{margin-top:7px;background:#f8fafc;border-color:#d8dee8}" +
      ".airqo-widget-forecast-confidence{grid-column:1/-1;padding:10px;border:1px solid #dbe4f0;border-radius:11px;background:#f8fafc}.airqo-widget-confidence-header{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#344054;font-size:11px;font-weight:700}.airqo-widget-confidence-header strong{color:#101828;font-size:14px}.airqo-widget-confidence-track{height:7px;margin:7px 0 6px;overflow:hidden;border-radius:999px;background:#e4e7ec}.airqo-widget-confidence-fill{height:100%;border-radius:inherit}.airqo-widget-confidence-description{margin:0;color:#667085;font-size:10px;line-height:1.45}.airqo-widget-met-title{margin:12px 0 7px;color:#101828;font-size:11px;font-weight:800}.airqo-widget-met-row{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}.airqo-widget-met-item{display:flex;min-width:0;padding:7px 3px;flex-direction:column;align-items:center;justify-content:center;border:1px solid #e4e7ec;border-radius:8px;background:#f8fafc;text-align:center}.airqo-widget-met-icon{display:flex;width:20px;height:20px;margin:0 auto 5px;align-items:center;justify-content:center;border-radius:5px;background:#fff;color:#64748b;box-shadow:0 1px 3px rgba(15,23,42,.08);font-size:12px}.airqo-widget-met-value{display:block;overflow:hidden;color:#101828;font-size:9px;font-weight:800;line-height:1.2;text-overflow:ellipsis;white-space:normal}" +
      ".airqo-widget-legend{width:43px;min-width:0;padding:8px;overflow:hidden;background:rgba(255,255,255,.96);border:1px solid rgba(226,232,240,.95);border-radius:12px;box-shadow:0 10px 28px rgba(15,23,42,.18);transition:width .22s ease,padding .22s ease}.airqo-widget-legend:hover,.airqo-widget-legend:focus-within{width:214px;padding:12px}.airqo-widget-legend-title{display:none;margin-bottom:9px;color:#101828;font-size:15px;font-weight:800;white-space:nowrap}.airqo-widget-legend:hover .airqo-widget-legend-title,.airqo-widget-legend:focus-within .airqo-widget-legend-title{display:block}.airqo-widget-legend-subtitle{display:block;margin-top:2px;color:#667085;font-size:10px;font-weight:500}.airqo-widget-legend ul{display:grid;gap:5px;margin:0;padding:0;list-style:none}.airqo-widget-legend li{display:flex;align-items:center;gap:0;min-height:26px;color:#344054;font-size:12px;font-weight:600;line-height:1.2}.airqo-widget-legend-label{width:0;overflow:hidden;opacity:0;white-space:nowrap;transition:width .22s ease,margin-left .22s ease,opacity .14s ease}.airqo-widget-legend:hover .airqo-widget-legend-label,.airqo-widget-legend:focus-within .airqo-widget-legend-label{width:170px;margin-left:8px;opacity:1}.airqo-widget-legend-icon-wrap{display:flex;width:25px;height:25px;flex:0 0 25px;align-items:center;justify-content:center;border:1px solid transparent;border-radius:50%;background:#f2f4f7}.airqo-widget-legend-icon{font-family:'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif;font-size:16px;line-height:1}" +
      ".airqo-widget-error{position:absolute;left:12px;top:12px;z-index:1100;padding:10px 12px;border:1px solid #fecaca;border-radius:8px;background:#fff1f2;color:#be123c;font:700 13px Arial,Helvetica,sans-serif}" +
      "@media(max-width:700px){.airqo-widget-search{left:10px;right:10px}.airqo-widget-search-input{min-width:0;flex:1}.airqo-widget-search-results{right:10px;width:calc(100% - 20px)}.airqo-widget-forecast-panel{top:auto;right:8px;bottom:8px;left:8px;width:auto;max-width:none;max-height:min(72%,620px);border-radius:16px}.airqo-widget-forecast-header{padding:11px 12px}.airqo-widget-forecast-content{padding:10px 12px 13px}.airqo-widget-forecast-section-title{margin-bottom:7px;font-size:11px}.airqo-widget-forecast-days{gap:5px;padding-bottom:6px}.airqo-widget-forecast-day-card{min-width:46px;height:80px;border-radius:21px}.airqo-widget-forecast-dow{padding-top:6px;font-size:9px}.airqo-widget-forecast-date-num{font-size:14px}.airqo-widget-forecast-icon-wrap{width:18px;height:18px;margin-top:4px}.airqo-widget-forecast-pm25{font-size:13px}.airqo-widget-forecast-detail-grid{gap:6px}.airqo-widget-met-row{grid-template-columns:repeat(5,minmax(52px,1fr));overflow-x:auto;padding-bottom:3px}}";

    document.head.appendChild(style);
  }

  function autoInit() {
    document.querySelectorAll("[data-embedding-airqo-maps], [data-airqo-forecast-widget]").forEach(function (element) {
      if (element.dataset.embeddingAirqoMapsMounted === "true") return;

      element.dataset.embeddingAirqoMapsMounted = "true";
      init({
        element: element,
        accessToken: element.dataset.accessToken || element.dataset.token,
        gridId: element.dataset.gridId || element.dataset.grid,
        height: element.dataset.height,
      });
    });
  }

  var publicApi = {
    init: init,
    autoInit: autoInit,
  };

  window.EmbeddingAirQoMaps = publicApi;
  window.AirQoForecastWidget = publicApi;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }
})(window, document);


