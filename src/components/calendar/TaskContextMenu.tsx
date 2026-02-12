import { memo, useState } from 'react';
import { AlertTriangle, X, Palette, Trash2 } from 'lucide-react';
import { cn, isDarkColor } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { Task } from '@/hooks/useTasks';
import { ColorPickerOverlay } from '@/components/ui/color-picker-overlay';

// Preset colors for quick selection
const PRESET_COLORS = [
  '#FEF3C7', // Warm yellow
  '#DCFCE7', // Light green
  '#DBEAFE', // Light blue
  '#FCE7F3', // Light pink
  '#E9D5FF', // Light purple
  '#FED7AA', // Light orange
  '#F3F4F6', // Light gray
  '#FFFFFF', // White
];


type Props = {
  position: { x: number; y: number };
  task: Task;
  onColorChange: (color: string | null) => void;
  onUrgentToggle: () => void;
  onDelete: () => void;
  onClose: () => void;
};

const TaskContextMenu = memo(({
  position,
  task,
  onColorChange,
  onUrgentToggle,
  onDelete,
  onClose,
}: Props) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleColorSelect = (color: string | null) => {
    onColorChange(color);
    triggerHaptic('light');
    onClose();
  };

  const handleUrgentToggle = () => {
    onUrgentToggle();
    triggerHaptic('light');
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    triggerHaptic('warning');
    onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50" 
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        className="fixed z-50 flex flex-col gap-2.5 p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 max-w-[300px]"
        style={{
          left: Math.min(Math.max(10, position.x), window.innerWidth - 310),
          top: Math.min(position.y, window.innerHeight - 300),
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Urgent toggle */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Priorità</span>
          <button
            onClick={handleUrgentToggle}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all w-full",
              task.is_urgent 
                ? "bg-red-500 text-white" 
                : "bg-muted hover:bg-red-100 text-foreground"
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{task.is_urgent ? 'Urgente ✓' : 'Segna come urgente'}</span>
          </button>
        </div>

        {/* Separator */}
        <div className="h-px bg-muted/50" />

        {/* Color picker */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block flex items-center gap-1">
            <Palette className="w-3 h-3" />
            Colore
          </span>
          <div className="flex flex-wrap items-center gap-1.5 max-w-[220px]">
            {/* Remove color button */}
            {task.card_color && (
              <button
                onClick={() => handleColorSelect(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted hover:bg-destructive hover:text-white transition-colors"
                title="Rimuovi colore"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            
            {/* Preset colors */}
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={cn(
                  "w-7 h-7 rounded-lg transition-all hover:scale-110",
                  task.card_color === color && "ring-2 ring-offset-1 ring-foreground"
                )}
                style={{ 
                  backgroundColor: color,
                  border: color === '#FFFFFF' ? '1px solid #e5e7eb' : 'none'
                }}
              />
            ))}
            
            {/* Custom color picker */}
            <button
              onClick={() => setShowColorPicker(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-red-400 via-purple-400 to-blue-400 hover:scale-110 transition-transform"
              title="Colore personalizzato"
            >
              <span className="text-white text-xs font-bold">+</span>
            </button>
            <ColorPickerOverlay
              open={showColorPicker}
              color={task.card_color || '#FEF3C7'}
              onChange={(newColor) => {
                handleColorSelect(newColor);
                setShowColorPicker(false);
              }}
              onClose={() => setShowColorPicker(false)}
            />
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-muted/50" />

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-destructive/10 hover:bg-destructive hover:text-white text-destructive transition-all w-full"
        >
          <Trash2 className="w-4 h-4" />
          <span>Elimina task</span>
        </button>
      </div>
    </>
  );
});

TaskContextMenu.displayName = 'TaskContextMenu';

export default TaskContextMenu;
