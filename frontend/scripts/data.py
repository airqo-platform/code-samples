# data.py

import requests
import pandas as pd
import os
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

API_URL = os.getenv("NEXT_PUBLIC_API_URL")
API_TOKEN = os.getenv("NEXT_PUBLIC_API_TOKEN")

def get_airquality_data():
    """
    Fetches air quality data from AirQo API and prepares a DataFrame.
    Uses actual sensor coordinates from 'siteDetails.site_category.latitude/longitude'.
    """
    if not API_URL or not API_TOKEN:
        raise ValueError("Missing API URL or Token in environment variables")

    url = f"{API_URL}devices/readings/map?token={API_TOKEN}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch data from API: {e}")
        raise RuntimeError(f"Failed to fetch data from API: {e}")

    data = response.json().get("measurements", [])

    # Confirm it's a list
    if not isinstance(data, list):
        logger.error("API did not return a list of records")
        raise ValueError("API did not return a list of records")

    records = []

    for item in data:
        try:
            site = item.get("siteDetails", {})
            site_cat = site.get("site_category", {})

            lat = site_cat.get("latitude")
            lon = site_cat.get("longitude")
            pm = item.get("pm2_5", {}).get("value")

            if isinstance(lat, (float, int)) and isinstance(lon, (float, int)) and isinstance(pm, (float, int)):
                records.append({
                    "latitude": float(lat),
                    "longitude": float(lon),
                    "pm2_5": float(pm),
                    "timestamp": item.get("time"),
                    "city": site.get("city", "unknown").strip(),
                    "country": site.get("country", "unknown").strip()
                })
        except Exception as e:
            logger.warning(f"Skipping record due to error: {e}")

    if not records:
        logger.error("No valid air quality records with usable coordinates found")
        raise ValueError("No valid air quality records with usable coordinates found.")

    df = pd.DataFrame(records)
    
    # Log unique cities and countries for debugging
    logger.info(f"Unique Cities: {df['city'].unique()}")
    logger.info(f"Unique Countries: {df['country'].unique()}")

    return df

# Optional main block for testing
if __name__ == "__main__":
    try:
        data = get_airquality_data()
        print(data)
    except Exception as e:
        print(f"Error: {e}")