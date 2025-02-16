"use client";

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { FileUpload } from '@/components/Controls/FileUpload';
import { useToast } from '@/ui/use-toast';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from 'react-leaflet';
import { getSiteCategory } from '@/lib/api';
import { Location, SiteCategoryResponse } from '@/lib/types';
import { Card } from '@/ui/card';
import { Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import Navigation from "@/components/navigation/navigation";
import { Textarea } from '@/ui/textarea';
import 'leaflet/dist/leaflet.css';
import { debounce } from 'lodash';

interface SiteCategoryInfo extends Location {
  category?: string;
  area_name?: string;
}

export default function SiteCategory() {
  const [sites, setSites] = useState<SiteCategoryInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteCategoryInfo | null>(null);
  const [manualInput, setManualInput] = useState('');
  const { toast } = useToast();

  // Handle file upload
  const handleFileUpload = async (locations: Location[]) => {
    setLoading(true);
    try {
      const newSites = await Promise.all(
        locations.map(async (location) => {
          const response = await getSiteCategory(location.lat, location.lng);
          return {
            ...location,
            category: response.site['site-category'].category,
            area_name: response.site['site-category'].area_name,
          };
        })
      );
      setSites((prev) => [...prev, ...newSites]);
      toast({
        title: 'Success',
        description: `Processed ${newSites.length} sites`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process sites',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle map click with debouncing
  const handleMapClick = useCallback(
    debounce(async (e: { latlng: { lat: number; lng: number } }) => {
      try {
        setLoading(true);
        const { lat, lng } = e.latlng;
        const response = await getSiteCategory(lat, lng);
        const newSite = {
          lat,
          lng,
          category: response.site['site-category'].category,
          area_name: response.site['site-category'].area_name,
        };
        setSites((prev) => [...prev, newSite]);
        setSelectedSite(newSite);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to get site category',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Handle manual input submission
  const handleManualSubmit = async () => {
    try {
      setLoading(true);
      const coordinates = manualInput
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line)
        .map((line) => {
          const [lat, lng] = line.split(',').map((num) => parseFloat(num.trim()));
          if (isNaN(lat) || isNaN(lng)) {
            throw new Error('Invalid coordinates format');
          }
          return { lat, lng };
        });

      const newSites = await Promise.all(
        coordinates.map(async (coord) => {
          const response = await getSiteCategory(coord.lat, coord.lng);
          return {
            ...coord,
            category: response.site['site-category'].category,
            area_name: response.site['site-category'].area_name,
          };
        })
      );

      setSites((prev) => [...prev, ...newSites]);
      setManualInput('');
      toast({
        title: 'Success',
        description: `Processed ${newSites.length} sites`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process coordinates. Please ensure format is correct (latitude,longitude)',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Download CSV
  const downloadCSV = () => {
    try {
      const csv = Papa.unparse(sites);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = 'site_categories.csv';
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download CSV',
        variant: 'destructive',
      });
    }
  };

  // Map events component
  const MapEvents = () => {
    useMapEvents({
      click: handleMapClick,
    });
    return null;
  };

  // Memoized markers to avoid unnecessary re-renders
  const markers = useMemo(
    () =>
      sites.map((site, index) => (
        <Marker
          key={`${site.lat}-${site.lng}-${index}`}
          position={[site.lat, site.lng]}
          eventHandlers={{
            click: () => setSelectedSite(site),
          }}
        >
          <Popup>
            <div className="p-2">
              <p><strong>Category:</strong> {site.category}</p>
              <p><strong>Area:</strong> {site.area_name}</p>
            </div>
          </Popup>
        </Marker>
      )),
    [sites]
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex h-screen pt-16">
        <div className="flex-1">
          <MapContainer center={[1.3733, 32.2903]} zoom={7} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents />
            {markers}
          </MapContainer>
        </div>

        <div className="w-96 p-4 space-y-4">
          <div className="space-y-4 mb-6">
            <Button onClick={downloadCSV} disabled={sites.length === 0} className="w-full">
              Download CSV
            </Button>
            <FileUpload onUpload={handleFileUpload} />

            <Card className="p-4">
              <h3 className="font-medium mb-2">Add Multiple Locations</h3>
              <p className="text-sm text-gray-500 mb-2">
                Enter coordinates (one per line) in format: latitude,longitude
              </p>
              <Textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="0.3178311,32.5899529&#10;0.318058,32.590206"
                className="mb-2"
                rows={5}
              />
              <Button onClick={handleManualSubmit} className="w-full" disabled={!manualInput.trim()}>
                Process Coordinates
              </Button>
            </Card>
          </div>

          {selectedSite && (
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Site Information</h2>
              <div>
                <p><strong>Category:</strong> {selectedSite.category}</p>
                <p><strong>Area Name:</strong> {selectedSite.area_name}</p>
                <p><strong>Latitude:</strong> {selectedSite.lat.toFixed(6)}</p>
                <p><strong>Longitude:</strong> {selectedSite.lng.toFixed(6)}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-white p-4 rounded-lg flex items-center space-x-2">
            <Loader2 className="h-6 w-4 animate-spin" />
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}