import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

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
    map.on("geosearch/showlocation", (result: any) => {
      const { x, y } = result.location;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      const marker = L.marker([y, x], { icon: DefaultIcon }).addTo(map);
      markersRef.current.push(marker);
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
