"use client"

import { useRef } from 'react';
import { Button } from '@/ui/button';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';
import { useToast } from '@/ui/use-toast';

interface Location {
  lat: number;
  lng: number;
}

interface FileUploadProps {
  onUpload: (locations: Location[]) => void;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const normalizeColumnName = (name: string): string =>
    name.trim().toLowerCase().replace(/\s+/g, '');

  const latitudeAliases = ['lat', 'latitude'];
  const longitudeAliases = ['lng', 'lon', 'longitude'];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const headers = results.meta.fields || [];
          if (!headers.length) {
            throw new Error('CSV file has no headers.');
          }

          const normalizedHeaders = headers.map(normalizeColumnName);
          const latIndex = normalizedHeaders.findIndex((header) =>
            latitudeAliases.includes(header)
          );
          const lngIndex = normalizedHeaders.findIndex((header) =>
            longitudeAliases.includes(header)
          );

          if (latIndex === -1 || lngIndex === -1) {
            throw new Error('Could not find latitude and/or longitude columns in the CSV file.');
          }

          const locations = results.data
            .map((row: any) => ({
              lat: parseFloat(row[headers[latIndex]]),
              lng: parseFloat(row[headers[lngIndex]]),
            }))
            .filter((loc: Location) => !isNaN(loc.lat) && !isNaN(loc.lng));

          if (locations.length === 0) {
            throw new Error('No valid latitude/longitude pairs found.');
          }

          onUpload(locations);

          toast({
            title: 'Success',
            description: `Imported ${locations.length} locations from CSV`,
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to parse CSV file.',
            variant: 'destructive',
          });
        }
      },
      error: () => {
        toast({
          title: 'Error',
          description: 'Failed to read CSV file',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />
      <Button
        variant="outline"
        className="w-full"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        Upload CSV
      </Button>
    </div>
  );
}
