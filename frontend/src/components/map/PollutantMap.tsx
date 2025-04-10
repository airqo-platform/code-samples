import React, { useEffect, useRef,  useState } from "react";
import { MapContainer, TileLayer, Marker, Popup,useMap,Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { Button } from "@/ui/button";
import { MapIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import type { Location } from "@/lib/types";
import { NavigationControls } from "./NavigationControls";


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
            ? '&copy; <a href="https://www.arcgis.com/">ESRI</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
  
const fetchPollutionData = async (): Promise<PollutionProperties[] | null> => {
  try {
    const response = await fetch("http://localhost:5001/api/v2/spatial/get-all-data");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

function isPollutionFeatureCollection(data: any): data is PollutionFeatureCollection {
  return data && data.type === "FeatureCollection" && Array.isArray(data.features);
}


interface PollutionDataPoint {
  latitude: number;
  longitude: number;
  confidence_score: number;
  timestamp: string;
  mean_AOD: number;
  mean_CO: number;
  mean_NO2: number;
}

interface PollutionCardProps {
  pollutionData: PollutionDataPoint[];
}

function PollutionCard({ pollutionData }: PollutionCardProps) {
  // Calculate averages dynamically
  const average_CO = pollutionData.reduce((sum, data) => sum + data.mean_CO, 0) / pollutionData.length;
  const average_NO2 = pollutionData.reduce((sum, data) => sum + data.mean_NO2, 0) / pollutionData.length;
  const average_AOD = pollutionData.reduce((sum, data) => sum + data.mean_AOD, 0) / pollutionData.length;

  const DropdownCard = ({ data }: { data: PollutionDataPoint }) => {
      const [isExpanded, setIsExpanded] = useState(false);

      return (
          <div style={{ marginBottom: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
              <div
                  style={{ padding: "10px", cursor: "pointer", backgroundColor: "#f9f9f9" }}
                  onClick={() => setIsExpanded(!isExpanded)}
              >
                  <strong>Point at Latitude {data.latitude.toFixed(4)}, Longitude {data.longitude.toFixed(4)}</strong>
                  <span style={{ float: "right" }}>{isExpanded ? "▲" : "▼"}</span>
              </div>
              {isExpanded && (
                  <div style={{ padding: "10px", backgroundColor: "#ffffff" }}>
                      <p>Confidence Score: {data.confidence_score.toFixed(4)}</p>
                      <p>Mean CO: {data.mean_CO?.toFixed(4)}</p>
                      <p>Mean NO₂: {data.mean_NO2?.toExponential(2)}</p>
                      <p>Mean AOD: {data.mean_AOD?.toFixed(2)}</p>
                  </div>
              )}
          </div>
      );
  };

  return (
      <div style={{
          width: "300px",
          padding: "10px",
          backgroundColor: "#ffffff",
          color: "#000000",
          border: "1px solid #ccc",
          borderRadius: "5px",
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)"
      }}>
          <h2>Pollutants Summary</h2>
          <p>Average CO: {average_CO.toFixed(4)}</p>
          <p>Average NO₂: {average_NO2.toExponential(2)}</p>
          <p>Average AOD: {average_AOD.toFixed(2)}</p>
          <h3>Pollution Data Points</h3>
          {pollutionData.map((data, index) => (
              <DropdownCard key={index} data={data} />
          ))}
      </div>
  );
}


const PollutantMap: React.FC<MapComponentProps> = ({
  polygon,
  mustHaveLocations,
  suggestedLocations,
  onPolygonChange,
  isDrawing,
})  => {
  const [pollutionData, setPollutionData] = useState<PollutionProperties[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      const data = await fetchPollutionData();
      setPollutionData(data);
      setLoading(false);
    };

    getData();
  }, []);

  if (loading) return <div>Loading map...</div>;

  const pollutantCount = pollutionData ? pollutionData.length : 0;
 // Define default data for when pollutionData is null
 const defaultPollutionData: PollutionProperties[] = [
  {
      latitude: 0,
      longitude: 0,
      confidence_score: 0,
      timestamp: new Date().toISOString(),
      mean_AOD: 0,
      mean_CO: 0,
      mean_NO2: 0,
  },
];

  return (
    <div style={{ display: "flex" }}>
      {/* Side Panel */}
      <div style={{ 
  width: "300px", 
  padding: "10px", 
  backgroundColor: "#ffffff", 
  color: "#000000", 
  border: "1px solid #ccc", 
  borderRadius: "5px", 
  boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)" 
}}>
  <p>Total Pollutants Identified: {pollutantCount}</p>
  {/*<p>Average Pollutants per Category: {averagePollutants}</p>*/}
  {/* Side Panel */}
  <PollutionCard pollutionData={pollutionData || defaultPollutionData} />
</div>

      {/* Map */}
      <MapContainer center={[1.3733, 32.2903]} zoom={7} style={{ height: "100vh", width: "100%" }}>
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
                  <p>Confidence Score: {data.confidence_score.toFixed(3)}</p>
                  <p>Mean CO: {data.mean_CO?.toFixed(4)}</p>
                  <p>Mean NO₂: {data.mean_NO2?.toExponential(2)}</p>
                  <p>Mean AOD: {data.mean_AOD?.toFixed(2)}</p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};

export default PollutantMap;
