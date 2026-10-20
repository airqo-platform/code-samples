"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/ui/field"
import { Alert } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Accordion, AccordionItem } from "@/components/ui/accordion"
import { SearchBar } from "./search-bar"
import { PriorityLocationSearch } from "./priority-location-search"
import { FileUpload } from "./file-upload"
import type { Location, ControlPanelProps } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Crosshair, MapPinned, Plus, Ruler, Sparkles, Trash2, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

function ControlSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-xl bg-accent p-2 text-primary">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

// Extend ControlPanelProps to include onBoundaryFound
interface ExtendedControlPanelProps extends ControlPanelProps {
  onBoundaryFound: (boundary: Location[]) => void
  isSelectingPriority: boolean
  onSelectingPriorityChange: (isSelecting: boolean) => void
}

export function ControlPanel({
  onSubmit,
  polygon,
  mustHaveLocations,
  onMustHaveLocationsChange,
  onBoundaryFound,
  isSelectingPriority,
  onSelectingPriorityChange,
}: ExtendedControlPanelProps) {
  const [minDistance, setMinDistance] = useState("0.5") // Default value for min_distance_km
  const [numSensors, setNumSensors] = useState("5") // Default value for num_sensors
  const [newLat, setNewLat] = useState("")
  const [newLng, setNewLng] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Validation helper function
  const validateInputs = () => {
    if (polygon.length < 3) {
      toast({
        title: "Error",
        description: "Please draw a polygon on the map",
        variant: "destructive",
      })
      return false
    }
    if (!numSensors || Number.parseInt(numSensors) < 1) {
      toast({
        title: "Error",
        description: "Please enter a valid number of sensors",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateInputs()) return

    const payload: any = {
      polygon: {
        coordinates: [
          [...polygon.map((loc) => [loc.lng, loc.lat]), [polygon[0].lng, polygon[0].lat]], // Close the polygon
        ],
      },
      must_have_locations: mustHaveLocations.length > 0 ? mustHaveLocations.map((loc) => [loc.lat, loc.lng]) : [],
      num_sensors: Number.parseInt(numSensors, 10),
    }

    // Ensure min_distance_km is only included if valid
    const minDistanceValue = Number.parseFloat(minDistance)
    if (!isNaN(minDistanceValue)) {
      payload.min_distance_km = minDistanceValue
    }

    setIsLoading(true)
    try {
      await onSubmit(payload)
      toast({
        title: "Success",
        description: "Locations submitted successfully",
      })
    } catch (error) {
      console.log(error)
      toast({
        title: "Error",
        description: "Failed to submit locations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add a new must-have location
  const handleAddLocation = () => {
    const lat = Number.parseFloat(newLat)
    const lng = Number.parseFloat(newLng)

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Error",
        description: "Please enter valid latitude (-90 to 90) and longitude (-180 to 180)",
        variant: "destructive",
      })
      return
    }

    onMustHaveLocationsChange([...mustHaveLocations, { lat, lng }])
    setNewLat("")
    setNewLng("")
    toast({
      title: "Success",
      description: "Location added successfully",
    })
  }

  const addPriorityLocation = (location: Location) => {
    const duplicate = mustHaveLocations.some(
      (current) => Math.abs(current.lat - location.lat) < 0.000001 && Math.abs(current.lng - location.lng) < 0.000001,
    )
    if (duplicate) {
      toast({
        title: "Location already added",
        description: "Choose a different priority location.",
      })
      return
    }
    onMustHaveLocationsChange([...mustHaveLocations, location])
  }

  return (
    <div className="control-panel space-y-4">
      <ControlSection icon={<MapPinned className="h-4 w-4" />} title="Select an analysis area" description="Search for a known boundary or draw one on the map.">
        <SearchBar onSearch={() => {}} onBoundaryFound={onBoundaryFound} />
        <div className={`mt-3 rounded-xl border px-3 py-2.5 text-xs ${
          polygon.length >= 3
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}>
          {polygon.length >= 3
            ? `Boundary ready with ${polygon.length} points.`
            : "A boundary with at least three points is required."}
        </div>
      </ControlSection>

      <ControlSection icon={<Crosshair className="h-4 w-4" />} title="Add priority locations (Optional)" description="Optional sites that must remain in the deployment plan.">
        <div className="mb-3 space-y-2">
          <PriorityLocationSearch onLocationFound={addPriorityLocation} />
          <Button
            type="button"
            variant={isSelectingPriority ? "default" : "outline"}
            onClick={() => onSelectingPriorityChange(!isSelectingPriority)}
            className={`h-11 w-full gap-2 rounded-xl ${
              isSelectingPriority ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-card"
            }`}
          >
            <Crosshair className="h-4 w-4" />
            {isSelectingPriority ? "Click the map to add points" : "Pick priority points on map"}
          </Button>
        </div>
        <Accordion>
          <AccordionItem title="Or enter coordinates" description="Type lat/lng pairs manually." defaultOpen>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Latitude" htmlFor="priority-lat" required>
                <Input
                  id="priority-lat"
                  type="number"
                  placeholder="Latitude"
                  value={newLat}
                  onChange={(e) => setNewLat(e.target.value)}
                  step="any"
                  className="h-11 rounded-xl border-border bg-muted focus-visible:bg-card"
                />
              </Field>
              <Field label="Longitude" htmlFor="priority-lng" required>
                <Input
                  id="priority-lng"
                  type="number"
                  placeholder="Longitude"
                  value={newLng}
                  onChange={(e) => setNewLng(e.target.value)}
                  step="any"
                  className="h-11 rounded-xl border-border bg-muted focus-visible:bg-card"
                />
              </Field>
              <Button onClick={handleAddLocation} aria-label="Add Location" className="col-span-2 gap-2 rounded-xl bg-blue-700 text-white hover:bg-blue-600">
                <Plus className="h-4 w-4" />
                Add priority point
              </Button>
            </div>
            <div className="mt-3 rounded-xl border border-dashed border-border bg-muted p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Upload className="h-3.5 w-3.5" />
                Upload coordinates
              </div>
              <FileUpload onUpload={onMustHaveLocationsChange} />
            </div>
          </AccordionItem>
        </Accordion>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-muted px-3 py-2">
          <span className="text-xs text-muted-foreground">{mustHaveLocations.length} priority locations added</span>
          {mustHaveLocations.length > 0 ? (
            <button
              type="button"
              onClick={() => onMustHaveLocationsChange([])}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          ) : null}
        </div>
      </ControlSection>

      <ControlSection icon={<Ruler className="h-4 w-4" />} title="Configure the network" description="Set deployment size and spacing constraints.">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sensors" htmlFor="num-sensors" required>
            <Input
              id="num-sensors"
              type="number"
              min="1"
              value={numSensors}
              onChange={(e) => setNumSensors(e.target.value)}
              className="h-11 rounded-xl border-border bg-muted focus-visible:bg-card"
            />
          </Field>
          <Field label="Min. spacing (km)" htmlFor="min-distance">
            <Input
              id="min-distance"
              type="number"
              min="0.1"
              step="0.1"
              value={minDistance}
              onChange={(e) => setMinDistance(e.target.value)}
              className="h-11 rounded-xl border-border bg-muted focus-visible:bg-card"
            />
          </Field>
        </div>
      </ControlSection>

      <Button
        className="h-12 w-full gap-2 rounded-xl bg-blue-700 text-white shadow-lg shadow-blue-700/20 hover:bg-blue-600"
        onClick={handleSubmit}
        disabled={isLoading}
        aria-label="Submit"
      >
        {isLoading ? (
          <Spinner size="sm" className="text-white" label="Submitting...">
            <span className="sr-only">Submitting...</span>
          </Spinner>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate recommended sites
          </>
        )}
      </Button>
    </div>
  )
}
