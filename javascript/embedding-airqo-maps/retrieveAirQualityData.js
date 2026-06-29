import React, { useState, useEffect } from "react";

const AirQualityData = () => {
  const [data, setData] = useState([]);
  const [token, setToken] = useState(""); // Input field for the access token

  const gridId = "your_grid_id"; // Replace with the grid ID for City X

  useEffect(() => {
    // Make the API request
    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://api.airqo.net/api/v2/devices/measurements/grids/${gridId}?token=${token}`
        );
        if (response.ok) {
          const result = await response.json();
          setData(result.data);
        } else {
          console.error("Error fetching data");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    if (token && gridId) {
      fetchData();
    }
  }, [token, gridId]);

  return (
    <div>
      <h1>City X Air Quality Data</h1>
      <p>Input your access token:</p>
      <input
        type="text"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <div>
        {data.map((measurement) => (
          <div key={measurement.id}>
            <p>Date: {measurement.date}</p>
            <p>PM2.5: {measurement.pm25}</p>
            {/* Include more data fields as needed */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AirQualityData;
