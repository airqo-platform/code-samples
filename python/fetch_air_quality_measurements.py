# This Python script demonstrates how to fetch recent air quality measurements from the AirQo API. It uses the requests library to send a GET request to the API and parse the JSON response. This example is suitable for beginners looking to understand API interactions in Python.
import requests

API_KEY = 'YOUR_API_KEY_HERE'  # Replace YOUR_API_KEY_HERE with your actual API key
DEVICE_ID = '6422a4e8a'
BASE_URL = f'https://api.airqo.net/api/v2/devices/measurements/devices/{DEVICE_ID}/recent/?token={API_KEY}'

try:
    # Send the GET request to the AirQo API
    response = requests.get(BASE_URL)
    
    # Check if the request was successful
    if response.status_code == 200:
        data = response.json()
        print(data)
    else:
        print(f"Failed to retrieve data. Status Code: {response.status_code}")
except Exception as e:
    print(f"An error occurred: {e}")
