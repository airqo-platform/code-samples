"use client";
import { useState } from "react";
import { PollutantControlPanel } from "@/components/Controls/PollutantControlPanel";
import type { Location, SiteLocatorPayload } from "@/lib/types";
import { submitLocations } from "@/lib/api";
import { useToast } from "@/ui/use-toast";
import { Button } from "@/ui/button";
import { Download, Camera } from "lucide-react";
import html2canvas from "html2canvas";
import Navigation from "@/components/navigation/navigation";
import dynamic from "next/dynamic";
import Loading from "../Loading";

const PollutantMap = dynamic(() => import("@/components/map/PollutantMap"), {
  ssr: false,
  loading: () => <Loading />,
});


export default function Index() {
  const [polygon, setPolygon] = useState<Location[]>([]);
  const [mustHaveLocations, setMustHaveLocations] = useState<Location[]>([]);
  const [suggestedLocations, setSuggestedLocations] = useState<Location[]>([]);
  const { toast } = useToast();
  const [isDrawing, setIsDrawing] = useState(false);

  const handleSubmit = async (payload: SiteLocatorPayload) => {
    try {
      console.log("Submitting payload:", payload);
      const response = await submitLocations(payload);
      console.log("API Response:", response);
      if (!response.site_location || !Array.isArray(response.site_location)) {
        throw new Error("Invalid response format from API");
      }
      const locations = response.site_location.map((site) => ({
        lat: site.latitude,
        lng: site.longitude,
      }));
      console.log("Processed locations to plot:", locations);
      setSuggestedLocations(locations);
      toast({
        title: "Success",
        description: `Found ${locations.length} suggested locations`,
      });
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit locations",
        variant: "destructive",
      });
    }
  };

  const handleLocationClick = (location: Location) => {
    setMustHaveLocations([...mustHaveLocations, location]);
  };

  const handleExportCSV = () => {
    if (suggestedLocations.length === 0 && mustHaveLocations.length === 0) {
      toast({
        title: "No Data",
        description: "No locations available to export",
        variant: "destructive",
      });
      return;
    }
    const headers = ["Type", "Latitude", "Longitude"];
    const uniqueLocations = new Set();
    const formatRow = (type: string, loc: Location) =>
      `${type},${loc.lat},${loc.lng},,`;

    const rows = mustHaveLocations.map((loc) => {
      const key = `${loc.lat},${loc.lng}`;
      uniqueLocations.add(key);
      return formatRow("Must Have", loc);
    });

    suggestedLocations.forEach((loc) => {
      const key = `${loc.lat},${loc.lng}`;
      if (!uniqueLocations.has(key)) {
        uniqueLocations.add(key);
        rows.push(formatRow("Suggested", loc));
      }
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "locations.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast({
      title: "Success",
      description: "CSV file downloaded successfully",
    });
  };

  const handleSaveMap = async () => {
    const mapElement = document.querySelector(".leaflet-container");
    if (mapElement) {
      const canvas = await html2canvas(mapElement as HTMLElement);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "map.png";
      a.click();
      toast({
        title: "Success",
        description: "Map image saved successfully",
      });
    }
  };

  const toggleDrawing = () => {
    setIsDrawing(!isDrawing);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navigation */}
      <Navigation />
      <div className="relative flex-1">
      <PollutantMap />
        {/* Control Panel */}
        <div className="absolute right-4 top-4 z-[1000]">
          <PollutantControlPanel
            onSubmit={handleSubmit}
            polygon={polygon}
            mustHaveLocations={mustHaveLocations}
            onMustHaveLocationsChange={setMustHaveLocations}
            onBoundaryFound={setPolygon}
          />

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center gap-4">
            



          </div>
        </div>
      </div>
    </div>
  );
}
