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

// Satellite API service to fetch data with POST request, accepting only body
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
