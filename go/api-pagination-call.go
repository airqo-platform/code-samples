package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func makeSubsequentRequests(baseUrl string, endpointPath string, start string, end string, totalPages int) {
	for page := 1; page <= totalPages; page++ {
		url := fmt.Sprintf("%s/%s?startTime=%s&endTime=%s&page=%d", baseUrl, endpointPath, start, end, page)
		response, err := http.Get(url)
		if err != nil {
			fmt.Println("Error:", err)
			return
		}
		defer response.Body.Close()

		body, err := ioutil.ReadAll(response.Body)
		if err != nil {
			fmt.Println("Error reading response body:", err)
			return
		}

		// Process the response data as needed

		// Check and update the startTime and endTime for the next request
		// Extract startTime and endTime from the response body

		// For demonstration purposes, print the details
		fmt.Printf("Page %d processed. New startTime: %s, new endTime: %s\n", page, start, end)
	}
}

func main() {
	baseUrl := "YOUR_BASE_URL"
	endpointPath := "rest-of-your-endpoint-path"
	start := "2022-11-14T20:00:45.061Z"
	end := "2023-11-21T20:00:45.061Z"
	totalPages := 23

	makeSubsequentRequests(baseUrl, endpointPath, start, end, totalPages)
}
