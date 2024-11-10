import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { getSatelliteData } from "@/services/apiService";

// Set default icon for markers
const DefaultIcon = L.icon({
  iconUrl:
    typeof markerIconUrl === "string" ? markerIconUrl : markerIconUrl.src,
  shadowUrl:
    typeof markerShadowUrl === "string" ? markerShadowUrl : markerShadowUrl.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Update the interface to match the actual API response
interface SatelliteData {
  latitude: number;
  longitude: number;
  pm2_5_prediction: number;
  timestamp: string;
}

// Add this function to determine air quality level and emoji
const getAirQualityInfo = (pm25: number) => {
  if (pm25 <= 12) return { level: 'Good', emoji: '😊', color: 'bg-green-100 border-green-200' };
  if (pm25 <= 35.4) return { level: 'Moderate', emoji: '🙂', color: 'bg-yellow-100 border-yellow-200' };
  if (pm25 <= 55.4) return { level: 'Unhealthy for Sensitive Groups', emoji: '😐', color: 'bg-orange-100 border-orange-200' };
  if (pm25 <= 150.4) return { level: 'Unhealthy', emoji: '😷', color: 'bg-red-100 border-red-200' };
  if (pm25 <= 250.4) return { level: 'Very Unhealthy', emoji: '🤢', color: 'bg-purple-100 border-purple-200' };
  return { level: 'Hazardous', emoji: '⚠️', color: 'bg-red-200 border-red-300' };
};

// Component to add the search control to the map
const SearchControl: React.FC<{
  defaultCenter: [number, number];
  defaultZoom: number;
}> = ({ defaultCenter, defaultZoom }) => {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider,
      style: "bar",
      position: "topleft",
    });

    map.addControl(searchControl);

    // Apply custom TailwindCSS styles to the search bar
    const searchBar = document.querySelector(".leaflet-control-geosearch form");
    if (searchBar) {
      searchBar.classList.add(
        "bg-white",
        "text-black",
        "border",
        "border-gray-400",
        "rounded-md"
      );
    }

    const searchResults = document.querySelector(
      ".leaflet-control-geosearch .results"
    );
    if (searchResults) {
      searchResults.classList.add("bg-white", "text-black");
    }

    // Event listener to clear markers and reset the map when search is cleared
    map.on("geosearch/marker/clear", () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.setView(defaultCenter, defaultZoom);
    });

    // Event listener for when a location is found
    map.on("geosearch/showlocation", async (result: any) => {
      const { x, y, label } = result.location;
      
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add marker immediately with loading state
      const loadingPopupContent = `
        <div class="min-w-[200px] p-3 rounded-lg bg-white border">
          <div class="flex items-center justify-between mb-2">
            <div class="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>
            <button class="text-gray-500 hover:text-gray-700" onclick="this.parentElement.parentElement.remove()">
              ✕
            </button>
          </div>
          <div class="text-sm font-medium mb-2">${label}</div>
          <div class="animate-pulse space-y-2">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      `;

      const marker = L.marker([y, x], { icon: DefaultIcon })
        .bindPopup(loadingPopupContent, {
          className: 'custom-popup',
          closeButton: false,
          maxWidth: 300,
          minWidth: 200,
        })
        .addTo(map);
      
      marker.openPopup();
      markersRef.current.push(marker);

      try {
        const data = await getSatelliteData({
          latitude: y,
          longitude: x,
        }) as SatelliteData;

        const { level, emoji, color } = getAirQualityInfo(data.pm2_5_prediction);
        const timestamp = new Date(data.timestamp).toLocaleString();

        const popupContent = `
          <div class="min-w-[200px] p-3 rounded-lg ${color} border">
            <div class="flex items-center justify-between mb-2">
              <span class="text-2xl">${emoji}</span>
              <button class="text-gray-500 hover:text-gray-700" onclick="this.parentElement.parentElement.remove()">
                ✕
              </button>
            </div>
            <div class="text-sm font-medium mb-2">${label}</div>
            <div class="text-lg font-semibold mb-1">
              ${level}
            </div>
            <div class="text-sm text-gray-700">
              PM2.5: ${data.pm2_5_prediction.toFixed(1)} µg/m³
            </div>
            <div class="text-xs text-gray-500 mt-2">
              Updated ${timestamp}
            </div>
          </div>
        `;

        // Update the existing marker's popup content
        marker.setPopupContent(popupContent);
        marker.openPopup();

      } catch (error) {
        console.error('Error fetching air quality data:', error);
        const errorPopupContent = `
          <div class="min-w-[200px] p-3 rounded-lg bg-gray-100 border border-gray-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-2xl">❌</span>
              <button class="text-gray-500 hover:text-gray-700" onclick="this.parentElement.parentElement.remove()">
                ✕
              </button>
            </div>
            <div class="text-sm font-medium mb-2">${label}</div>
            <div class="text-sm text-gray-700">
              Error loading air quality data
            </div>
          </div>
        `;
        
        // Update the existing marker's popup content
        marker.setPopupContent(errorPopupContent);
        marker.openPopup();
      }
    });

    // Event listener for search input cancel or clear
    const searchInput = document.querySelector(
      ".leaflet-control-geosearch input"
    );
    if (searchInput) {
      searchInput.addEventListener("input", (event: any) => {
        if (!event.target.value) {
          map.setView(defaultCenter, defaultZoom);
          markersRef.current.forEach((marker) => marker.remove());
          markersRef.current = [];
        }
      });
    }

    return () => {
      map.removeControl(searchControl);
    };
  }, [map, defaultCenter, defaultZoom]);

  return null;
};

const LeafletMap: React.FC = () => {
  const defaultCenter: [number, number] = [1.5, 17.5];
  const defaultZoom = 4;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <SearchControl defaultCenter={defaultCenter} defaultZoom={defaultZoom} />
    </MapContainer>
  );
};

export default LeafletMap;
