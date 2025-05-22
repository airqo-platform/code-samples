import React from "react";

// AQI levels based on PM2.5 values (µg/m³) following EPA standards
// These match the gradient colors defined in HeatmapOverlay.tsx
const AQI_GRADIENT = [
  { color: "#44e527", label: "Good", range: "< 12.1" },
  { color: "#f8fe39", label: "Moderate", range: "12.1–35.4" },
  { color: "#ee8327", label: "USG", range: "35.5–55.4" },
  { color: "#fe0023", label: "Unhealthy", range: "55.5–155.4" },
  { color: "#8639c0", label: "Very Unhealthy", range: "155.5–250.4" },
  { color: "#81202e", label: "Hazardous", range: "≥ 250.5" },
];

const HeatmapLegend: React.FC = () => (
  <div className="bg-white bg-opacity-90 rounded-lg shadow-md p-3 flex flex-col gap-1">
    <div className="font-semibold mb-1 text-gray-700 text-sm">PM2.5 (µg/m³)</div>
    {AQI_GRADIENT.map((item) => (
      <div key={item.label} className="flex items-center gap-2 text-xs">
        <span
          className="inline-block w-4 h-4 rounded"
          style={{ background: item.color }}
        />
        <span className="w-24 text-gray-700">{item.label}</span>
        <span className="text-gray-500">{item.range}</span>
      </div>
    ))}
    <div className="mt-1 text-xs text-gray-500">
      USG: Unhealthy for Sensitive Groups
    </div>
  </div>
);

export default HeatmapLegend;
