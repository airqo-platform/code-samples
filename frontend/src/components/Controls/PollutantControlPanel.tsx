"use client";

import { useState } from "react";
import { SearchBar } from "./SearchBar";
import type { Location, ControlPanelProps } from "@/lib/types";


// Extend ControlPanelProps to include onBoundaryFound
interface ExtendedControlPanelProps extends ControlPanelProps {
  onBoundaryFound: (boundary: Location[]) => void;
}

export function PollutantControlPanel({
  onBoundaryFound,
}: ExtendedControlPanelProps) {
  const [minDistance, setMinDistance] = useState("0.5"); // Default value for min_distance_km

  // Validation helper function
  return (
    <div className="control-panel space-y-4 mt-9" style={{ width: "400px" }}>
      {/* Search Bar */}
      <SearchBar onSearch={() => {}} onBoundaryFound={onBoundaryFound} />
    </div>
  );
}
