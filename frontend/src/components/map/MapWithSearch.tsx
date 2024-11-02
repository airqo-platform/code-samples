"use client";

import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useState } from "react";
import { OpenStreetMapProvider, SearchResult } from "leaflet-geosearch";
import { FaTimes } from "react-icons/fa";
// import { getSatelliteData } from "@services/apiService";

const DEFAULT_CENTER: [number, number] = [0, 20];
const DEFAULT_ZOOM = 4;

const CustomSearchControl: React.FC = () => {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const provider = new OpenStreetMapProvider();

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery = e.target.value;
    setQuery(searchQuery);

    if (searchQuery.length > 2) {
      const searchResults = await provider.search({ query: searchQuery });
      setResults(searchResults);
    } else {
      setResults([]);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    const { x, y } = result;
    map.setView([y, x], 10);
    setQuery(result.label);
    setResults([]);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM); // Reset to default center and zoom
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] w-[300px]">
      <div className="flex items-center bg-white rounded-full overflow-hidden shadow-md">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Enter a location"
          className="p-2 w-full text-black bg-white outline-none"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="p-2 bg-purple-500 text-white rounded-full"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        )}
      </div>
      {results.length > 0 && (
        <ul className="bg-white border text-black border-gray-300 mt-2 rounded-lg shadow-lg max-h-48 overflow-auto">
          {results.map((result, index) => (
            <li
              key={`${result.label}-${index}`}
              onClick={() => handleSelectResult(result)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {result.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const MapWithSearch: React.FC = () => {
  return (
    <div className="w-full h-screen relative">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <CustomSearchControl />
      </MapContainer>
    </div>
  );
};

export default MapWithSearch;
