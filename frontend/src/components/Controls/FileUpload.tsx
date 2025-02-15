import { useRef, useState } from 'react';
import { Button } from '@/ui/button';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';
import { useToast } from '@/ui/use-toast';
import type {Location, FileUploadProps} from "@/lib/types"

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPE = 'text/csv';

const normalizeColumnName = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, '');

const latitudeAliases = new Set(['lat', 'latitude']);
const longitudeAliases = new Set(['lng', 'lon', 'longitude']);

export function FileUpload({ onUpload }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const parseCSV = (file: File) => {
    setIsLoading(true);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        setIsLoading(false);

        try {
          const headers = meta.fields?.map(normalizeColumnName) || [];
          if (!headers.length) throw new Error('CSV file has no headers.');

          const latIndex = headers.findIndex((h) => latitudeAliases.has(h));
          const lngIndex = headers.findIndex((h) => longitudeAliases.has(h));

          if (latIndex === -1 || lngIndex === -1) {
            throw new Error('Missing latitude and/or longitude columns.');
          }

          const locations: Location[] = data
            .map((row) => ({
              lat: parseFloat(row[meta.fields![latIndex]] || ''),
              lng: parseFloat(row[meta.fields![lngIndex]] || ''),
            }))
            .filter(({ lat, lng }) => !isNaN(lat) && !isNaN(lng));

          if (!locations.length) throw new Error('No valid latitude/longitude pairs found.');

          onUpload(locations);
          toast({ title: 'Success', description: `Imported ${locations.length} locations.` });
        } catch (error) {
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to parse CSV.',
            variant: 'destructive',
          });
        }
      },
      error: () => {
        setIsLoading(false);
        toast({ title: 'Error', description: 'Failed to read CSV file.', variant: 'destructive' });
      },
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'Error', description: 'File size exceeds 5MB limit.', variant: 'destructive' });
      return;
    }

    if (file.type !== ACCEPTED_FILE_TYPE) {
      toast({ title: 'Error', description: 'Please upload a valid CSV file.', variant: 'destructive' });
      return;
    }

    parseCSV(file);
  };

  return (
    <div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
      <Button
        variant="outline"
        className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        aria-label="Upload CSV file"
      >
        <Upload className="mr-2 h-4 w-4" />
        {isLoading ? 'Uploading...' : 'Upload CSV'}
      </Button>
    </div>
  );
}
