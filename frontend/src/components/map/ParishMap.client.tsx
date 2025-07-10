"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import * as turf from "@turf/turf";
import type { FeatureCollection, Feature, Polygon } from "geojson";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then(mod => mod.GeoJSON), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then(mod => mod.CircleMarker), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const LeafletPopup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

// Loading and Error States
type LoadingState = {
  parishes: boolean;
  pollutionSources: boolean;
};

type ErrorState = {
  parishes: string | null;
  pollutionSources: string | null;
};

type ParishProperties = {
  GID_4: string;
  GID_0: string;
  COUNTRY: string;
  GID_1: string;
  NAME_1: string;
  GID_2: string;
  NAME_2: string;
  GID_3: string;
  NAME_3: string;
  NAME_4: string;
  [key: string]: any;
};

type CombinedDataFeature = {
  _id: { $oid: string };
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  properties: {
    latitude: number;
    longitude: number;
    confidence_score: number;
    timestamp: string;
  };
};

type ParishFeature = Feature<Polygon, ParishProperties>;

const DATA_PATH = "/mapdata";

// Utility to fetch land cover/building data for a pollution source
async function fetchLandCoverForSource(lat: number, lon: number) {
  try {
    const response = await fetch("/mapdata/buildings_and_landcover.json");
    if (!response.ok) throw new Error("Failed to load land cover data");
    const allData = await response.json();
    // First, try to find an entry with latitude/longitude exactly matching (within epsilon)
    const epsilon = 0.00001;
    let exactMatch = allData.find((entry: any) =>
      Math.abs(entry.latitude - lat) < epsilon && Math.abs(entry.longitude - lon) < epsilon
    );
    if (exactMatch) return exactMatch;
    // If not found, fallback to closest within 500m
    let minDist = Infinity;
    let bestEntry = null;
    for (const entry of allData) {
      const d = turf.distance([lon, lat], [entry.longitude, entry.latitude], { units: "meters" });
      if (d < 500 && d < minDist) {
        minDist = d;
        bestEntry = entry;
      }
    }
    return bestEntry;
  } catch (e) {
    console.error("Error fetching land cover for source:", e);
    return null;
  }
}

function computeLandCoverPercentagesFromSummary(landcover_summary: any): { name: string; value: number }[] {
  if (!landcover_summary) return [];
  return Object.entries(landcover_summary).map(([name, obj]: [string, any]) => ({
    name,
    value: typeof obj.percentage === 'number' ? obj.percentage : 0
  })).filter(entry => entry.value > 0);
}

function computeLandCoverPercentages(buildings: any[]): { name: string; value: number }[] {
  if (!buildings || buildings.length === 0) return [];
  const buckets = {
    Small: 0,
    Medium: 0,
    Large: 0,
  };
  for (const b of buildings) {
    const area = b.properties?.area_in_meters || 0;
    if (area < 50) buckets.Small++;
    else if (area < 200) buckets.Medium++;
    else buckets.Large++;
  }
  const total = buildings.length;
  return Object.entries(buckets).map(([name, value]) => ({ name, value: (value / total) * 100 }));
}

const LayerControls = ({ 
  showPollutionSources, 
  setShowPollutionSources,
  pollutionSourcesAvailable
}: {
  showPollutionSources: boolean;
  setShowPollutionSources: (show: boolean) => void;
  pollutionSourcesAvailable: boolean;
}) => (
  <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-md p-3 min-w-[200px]">
    <h4 className="font-semibold mb-3 text-gray-800">Layer Controls</h4>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-700">Pollution Sources</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showPollutionSources}
            onChange={(e) => setShowPollutionSources(e.target.checked)}
            disabled={!pollutionSourcesAvailable}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
    {!pollutionSourcesAvailable && (
      <p className="text-xs text-gray-500 mt-2">Zoom in to a parish to view pollution sources</p>
    )}
  </div>
);

const MapLegend = ({ showPollutionSources }: { showPollutionSources: boolean }) => (
  <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-[1000] text-sm max-w-xs">
    <h4 className="font-semibold mb-3 text-gray-800">Map Legend</h4>
    <div className="space-y-3">
      <div className="flex items-center">
        <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
        <div>
          <span className="text-gray-700 font-medium">Parishes</span>
          <p className="text-xs text-gray-500">Click to zoom and view details</p>
        </div>
      </div>
      {showPollutionSources && (
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
          <div>
            <span className="text-gray-700 font-medium">Pollution Sources</span>
            <p className="text-xs text-gray-500">Click for source details</p>
          </div>
        </div>
      )}
    </div>
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-xs text-gray-500">
        <strong>Tip:</strong> Use mouse wheel to zoom in/out
      </p>
    </div>
  </div>
);

const LoadingIndicator = ({ loadingState, errorState }: { loadingState: LoadingState; errorState: ErrorState }) => {
  const hasErrors = Object.values(errorState).some(error => error !== null);
  const isLoading = Object.values(loadingState).some(loading => loading);
  if (!isLoading && !hasErrors) return null;
  return (
    <div className="absolute top-20 left-4 z-[1000] bg-white rounded-lg shadow-md p-3 max-w-xs">
      {isLoading && (
        <div className="flex items-center space-x-2 mb-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
          <span className="text-sm text-gray-600">Loading data...</span>
        </div>
      )}
      {hasErrors && (
        <div className="space-y-1">
          {Object.entries(errorState).map(([key, error]) => 
            error && (
              <div key={key} className="text-xs text-red-500 bg-red-50 p-2 rounded">
                <strong>{key}:</strong> {error}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

function ParishMap() {
  const [parishes, setParishes] = useState<FeatureCollection<Polygon, ParishProperties> | null>(null);
  const [pollutionSources, setPollutionSources] = useState<CombinedDataFeature[]>([]);
  const [selectedParish, setSelectedParish] = useState<ParishFeature | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    parishes: true,
    pollutionSources: false,
  });
  const [errorState, setErrorState] = useState<ErrorState>({
    parishes: null,
    pollutionSources: null,
  });
  const [mapZoom, setMapZoom] = useState(10);
  const [showPollutionSources, setShowPollutionSources] = useState(true);
  const mapRef = useRef<any>(null);
  const [landCoverDataBySource, setLandCoverDataBySource] = useState<Record<string, { name: string; value: number }[]>>({});
  const [infoMarker, setInfoMarker] = useState<{ lat: number; lon: number; entry: any } | null>(null);
  // Add state to store land cover/building info for each pollutant/location
  const [landCoverByLocation, setLandCoverByLocation] = useState<Record<string, any>>({});

  useEffect(() => {
    async function fetchParishes() {
      try {
        setLoadingState(prev => ({ ...prev, parishes: true }));
        setErrorState(prev => ({ ...prev, parishes: null }));
        const response = await fetch(`${DATA_PATH}/jinja_parishes.json`);
        if (!response.ok) {
          throw new Error(`Failed to load parishes: ${response.status}`);
        }
        const parishesData = await response.json();
        setParishes(parishesData);
        setLoadingState(prev => ({ ...prev, parishes: false }));
      } catch (err: any) {
        console.error('Error loading parishes:', err);
        setErrorState(prev => ({ ...prev, parishes: err.message || "Failed to load parishes" }));
        setLoadingState(prev => ({ ...prev, parishes: false }));
      }
    }
    fetchParishes();
  }, []);

  useEffect(() => {
    const loadPollutionSources = async () => {
      setLoadingState(prev => ({ ...prev, pollutionSources: true }));
      setErrorState(prev => ({ ...prev, pollutionSources: null }));
      try {
        const response = await fetch('/mapdata/combined_data_t.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Pollution sources data is not an array');
        }
        const validSources = data.filter((item: any) => {
          return item && 
                 item.type === 'Feature' && 
                 item.geometry && 
                 item.geometry.type === 'Polygon' &&
                 item.geometry.coordinates &&
                 Array.isArray(item.geometry.coordinates) &&
                 item.properties;
        });
        setPollutionSources(validSources);
      } catch (error) {
        setErrorState(prev => ({ ...prev, pollutionSources: error instanceof Error ? error.message : 'Failed to load pollution sources' }));
      } finally {
        setLoadingState(prev => ({ ...prev, pollutionSources: false }));
      }
    };
    loadPollutionSources();
  }, []);

  const pollutionSourceCounts = useMemo(() => {
    if (!parishes || !pollutionSources.length) return {};
    const counts: Record<string, number> = {};
    for (const parish of parishes.features) {
      try {
        if (!parish.geometry?.coordinates || 
            !Array.isArray(parish.geometry.coordinates) || 
            parish.geometry.coordinates.length === 0) {
          counts[parish.properties.NAME_4] = 0;
          continue;
        }
        const coords = parish.geometry.coordinates[0];
        if (!Array.isArray(coords) || coords.length < 4) {
          counts[parish.properties.NAME_4] = 0;
          continue;
        }
        for (const coord of coords) {
          if (!Array.isArray(coord) || coord.length < 2 || 
              typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
            counts[parish.properties.NAME_4] = 0;
            continue;
          }
        }
        const parishPoly = turf.polygon(parish.geometry.coordinates);
        let parishPolyBuffered: Feature<Polygon>;
        try {
          const buffered = turf.buffer(parishPoly, 0.0001, { units: 'degrees' });
          if (buffered && buffered.geometry.type === 'Polygon') {
            parishPolyBuffered = buffered as Feature<Polygon>;
          } else {
            parishPolyBuffered = parishPoly;
          }
        } catch (e) {
          parishPolyBuffered = parishPoly;
        }
        const validSources = pollutionSources.filter(source => {
          if (!source.geometry?.coordinates || 
              !Array.isArray(source.geometry.coordinates) || 
              source.geometry.coordinates.length === 0) {
            return false;
          }
          const coords = source.geometry.coordinates[0];
          if (!Array.isArray(coords) || coords.length < 3) {
            return false;
          }
          for (const coord of coords) {
            if (!Array.isArray(coord) || coord.length !== 2 || 
                typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
              return false;
            }
          }
          try {
            const sourcePoly = turf.polygon(source.geometry.coordinates);
            const sourceCentroid = turf.centroid(sourcePoly);
            const centroidInParish = turf.booleanPointInPolygon(sourceCentroid, parishPolyBuffered);
            const intersects = turf.booleanIntersects(parishPolyBuffered, sourcePoly);
            const contains = turf.booleanContains(parishPolyBuffered, sourcePoly);
            const isInParish = centroidInParish || intersects || contains;
            return isInParish;
          } catch (error) {
            return false;
          }
        });
        counts[parish.properties.NAME_4] = validSources.length;
      } catch (error) {
        counts[parish.properties.NAME_4] = 0;
      }
    }
    return counts;
  }, [parishes, pollutionSources]);

  // Handler for map click
  async function handleMapClick(e: any) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    const entry = await fetchLandCoverForSource(lat, lon);
    setInfoMarker(entry ? { lat, lon, entry } : null);
  }

  function onEachParish(feature: ParishFeature, layer: any) {
    layer.on({
      click: () => {
        setSelectedParish(feature);
        if (mapRef.current && layer && layer.getBounds) {
          try {
            const bounds = layer.getBounds();
            if (bounds && bounds.isValid && bounds.isValid()) {
              mapRef.current.fitBounds(bounds);
            }
          } catch (e) {}
        }
      },
    });
  }

  function parishStyle(feature: any) {
    if (!feature || !feature.properties) {
      return {
        fillColor: "#3388ff",
        weight: 2,
        opacity: 1,
        color: "white",
        fillOpacity: 0.7,
      };
    }
    const parishFeature = feature as ParishFeature;
    const isSelected = selectedParish?.properties.GID_4 === parishFeature.properties.GID_4;
    return {
      fillColor: isSelected ? "#ff7800" : "#3388ff",
      weight: 2,
      opacity: 1,
      color: "white",
      fillOpacity: 0.7,
    };
  }

  // Fetch land cover/building info for all pollution sources in selected parish
  useEffect(() => {
    async function fetchAllLandCover() {
      if (!selectedParish || !pollutionSources.length) return;
      const parishPoly = turf.polygon(selectedParish.geometry.coordinates);
      const sourcesInParish = pollutionSources.filter(source => {
        try {
          const sourcePoly = turf.polygon(source.geometry.coordinates);
          return turf.booleanIntersects(parishPoly, sourcePoly);
        } catch {
          return false;
        }
      });
      const newData: Record<string, any> = {};
      for (const source of sourcesInParish) {
        const { latitude, longitude } = source.properties;
        const entry = await fetchLandCoverForSource(latitude, longitude);
        newData[source._id.$oid] = entry;
      }
      setLandCoverByLocation(newData);
    }
    fetchAllLandCover();
  }, [selectedParish, pollutionSources]);

  // Debug logs for sidebar rendering
  console.log('selectedParish:', selectedParish);
  console.log('pollutionSources:', pollutionSources);
  console.log('landCoverByLocation:', landCoverByLocation);

  if (loadingState.parishes) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (errorState.parishes) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Map Loading Error</h2>
          <p className="text-red-600 mb-4">{errorState.parishes}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!parishes) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No map data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-1/4 bg-gray-50 p-4 border-r border-gray-300 overflow-auto">
        {!selectedParish && <div className="text-gray-500">Select a parish on the map to see details.</div>}
        {selectedParish && (
          <>
            <div className="mb-2 font-bold">Selected parish: {selectedParish.properties.NAME_4}</div>
            <div className="mb-2">
              Pollution sources in parish: {
                pollutionSources.filter(source => {
                  try {
                    const parishPoly = turf.polygon(selectedParish.geometry.coordinates);
                    const sourcePoly = turf.polygon(source.geometry.coordinates);
                    return turf.booleanIntersects(parishPoly, sourcePoly);
                  } catch {
                    return false;
                  }
                }).length
              }
            </div>
            <div>
              {pollutionSources.filter(source => {
                try {
                  const parishPoly = turf.polygon(selectedParish.geometry.coordinates);
                  const sourcePoly = turf.polygon(source.geometry.coordinates);
                  return turf.booleanIntersects(parishPoly, sourcePoly);
                } catch {
                  return false;
                }
              }).length === 0 && <div className="text-gray-500">No pollution sources found in this parish.</div>}
              {pollutionSources.filter(source => {
                try {
                  const parishPoly = turf.polygon(selectedParish.geometry.coordinates);
                  const sourcePoly = turf.polygon(source.geometry.coordinates);
                  return turf.booleanIntersects(parishPoly, sourcePoly);
                } catch {
                  return false;
                }
              }).map((source, idx) => {
                const landCoverEntry = landCoverByLocation[source._id.$oid];
                if (!landCoverEntry) return <div key={source._id.$oid} className="text-gray-400">Loading land cover data for source {idx + 1}...</div>;
                return (
                  <div key={source._id.$oid} className="mb-6 p-3 bg-white rounded shadow">
                    <div className="font-medium text-gray-800 mb-1">Source {idx + 1} at ({source.properties.latitude.toFixed(4)}, {source.properties.longitude.toFixed(4)})</div>
                    <div className="text-xs text-gray-500 mb-2">Confidence: {(source.properties.confidence_score * 100).toFixed(1)}%</div>
                    {landCoverEntry && landCoverEntry.landcover_summary && (
                      <>
                        <div className="mb-2">
                          <h4 className="text-xs font-semibold text-blue-700 mb-1">Land Cover (Donut Chart)</h4>
                          <div style={{ width: '100%', height: 180 }}>
                            <ResponsiveContainer width="100%" height={180}>
                              <PieChart>
                                <Pie
                                  data={Object.entries(landCoverEntry.landcover_summary).map(([name, obj]: any) => ({ name, value: obj.percentage }))}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                                  paddingAngle={2}
                                >
                                  {Object.entries(landCoverEntry.landcover_summary).map((_, i) => (
                                    <Cell key={`cell-${i}`} fill={["#4ade80", "#fbbf24", "#f87171", "#60a5fa", "#a78bfa", "#f472b6", "#facc15"][i % 7]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => [typeof value === 'number' ? `${value.toFixed(1)}%` : value, "Percent"]} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div>
                          <strong>Land Cover:</strong>
                          <ul className="ml-4 list-disc">
                            {Object.entries(landCoverEntry.landcover_summary).map(([cls, obj]: any) => (
                              <li key={cls}>{cls}: {obj.percentage.toFixed(1)}% ({obj.pixel_count} px)</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                    {landCoverEntry && landCoverEntry.buildings && (
                      <div className="mt-2">
                        <strong>Buildings ({landCoverEntry.buildings.length}):</strong>
                        <ul className="ml-4 list-disc">
                          {landCoverEntry.buildings.length > 0 ?
                            landCoverEntry.buildings.slice(0, 10).map((b: any, i: number) => (
                              <li key={i}>Type: {b.type || 'Unknown'}, Area: {b.area_in_meters || '?'} m²</li>
                            )) : <li>None found</li>}
                          {landCoverEntry.buildings.length > 10 && (
                            <li>...and {landCoverEntry.buildings.length - 10} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </aside>
      {/* Map */}
      <main className="w-3/4 relative">
        <MapContainer
          ref={(map) => {
            if (map) {
              mapRef.current = map;
              try {
                map.on('zoomend', () => {
                  if (map && typeof map.getZoom === 'function') {
                    setMapZoom(map.getZoom());
                  }
                });
                if (typeof map.getZoom === 'function') {
                  setMapZoom(map.getZoom());
                }
                map.on('click', handleMapClick);
              } catch (e) {}
            }
          }}
          center={[0.447856, 33.202116]}
          zoom={10}
          scrollWheelZoom={true}
          className="h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap contributors'
          />
          {parishes && parishes.features && parishes.features.length > 0 && (
            <GeoJSON
              data={parishes}
              style={parishStyle}
              onEachFeature={onEachParish}
            />
          )}
          {showPollutionSources && pollutionSources.length > 0 && (
            <GeoJSON
              data={{
                type: "FeatureCollection",
                features: pollutionSources
              } as any}
              style={() => ({
                fillColor: '#ff4444',
                weight: 1,
                opacity: 0.8,
                color: '#cc0000',
                fillOpacity: 0.4
              })}
            />
          )}
        </MapContainer>
        <LoadingIndicator loadingState={loadingState} errorState={errorState} />
        {/* MapLegend at top right */}
        <div className="absolute top-4 right-4 z-[1000]">
          <MapLegend showPollutionSources={showPollutionSources} />
        </div>
        {/* LayerControls just below MapLegend, not covering zoom */}
        <div className="absolute top-32 right-4 z-[1000]">
          <LayerControls 
            showPollutionSources={showPollutionSources}
            setShowPollutionSources={setShowPollutionSources}
            pollutionSourcesAvailable={pollutionSources.length > 0}
          />
        </div>
      </main>
    </div>
  );
}

export default ParishMap; 