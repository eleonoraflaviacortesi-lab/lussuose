import { memo, useState, useRef, useEffect } from 'react';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { cn, isDarkColor } from '@/lib/utils';
import { ColorPickerOverlay } from '@/components/ui/color-picker-overlay';

const COLUMN_COLORS = [
  '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#1f2937', '#6b7280', '#84cc16'
];

export interface KanbanColumnData {
  id: string;
  key: string;
  label: string;
  color: string;
}

interface KanbanColumnHeaderProps {
  column: KanbanColumnData;
  count: number;
  onUpdate: (updates: Partial<KanbanColumnData>) => void;
  onDelete: () => void;
  onQuickAdd?: () => void;
  isDragging?: boolean;
  isProtected?: boolean;
}

export const KanbanColumnHeader = memo(({
  column,
  count,
  onUpdate,
  onDelete,
  onQuickAdd,
  isDragging,
  isProtected = false,
}: KanbanColumnHeaderProps) => {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(column.label);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState(column.color);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    if (label.trim() && label !== column.label) {
      onUpdate({ label: label.trim() });
    }
    setEditing(false);
  };

  return (
    <div className={cn(
      "flex items-center gap-2 mb-1.5 lg:mb-2 group relative",
      isDragging && "opacity-50"
    )}>
      <GripVertical className="w-4 h-4 text-muted-foreground lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-grab shrink-0 touch-none" />

      {editing && !isProtected ? (
        <input
          ref={inputRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') { setLabel(column.label); setEditing(false); }
          }}
          className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-card border border-border outline-none w-24"
        />
      ) : (
        <button
          onClick={() => !isProtected && setEditing(true)}
          className={cn(
            "text-[11px] font-semibold px-2 py-0.5 rounded-md transition-transform",
            !isProtected && "hover:scale-105 cursor-text",
            isProtected && "cursor-default"
          )}
          style={{
            backgroundColor: column.color,
            color: isDarkColor(column.color) ? 'white' : 'black'
          }}
          title={isProtected ? "Colonna protetta" : "Clicca per modificare nome"}
        >
          {column.label}
        </button>
      )}

      <button
        onClick={() => setShowColorPicker(!showColorPicker)}
        className="w-4 h-4 rounded-full shrink-0 transition-transform hover:scale-110 ring-1 ring-black/10"
        style={{ backgroundColor: column.color }}
        title="Cambia colore"
      />

      <span className="text-xs text-muted-foreground">{count}</span>

      {onQuickAdd && (
        <button
          onClick={onQuickAdd}
          className="ml-auto text-foreground hover:opacity-60 transition-opacity"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}

      {!isProtected && (
        <button
          onClick={onDelete}
          className={cn(
            "text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100",
            !onQuickAdd && "ml-auto"
          )}
          title="Elimina colonna"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {showColorPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setShowColorPicker(false); setShowCustomPicker(false); }} />
          <div className="absolute top-8 left-0 z-50 p-3 bg-white/90 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] rounded-2xl min-w-[220px] animate-in zoom-in-95 fade-in duration-150">
            <div className="flex flex-wrap items-center gap-2">
              {COLUMN_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => { onUpdate({ color }); setShowColorPicker(false); }}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all active:scale-90 border border-border",
                    column.color === color && "ring-2 ring-foreground ring-offset-2"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              <button
                onClick={() => setShowCustomPicker(!showCustomPicker)}
                className={cn(
                  "w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-sm font-bold text-foreground transition-all active:scale-90",
                  showCustomPicker && "ring-2 ring-foreground ring-offset-2"
                )}
              >
                +
              </button>
            </div>
            <ColorPickerOverlay
              open={showCustomPicker}
              color={customColor}
              onChange={(newColor) => {
                setCustomColor(newColor);
                onUpdate({ color: newColor });
                setShowColorPicker(false);
                setShowCustomPicker(false);
              }}
              onClose={() => setShowCustomPicker(false)}
            />
          </div>
        </>
      )}
    </div>
  );
});
KanbanColumnHeader.displayName = 'KanbanColumnHeader';
