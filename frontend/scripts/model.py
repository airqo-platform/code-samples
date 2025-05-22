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

load_dotenv()
logging.basicConfig(level=logging.INFO)

MONGO_URI = os.getenv("MONGO_DEV_URI_NETMANAGER", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME_DEV_NETMANAGER", "airqo_netmanager_staging")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEOJSON_DIR = os.path.join(BASE_DIR, "public", "shapefiles")

def idw_interpolation(lons, lats, values, xi, yi, power=2, k=5):
    # Ensure k is not larger than the number of data points
    k = min(k, len(lons))
    if k == 0:
        return np.full_like(xi, np.nan)
    
    # Input validation
    if len(lons) != len(lats) or len(lons) != len(values):
        raise ValueError("Input arrays must have the same length")
    if len(xi) != len(yi):
        raise ValueError("Target coordinate arrays must have the same length")
    
    # Handle case where all input points are identical
    if len(np.unique(np.column_stack([lons, lats]), axis=0)) == 1:
        return np.full_like(xi, values[0])
        
    tree = cKDTree(np.column_stack([lons, lats]))
    dist, idx = tree.query(np.column_stack([xi, yi]), k=k)
    
    # Handle case where some points have no valid neighbors
    mask = ~np.isinf(dist).any(axis=1)
    if not mask.any():
        return np.full_like(xi, np.nan)
    
    # Calculate weights with better numerical stability
    weights = np.zeros_like(dist)
    weights[mask] = 1 / (dist[mask] ** power + 1e-10)
    
    # Normalize weights only for valid points
    weight_sums = weights.sum(axis=1)
    valid_mask = weight_sums > 0
    weights[valid_mask] /= weight_sums[valid_mask][:, None]
    
    # Calculate predictions
    result = np.full_like(xi, np.nan)
    result[valid_mask] = np.sum(values[idx[valid_mask]] * weights[valid_mask], axis=1)
    
    return result

def connect_mongo():
    client = MongoClient(MONGO_URI)
    return client[DB_NAME]

def run_prediction():
    df = get_airquality_data()
    
    if df.empty:
        logging.warning("No air quality data received. Skipping prediction run.")
        return

    cities = df["city"].unique()
    logging.info(f"Unique cities found in data: {list(cities)}")

    for city in cities:
        logging.info(f"Processing city: {city}")
        city_data = df[df["city"] == city]
        country = city_data["country"].iloc[0].lower()
        print(city_data)

        # Load appropriate GeoJSON for the country
        geojson_file = os.path.join(GEOJSON_DIR, f"{country}_adm2.geojson")
        print(geojson_file)
        if not os.path.exists(geojson_file):
            logging.warning(f"GeoJSON file for country '{country}' not found. Skipping {city}.")
            continue

        try:
            country_gdf = gpd.read_file(geojson_file)
        except Exception as e:
            logging.error(f"Error loading GeoJSON for {country}: {e}")
            continue

        polygon_match = country_gdf[country_gdf["region"].str.lower() == city.lower()]
        
        if polygon_match.empty:
            logging.warning(f"No polygon match for city '{city}' in {country}. Skipping.")
            continue
        else:
            logging.info(f"Found polygon match for city '{city}' in {country}.")

        poly = polygon_match.geometry.union_all()

        # Generate prediction grid
        min_lon, max_lon = city_data["longitude"].min(), city_data["longitude"].max()
        min_lat, max_lat = city_data["latitude"].min(), city_data["latitude"].max()
        grid_size = 1000  # adjust as needed

        xi = np.random.uniform(min_lon, max_lon, grid_size)
        yi = np.random.uniform(min_lat, max_lat, grid_size)

        grid_df = pd.DataFrame({"longitude": xi, "latitude": yi})
        grid_df["geometry"] = [Point(x, y) for x, y in zip(xi, yi)]
        grid_gdf = gpd.GeoDataFrame(grid_df, geometry="geometry", crs="EPSG:4326")

        grid_clipped = grid_gdf[grid_gdf.geometry.within(poly)].copy()
        if grid_clipped.empty:
            logging.warning(f"No points within polygon for {city}. Skipping.")
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

        # Save to DB
        db = connect_mongo()
        collection_name = "idw_model_predictions"
        collection = db[collection_name]

        # Delete previous predictions
        collection.delete_many({"airqloud": airqloud})
        collection.insert_one(result_doc)

        logging.info(f"✅ Predictions for '{city}' saved successfully.")

if __name__ == "__main__":
    run_prediction()
