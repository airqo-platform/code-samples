import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

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

const PollutantMap: React.FC = () => {
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

  return (
    <div style={{ display: "flex" }}>
      {/* Side Panel */}
      <div style={{ width: "300px", padding: "10px", backgroundColor: "#f4f4f4", borderRight: "1px solid #ccc" }}>
        <h2>Pollutants Summary</h2>
        <p>Total Pollutants Identified: {pollutantCount}</p>
      </div>

      {/* Map */}
      <MapContainer center={[1.3733, 32.2903]} zoom={7} style={{ height: "100vh", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {pollutionData &&
          pollutionData.map((data, index) => (
            <Marker key={index} position={[data.latitude, data.longitude]}>
              <Popup>
                <div>
                  <h3>Pollution Data</h3>
                  <p>Latitude: {data.latitude}</p>
                  <p>Longitude: {data.longitude}</p>
                  <p>Confidence Score: {data.confidence_score}</p>
                  <p>Timestamp: {new Date(data.timestamp).toLocaleString()}</p>
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
