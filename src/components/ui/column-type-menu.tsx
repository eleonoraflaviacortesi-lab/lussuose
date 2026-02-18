import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Type, Link, CheckSquare, ChevronDown, RotateCcw } from 'lucide-react';
import { ColumnTypeOverride } from '@/hooks/useColumnTypeOverrides';
import { cn } from '@/lib/utils';

const TYPE_OPTIONS: { value: ColumnTypeOverride; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'text', label: 'Testo', icon: <Type className="w-3.5 h-3.5" />, description: 'Campo testo libero' },
  { value: 'dropdown', label: 'Dropdown', icon: <ChevronDown className="w-3.5 h-3.5" />, description: 'Selezione da lista' },
  { value: 'url', label: 'URL', icon: <Link className="w-3.5 h-3.5" />, description: 'Link cliccabile' },
  { value: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="w-3.5 h-3.5" />, description: 'Sì / No' },
];

interface ColumnTypeMenuProps {
  colKey: string;
  colLabel: string;
  currentType: ColumnTypeOverride | null;
  position: { x: number; y: number };
  onSelect: (colKey: string, type: ColumnTypeOverride | null) => void;
  onClose: () => void;
}

export function ColumnTypeMenu({ colKey, colLabel, currentType, position, onSelect, onClose }: ColumnTypeMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjPos, setAdjPos] = useState(position);

  useEffect(() => {
    requestAnimationFrame(() => {
      const el = menuRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      let nx = position.x, ny = position.y;
      if (nx + rect.width > window.innerWidth - 10) nx = window.innerWidth - rect.width - 10;
      if (ny + rect.height > window.innerHeight - 10) ny = window.innerHeight - rect.height - 10;
      setAdjPos({ x: Math.max(10, nx), y: Math.max(10, ny) });
    });
  }, [position]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200]" onClick={onClose} onContextMenu={e => { e.preventDefault(); onClose(); }} />
      <div
        ref={menuRef}
        className="fixed z-[201] flex flex-col gap-1 p-2 bg-background border border-border rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 min-w-[190px]"
        style={{ left: adjPos.x, top: adjPos.y }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-2 pt-1 pb-2 border-b border-border/50">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tipo colonna</p>
          <p className="text-xs font-semibold truncate">{colLabel}</p>
        </div>

        {TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => { onSelect(colKey, opt.value); onClose(); }}
            className={cn(
              "flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-colors text-left",
              currentType === opt.value
                ? "bg-foreground text-background"
                : "hover:bg-muted/60 text-foreground"
            )}
          >
            {opt.icon}
            <div>
              <div className="font-medium">{opt.label}</div>
              <div className={cn("text-[10px]", currentType === opt.value ? "text-background/70" : "text-muted-foreground")}>{opt.description}</div>
            </div>
            {currentType === opt.value && (
              <span className="ml-auto text-[10px] font-bold">✓</span>
            )}
          </button>
        ))}

        {currentType && (
          <>
            <div className="h-px bg-border/50 mx-1" />
            <button
              onClick={() => { onSelect(colKey, null); onClose(); }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ripristina predefinito
            </button>
          </>
        )}
      </div>
    </>,
    document.body
  );
}
