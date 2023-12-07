import requests

# Sample function to make subsequent requests
def make_subsequent_requests(base_url, endpoint_path, start, end, total_pages):
    for page in range(1, total_pages + 1):
        response = requests.get(f'{base_url}/{endpoint_path}?startTime={start}&endTime={end}&page={page}')

        # Process the response data as needed

        # Check and update the startTime and endTime for the next request
        meta = response.json()['meta']
        start, end = meta['startTime'], meta['endTime']

        # For demonstration purposes, print the details
        print(f'Page {page} processed. New startTime: {start}, new endTime: {end}')

# Example usage
base_url = 'YOUR_BASE_URL'
endpoint_path = 'rest-of-your-endpoint-path'
start = '2022-11-14T20:00:45.061Z'
end = '2023-11-21T20:00:45.061Z'
total_pages = 23

make_subsequent_requests(base_url, endpoint_path, start, end, total_pages)
