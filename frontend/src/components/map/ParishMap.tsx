import React, { useEffect, useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import * as turf from "@turf/turf";
import type { FeatureCollection, Feature, Geometry, Point, Polygon } from "geojson";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then(mod => mod.GeoJSON), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

// Loading and Error States
type LoadingState = {
  parishes: boolean;
  buildings: boolean;
  pollutionSources: boolean;
};

type ErrorState = {
  parishes: string | null;
  buildings: string | null;
  pollutionSources: string | null;
};

// Layer Visibility Controls
const LayerControls = ({ 
  showBuildings, 
  setShowBuildings, 
  showPollutionSources, 
  setShowPollutionSources,
  buildingsAvailable,
  pollutionSourcesAvailable
}: {
  showBuildings: boolean;
  setShowBuildings: (show: boolean) => void;
  showPollutionSources: boolean;
  setShowPollutionSources: (show: boolean) => void;
  buildingsAvailable: boolean;
  pollutionSourcesAvailable: boolean;
}) => (
  <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-md p-3 min-w-[200px]">
    <h4 className="font-semibold mb-3 text-gray-800">Layer Controls</h4>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-700">Buildings</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showBuildings}
            onChange={(e) => setShowBuildings(e.target.checked)}
            disabled={!buildingsAvailable}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
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
    
    {!buildingsAvailable && (
      <p className="text-xs text-gray-500 mt-2">Zoom in to a parish to view buildings</p>
    )}
  </div>
);

// Map Legend Component
const MapLegend = ({ showBuildings, showPollutionSources }: { showBuildings: boolean; showPollutionSources: boolean }) => (
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
      {showBuildings && (
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
          <div>
            <span className="text-gray-700 font-medium">Buildings</span>
            <p className="text-xs text-gray-500">Click for building info</p>
          </div>
        </div>
      )}
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

// Loading Indicator Component
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

// Types for your GeoJSON features
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

type PollutionSourceProperties = {
  name: string;
  type?: string;
  [key: string]: any;
};

type ParishFeature = Feature<Polygon, ParishProperties>;
type PollutionSourceFeature = Feature<Polygon, PollutionSourceProperties>;
type BuildingFeature = Feature<Point, any>;

const DATA_PATH = "/mapdata";

export default function SourcePollutionPage() {
  const [parishes, setParishes] = useState<FeatureCollection<Polygon, ParishProperties> | null>(null);
  const [buildings, setBuildings] = useState<FeatureCollection<Point, any> | null>(null);
  const [pollutionSources, setPollutionSources] = useState<PollutionSourceFeature[]>([]);
  const [selectedParish, setSelectedParish] = useState<ParishFeature | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    parishes: true,
    buildings: false,
    pollutionSources: false,
  });
  const [errorState, setErrorState] = useState<ErrorState>({
    parishes: null,
    buildings: null,
    pollutionSources: null,
  });
  const [mapZoom, setMapZoom] = useState(10);
  const [showBuildings, setShowBuildings] = useState(false);
  const [showPollutionSources, setShowPollutionSources] = useState(false);
  const mapRef = useRef<any>(null);

  // Load parishes data first (essential for map to work)
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

  // Load pollution sources data immediately for all Jinja
  useEffect(() => {
    async function fetchPollutionSources() {
      try {
        setLoadingState(prev => ({ ...prev, pollutionSources: true }));
        setErrorState(prev => ({ ...prev, pollutionSources: null }));
        
        const response = await fetch(`${DATA_PATH}/pollution_sources.geojson`);
        if (!response.ok) {
          throw new Error(`Failed to load pollution sources: ${response.status}`);
        }
        
        const pollutionData = await response.json();
        setPollutionSources(pollutionData.features);
        setShowPollutionSources(true); // Auto-enable pollution sources
        setLoadingState(prev => ({ ...prev, pollutionSources: false }));
      } catch (err: any) {
        console.error('Error loading pollution sources:', err);
        setErrorState(prev => ({ ...prev, pollutionSources: err.message || "Failed to load pollution sources" }));
        setLoadingState(prev => ({ ...prev, pollutionSources: false }));
      }
    }
    
    fetchPollutionSources();
  }, []);

  // Load buildings data when a parish is selected, zoomed in, and buildings are toggled on
  useEffect(() => {
    if (!selectedParish || mapZoom < 12 || !showBuildings) {
      setBuildings(null);
      return;
    }

    async function fetchBuildings() {
      try {
        setLoadingState(prev => ({ ...prev, buildings: true }));
        setErrorState(prev => ({ ...prev, buildings: null }));
        
        const response = await fetch(`${DATA_PATH}/buildings_in_jinja.geojson`);
        if (!response.ok) {
          throw new Error(`Failed to load buildings: ${response.status}`);
        }
        
        const buildingsData = await response.json();
        setBuildings(buildingsData);
        setLoadingState(prev => ({ ...prev, buildings: false }));
      } catch (err: any) {
        console.error('Error loading buildings:', err);
        setErrorState(prev => ({ ...prev, buildings: err.message || "Failed to load buildings" }));
        setLoadingState(prev => ({ ...prev, buildings: false }));
      }
    }
    
    fetchBuildings();
  }, [selectedParish, mapZoom, showBuildings]);

  // Pre-calculate building counts for all parishes (only when buildings are toggled on)
  const buildingCounts = useMemo(() => {
    if (!parishes || !buildings || !showBuildings) return {};

    const counts: Record<string, number> = {};
    const buildingPoints = buildings.features;

    // Create a spatial index for faster lookups
    const buildingIndex = buildingPoints.map(building => ({
      point: turf.point(building.geometry.coordinates),
      building
    }));

    for (const parish of parishes.features) {
      try {
        const parishPoly = turf.polygon(parish.geometry.coordinates);
        let count = 0;
        
        // Fast point-in-polygon check
        for (const { point } of buildingIndex) {
          if (turf.booleanPointInPolygon(point, parishPoly)) {
            count++;
          }
        }
        
        counts[parish.properties.GID_4] = count;
      } catch (e) {
        console.warn(`Error calculating buildings in parish ${parish.properties.GID_4}`, e);
        counts[parish.properties.GID_4] = 0;
      }
    }
    return counts;
  }, [parishes, buildings, showBuildings]);

  // Pre-calculate building type counts for selected parish (only when buildings are toggled on)
  const selectedParishBuildingTypes = useMemo(() => {
    if (!selectedParish || !buildings || !showBuildings) return {};

    try {
      const parishPoly = turf.polygon(selectedParish.geometry.coordinates);
      const typeCounts: Record<string, number> = {};
      
      buildings.features.forEach(building => {
        try {
          if (turf.booleanPointInPolygon(
            turf.point(building.geometry.coordinates),
            parishPoly
          )) {
            const type = building.properties.type || 'Unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          }
        } catch (e) {
          // Skip invalid buildings
        }
      });
      
      return typeCounts;
    } catch (e) {
      console.warn('Error calculating building types for selected parish:', e);
      return {};
    }
  }, [selectedParish, buildings, showBuildings]);

  // Compute pollution source counts per parish
  const pollutionSourceCounts = useMemo(() => {
    if (!parishes || !pollutionSources.length) return {};

    const counts: Record<string, number> = {};

    for (const parish of parishes.features) {
      try {
        const parishPoly = turf.polygon(parish.geometry.coordinates);
        const validSources = pollutionSources.filter(source => {
          // Validate coordinates for Polygon geometry
          if (!source.geometry?.coordinates || 
              !Array.isArray(source.geometry.coordinates) || 
              source.geometry.coordinates.length === 0) {
            return false;
          }
          
          // Check if it's a valid polygon (should be array of arrays)
          const coords = source.geometry.coordinates[0];
          if (!Array.isArray(coords) || coords.length < 3) {
            return false;
          }
          
          // Validate each coordinate pair
          for (const coord of coords) {
            if (!Array.isArray(coord) || coord.length < 2 || 
                typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
              return false;
            }
          }
          return true;
        });
        
        const sourcesWithin = validSources.filter(source => {
          try {
            const sourcePoly = turf.polygon(source.geometry.coordinates);
            return turf.booleanIntersects(parishPoly, sourcePoly);
          } catch (e) {
            console.warn('Error checking pollution source intersection:', e);
            return false;
          }
        });
        counts[parish.properties.GID_4] = sourcesWithin.length;
      } catch (e) {
        console.warn(`Error calculating pollution sources in parish ${parish.properties.GID_4}`, e);
        counts[parish.properties.GID_4] = 0;
      }
    }
    return counts;
  }, [parishes, pollutionSources]);

  // Get total pollution sources in Jinja
  const totalPollutionSources = useMemo(() => {
    if (!pollutionSources.length) return 0;
    
    const validSources = pollutionSources.filter(source => {
      // Validate coordinates for Polygon geometry
      if (!source.geometry?.coordinates || 
          !Array.isArray(source.geometry.coordinates) || 
          source.geometry.coordinates.length === 0) {
        return false;
      }
      
      // Check if it's a valid polygon (should be array of arrays)
      const coords = source.geometry.coordinates[0];
      if (!Array.isArray(coords) || coords.length < 3) {
        return false;
      }
      
      // Validate each coordinate pair
      for (const coord of coords) {
        if (!Array.isArray(coord) || coord.length < 2 || 
            typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
          return false;
        }
      }
      return true;
    });
    
    return validSources.length;
  }, [pollutionSources]);

  // Get pollution sources for selected parish
  const selectedParishPollutionSources = useMemo(() => {
    if (!selectedParish || !pollutionSources.length) return [];
    
    try {
      const parishPoly = turf.polygon(selectedParish.geometry.coordinates);
      return pollutionSources.filter(source => {
        // Validate coordinates for Polygon geometry
        if (!source.geometry?.coordinates || 
            !Array.isArray(source.geometry.coordinates) || 
            source.geometry.coordinates.length === 0) {
          return false;
        }
        
        // Check if it's a valid polygon (should be array of arrays)
        const coords = source.geometry.coordinates[0];
        if (!Array.isArray(coords) || coords.length < 3) {
          return false;
        }
        
        // Validate each coordinate pair
        for (const coord of coords) {
          if (!Array.isArray(coord) || coord.length < 2 || 
              typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
            return false;
          }
        }
        
        try {
          const sourcePoly = turf.polygon(source.geometry.coordinates);
          return turf.booleanIntersects(parishPoly, sourcePoly);
        } catch (e) {
          console.warn('Error checking if pollution source is in parish:', e);
          return false;
        }
      });
    } catch (e) {
      console.warn('Error calculating pollution sources for selected parish:', e);
      return [];
    }
  }, [selectedParish, pollutionSources]);

  // Handle parish click: zoom and select
  function onEachParish(feature: ParishFeature, layer: any) {
    layer.on({
      click: () => {
        // Immediately switch to the clicked parish
        setSelectedParish(feature);
        
        // Clear buildings if we're switching parishes (will reload if needed)
        if (buildings) {
          setBuildings(null);
        }
        
        // Zoom to the parish with proper null checks
        if (mapRef.current && layer && layer.getBounds) {
          try {
            const bounds = layer.getBounds();
            if (bounds && bounds.isValid && bounds.isValid()) {
              mapRef.current.fitBounds(bounds);
            }
          } catch (e) {
            console.warn('Error fitting bounds:', e);
          }
        }
      },
    });
  }

  // Style for parishes
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

  // Show loading state if parishes are still loading
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

  // Show error state if parishes failed to load
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

  // Don't render map if parishes data is not available
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
        {/* Summary Section */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-3">Jinja District Overview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{parishes.features.length}</div>
              <div className="text-blue-700">Parishes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {buildings ? buildings.features.length : '—'}
              </div>
              <div className="text-green-700">Buildings</div>
            </div>
            <div className="text-center col-span-2">
              <div className="text-2xl font-bold text-red-600">
                {selectedParish 
                  ? pollutionSourceCounts[selectedParish.properties.GID_4] ?? 0
                  : totalPollutionSources
                }
              </div>
              <div className="text-red-700">
                Pollution Sources
                {selectedParish && (
                  <span className="text-xs block text-red-600">
                    in {selectedParish.properties.NAME_4}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {selectedParish ? (
          <>
            <h2 className="text-xl font-bold mb-3">{selectedParish.properties.NAME_4}</h2>
            <div className="mb-3 text-sm text-gray-600">
              <p><strong>Sub-county:</strong> {selectedParish.properties.NAME_3}</p>
              <p><strong>County:</strong> {selectedParish.properties.NAME_2}</p>
              <p><strong>District:</strong> {selectedParish.properties.NAME_1}</p>
            </div>
            
            {/* Buildings Section */}
            <div className="mb-4 p-3 bg-white rounded shadow">
              <h3 className="font-semibold text-gray-700 mb-1">Buildings</h3>
              {!showBuildings ? (
                <div className="text-sm text-gray-500">
                  <p>Toggle buildings on to view building data</p>
                </div>
              ) : loadingState.buildings ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-green-600"></div>
                  <span className="text-sm text-gray-600">Loading buildings...</span>
                </div>
              ) : errorState.buildings ? (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {errorState.buildings}
                </div>
              ) : buildings ? (
                <>
                  <p className="text-2xl font-mono text-green-600">
                    {buildingCounts[selectedParish.properties.GID_4] ?? 0}
                  </p>
                  
                  {/* Building Details */}
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Building Types:</h4>
                    <div className="space-y-1">
                      {Object.entries(selectedParishBuildingTypes).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span className="text-gray-600">{type}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Zoom in to view buildings</p>
              )}
            </div>
            
            {/* Pollution Sources Section */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Pollution Sources</h3>
              {loadingState.pollutionSources ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-red-600"></div>
                  <span className="text-sm text-gray-600">Loading pollution sources...</span>
                </div>
              ) : errorState.pollutionSources ? (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {errorState.pollutionSources}
                </div>
              ) : (
                <ul className="space-y-2 max-h-[60vh] overflow-auto">
                  {selectedParish 
                    ? selectedParishPollutionSources.map((source, idx) => (
                        <li
                          key={idx}
                          className="bg-white p-3 rounded border-l-4 border-red-500 shadow-sm"
                        >
                          <span className="font-medium text-gray-800">{source.properties.name}</span>
                          {source.properties.type && (
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                {source.properties.type}
                              </span>
                            </div>
                          )}
                        </li>
                      ))
                    : pollutionSources
                        .filter(source => {
                          // Validate coordinates
                          if (!source.geometry?.coordinates || 
                              !Array.isArray(source.geometry.coordinates) || 
                              source.geometry.coordinates.length < 2) {
                            return false;
                          }
                          return true;
                        })
                        .map((source, idx) => (
                          <li
                            key={idx}
                            className="bg-white p-3 rounded border-l-4 border-red-500 shadow-sm"
                          >
                            <span className="font-medium text-gray-800">{source.properties.name}</span>
                            {source.properties.type && (
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                  {source.properties.type}
                                </span>
                              </div>
                            )}
                          </li>
                        ))
                  }
                  {selectedParish 
                    ? selectedParishPollutionSources.length === 0 && (
                        <p className="text-gray-500 italic">No pollution sources found in this parish</p>
                      )
                    : pollutionSources.filter(source => {
                        if (!source.geometry?.coordinates || 
                            !Array.isArray(source.geometry.coordinates) || 
                            source.geometry.coordinates.length < 2) {
                          return false;
                        }
                        return true;
                      }).length === 0 && (
                        <p className="text-gray-500 italic">No pollution sources found in Jinja</p>
                      )
                  }
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>Click on any parish to view detailed information</p>
            <p className="text-sm mt-2">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Buildings (zoom in to view)
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-4 mr-2"></span>
              Pollution Sources
            </p>
          </div>
        )}
      </aside>

      {/* Map */}
      <main className="w-3/4 relative">
        <MapContainer
            ref={(map) => {
              if (map) {
                mapRef.current = map;
                // Set up zoom event listener with proper null checks
                try {
                  map.on('zoomend', () => {
                    if (map && typeof map.getZoom === 'function') {
                      setMapZoom(map.getZoom());
                    }
                  });
                  // Set initial zoom
                  if (typeof map.getZoom === 'function') {
                    setMapZoom(map.getZoom());
                  }
                } catch (e) {
                  console.warn('Error setting up map zoom listener:', e);
                }
              }
            }}
            center={[0.447856, 33.202116]} // Jinja approx center
            zoom={10}
            scrollWheelZoom={true}
            className="h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap contributors'
          />

          {/* Parishes - Always show */}
          {parishes && parishes.features && parishes.features.length > 0 && (
            <GeoJSON
              data={parishes}
              style={parishStyle}
              onEachFeature={onEachParish}
            />
          )}

          {/* Buildings - Only show when zoomed in, parish selected, and toggle is on */}
          {showBuildings && buildings && mapZoom >= 12 && buildings.features
            .filter(building => {
              // Validate building coordinates
              return building && 
                     building.geometry && 
                     building.geometry.coordinates && 
                     Array.isArray(building.geometry.coordinates) && 
                     building.geometry.coordinates.length >= 2 &&
                     typeof building.geometry.coordinates[0] === 'number' &&
                     typeof building.geometry.coordinates[1] === 'number';
            })
            .map((building, index) => (
              <CircleMarker
                key={`building-${index}`}
                center={[building.geometry.coordinates[1], building.geometry.coordinates[0]]}
                radius={4}
                fillColor="#00ff00"
                color="#006600"
                weight={1}
                opacity={1}
                fillOpacity={0.7}
              >
                <Popup>
                  <div className="text-xs">
                    <strong>{building.properties?.name || 'Unknown'}</strong><br/>
                    Type: {building.properties?.type || 'Unknown'}
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {/* Pollution Sources - Show all when no parish selected, or parish-specific when parish selected */}
          {showPollutionSources && pollutionSources.length > 0 && (
            <GeoJSON
              data={{
                type: "FeatureCollection",
                features: pollutionSources.filter(source => {
                  // Validate coordinates for Polygon geometry
                  if (!source || 
                      !source.geometry?.coordinates || 
                      !Array.isArray(source.geometry.coordinates) || 
                      source.geometry.coordinates.length === 0) {
                    return false;
                  }
                  
                  // Check if it's a valid polygon (should be array of arrays)
                  const coords = source.geometry.coordinates[0];
                  if (!Array.isArray(coords) || coords.length < 3) {
                    return false;
                  }
                  
                  // Validate each coordinate pair
                  for (const coord of coords) {
                    if (!Array.isArray(coord) || coord.length < 2 || 
                        typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
                      return false;
                    }
                  }
                  
                  // If parish is selected, only show sources in that parish
                  if (selectedParish) {
                    try {
                      const parishPoly = turf.polygon(selectedParish.geometry.coordinates);
                      const sourcePoly = turf.polygon(source.geometry.coordinates);
                      return turf.booleanIntersects(parishPoly, sourcePoly);
                    } catch (e) {
                      console.warn('Error checking if pollution source is in parish:', e);
                      return false;
                    }
                  }
                  
                  // If no parish selected, show all sources in Jinja
                  return true;
                })
              } as FeatureCollection<Polygon, PollutionSourceProperties>}
              style={{
                fillColor: "#ff0000",
                weight: 2,
                opacity: 1,
                color: "#000",
                fillOpacity: 0.6,
              }}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(`
                  <div class="text-xs">
                    <strong>${feature.properties?.name || 'Unknown'}</strong><br/>
                    Type: ${feature.properties?.type || 'Unknown'}
                  </div>
                `);
              }}
            />
          )}
        </MapContainer>
        
        {/* Layer Controls */}
        <LayerControls 
          showBuildings={showBuildings}
          setShowBuildings={setShowBuildings}
          showPollutionSources={showPollutionSources}
          setShowPollutionSources={setShowPollutionSources}
          buildingsAvailable={!!buildings && mapZoom >= 12}
          pollutionSourcesAvailable={pollutionSources.length > 0}
        />
        
        {/* Loading and Error Indicators */}
        <LoadingIndicator loadingState={loadingState} errorState={errorState} />
        
        {/* Map Legend */}
        <MapLegend 
          showBuildings={showBuildings} 
          showPollutionSources={showPollutionSources} 
        />
      </main>
    </div>
  );
}
