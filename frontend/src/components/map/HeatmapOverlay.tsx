import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { AirQualityDataPoint } from '../../services/heatmapService';
import HeatmapLegend from './HeatmapLegend';

// Extend Leaflet's type definitions to include heatLayer
declare module 'leaflet' {
  namespace L {
    function heatLayer(latlngs: Array<[number, number, number]>, options?: any): L.Layer;
  }
}

interface HeatmapOverlayProps {
  data: AirQualityDataPoint[] | null;
}

const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({ data }) => {
  const map = useMap();
  const heatmapLayerRef = useRef<L.Layer | null>(null);
  const pointsLayerRef = useRef<L.LayerGroup | null>(null);
  
  useEffect(() => {
    // Remove previous layers if they exist
    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }
    if (pointsLayerRef.current) {
      map.removeLayer(pointsLayerRef.current);
      pointsLayerRef.current = null;
    }

    if (data && data.length > 0) {
      console.log('Creating heatmap layer with points:', data.length);
      
      // Transform data to format expected by leaflet.heat
      const heatData = data
        .map((point) =>
          point.latitude && point.longitude && point.pm2_5 !== undefined
            ? [point.latitude, point.longitude, point.pm2_5]
            : null
        )
        .filter(Boolean) as Array<[number, number, number]>;
      
      if (heatData.length === 0) {
        console.warn('No valid heatmap data points found');
        return;
      }
      
      // Calculate max intensity for proper scaling
      const maxIntensity = Math.max(...heatData.map(point => point[2]));
      
      try {
        // Create the heatmap layer
        const heatLayer = L.heatLayer(heatData, {
          minOpacity: 0.45,
          radius: 20,
          blur: 28,
          maxZoom: 12,
          max: maxIntensity,
          gradient: {
            0.0: '#44e527',   // Good (< 12.1 µg/m³)
            0.25: '#f8fe39',  // Moderate (12.1-35.4 µg/m³)
            0.5: '#ee8327',   // Unhealthy for Sensitive Groups (35.5-55.4 µg/m³)
            0.75: '#fe0023',  // Unhealthy (55.5-155.4 µg/m³)
            0.9: '#8639c0',   // Very Unhealthy (155.5-250.4 µg/m³)
            1.0: '#81202e'    // Hazardous (≥ 250.5 µg/m³)
          }
        });
        
        // Create a layer group for the interactive points
        const pointsLayer = L.layerGroup();
        
        // Add invisible circles with tooltips for each point
        data.forEach((point) => {
          if (point.latitude && point.longitude && point.pm2_5 !== undefined) {
            const circle = L.circle([point.latitude, point.longitude], {
              radius: 20, // Match the heatmap radius
              fillOpacity: 0,
              weight: 0,
              interactive: true
            });
            
            // Add tooltip with PM2.5 value
            circle.bindTooltip(
              `<div class="text-sm font-medium">
                PM2.5: ${point.pm2_5.toFixed(1)} µg/m³
              </div>`,
              {
                permanent: false,
                direction: 'top',
                className: 'custom-tooltip'
              }
            );
            
            circle.addTo(pointsLayer);
          }
        });
        
        // Add both layers to the map
        heatLayer.addTo(map);
        pointsLayer.addTo(map);
        
        // Store references to both layers
        heatmapLayerRef.current = heatLayer;
        pointsLayerRef.current = pointsLayer;
      } catch (error) {
        console.error('Error creating heatmap layers:', error);
      }
    }
    
    // Clean up layers on unmount or data change
    return () => {
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
        heatmapLayerRef.current = null;
      }
      if (pointsLayerRef.current) {
        map.removeLayer(pointsLayerRef.current);
        pointsLayerRef.current = null;
      }
    };
  }, [data, map]);

  // Only show the legend if the heatmap is visible
  return null;
};

export default HeatmapOverlay;