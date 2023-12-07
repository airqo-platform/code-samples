const axios = require('axios');

// Sample meta field response below:

/*****
"meta": {
    "total": 22835,
    "skip": 0,
    "limit": 1000,
    "page": 1,
    "pages": 23,
    "startTime": "2023-11-14T20:00:45.061Z",
    "endTime": "2023-11-21T20:00:45.061Z"
}
****/

// Sample function to make subsequent requests
async function makeSubsequentRequests(baseUrl, endpointPath, start, end, totalPages) {
  for (let page = 1; page <= totalPages; page++) {
    const response = await axios.get(`${baseUrl}/${endpointPath}?startTime=${start}&endTime=${end}&page=${page}`);
    
    // Process the response data as needed

    // Check and update the startTime and endTime for the next request
    const meta = response.data.meta;
    start = meta.startTime;
    end = meta.endTime;

    // For demonstration purposes, log the details
    console.log(`Page ${page} processed. New startTime: ${start}, new endTime: ${end}`);
  }
}

// Example usage
const baseUrl = 'YOUR_BASE_URL';
const endpointPath = 'rest-of-your-endpoint-path';
const start = '2022-11-14T20:00:45.061Z';
const end = '2023-11-21T20:00:45.061Z';
const totalPages = 23;

makeSubsequentRequests(baseUrl, endpointPath, start, end, totalPages);
