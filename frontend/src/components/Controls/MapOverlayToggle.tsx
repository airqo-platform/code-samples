import React from 'react';
import { Button } from '../../ui/button';
import { Flame } from 'lucide-react';

interface MapOverlayToggleProps {
  onClick: () => void;
  isActive?: boolean;
}

const MapOverlayToggle: React.FC<MapOverlayToggleProps> = ({ 
  onClick, 
  isActive = false 
}) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="icon"
      className={`${
        isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'
      } text-white flex items-center justify-center transition-colors`}
      title={`${isActive ? 'Hide' : 'Show'} Air Quality Heatmap`}
    >
      <Flame className="h-5 w-5" />
    </Button>
  );
};

export default MapOverlayToggle;