import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class PaginationExample {
    public static void makeSubsequentRequests(String baseUrl, String endpointPath, String start, String end, int totalPages) throws Exception {
        for (int page = 1; page <= totalPages; page++) {
            URL url = new URL(baseUrl + "/" + endpointPath + "?startTime=" + start + "&endTime=" + end + "&page=" + page);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");

            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            String line;
            StringBuilder response = new StringBuilder();

            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();

            // Process the response data as needed

            // Check and update the startTime and endTime for the next request
            String jsonResponse = response.toString();
            // Parse the JSON response and extract startTime and endTime

            // For demonstration purposes, print the details
            System.out.println("Page " + page + " processed. New startTime: " + start + ", new endTime: " + end);
        }
    }

    public static void main(String[] args) throws Exception {
        String baseUrl = "YOUR_BASE_URL";
        String endpointPath = "rest-of-your-endpoint-path";
        String start = "2022-11-14T20:00:45.061Z";
        String end = "2023-11-21T20:00:45.061Z";
        int totalPages = 23;

        makeSubsequentRequests(baseUrl, endpointPath, start, end, totalPages);
    }
}
