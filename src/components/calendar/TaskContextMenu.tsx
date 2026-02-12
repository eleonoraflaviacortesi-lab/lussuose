import { memo, useState } from 'react';
import { AlertTriangle, X, Palette, Trash2, Star } from 'lucide-react';
import { cn, isDarkColor } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { Task } from '@/hooks/useTasks';
import { ColorPickerOverlay } from '@/components/ui/color-picker-overlay';
import { useFavoriteColors } from '@/hooks/useFavoriteColors';

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
  const { favorites, addFavorite, removeFavorite } = useFavoriteColors();

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
        className="fixed z-50 flex flex-col gap-2.5 p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 max-w-[300px] max-h-[85vh] overflow-y-auto"
        style={{
          left: Math.min(Math.max(10, position.x), window.innerWidth - 310),
          top: Math.min(Math.max(10, position.y), window.innerHeight - 40),
          transform: position.y > window.innerHeight * 0.6 ? 'translateY(-100%)' : 'none',
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
            {task.card_color && (
              <button
                onClick={() => handleColorSelect(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted hover:bg-destructive hover:text-white transition-colors"
                title="Rimuovi colore"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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
            <button
              onClick={() => setShowColorPicker(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-red-400 via-purple-400 to-blue-400 hover:scale-110 transition-transform"
              title="Colore personalizzato"
            >
              <span className="text-white text-xs font-bold">+</span>
            </button>
          </div>
          {/* Save current color as favorite */}
          {task.card_color && !PRESET_COLORS.includes(task.card_color) && !favorites.includes(task.card_color) && (
            <button
              onClick={() => { addFavorite(task.card_color!); triggerHaptic('light'); }}
              className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Star className="w-3 h-3" />
              Salva come preferito
            </button>
          )}
        </div>

        {/* Favorite colors */}
        {favorites.length > 0 && (
          <>
            <div className="h-px bg-muted/50" />
            <div>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block flex items-center gap-1">
                <Star className="w-3 h-3" />
                Preferiti
              </span>
              <div className="flex flex-wrap items-center gap-1.5 max-w-[220px]">
                {favorites.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    onContextMenu={(e) => { e.preventDefault(); removeFavorite(color); triggerHaptic('light'); }}
                    className={cn(
                      "w-7 h-7 rounded-lg transition-all hover:scale-110 relative group",
                      task.card_color === color && "ring-2 ring-offset-1 ring-foreground"
                    )}
                    style={{ backgroundColor: color }}
                    title="Click: applica · Tasto destro: rimuovi"
                  >
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

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
      {/* Color picker overlay - outside scrollable container */}
      <ColorPickerOverlay
        open={showColorPicker}
        color={task.card_color || '#FEF3C7'}
        onChange={(newColor) => {
          handleColorSelect(newColor);
          setShowColorPicker(false);
        }}
        onClose={() => setShowColorPicker(false)}
      />
    </>
  );
});

TaskContextMenu.displayName = 'TaskContextMenu';

export default TaskContextMenu;
