import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polygon,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { Button } from "@/ui/button";
import { MapIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import type { Location } from "@/lib/types";
import { NavigationControls } from "./NavigationControls";
import { getSatelliteData } from "@/services/apiService";

// Set default icon for markers
const DefaultIcon = L.icon({
  iconUrl: typeof markerIconUrl === "string" ? markerIconUrl : markerIconUrl.src,
  shadowUrl: typeof markerShadowUrl === "string" ? markerShadowUrl : markerShadowUrl.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface PollutionProperties {
  latitude: number;
  longitude: number;
  confidence_score: number;
  timestamp: string;
  mean_AOD: number;
  mean_CO: number;
  mean_NO2: number;
  pm2_5_prediction?: number;
}

interface PollutionFeature {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  properties: PollutionProperties;
}

interface PollutionFeatureCollection {
  type: "FeatureCollection";
  features: PollutionFeature[];
}

const mapStyles = {
  streets: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  satellite:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

type MapStyle = keyof typeof mapStyles;

interface MapComponentProps {
  polygon: Location[];
  mustHaveLocations: Location[];
  suggestedLocations: Location[];
  onPolygonChange: (locations: Location[]) => void;
  onLocationClick: (location: Location) => void;
  isDrawing: boolean;
}

// Add map instance to window for global access
declare global {
  interface Window {
    map: L.Map;
  }
}

function MapStyleControl() {
  const map = useMap();
  const [currentStyle, setCurrentStyle] = useState<MapStyle>("streets");

  const changeStyle = (style: MapStyle) => {
    setCurrentStyle(style);
    // Find and remove the existing tile layer
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });
    // Add the new tile layer
    L.tileLayer(mapStyles[style], {
      attribution:
        style === "satellite"
          ? "&copy; <a href='https://www.arcgis.com/'>ESRI</a>"
          : "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
    }).addTo(map);
  };

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 bg-white shadow-lg"
          >
            <MapIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2" style={{ zIndex: 2000 }}>
          {Object.keys(mapStyles).map((style) => (
            <Button
              key={style}
              variant={currentStyle === style ? "secondary" : "ghost"}
              className="w-full justify-start text-sm capitalize mb-1"
              onClick={() => changeStyle(style as MapStyle)}
            >
              {style}
            </Button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function MapController() {
  const map = useMap();
  useEffect(() => {
    window.map = map;
  }, [map]);
  return null;
}

function DrawControl({
  onPolygonChange,
}: {
  onPolygonChange: (locations: Location[]) => void;
}) {
  const map = useMap();
  const drawingRef = useRef<L.Polyline>();
  const locationsRef = useRef<Location[]>([]);

  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      const newLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
      locationsRef.current = [...locationsRef.current, newLocation];

      if (!drawingRef.current) {
        drawingRef.current = L.polyline([], { color: "blue" }).addTo(map);
      }

      drawingRef.current.setLatLngs(locationsRef.current);
      onPolygonChange(locationsRef.current);
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
      drawingRef.current?.remove();
    };
  }, [map, onPolygonChange]);

  return null;
}

const fetchPollutionData = async (): Promise<
  PollutionProperties[] | null
> => {
  try {
    const response = await fetch(
      "http://localhost:5001/api/v2/spatial/get-all-data"
    );
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    if (!isPollutionFeatureCollection(data)) {
      console.error("Invalid data format from API:", data);
      return null;
    }

    return data.features.map((feature) => feature.properties);
  } catch (error) {
    console.error("Failed to fetch pollution data:", error);
    return null;
  }
};

function isPollutionFeatureCollection(
  data: any
): data is PollutionFeatureCollection {
  return data && data.type === "FeatureCollection" && Array.isArray(data.features);
}

interface PollutionCardProps {
  pollutionData: PollutionProperties[];
}

function PollutionCard({ pollutionData }: PollutionCardProps) {
  const [expandedPoint, setExpandedPoint] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Calculate averages
  const average_PM25 =
    pollutionData.reduce((sum, data) => sum + (data.pm2_5_prediction || 0), 0) /
    (pollutionData.length || 1);

  // Pagination calculations
  const totalPages = Math.ceil(pollutionData.length / pageSize);
  const paginatedData = pollutionData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleDropdown = (index: number) => {
    setExpandedPoint((prev) => (prev === index ? null : index));
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setExpandedPoint(null); // Collapse all when changing pages
  };

  return (
    <div
      style={{
        width: "300px",
        padding: "10px",
        backgroundColor: "#ffffff",
        color: "#000000",
        border: "1px solid #ccc",
        borderRadius: "5px",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        maxHeight: "70vh",
        overflowY: "auto",
      }}
    >
      <h2>Pollutants Summary</h2>
      <p>Average PM2.5 Prediction: {average_PM25?.toFixed(2)}</p>

      <h3>Pollution Data Points</h3>
      {paginatedData.map((data, index) => {
        const absoluteIndex = (currentPage - 1) * pageSize + index;
        return (
          <div
            key={absoluteIndex}
            style={{
              marginBottom: "10px",
              borderBottom: "1px solid #ccc",
              paddingBottom: "10px",
            }}
          >
            <div
              style={{
                cursor: "pointer",
                backgroundColor: "#f9f9f9",
                padding: "8px",
                borderRadius: "5px",
                marginBottom: "5px",
              }}
              onClick={() => toggleDropdown(absoluteIndex)}
            >
              <strong>
                Point at Latitude {data.latitude.toFixed(4)}, Longitude{" "}
                {data.longitude.toFixed(4)}
              </strong>
              <span style={{ float: "right" }}>
                {expandedPoint === absoluteIndex ? "▲" : "▼"}
              </span>
            </div>
            {expandedPoint === absoluteIndex && (
              <div>
                <p>Confidence Score: {data.confidence_score.toFixed(4)}</p>
                <p>
                  PM2.5 Prediction: {data.pm2_5_prediction?.toFixed(2) || "N/A"}
                </p>
                <p>Timestamp: {new Date(data.timestamp).toLocaleString()}</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Pagination Controls */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        marginTop: "15px",
        padding: "10px 5px",
        borderTop: "1px solid #eee"
      }}>
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: "5px 10px",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
            opacity: currentPage === 1 ? 0.5 : 1
          }}
        >
          ← Previous
        </button>
        <span style={{ margin: "0 10px" }}>
          Page {currentPage} of {totalPages}
        </span>
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: "5px 10px",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            opacity: currentPage === totalPages ? 0.5 : 1
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

const PollutantMap: React.FC<MapComponentProps> = ({
  polygon,
  mustHaveLocations,
  suggestedLocations,
  onPolygonChange,
  isDrawing,
}) => {
  const [pollutionData, setPollutionData] = useState<
    PollutionProperties[] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      const initialData = await fetchPollutionData();

      if (initialData) {
        // Fetch PM2.5 predictions for each data point
        const dataWithPM25 = await Promise.all(
          initialData.map(async (item) => {
            try {
              const satelliteData = await getSatelliteData({
                latitude: item.latitude,
                longitude: item.longitude,
              });
              return {
                ...item,
                pm2_5_prediction: satelliteData?.pm2_5_prediction, // Add PM2.5 prediction
              };
            } catch (error) {
              console.error(
                "Error fetching satellite data for point:",
                item,
                error
              );
              return { ...item, pm2_5_prediction: null }; // Handle error: set PM2.5 to null
            }
          })
        );
        setPollutionData(dataWithPM25);
      } else {
        setPollutionData([]); // Ensure it's an array even if empty to avoid further issues
      }
      setLoading(false);
    };

    getData();
  }, []);

  if (loading) return <div>Loading map...</div>;

  return (
    <div style={{ display: "flex" }}>
      {/* Side Panel */}
      {pollutionData && <PollutionCard pollutionData={pollutionData} />}

      {/* Map */}
      <MapContainer
        center={[1.3733, 32.2903]}
        zoom={7}
        style={{ height: "100vh", width: "100%" }}
      >
        <MapController />
        <MapStyleControl />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {isDrawing && <DrawControl onPolygonChange={onPolygonChange} />}
        {polygon.length > 2 && (
          <Polygon
            positions={polygon.map((loc) => [loc.lat, loc.lng])}
            pathOptions={{ color: "blue" }}
          />
        )}
        {pollutionData &&
          pollutionData.map((data, index) => (
            <Marker key={index} position={[data.latitude, data.longitude]}>
              <Popup>
                <div>
                  <h3>Pollution Data</h3>
                  <p>Latitude: {data.latitude.toFixed(4)}</p>
                  <p>Longitude: {data.longitude.toFixed(4)}</p>
                  <p>Confidence Score: {data.confidence_score.toFixed(4)}</p>
                  <p>
                    PM2.5 Prediction: {data.pm2_5_prediction?.toFixed(2) || "N/A"}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};

export default PollutantMap;
