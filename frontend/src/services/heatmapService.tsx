export interface AirQualityDataPoint {
  timestamp?: string;
  longitude: number;
  latitude: number;
  pm2_5: number;
  // Optional fields for future expansion
  pm10?: number;
  no2?: number;
}

export interface HeatmapResponse {
  timestamp: string;
  values: AirQualityDataPoint[];
}

interface CachedData {
  data: AirQualityDataPoint[];
  timestamp: number;
}

const CACHE_KEY = 'airqo_heatmap_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

const getCachedData = (): CachedData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - timestamp < CACHE_TTL) {
      return { data, timestamp };
    }
    
    // Cache expired, remove it
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error reading heatmap cache:', error);
    return null;
  }
};

const setCachedData = (data: AirQualityDataPoint[]): void => {
  try {
    const cacheData: CachedData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing heatmap cache:', error);
  }
};

export const fetchHeatmapData = async (forceRefresh = false): Promise<AirQualityDataPoint[]> => {
  // Check cache first unless force refresh is requested
  if (!forceRefresh) {
    const cached = getCachedData();
    if (cached) {
      console.log('Serving heatmap data from cache');
      return cached.data;
    }
  }

  try {
    console.log('Fetching fresh heatmap data');
    const response = await fetch('/api/heatmap-data');
    if (!response.ok) throw new Error('Failed to fetch heatmap data');
    
    const data = await response.json();
    
    // Cache the new data
    setCachedData(data);
    
    return data;
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    // If fetch fails and we have stale cache, return it
    const staleCache = getCachedData();
    if (staleCache) {
      console.log('Using stale cache due to fetch error');
      return staleCache.data;
    }
    throw error;
  }
};

// Utility function to force refresh the cache
export const refreshHeatmapCache = async (): Promise<AirQualityDataPoint[]> => {
  return fetchHeatmapData(true);
};
