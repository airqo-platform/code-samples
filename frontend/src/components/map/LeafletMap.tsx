import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef } from "react";
import ReactDOM from 'react-dom/client';
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import Image from "next/image";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { getSatelliteData } from "@/services/apiService";

// Import air quality images
import GoodAir from "@public/images/GoodAir.png";
import Moderate from "@public/images/Moderate.png";
import UnhealthySG from "@public/images/UnhealthySG.png";
import Unhealthy from "@public/images/Unhealthy.png";
import VeryUnhealthy from "@public/images/VeryUnhealthy.png";
import Hazardous from "@public/images/Hazardous.png";
import Invalid from "@public/images/Invalid.png";

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

// Update the air quality info function to include image sources
const getAirQualityInfo = (pm25: number) => {
  if (pm25 <= 12) return { level: 'Good', image: GoodAir, color: 'bg-white border-green-200' };
  if (pm25 <= 35.4) return { level: 'Moderate', image: Moderate, color: 'bg-white border-yellow-200' };
  if (pm25 <= 55.4) return { level: 'Unhealthy for Sensitive Groups', image: UnhealthySG, color: 'bg-white border-orange-200' };
  if (pm25 <= 150.4) return { level: 'Unhealthy', image: Unhealthy, color: 'bg-white border-red-200' };
  if (pm25 <= 250.4) return { level: 'Very Unhealthy', image: VeryUnhealthy, color: 'bg-white border-purple-200' };
  return { level: 'Hazardous', image: Hazardous, color: 'bg-white border-red-300' };
};

// Create a component for the popup content
const PopupContent: React.FC<{
  label: string;
  data: SatelliteData;
  onClose: () => void;
}> = ({ label, data, onClose }) => {
  const { level, image, color } = getAirQualityInfo(data.pm2_5_prediction);
  const timestamp = new Date(data.timestamp).toLocaleString();

  return (
    <div className={`min-w-[200px] p-3 rounded-lg ${color} border`}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8">
          <Image
            src={image}
            alt={level}
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </div>
        <button 
          className="text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className="text-sm font-medium mb-2">{label}</div>
      <div className="text-lg font-semibold mb-1">
        {level}
      </div>
      <div className="text-sm text-gray-700">
        PM2.5: {data.pm2_5_prediction.toFixed(1)} µg/m³
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Updated {timestamp}
      </div>
    </div>
  );
};

// Create a loading popup component
const LoadingPopupContent: React.FC<{
  label: string;
  onClose: () => void;
}> = ({ label, onClose }) => (
  <div className="min-w-[200px] p-3 rounded-lg bg-white border">
    <div className="flex items-center justify-between mb-2">
      <div className="w-8 h-8">
        <div className="animate-pulse bg-gray-200 h-full w-full rounded-full" />
      </div>
      <button 
        className="text-gray-500 hover:text-gray-700"
        onClick={onClose}
      >
        ✕
      </button>
    </div>
    <div className="text-sm font-medium mb-2">{label}</div>
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

// Create an error popup component
const ErrorPopupContent: React.FC<{
  label: string;
  onClose: () => void;
}> = ({ label, onClose }) => (
  <div className="min-w-[200px] p-3 rounded-lg bg-gray-100 border border-gray-200">
    <div className="flex items-center justify-between mb-2">
      <div className="w-8 h-8">
        <Image
          src={Invalid}
          alt="Error"
          width={32}
          height={32}
          className="w-full h-full object-contain"
        />
      </div>
      <button 
        className="text-gray-500 hover:text-gray-700"
        onClick={onClose}
      >
        ✕
      </button>
    </div>
    <div className="text-sm font-medium mb-2">{label}</div>
    <div className="text-sm text-gray-700">
      Error loading air quality data
    </div>
  </div>
);

// Add this CSS class to override default Leaflet popup styles
const customPopupOptions = {
  className: 'custom-popup',
  closeButton: false,
  maxWidth: 300,
  minWidth: 200,
  offset: [0, -20],
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
      
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const marker = L.marker([y, x], { icon: DefaultIcon }).addTo(map);
      markersRef.current.push(marker);

      // Create a container div for the popup
      const container = document.createElement('div');
      
      // Render loading state
      const root = ReactDOM.createRoot(container);
      root.render(
        <LoadingPopupContent 
          label={label} 
          onClose={() => marker.closePopup()} 
        />
      );

      marker.bindPopup(container, { ...customPopupOptions, offset: [0, 0] }).openPopup();

      try {
        const data = await getSatelliteData({
          latitude: y,
          longitude: x,
        }) as SatelliteData;

        // Update with actual data
        root.render(
          <PopupContent 
            label={label}
            data={data}
            onClose={() => marker.closePopup()}
          />
        );

      } catch (error) {
        console.error('Error fetching air quality data:', error);
        // Show error state
        root.render(
          <ErrorPopupContent 
            label={label}
            onClose={() => marker.closePopup()}
          />
        );
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
