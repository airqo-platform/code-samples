"use client";

import { Button } from '@/ui/button';

interface NavigationControlsProps {
  isDrawing: boolean;
  onDrawingToggle: () => void;
}

export function NavigationControls({ isDrawing, onDrawingToggle }: NavigationControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      <Button
        variant={isDrawing ? "secondary" : "default"}
        onClick={onDrawingToggle}
        className="shadow-lg"
      >
        {isDrawing ? "Finish Drawing" : "Draw Polygon"}
      </Button>
    </div>
  );
}
