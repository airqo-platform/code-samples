import axios from "axios"
import { NextResponse } from "next/server"
import { Location, SiteLocatorPayload, SiteLocatorResponse,
    SiteInformation, SiteLocation, SiteCategoryResponse, 
    ControlPanelProps, GridOption, AirQualityReportPayload,
    AirQualityReportResponse, DiurnalData,  MonthlyData,
    DailyMeanData, SatelliteDataPayload, SatelliteDataResponse,
    Grid, Site

 } from "./types"


const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const PUBLIC_LOCATE_API_URL = process.env.NEXT_PUBLIC_LOCATE_API_URL;
const PUBLIC_SITE_CATEGORY_API_URL = process.env.NEXT_PUBLIC_SITE_CATEGORY_API_URL;
const PUBLIC_AIR_QUALITY_REPORT_API_URL_LLM = process.env.NEXT_PUBLIC_AIR_QUALITY_REPORT_API_URL_LLM;
const PUBLIC_SATELLITE_DATA_API_URL = process.env.NEXT_PUBLIC_SATELLITE_DATA_API_URL;
const PUBLIC_DEVICE_DATA_API_URL = process.env.NEXT_PUBLIC_DEVICE_DATA_API_URL;
const PUBLIC_GRID_SUMMARY_API_URL = process.env.NEXT_PUBLIC_GRID_SUMMARY_API_URL;


export async function submitLocations(payload: SiteLocatorPayload): Promise<SiteLocatorResponse> {
    try {
      if (!PUBLIC_LOCATE_API_URL || !API_TOKEN) {
        throw new Error('API configuration missing');
      }
  
      console.log('Making API request to:', PUBLIC_LOCATE_API_URL);
      console.log('Request payload:', payload);
  
      const response = await fetch(`${PUBLIC_LOCATE_API_URL}?token=${API_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', errorData);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('API Response data:', data);
      return data;
    } catch (error) {
      console.error('Error submitting locations:', error);
      throw error;
    }
  }
  
  export async function getSiteCategory(latitude: number, longitude: number): Promise<SiteCategoryResponse> {
    try {
      if (!PUBLIC_SITE_CATEGORY_API_URL || !API_TOKEN) {
        throw new Error('API configuration missing');
      }
  
      console.log('Making site category API request for:', { latitude, longitude });
  
      const response = await fetch(
        `${PUBLIC_SITE_CATEGORY_API_URL}?latitude=${latitude}&longitude=${longitude}&token=${API_TOKEN}`
      );
  
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', errorData);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('Site category API Response:', data);
      return data;
    } catch (error) {
      console.error('Error getting site category:', error);
      throw error;
    }
  }
  
  export async function getAirQualityReport(payload: AirQualityReportPayload): Promise<AirQualityReportResponse> {
    try {
      const response = await fetch(`${PUBLIC_AIR_QUALITY_REPORT_API_URL_LLM}?token=${API_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', errorData);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('Air Quality Report Response:', data);
      return data;
    } catch (error) {
      console.error('Error getting air quality report:', error);
      throw error;
    }
  }
  
  
  export async function fetchGrids(): Promise<Grid[]> { 
    const response = await fetch(`${PUBLIC_GRID_SUMMARY_API_URL}`);
    if (!response.ok) { 
      throw new Error('Failed to fetch grids');
    }
    const data = await response.json();
    return data.grids;
  }