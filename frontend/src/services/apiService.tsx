import { removeTrailingSlash } from "@utils/index";
import axios from "axios";

const apiToken = process.env.NEXT_PUBLIC_API_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Axios instance with a base URL and default headers
const apiService = axios.create({
  baseURL: removeTrailingSlash(BASE_URL),
  headers: {
    "Content-Type": "application/json",
  },
});

// Interface for health tip
interface HealthTip {
  title?: string;
  description?: string;
  image?: string;
}

// Interface for measurement value
interface MeasurementValue {
  value: number | null;
}

// Interface for site details
interface SiteDetails {
  _id: string;
  name: string;
  formatted_name?: string;
  approximate_latitude?: number;
  approximate_longitude?: number;
  country?: string;
  location_name?: string;
  city?: string;
  region?: string;
  data_provider?: string;
}

// Interface for map node measurement
interface MapNode {
  _id: string;
  site_id: string;
  time: string;
  aqi_category?: string;
  aqi_color?: string;
  aqi_color_name?: string;
  device: string;
  device_id: string;
  pm2_5: MeasurementValue;
  pm10: MeasurementValue;
  no2: Partial<MeasurementValue>;
  health_tips: HealthTip[];
  siteDetails: SiteDetails;
  createdAt: string;
  updatedAt: string;
}

interface PollutionProperties {
  latitude: number;
  longitude: number;
  confidence_score: number;
  timestamp: string;
  total_road_length: number;
  road_density: number;
  intersection_count: number;
  number_of_buildings: number;
  building_density: number;
  service: number;
  mean_AOD: number;
  mean_CO: number;
  mean_NO2: number;
}


// Satellite API service to fetch data with POST request
export const getSatelliteData = async (body = {}) => {
  try {
    const response = await apiService.post(
      "/spatial/satellite_prediction",
      body,
      {
        params: {
          token: apiToken,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(error);
  }
};

// Get map nodes with air quality readings
export const getMapNodes = async (): Promise<MapNode[] | null> => {
  try {
    const response = await apiService.get("/devices/readings/map", {
      params: {
        token: apiToken,
      },
    });

    // Only check if measurements array exists and has data
    if (!response.data?.measurements?.length) {
      console.error('No measurements found in response');
      return null;
    }

    return response.data.measurements;
  } catch (error) {
    console.error('Error fetching map nodes:', error);
    return null;
  }
};





export const fetchPollutionData = async (): Promise<PollutionProperties[] | null> => {
  try {
    const response = await apiService.get("/spatial/get-all-data");

    // Validate if features exist in the response
    if (!response.data?.features?.length) {
      console.error('No features found in response');
      return null;
    }

    // Extract and map properties from features
    const pollutionProperties = response.data.features.map((feature: any) => feature.properties);

    return pollutionProperties as PollutionProperties[];
  } catch (error) {
    console.error('Error fetching pollution data:', error);
    return null;
  }
};
