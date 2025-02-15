export interface Location {
    lat: number;
    lng: number;
  }
export  interface FileUploadProps {
    onUpload: (locations: Location[]) => void;
  }
  
export interface SiteLocatorPayload {
    polygon: {
      coordinates: number[][][]; // 3D array for the polygon coordinates
    };
    must_have_locations: number[][]; // Array of must-have locations (latitude, longitude)
    min_distance_km: number; // Minimum distance for placement in kilometers
    num_sensors: number; // Number of sensors to deploy
  }
  
export interface SiteInformation {
    category_counts: {
      [key: string]: number; // Counts of categories
    };
    total_sites: number; // Total number of sites
  }
  
  export interface SiteLocation {
    area_name: string; // Name of the area
    category: string; // Category of the site
    highway: string | null; // Highway information, if any
    landuse: string | null; // Land use type
    latitude: number; // Latitude of the site
    longitude: number; // Longitude of the site
    natural: string | null; // Natural feature info, if any
  }
  
  export interface SiteLocatorResponse {
    site_information: SiteInformation; // Information about the sites
    site_location: SiteLocation[]; // Array of site locations
  }
  
  export interface ControlPanelProps {
    onSubmit: (data: SiteLocatorPayload) => void;
    polygon: Location[]; // Polygon points defining an area
    mustHaveLocations: Location[]; // Must-have locations for site placement
    onMustHaveLocationsChange: (locations: Location[]) => void; // Callback for changes in must-have locations
  }
  
  export interface SiteCategoryResponse {
    site: {
      OSM_info: string[]; // OpenStreetMap info
      'site-category': {
        area_name: string;
        category: string;
        highway: string;
        landuse: string;
        latitude: number;
        longitude: number;
        natural: string;
        search_radius: number;
        waterway: string;
      };
    };
  }
  
  export interface GridOption {
    grid_id: string; // Grid identifier
    grid_name: string; // Name of the grid
  }
  
  export interface AirQualityReportPayload {
    grid_id: string; // Grid identifier
    start_time: string; // Start time for the report
    end_time: string; // End time for the report
  }
  
  export interface DailyMeanData {
    date: string; // Date of the data
    pm10_calibrated_value: number | null; // Calibrated PM10 value
    pm10_raw_value: number; // Raw PM10 value
    pm2_5_calibrated_value: number | null; // Calibrated PM2.5 value
    pm2_5_raw_value: number; // Raw PM2.5 value
  }
  
  export interface DiurnalData {
    hour: number; // Hour of the day
    pm10_calibrated_value: number; // Calibrated PM10 value
    pm10_raw_value: number; // Raw PM10 value
    pm2_5_calibrated_value: number; // Calibrated PM2.5 value
    pm2_5_raw_value: number; // Raw PM2.5 value
  }
  
  export interface MonthlyData {
    month: number; // Month number
    year: number; // Year
    pm10_calibrated_value: number; // Calibrated PM10 value
    pm10_raw_value: number; // Raw PM10 value
    pm2_5_calibrated_value: number; // Calibrated PM2.5 value
    pm2_5_raw_value: number; // Raw PM2.5 value
    site_latitude: number; // Latitude of the site
    site_longitude: number; // Longitude of the site
    site_name: string; // Name of the site
  }
  
  export interface AirQualityReportResponse {
    report: {
      daily_mean_data: DailyMeanData[]; // Daily mean data for the report
      diurnal: DiurnalData[]; // Diurnal data for the report
      monthly_data: MonthlyData[]; // Monthly data for the report
      report: string; // Textual report
    };
  }
  
  export interface SatelliteDataPayload {
    latitude: number; // Latitude for satellite data
    longitude: number; // Longitude for satellite data
    timestamp: string; // Timestamp for satellite data
  }
  
  export interface SatelliteDataResponse {
    latitude: number; // Latitude
    longitude: number; // Longitude
    pm2_5_prediction: number; // PM2.5 prediction value
    timestamp: string; // Timestamp
  }
  
  export interface Grid {
    _id: string; // Grid ID
    name: string; // Grid name
    admin_level: string; // Administrative level of the grid
    network: string; // Network type
    long_name: string; // Long name for the grid
    sites: Site[]; // List of sites in the grid
  }
  
  export interface Site {
    _id: string; // Site ID
    search_name: string; // Searchable name for the site
    city: string; // City where the site is located
    district: string; // District of the site
    county: string; // County of the site
    region: string; // Region of the site
    country: string; // Country of the site
    name: string; // Site name
    site_category: {
      category: string; // Category of the site
    };
    groups: string[]; // Groups associated with the site
    lastActive: string; // Last active timestamp
  }
  