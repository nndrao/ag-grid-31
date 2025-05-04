import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DirectColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

// Helper function to convert hex to rgba
function hexToRgba(hex: string, alpha: number = 1): string {
  // Remove the # if it exists
  hex = hex.replace('#', '');
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Return rgba string
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper function to get hex from rgba
function getRgbaComponents(rgba: string): { hex: string; opacity: number } {
  if (rgba.startsWith('rgba')) {
    const match = rgba.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      const opacity = parseFloat(match[4]);
      
      // Convert RGB to hex
      const toHex = (c: number) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      
      const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      return { hex, opacity };
    }
  }
  
  // If it's a hex color or invalid rgba, return the original with opacity 1
  return { hex: rgba, opacity: 1 };
}

export function DirectColorPicker({ value, onChange, disabled = false, label }: DirectColorPickerProps) {
  // Extract hex and opacity from the initial value
  const initialColor = value.startsWith('rgba') ? getRgbaComponents(value) : { hex: value || "#000000", opacity: 1 };
  
  const [hex, setHex] = useState(initialColor.hex);
  const [opacity, setOpacity] = useState(initialColor.opacity);
  const colorInputRef = useRef<HTMLInputElement>(null);
  
  // The displayed color is either rgba or hex depending on opacity
  const displayColor = opacity < 1 ? hexToRgba(hex, opacity) : hex;

  useEffect(() => {
    // Update state when the value prop changes
    if (value !== displayColor) {
      const newColor = value.startsWith('rgba') ? getRgbaComponents(value) : { hex: value || "#000000", opacity: 1 };
      setHex(newColor.hex);
      setOpacity(newColor.opacity);
    }
  }, [value]);

  const handleColorChange = (newHex: string) => {
    setHex(newHex);
    onChange(opacity < 1 ? hexToRgba(newHex, opacity) : newHex);
  };

  return (
    <div className="flex flex-col space-y-1.5">
      {label && <Label>{label}</Label>}
      <div 
        className={cn(
          "w-full h-10 relative flex items-center justify-between px-3 font-mono border rounded-md",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary"
        )}
        onClick={() => {
          if (!disabled && colorInputRef.current) {
            colorInputRef.current.click();
          }
        }}
      >
        <div 
          className="w-5 h-5 rounded-sm border border-gray-300" 
          style={{ backgroundColor: displayColor }}
        />
        <span className="text-xs truncate">{hex}</span>
        <input
          ref={colorInputRef}
          type="color"
          value={hex}
          onChange={(e) => handleColorChange(e.target.value)}
          className="sr-only" // Hidden but accessible
          disabled={disabled}
        />
      </div>
    </div>
  );
}