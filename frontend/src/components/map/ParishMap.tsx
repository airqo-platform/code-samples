import React, { useEffect, useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import * as turf from "@turf/turf";
import type { FeatureCollection, Feature, Geometry, Point, Polygon } from "geojson";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then(mod => mod.GeoJSON), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

// Loading and Error States
type LoadingState = {
  parishes: boolean;
  pollutionSources: boolean;
};

type ErrorState = {
  parishes: string | null;
  pollutionSources: string | null;
};

// Layer Visibility Controls
const LayerControls = ({ 
  showPollutionSources, 
  setShowPollutionSources,
  pollutionSourcesAvailable,
  showBuildingsOverlay,
  setShowBuildingsOverlay
}: {
  showPollutionSources: boolean;
  setShowPollutionSources: (show: boolean) => void;
  pollutionSourcesAvailable: boolean;
  showBuildingsOverlay: boolean;
  setShowBuildingsOverlay: (show: boolean) => void;
}) => (
  <div className="bg-white rounded-lg shadow-md p-3 min-w-[200px] w-full">
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
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-700">Buildings Overlay</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showBuildingsOverlay}
            onChange={(e) => setShowBuildingsOverlay(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      </div>
    </div>
    {!pollutionSourcesAvailable && (
      <p className="text-xs text-gray-500 mt-2">Zoom in to a parish to view pollution sources</p>
    )}
  </div>
);

// Update MapLegend container to be wider
const MapLegend = ({ showPollutionSources }: { showPollutionSources: boolean }) => (
  <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-[1000] text-sm w-[220px] max-w-xs">
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
        <div className="flex items-center mt-2">
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

// Update the type definition for the new data structure
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

// Helper to compute land cover percentages from landcover_summary
function computeLandCoverPercentagesFromSummary(landcover_summary: any): { name: string; value: number }[] {
  if (!landcover_summary) return [];
  return Object.entries(landcover_summary).map(([name, obj]: [string, any]) => ({
    name,
    value: typeof obj.percentage === 'number' ? obj.percentage : 0
  })).filter(entry => entry.value > 0);
}

// Helper to compute land cover percentages from buildings array
function computeLandCoverPercentages(buildings: any[]): { name: string; value: number }[] {
  if (!buildings || buildings.length === 0) return [];
  // Example: group by area size buckets (customize as needed)
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

export default function SourcePollutionPage() {
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
  const [showBuildingsOverlay, setShowBuildingsOverlay] = useState(true);
  const mapRef = useRef<any>(null);
  const [landCoverDataBySource, setLandCoverDataBySource] = useState<Record<string, { name: string; value: number }[]>>({});

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

  // Load pollution sources data
  useEffect(() => {
    const loadPollutionSources = async () => {
      setLoadingState(prev => ({ ...prev, pollutionSources: true }));
      setErrorState(prev => ({ ...prev, pollutionSources: null }));
      
      try {
        console.log('Loading pollution sources from combined_data_t.json...');
        const response = await fetch('/mapdata/combined_data_t.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Pollution sources data loaded:', {
          dataType: typeof data,
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'not an array'
        });
        
        if (!Array.isArray(data)) {
          throw new Error('Pollution sources data is not an array');
        }
        
        // Validate the data structure
        const validSources = data.filter((item: any) => {
          return item && 
                 item.type === 'Feature' && 
                 item.geometry && 
                 item.geometry.type === 'Polygon' &&
                 item.geometry.coordinates &&
                 Array.isArray(item.geometry.coordinates) &&
                 item.properties;
        });
        
        console.log('Valid pollution sources:', {
          total: data.length,
          valid: validSources.length,
          invalid: data.length - validSources.length
        });
        
        setPollutionSources(validSources);
      } catch (error) {
        console.error('Error loading pollution sources:', error);
        setErrorState(prev => ({ ...prev, pollutionSources: error instanceof Error ? error.message : 'Failed to load pollution sources' }));
      } finally {
        setLoadingState(prev => ({ ...prev, pollutionSources: false }));
      }
    };

    loadPollutionSources();
  }, []);

  // Pre-calculate pollution source counts per parish
  const pollutionSourceCounts = useMemo(() => {
    if (!parishes || !pollutionSources.length) return {};

    console.log('Computing pollution source counts:', {
      parishesCount: parishes.features.length,
      pollutionSourcesCount: pollutionSources.length
    });

    const counts: Record<string, number> = {};

    for (const parish of parishes.features) {
      try {
        // Validate parish coordinates before creating polygon
        if (!parish.geometry?.coordinates || 
            !Array.isArray(parish.geometry.coordinates) || 
            parish.geometry.coordinates.length === 0) {
          console.warn(`Invalid parish coordinates for ${parish.properties.NAME_4}:`, parish.geometry);
          counts[parish.properties.NAME_4] = 0;
          continue;
        }

        // Check if the polygon has at least 4 positions (first and last should be the same)
        const coords = parish.geometry.coordinates[0];
        if (!Array.isArray(coords) || coords.length < 4) {
          console.warn(`Parish ${parish.properties.NAME_4} has insufficient coordinates:`, coords);
          counts[parish.properties.NAME_4] = 0;
          continue;
        }

        // Validate each coordinate pair
        for (const coord of coords) {
          if (!Array.isArray(coord) || coord.length < 2 || 
              typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
            console.warn(`Invalid coordinate in parish ${parish.properties.NAME_4}:`, coord);
            counts[parish.properties.NAME_4] = 0;
            continue;
          }
        }

        // Buffer the parish polygon slightly to help with precision issues
        const parishPoly = turf.polygon(parish.geometry.coordinates);
        let parishPolyBuffered: Feature<Polygon>;
        try {
          // Buffer returns a Feature<Polygon|MultiPolygon>, but we expect Polygon for our data
          const buffered = turf.buffer(parishPoly, 0.0001, { units: 'degrees' });
          // If buffer returns MultiPolygon, fallback to original
          if (buffered && buffered.geometry.type === 'Polygon') {
            parishPolyBuffered = buffered as Feature<Polygon>;
          } else {
            parishPolyBuffered = parishPoly;
          }
        } catch (e) {
          parishPolyBuffered = parishPoly;
        }
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
          
          // Check if coordinates are valid numbers
          for (const coord of coords) {
            if (!Array.isArray(coord) || coord.length !== 2 || 
                typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
              return false;
            }
          }
          
          try {
            const sourcePoly = turf.polygon(source.geometry.coordinates);
            // Method 1: Check if the centroid of the pollution source is within the parish
            const sourceCentroid = turf.centroid(sourcePoly);
            const centroidInParish = turf.booleanPointInPolygon(sourceCentroid, parishPolyBuffered);
            // Method 2: Check if any part of the pollution source intersects with the parish
            const intersects = turf.booleanIntersects(parishPolyBuffered, sourcePoly);
            // Method 3: Check if the parish contains the pollution source
            const contains = turf.booleanContains(parishPolyBuffered, sourcePoly);
            // Use any of the three methods - if any are true, the pollution source is in the parish
            const isInParish = centroidInParish || intersects || contains;
            // Debug: Log all checks for problematic parishes
            if (counts[parish.properties.NAME_4] === 0 || Math.random() < 0.01) {
              console.log('DEBUG parish/source check:', {
                parish: parish.properties.NAME_4,
                sourceId: source._id.$oid,
                centroidInParish,
                intersects,
                contains,
                isInParish,
                parishBbox: turf.bbox(parishPolyBuffered),
                sourceBbox: turf.bbox(sourcePoly)
              });
            }
            return isInParish;
          } catch (error) {
            console.warn('Error checking intersection for pollution source:', error);
            return false;
          }
        });
        counts[parish.properties.NAME_4] = validSources.length;
        if (validSources.length > 0) {
          console.log(`Parish ${parish.properties.NAME_4} has ${validSources.length} pollution sources`);
        }
        // Extra debug: If count is zero, log all sources and parish geometry
        if (validSources.length === 0) {
          console.log('DEBUG: Parish with zero sources:', {
            parish: parish.properties.NAME_4,
            parishPoly: parish.geometry.coordinates,
            pollutionSources: pollutionSources.map(s => ({
              id: s._id.$oid,
              coords: s.geometry.coordinates
            }))
          });
        }
      } catch (error) {
        console.error(`Error processing parish ${parish.properties.NAME_4}:`, error);
        counts[parish.properties.NAME_4] = 0;
      }
    }

    console.log('Final pollution source counts:', counts);
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
    
    console.log('Calculating pollution sources for selected parish:', {
      parish: selectedParish.properties.NAME_4,
      totalPollutionSources: pollutionSources.length
    });
    
    try {
      // Validate parish coordinates before creating polygon
      if (!selectedParish.geometry?.coordinates || 
          !Array.isArray(selectedParish.geometry.coordinates) || 
          selectedParish.geometry.coordinates.length === 0) {
        console.warn(`Invalid parish coordinates for ${selectedParish.properties.NAME_4}:`, selectedParish.geometry);
        return [];
      }

      // Check if the polygon has at least 4 positions (first and last should be the same)
      const coords = selectedParish.geometry.coordinates[0];
      if (!Array.isArray(coords) || coords.length < 4) {
        console.warn(`Parish ${selectedParish.properties.NAME_4} has insufficient coordinates:`, coords);
        return [];
      }

      // Validate each coordinate pair
      for (const coord of coords) {
        if (!Array.isArray(coord) || coord.length < 2 || 
            typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
          console.warn(`Invalid coordinate in parish ${selectedParish.properties.NAME_4}:`, coord);
          return [];
        }
      }

      const parishPoly = turf.polygon(selectedParish.geometry.coordinates);
      const parishSources = pollutionSources.filter(source => {
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
          
          // Method 1: Check if the centroid of the pollution source is within the parish
          const sourceCentroid = turf.centroid(sourcePoly);
          const centroidInParish = turf.booleanPointInPolygon(sourceCentroid, parishPoly);
          
          // Method 2: Check if any part of the pollution source intersects with the parish
          const intersects = turf.booleanIntersects(parishPoly, sourcePoly);
          
          // Method 3: Check if the parish contains the pollution source
          const contains = turf.booleanContains(parishPoly, sourcePoly);
          
          // Use any of the three methods - if any are true, the pollution source is in the parish
          const isInParish = centroidInParish || intersects || contains;
          
          if (isInParish) {
            console.log('Found pollution source in parish:', {
              parish: selectedParish.properties.NAME_4,
              sourceId: source._id.$oid,
              centroidInParish,
              intersects,
              contains
            });
          }
          
          return isInParish;
        } catch (e) {
          console.warn('Error checking if pollution source is in parish:', e);
          return false;
        }
      });
      
      console.log('Final parish pollution sources:', {
        parish: selectedParish.properties.NAME_4,
        count: parishSources.length,
        sources: parishSources.map(s => s._id.$oid)
      });
      
      return parishSources;
    } catch (e) {
      console.warn('Error calculating pollution sources for selected parish:', e);
      return [];
    }
  }, [selectedParish, pollutionSources]);

  // When selectedParishPollutionSources changes, fetch land cover for each source
  useEffect(() => {
    if (!selectedParishPollutionSources || selectedParishPollutionSources.length === 0) return;
    let cancelled = false;
    async function loadAllLandCover() {
      const newData: Record<string, { name: string; value: number }[]> = {};
      for (const source of selectedParishPollutionSources) {
        const { latitude, longitude } = source.properties;
        const entry = await fetchLandCoverForSource(latitude, longitude);
        if (entry && entry.landcover_summary) {
          newData[source._id.$oid] = computeLandCoverPercentagesFromSummary(entry.landcover_summary);
        } else if (entry && entry.buildings) {
          newData[source._id.$oid] = computeLandCoverPercentages(entry.buildings);
        } else {
          newData[source._id.$oid] = [];
        }
      }
      if (!cancelled) setLandCoverDataBySource(newData);
    }
    loadAllLandCover();
    return () => { cancelled = true; };
  }, [selectedParishPollutionSources]);

  // Handle parish click: zoom and select
  function onEachParish(feature: ParishFeature, layer: any) {
    layer.on({
      click: () => {
        // Immediately switch to the clicked parish
        setSelectedParish(feature);
        
        // Clear buildings if we're switching parishes (will reload if needed)
        // setBuildings(null); // Removed buildings state
        
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
              <div className="text-2xl font-bold text-red-600">
                {selectedParish 
                  ? pollutionSourceCounts[selectedParish.properties.NAME_4] ?? 0
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
                    ? (() => {
                        const filteredSources = selectedParishPollutionSources
                          .filter(source => {
                            // Validate coordinates: check for at least a valid polygon ring
                            if (!source.geometry?.coordinates || 
                                !Array.isArray(source.geometry.coordinates) || 
                                !Array.isArray(source.geometry.coordinates[0]) || 
                                source.geometry.coordinates[0].length < 3) {
                              console.warn('Filtering out source due to invalid coordinates:', source);
                              return false;
                            }
                            return true;
                          });
                        // Add a summary at the top
                        return (
                          <>
                            {filteredSources.length > 0 && (
                              <div className="mb-2 text-sm text-red-700 font-semibold">
                                {filteredSources.length} pollution source{filteredSources.length > 1 ? 's' : ''} found in this parish
                              </div>
                            )}
                            {filteredSources.map((source, idx) => {
                              const confidence = source.properties.confidence_score;
                              const riskLevel = confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low';
                              const riskColor = confidence >= 0.8 ? 'red' : confidence >= 0.6 ? 'orange' : 'yellow';
                              return (
                                <li
                                  key={source._id.$oid || idx}
                                  className="bg-white p-3 rounded border-l-4 border-red-500 shadow-sm"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-gray-800">
                                      Potential Pollution Source {idx + 1}
                                    </span>
                                    <span className={`inline-block px-2 py-1 bg-${riskColor}-100 text-${riskColor}-700 rounded text-xs font-medium`}>
                                      {riskLevel} Risk
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600 space-y-1">
                                    <div className="flex justify-between">
                                      <span>Confidence:</span>
                                      <span className="font-medium">{(confidence * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Location:</span>
                                      <span className="font-mono text-xs">
                                        {source.properties.latitude.toFixed(6)}, {source.properties.longitude.toFixed(6)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                      Detected: {new Date(source.properties.timestamp).toLocaleDateString()}
                                    </div>
                                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                      {confidence >= 0.8 ? (
                                        <span>🔴 High probability of pollution source detected</span>
                                      ) : confidence >= 0.6 ? (
                                        <span>🟡 Moderate probability - requires verification</span>
                                      ) : (
                                        <span>🟢 Low probability - may be false positive</span>
                                      )}
                                    </div>
                                    {/* Donut chart for land cover percentages */}
                                    {landCoverDataBySource[source._id.$oid] && landCoverDataBySource[source._id.$oid].length > 0 && (
                                      <div className="mt-4">
                                        <h4 className="text-xs font-semibold text-blue-700 mb-1">Land Cover (Buildings by Area)</h4>
                                        <div style={{ width: '100%', height: 180 }}>
                                          <ResponsiveContainer width="100%" height={180}>
                                            <PieChart>
                                              <Pie
                                                data={landCoverDataBySource[source._id.$oid]}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={70}
                                                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                                                paddingAngle={2}
                                              >
                                                {landCoverDataBySource[source._id.$oid].map((entry, i) => (
                                                  <Cell key={`cell-${i}`} fill={["#4ade80", "#fbbf24", "#f87171"][i % 3]} />
                                                ))}
                                              </Pie>
                                              <Tooltip formatter={(value) => [typeof value === 'number' ? `${value.toFixed(1)}%` : value, "Percent"]} />
                                              <Legend />
                                            </PieChart>
                                          </ResponsiveContainer>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </>
                        );
                      })()
                    : (() => {
                        console.log('Rendering all pollution sources:', {
                          totalSources: pollutionSources.length,
                          showPollutionSources: showPollutionSources,
                          sources: pollutionSources.slice(0, 5) // Log first 5 for debugging
                        });
                        
                        const filteredSources = pollutionSources
                          .filter(source => {
                            // Validate coordinates
                            if (!source.geometry?.coordinates || 
                                !Array.isArray(source.geometry.coordinates) || 
                                source.geometry.coordinates.length < 2) {
                              console.warn('Filtering out source due to invalid coordinates:', source);
                              return false;
                            }
                            return true;
                          })
                          .slice(0, 10); // Show only first 10 for overview
                        
                        console.log('Filtered all sources for rendering:', {
                          beforeFilter: pollutionSources.length,
                          afterFilter: filteredSources.length,
                          sources: filteredSources.slice(0, 5).map(s => ({ id: s._id.$oid, confidence: s.properties.confidence_score }))
                        });
                        
                        return filteredSources.map((source, idx) => {
                          const confidence = source.properties.confidence_score;
                          const riskLevel = confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low';
                          const riskColor = confidence >= 0.8 ? 'red' : confidence >= 0.6 ? 'orange' : 'yellow';
                          
                          return (
                            <li
                              key={source._id.$oid || idx}
                              className="bg-white p-3 rounded border-l-4 border-red-500 shadow-sm"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-gray-800">
                                  Potential Pollution Source {idx + 1}
                                </span>
                                <span className={`inline-block px-2 py-1 bg-${riskColor}-100 text-${riskColor}-700 rounded text-xs font-medium`}>
                                  {riskLevel} Risk
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex justify-between">
                                  <span>Confidence:</span>
                                  <span className="font-medium">{(confidence * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Location:</span>
                                  <span className="font-mono text-xs">
                                    {source.properties.latitude.toFixed(6)}, {source.properties.longitude.toFixed(6)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                  Detected: {new Date(source.properties.timestamp).toLocaleDateString()}
                                </div>
                                
                                {/* Additional context based on confidence */}
                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                  {confidence >= 0.8 ? (
                                    <span>🔴 High probability of pollution source detected</span>
                                  ) : confidence >= 0.6 ? (
                                    <span>🟡 Moderate probability - requires verification</span>
                                  ) : (
                                    <span>🟢 Low probability - may be false positive</span>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        });
                      })()
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
                  
                  {/* Add informational note */}
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">About Pollution Sources</h4>
                    <p className="text-xs text-blue-700">
                      These are potential pollution sources identified using remote sensing data. 
                      Confidence scores indicate the reliability of detection. 
                      High confidence sources should be prioritized for field verification.
                    </p>
                  </div>
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>Click on any parish to view detailed information</p>
            <p className="text-sm mt-2">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
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
                  
                  // Check if coordinates are valid numbers
                  for (const coord of coords) {
                    if (!Array.isArray(coord) || coord.length !== 2 || 
                        typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
                      return false;
                    }
                  }
                  
                  // If a parish is selected, only show sources in that parish
                  if (selectedParish) {
                    try {
                      const parishPoly = turf.polygon(selectedParish.geometry.coordinates);
                      const sourcePoly = turf.polygon(source.geometry.coordinates);
                      return turf.booleanIntersects(parishPoly, sourcePoly);
                    } catch (error) {
                      console.warn('Error checking parish intersection for pollution source:', error);
                      return false;
                    }
                  }
                  
                  return true;
                }).map(source => ({
                  type: "Feature",
                  geometry: source.geometry,
                  properties: {
                    ...source.properties,
                    confidence_score: source.properties.confidence_score,
                    timestamp: source.properties.timestamp
                  }
                }))
              } as any}
              style={(feature) => ({
                fillColor: '#ff4444',
                weight: 1,
                opacity: 0.8,
                color: '#cc0000',
                fillOpacity: 0.4
              })}
              onEachFeature={(feature, layer) => {
                if (feature.properties) {
                  const popupContent = `
                    <div>
                      <strong>Pollution Source</strong><br/>
                      Confidence: ${(feature.properties.confidence_score * 100).toFixed(1)}%<br/>
                      Timestamp: ${feature.properties.timestamp}<br/>
                      Location: ${feature.properties.latitude.toFixed(6)}, ${feature.properties.longitude.toFixed(6)}
                    </div>
                  `;
                  layer.bindPopup(popupContent);
                }
              }}
            />
          )}
        </MapContainer>
        
        {/* Loading and Error Indicators */}
        <LoadingIndicator loadingState={loadingState} errorState={errorState} />
        
        {/* Map Legend */}
        <div className="absolute top-4 right-4 z-[1000]">
          <MapLegend showPollutionSources={showPollutionSources} />
        </div>
        {/* Layer Controls: position further below the legend, top-right */}
        <div className="absolute right-4 top-60 z-[1000]">
          <LayerControls 
            showPollutionSources={showPollutionSources}
            setShowPollutionSources={setShowPollutionSources}
            pollutionSourcesAvailable={pollutionSources.length > 0}
            showBuildingsOverlay={showBuildingsOverlay}
            setShowBuildingsOverlay={setShowBuildingsOverlay}
          />
        </div>
      </main>
    </div>
  );
}
