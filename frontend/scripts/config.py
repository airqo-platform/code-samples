import os
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
print(BASE_DIR)
dotenv_path = os.path.join(BASE_DIR, '.env')
print(dotenv_path)
load_dotenv(dotenv_path)

class Config:
    DEBUG = False
    TESTING = False
    MONGO_URI_NETMANAGER = os.getenv('MONGO_URI_NETMANAGER')
    DB_NAME_NETMANAGER = os.getenv("DB_NAME_NETMANAGER")

class DevelopmentConfig(Config):
    DEBUG = True
    MONGO_URI_NETMANAGER = os.getenv('MONGO_DEV_URI_NETMANAGER')
    DB_NAME_NETMANAGER = os.getenv("DB_NAME_DEV_NETMANAGER")

class StagingConfig(Config):
    MONGO_URI_NETMANAGER = os.getenv('MONGO_STAGE_URI_NETMANAGER')
    DB_NAME_NETMANAGER = os.getenv("DB_NAME_STAGE_NETMANAGER")

class ProductionConfig(Config):
    MONGO_URI_NETMANAGER = os.getenv('MONGO_PROD_URI_NETMANAGER')
    DB_NAME_NETMANAGER = os.getenv("DB_NAME_PROD_NETMANAGER")

app_config = {
    "development": DevelopmentConfig,
    "staging": StagingConfig,
    "production": ProductionConfig
}

environment = os.getenv("ENV", "staging")
configuration = app_config.get(environment, StagingConfig)

def connect_mongo():
    print("Current environment:", environment)
    print("MongoDB URI:", configuration.MONGO_URI_NETMANAGER)
    print("Database name:", configuration.DB_NAME_NETMANAGER)
    client = MongoClient(configuration.MONGO_URI_NETMANAGER)
    db = client[configuration.DB_NAME_NETMANAGER]
    return db
