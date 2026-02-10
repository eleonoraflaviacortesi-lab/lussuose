import React from 'react';
import { LiquidGlassColorPicker } from './liquid-glass-color-picker';

interface ColorPickerOverlayProps {
  open: boolean;
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

export const ColorPickerOverlay = ({ open, color, onChange, onClose }: ColorPickerOverlayProps) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <LiquidGlassColorPicker
        color={color}
        onChange={onChange}
        onClose={onClose}
        showEyeDropper={true}
      />
    </div>
  );
};
