import requests

airqloud_id = 'your_airqloud_id'  # Replace with the AirQloud ID for City X
access_token = 'your_access_token'  # Replace with your access token

api_url = f"https://api.airqo.net/api/v2/devices/measurements/airqlouds/{airqloud_id}?token={access_token}"

response = requests.get(api_url)

if response.status_code == 200:
    data = response.json()
    if 'data' in data:
        for measurement in data['data']:
            print(f"Date: {measurement['date']}")
            print(f"PM2.5: {measurement['pm25']}")
            # Include more data fields as needed
            print()
    else:
        print("Error: Unable to fetch data")
else:
    print("Error: Request failed")
