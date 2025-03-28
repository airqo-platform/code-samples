"use client";

import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { SearchBar } from "./SearchBar";
import { FileUpload } from "./FileUpload";
import type { Location, ControlPanelProps } from "@/lib/types";
import { useToast } from "@/ui/use-toast";
import { Loader2 } from "lucide-react";

// Extend ControlPanelProps to include onBoundaryFound
interface ExtendedControlPanelProps extends ControlPanelProps {
  onBoundaryFound: (boundary: Location[]) => void;
}

export function PollutantControlPanel({
  onSubmit,
  polygon,
  mustHaveLocations,
  onMustHaveLocationsChange,
  onBoundaryFound,
}: ExtendedControlPanelProps) {
  const [minDistance, setMinDistance] = useState("0.5"); // Default value for min_distance_km
  const [numSensors, setNumSensors] = useState("5"); // Default value for num_sensors
  const [newLat, setNewLat] = useState("");
  const [newLng, setNewLng] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Validation helper function
  const validateInputs = () => {
    if (polygon.length < 3) {
      toast({
        title: "Error",
        description: "Please draw a polygon on the map",
        variant: "destructive",
      });
      return false;
    }
    if (!numSensors || Number.parseInt(numSensors) < 1) {
      toast({
        title: "Error",
        description: "Please enter a valid number of sensors",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateInputs()) return;

    const payload: any = {
      polygon: {
        coordinates: [
          [
            ...polygon.map((loc) => [loc.lng, loc.lat]),
            [polygon[0].lng, polygon[0].lat],
          ], // Close the polygon
        ],
      },
      must_have_locations:
        mustHaveLocations.length > 0
          ? mustHaveLocations.map((loc) => [loc.lat, loc.lng])
          : [],
      num_sensors: Number.parseInt(numSensors, 10),
    };

    // Ensure min_distance_km is only included if valid
    const minDistanceValue = Number.parseFloat(minDistance);
    if (!isNaN(minDistanceValue)) {
      payload.min_distance_km = minDistanceValue;
    }

    setIsLoading(true);
    try {
      await onSubmit(payload);
      toast({
        title: "Success",
        description: "Locations submitted successfully",
      });
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Failed to submit locations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new must-have location
  const handleAddLocation = () => {
    const lat = Number.parseFloat(newLat);
    const lng = Number.parseFloat(newLng);

    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      toast({
        title: "Error",
        description:
          "Please enter valid latitude (-90 to 90) and longitude (-180 to 180)",
        variant: "destructive",
      });
      return;
    }

    onMustHaveLocationsChange([...mustHaveLocations, { lat, lng }]);
    setNewLat("");
    setNewLng("");
    toast({
      title: "Success",
      description: "Location added successfully",
    });
  };

  return (
    <div className="control-panel space-y-4 mt-9" style={{ width: "400px" }}>
      <h2 className="text-lg font-semibold mb-4">Stationary Sources Of Pollution</h2>

      {/* Search Bar */}
      <SearchBar onSearch={() => {}} onBoundaryFound={onBoundaryFound} />

      {/* Must-Have Locations */}
      <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-4">Kampala</h3>
      <h3 className="text-lg font-semibold mb-4">Jinja</h3>

  
        
        
      </div>

  


  
    </div>
  );
}
