import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
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

export function ColorPicker({ value, onChange, disabled = false, label }: ColorPickerProps) {
  // Extract hex and opacity from the initial value
  const initialColor = value.startsWith('rgba') ? getRgbaComponents(value) : { hex: value || "#000000", opacity: 1 };
  
  const [hex, setHex] = useState(initialColor.hex);
  const [opacity, setOpacity] = useState(initialColor.opacity);
  const [isOpen, setIsOpen] = useState(false);
  
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
  
  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setOpacity(value);
    onChange(value < 1 ? hexToRgba(hex, value) : hex);
  };

  return (
    <div className="flex flex-col space-y-1.5">
      {label && <Label>{label}</Label>}
      <Popover open={isOpen} onOpenChange={disabled ? undefined : setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            type="button"
            variant="outline" 
            className={cn(
              "w-full h-10 relative flex items-center justify-between px-3 font-mono",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
          >
            <div 
              className="w-5 h-5 rounded-sm border border-gray-300" 
              style={{ backgroundColor: displayColor }}
            />
            <span className="text-xs truncate">{hex}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" side="right">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Input
                type="color"
                value={hex}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full h-32 p-0 cursor-pointer"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs whitespace-nowrap">Opacity:</Label>
                  <Input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={opacity}
                    onChange={handleOpacityChange}
                    className="h-2 flex-1"
                  />
                  <span className="text-xs w-8 text-right">{Math.round(opacity * 100)}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Input
                type="text"
                value={hex}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
                    handleColorChange(val);
                  } else if (val.startsWith('#') && val.length <= 7) {
                    setHex(val);
                  }
                }}
                onBlur={() => {
                  if (!/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
                    setHex(initialColor.hex);
                  }
                }}
                className="font-mono text-xs"
                maxLength={7}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
