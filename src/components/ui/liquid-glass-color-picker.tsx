import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Pipette } from 'lucide-react';

// ============= Color Utility Functions =============

// Clamp value between min and max
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Convert HSV to RGB
const hsvToRgb = (h: number, s: number, v: number): { r: number; g: number; b: number } => {
  s = s / 100;
  v = v / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

// Convert RGB to HSV
const rgbToHsv = (r: number, g: number, b: number): { h: number; s: number; v: number } => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;

  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }

  return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
};

// Convert RGB to HEX
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};

// Convert HEX to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
};

// ============= Component Props =============

interface LiquidGlassColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose?: () => void;
  showEyeDropper?: boolean;
  className?: string;
}

// ============= Main Component =============

export const LiquidGlassColorPicker = memo(({
  color,
  onChange,
  onClose,
  showEyeDropper = true,
  className,
}: LiquidGlassColorPickerProps) => {
  // Parse initial color
  const initialRgb = useMemo(() => hexToRgb(color) || { r: 254, g: 243, b: 199 }, []);
  const initialHsv = useMemo(() => rgbToHsv(initialRgb.r, initialRgb.g, initialRgb.b), [initialRgb]);

  const [hsv, setHsv] = useState(initialHsv);
  const [rgb, setRgb] = useState(initialRgb);
  
  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const isDraggingSat = useRef(false);
  const isDraggingHue = useRef(false);

  // Update RGB when HSV changes
  useEffect(() => {
    const newRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
    setRgb(newRgb);
  }, [hsv]);

  // Handle saturation/brightness area interaction
  const handleSaturationChange = useCallback((clientX: number, clientY: number) => {
    if (!saturationRef.current) return;
    const rect = saturationRef.current.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);
    const s = (x / rect.width) * 100;
    const v = 100 - (y / rect.height) * 100;
    setHsv(prev => ({ ...prev, s: Math.round(s), v: Math.round(v) }));
  }, []);

  // Handle hue slider interaction
  const handleHueChange = useCallback((clientX: number) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const h = (x / rect.width) * 360;
    setHsv(prev => ({ ...prev, h: Math.round(h) }));
  }, []);

  // Mouse/Touch handlers for saturation area
  const handleSatMouseDown = (e: React.MouseEvent) => {
    isDraggingSat.current = true;
    handleSaturationChange(e.clientX, e.clientY);
  };

  const handleSatTouchStart = (e: React.TouchEvent) => {
    isDraggingSat.current = true;
    handleSaturationChange(e.touches[0].clientX, e.touches[0].clientY);
  };

  // Mouse/Touch handlers for hue slider
  const handleHueMouseDown = (e: React.MouseEvent) => {
    isDraggingHue.current = true;
    handleHueChange(e.clientX);
  };

  const handleHueTouchStart = (e: React.TouchEvent) => {
    isDraggingHue.current = true;
    handleHueChange(e.touches[0].clientX);
  };

  // Global mouse/touch move and up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSat.current) handleSaturationChange(e.clientX, e.clientY);
      if (isDraggingHue.current) handleHueChange(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingSat.current || isDraggingHue.current) {
        // Prevent scrolling on iOS while dragging
        e.preventDefault();
        if (isDraggingSat.current) handleSaturationChange(e.touches[0].clientX, e.touches[0].clientY);
        if (isDraggingHue.current) handleHueChange(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      isDraggingSat.current = false;
      isDraggingHue.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    // CRITICAL: passive: false is required for preventDefault() to work on iOS
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [handleSaturationChange, handleHueChange]);

  // Handle RGB input changes
  const handleRgbInputChange = (component: 'r' | 'g' | 'b', value: string) => {
    const numValue = clamp(parseInt(value) || 0, 0, 255);
    const newRgb = { ...rgb, [component]: numValue };
    setRgb(newRgb);
    setHsv(rgbToHsv(newRgb.r, newRgb.g, newRgb.b));
  };

  // Eye dropper API
  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        // @ts-ignore - EyeDropper API
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        const pickedRgb = hexToRgb(result.sRGBHex);
        if (pickedRgb) {
          setRgb(pickedRgb);
          setHsv(rgbToHsv(pickedRgb.r, pickedRgb.g, pickedRgb.b));
        }
      } catch (e) {
        // User cancelled or error
      }
    }
  };

  // Save handler
  const handleSave = () => {
    onChange(rgbToHex(rgb.r, rgb.g, rgb.b));
    onClose?.();
  };

  // Current color for preview and saturation background
  const currentColorHex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const hueColorHex = rgbToHex(...Object.values(hsvToRgb(hsv.h, 100, 100)) as [number, number, number]);

  return (
    <div 
      className={cn(
        "p-4 bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 fade-in duration-200",
        "w-[280px]",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Saturation/Brightness Area */}
      <div
        ref={saturationRef}
        className="relative w-full h-40 rounded-2xl cursor-crosshair overflow-hidden shadow-inner touch-none"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColorHex})`,
        }}
        onMouseDown={handleSatMouseDown}
        onTouchStart={handleSatTouchStart}
      >
        {/* Picker indicator */}
        <div
          className="absolute w-5 h-5 rounded-full border-[3px] border-white shadow-lg pointer-events-none"
          style={{
            left: `calc(${hsv.s}% - 10px)`,
            top: `calc(${100 - hsv.v}% - 10px)`,
            backgroundColor: currentColorHex,
          }}
        />
      </div>

      {/* Controls Row: Eye dropper, Preview, Hue slider */}
      <div className="flex items-center gap-3 mt-4">
        {/* Eye Dropper Button */}
        {showEyeDropper && 'EyeDropper' in window && (
          <button
            onClick={handleEyeDropper}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors"
            title="Preleva colore"
          >
            <Pipette className="w-4 h-4 text-foreground" />
          </button>
        )}

        {/* Color Preview Circle */}
        <div
          className="w-10 h-10 rounded-full shadow-lg shrink-0 ring-2 ring-white"
          style={{ backgroundColor: currentColorHex }}
        />

        {/* Hue Slider */}
        <div
          ref={hueRef}
          className="flex-1 h-4 rounded-full cursor-pointer relative shadow-inner touch-none"
          style={{
            background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
          }}
          onMouseDown={handleHueMouseDown}
          onTouchStart={handleHueTouchStart}
        >
          {/* Hue indicator */}
          <div
            className="absolute w-5 h-5 rounded-full border-[3px] border-white shadow-lg pointer-events-none -top-0.5"
            style={{
              left: `calc(${(hsv.h / 360) * 100}% - 10px)`,
              backgroundColor: hueColorHex,
            }}
          />
        </div>
      </div>

      {/* RGB Inputs Row */}
      <div className="flex items-center gap-2 mt-4">
        {(['r', 'g', 'b'] as const).map((component) => (
          <div key={component} className="flex-1 flex flex-col items-center">
            <input
              type="text"
              inputMode="numeric"
              value={rgb[component]}
              onChange={(e) => handleRgbInputChange(component, e.target.value)}
              className="w-full h-10 text-center text-sm font-medium bg-muted/30 rounded-xl border-0 outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
            />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5 font-medium">
              {component.toUpperCase()}
            </span>
          </div>
        ))}
        
        {/* Mode toggle placeholder - matches the reference image */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 flex items-center justify-center text-muted-foreground">
            <span className="text-xs">◇</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full mt-4 py-3 bg-foreground text-background text-sm font-semibold rounded-full shadow-lg active:scale-[0.98] transition-transform"
      >
        Salva
      </button>
    </div>
  );
});

LiquidGlassColorPicker.displayName = 'LiquidGlassColorPicker';

export default LiquidGlassColorPicker;
