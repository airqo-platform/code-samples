# model.py

import os
import pandas as pd
import numpy as np
import geopandas as gpd
from shapely.geometry import Point
from pymongo import MongoClient
from datetime import datetime
from data import get_airquality_data
from dotenv import load_dotenv
from scipy.spatial import cKDTree
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# MongoDB Config
MONGO_URI = os.getenv("MONGO_DEV_URI_NETMANAGER", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME_DEV_NETMANAGER", "airqo_netmanager_staging")

# Path to GeoJSON directory (relative to project root)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEOJSON_DIR = os.path.join(BASE_DIR, "public", "shapefiles")

def connect_mongo():
    client = MongoClient(MONGO_URI)
    return client[DB_NAME]

def idw_interpolation(lons, lats, values, xi, yi, power=2, k=5):
    tree = cKDTree(np.column_stack([lons, lats]))
    dist, idx = tree.query(np.column_stack([xi, yi]), k=k)
    weights = 1 / (dist ** power + 1e-10)
    weights /= weights.sum(axis=1)[:, None]
    return np.sum(values[idx] * weights, axis=1)

def run_prediction():
    df = get_airquality_data()

    cities = df["city"].unique()
    for city in cities:
        city_data = df[df["city"] == city]

        # Skip if fewer than 10 readings
        if city_data.shape[0] < 10:
            logging.warning(f"Skipping '{city}': only {city_data.shape[0]} readings (requires ≥ 10).")
            continue

        country = city_data["country"].iloc[0].lower()

        # Load appropriate GeoJSON for the country
        geojson_file = os.path.join(GEOJSON_DIR, f"{country}_adm2.geojson")
        if not os.path.exists(geojson_file):
            logging.warning(f"GeoJSON for country '{country}' not found. Skipping city '{city}'.")
            continue

        try:
            country_gdf = gpd.read_file(geojson_file)
        except Exception as e:
            logging.error(f"Error reading GeoJSON for {country}: {e}")
            continue

        polygon_match = country_gdf[country_gdf["region"].str.lower() == city.lower()]
        if polygon_match.empty:
            logging.warning(f"No polygon match found for city '{city}' in {country}. Skipping.")
            continue

        poly = polygon_match.geometry.unary_union

        # Generate grid points
        min_lon, max_lon = city_data["longitude"].min(), city_data["longitude"].max()
        min_lat, max_lat = city_data["latitude"].min(), city_data["latitude"].max()
        grid_size = 1000

        xi = np.random.uniform(min_lon, max_lon, grid_size)
        yi = np.random.uniform(min_lat, max_lat, grid_size)

        grid_df = pd.DataFrame({"longitude": xi, "latitude": yi})
        grid_df["geometry"] = [Point(x, y) for x, y in zip(xi, yi)]
        grid_gdf = gpd.GeoDataFrame(grid_df, geometry="geometry", crs="EPSG:4326")

        grid_clipped = grid_gdf[grid_gdf.geometry.within(poly)].copy()
        if grid_clipped.empty:
            logging.warning(f"No grid points within polygon for city '{city}'. Skipping.")
            continue

        xi_clipped = grid_clipped["longitude"].values
        yi_clipped = grid_clipped["latitude"].values

        # IDW interpolation
        lons = city_data["longitude"].values
        lats = city_data["latitude"].values
        pm25 = city_data["pm2_5"].values

        predicted_pm = idw_interpolation(lons, lats, pm25, xi_clipped, yi_clipped)
        grid_clipped["pm2_5"] = predicted_pm

        # Prepare document
        airqloud = city
        airqloud_id = f"{country}_{city}".lower()
        timestamp = datetime.utcnow().replace(minute=0, second=0, microsecond=0)

        result_doc = {
            "airqloud": airqloud,
            "airqloud_id": airqloud_id,
            "created_at": timestamp,
            "values": []
        }

        for _, row in grid_clipped.iterrows():
            result_doc["values"].append({
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "predicted_value": row["pm2_5"],
                "variance": None,
                "interval": None
            })

        # Save to MongoDB
        db = connect_mongo()
        collection = db["idw_model_predictions"]
        collection.delete_many({"airqloud": airqloud})
        collection.insert_one(result_doc)

        logging.info(f"✅ Saved predictions for '{city}' with {len(result_doc['values'])} grid points.")

if __name__ == "__main__":
    run_prediction()
