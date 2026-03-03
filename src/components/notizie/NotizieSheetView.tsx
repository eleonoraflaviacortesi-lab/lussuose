import { useState, useCallback, useRef, useMemo, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { Notizia, NotiziaStatus } from '@/hooks/useNotizie';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';
import { format } from 'date-fns';
import { cn, isDarkColor } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GripVertical, Paintbrush, Type, X, Bold, Italic, Strikethrough, Eye, GripHorizontal, Filter, Check, Star, Plus, Trash2, Copy, ClipboardPaste, RotateCcw, MessageCircle } from 'lucide-react';
import { useColumnTypeOverrides } from '@/hooks/useColumnTypeOverrides';
import { ColumnTypeMenu } from '@/components/ui/column-type-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ColorPickerOverlay } from '@/components/ui/color-picker-overlay';
import { triggerHaptic } from '@/lib/haptics';
import { useFavoriteColors } from '@/hooks/useFavoriteColors';

interface NotizieSheetViewProps {
  notizie: Notizia[];
  onNotiziaClick: (notizia: Notizia) => void;
  onUpdate: (id: string, updates: Partial<Notizia>) => void;
  onDelete?: (id: string) => void;
  searchQuery: string;
  onAddNew?: () => void;
}

const STATUS_OPTIONS: { value: NotiziaStatus; label: string; color: string }[] = [
  { value: 'new', label: 'Nuova', color: '#f59e0b' },
  { value: 'in_progress', label: 'In Lavorazione', color: '#3b82f6' },
  { value: 'done', label: 'Valutazione', color: '#22c55e' },
  { value: 'on_shot', label: 'On Shot', color: '#8b5cf6' },
  { value: 'taken', label: 'Presa', color: '#06b6d4' },
  { value: 'no', label: 'No', color: '#6b7280' },
  { value: 'sold', label: 'Venduta', color: '#ef4444' },
];

const CONTEXT_PALETTE_COLORS: (string | null)[] = [
  null,      '#f0eeec', '#e0ddda', '#c8c4c0', '#a8a4a0', '#808080', '#585858', '#303030',
  '#fef9e7', '#fef3c7', '#fde68a', '#f5c842', '#e8a317', '#c47f17', '#8b5e14', '#6b3f0d',
  '#e8f8e8', '#b5f0c0', '#6ddba0', '#38c77e', '#1a9a6c', '#0f7a5a', '#0a5e44', '#053d2e',
  '#dce8fc', '#b0ccf8', '#6fa2f0', '#3b7de8', '#2060d8', '#1648b8', '#0e3490', '#091e5c',
  '#f8e0ec', '#f0b0cc', '#e87aaa', '#d8488a', '#c02a70', '#981e5a', '#701644', '#480e2e',
  null, null, null, null, null, null, null, null,
];

const QUICK_EMOJIS = ['📋', '🏠', '🏡', '🏰', '🏛️', '🌳', '🌊', '⭐', '🔥', '💎', '🎯', '📞'];

const PALETTE_COLORS = [
  '#ffffff', '#f0eeec', '#e0ddda', '#c8c4c0', '#a8a4a0', '#808080', '#585858', '#303030',
  '#fef9e7', '#fef3c7', '#fde68a', '#f5c842', '#e8a317', '#c47f17', '#8b5e14', '#6b3f0d',
  '#e8f8e8', '#b5f0c0', '#6ddba0', '#38c77e', '#1a9a6c', '#0f7a5a', '#0a5e44', '#053d2e',
  '#dce8fc', '#b0ccf8', '#6fa2f0', '#3b7de8', '#2060d8', '#1648b8', '#0e3490', '#091e5c',
  '#f8e0ec', '#f0b0cc', '#e87aaa', '#d8488a', '#c02a70', '#981e5a', '#701644', '#480e2e',
];

// --- Emoji grid ---
const EmojiGridWithCustom = memo(function EmojiGridWithCustom({ currentEmoji, onSelect, onRemove }: {
  currentEmoji: string | null; onSelect: (e: string) => void; onRemove: () => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (showInput && inputRef.current) inputRef.current.focus(); }, [showInput]);

  return (
    <div className="flex flex-wrap items-center gap-1 max-w-[220px]">
      {currentEmoji && (
        <button onClick={onRemove} className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted hover:bg-destructive hover:text-white transition-colors" title="Rimuovi"><X className="w-3.5 h-3.5" /></button>
      )}
      {QUICK_EMOJIS.map(e => (
        <button key={e} onClick={() => onSelect(e)} className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-base hover:bg-muted transition-colors", currentEmoji === e && "bg-muted ring-1 ring-foreground")}>{e}</button>
      ))}
      {showInput ? (
        <input ref={inputRef} value={customEmoji} onChange={e => setCustomEmoji(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && customEmoji.trim()) { onSelect(customEmoji.trim()); setCustomEmoji(''); setShowInput(false); } }}
          onBlur={() => { setShowInput(false); setCustomEmoji(''); }}
          className="w-10 h-7 text-center text-base bg-muted rounded-lg border-0 outline-none focus:ring-1 focus:ring-foreground" placeholder="😀" maxLength={2} />
      ) : (
        <button onClick={() => setShowInput(true)} className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center text-sm font-bold text-foreground transition-all active:scale-90 hover:bg-muted">+</button>
      )}
    </div>
  );
});

// --- Row context menu ---
const SheetContextMenu = memo(function SheetContextMenu({
  position, notizia, onStatusChange, onEmojiChange, onColorChange, onDelete, onClose, statusOptions,
}: {
  position: { x: number; y: number }; notizia: Notizia;
  onStatusChange: (s: NotiziaStatus) => void; onEmojiChange: (e: string | null) => void;
  onColorChange: (c: string | null) => void; onDelete?: () => void; onClose: () => void;
  statusOptions: { value: string; label: string; color: string }[];
}) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customCardColor, setCustomCardColor] = useState(notizia.card_color || '#fef3c7');
  const { favorites, addFavorite, removeFavorite } = useFavoriteColors();
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjPos, setAdjPos] = useState(position);

  useEffect(() => {
    requestAnimationFrame(() => {
      const el = menuRef.current; if (!el) return;
      const rect = el.getBoundingClientRect();
      let nx = position.x, ny = position.y;
      if (nx + rect.width > window.innerWidth - 10) nx = window.innerWidth - rect.width - 10;
      if (ny + rect.height > window.innerHeight - 10) ny = window.innerHeight - rect.height - 10;
      setAdjPos({ x: Math.max(10, nx), y: Math.max(10, ny) });
    });
  }, [position]);

  return (
    <>
      <div className="fixed inset-0 z-[110]" onClick={onClose} onContextMenu={e => { e.preventDefault(); onClose(); }} />
      <div ref={menuRef} className="fixed z-[110] flex flex-col gap-2.5 p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 max-h-[85vh] overflow-y-auto"
        style={{ left: adjPos.x, top: adjPos.y }}
        onClick={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>

        {/* Status */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Stato</span>
          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
            {statusOptions.map(col => (
              <button key={col.value} onClick={() => { onStatusChange(col.value as NotiziaStatus); onClose(); }}
                className={cn("px-2.5 py-1 text-[10px] font-medium rounded-full transition-all active:scale-95",
                  notizia.status === col.value && "ring-2 ring-foreground ring-offset-1"
                )} style={{ backgroundColor: col.color, color: isDarkColor(col.color) ? 'white' : 'black' }}>{col.label}</button>
            ))}
          </div>
        </div>
        <div className="h-px bg-muted/50" />

        {/* Emoji */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Emoji</span>
          <EmojiGridWithCustom currentEmoji={notizia.emoji} onSelect={e => { onEmojiChange(e); onClose(); }} onRemove={() => { onEmojiChange(null); onClose(); }} />
        </div>
        <div className="h-px bg-muted/50" />

        {/* Color */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Colore card</span>
          <div className="grid grid-cols-8 gap-1 max-w-[220px]">
            {CONTEXT_PALETTE_COLORS.map(c => c !== null ? (
              <button key={c} onClick={() => { onColorChange(c); onClose(); }}
                className={cn("w-5 h-5 rounded-sm border border-border/30 hover:scale-125 transition-transform",
                  notizia.card_color === c && "ring-2 ring-foreground ring-offset-1"
                )} style={{ backgroundColor: c }} />
            ) : null)}
          </div>
          <button onClick={() => setShowCustomPicker(!showCustomPicker)}
            className="mt-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors">+ Personalizzato</button>
          {notizia.card_color && (
            <button onClick={() => { onColorChange(null); onClose(); }}
              className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3 h-3" /> Rimuovi colore
            </button>
          )}
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <>
            <div className="h-px bg-muted/50" />
            <div>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block flex items-center gap-1"><Star className="w-3 h-3" /> Preferiti</span>
              <div className="flex flex-wrap items-center gap-1.5 max-w-[220px]">
                {favorites.map(color => (
                  <button key={color} onClick={() => { onColorChange(color); onClose(); }}
                    onContextMenu={e => { e.preventDefault(); removeFavorite(color); triggerHaptic('light'); }}
                    className={cn("w-7 h-7 rounded-lg transition-all hover:scale-110 relative group",
                      notizia.card_color === color && "ring-2 ring-offset-1 ring-foreground"
                    )} style={{ backgroundColor: color }} title="Click: applica · Tasto destro: rimuovi">
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Delete */}
        {onDelete && (
          <>
            <div className="h-px bg-destructive/20" />
            <button onClick={() => { if (window.confirm('Eliminare questa notizia?')) { onDelete(); onClose(); } }}
              className="flex items-center gap-2 text-xs text-destructive hover:text-destructive/80 transition-colors py-1">
              <Trash2 className="w-3.5 h-3.5" /> Elimina notizia
            </button>
          </>
        )}

        <ColorPickerOverlay open={showCustomPicker} color={customCardColor}
          onChange={newColor => { onColorChange(newColor); onClose(); }} onClose={() => setShowCustomPicker(false)} />
      </div>
    </>
  );
});

// --- Cell context menu ---
type CellMenuInfo = { notizia: Notizia; colKey: string; value: string; x: number; y: number };

const CellContextMenu = memo(function CellContextMenu({
  info, onCellChange, onClose,
}: { info: CellMenuInfo; onCellChange: (id: string, key: string, val: string) => void; onClose: () => void; }) {
  const handleCopy = () => { navigator.clipboard.writeText(info.value).catch(() => {}); onClose(); };
  const handlePaste = async () => {
    try { const t = await navigator.clipboard.readText(); if (t) onCellChange(info.notizia.id, info.colKey, t); } catch {}
    onClose();
  };
  const handleReset = () => { onCellChange(info.notizia.id, info.colKey, ''); onClose(); };

  const ref = useRef<HTMLDivElement>(null);
  const [adjPos, setAdjPos] = useState({ x: info.x, y: info.y });
  useEffect(() => {
    requestAnimationFrame(() => {
      const el = ref.current; if (!el) return;
      const rect = el.getBoundingClientRect();
      let nx = info.x, ny = info.y;
      if (nx + rect.width > window.innerWidth - 10) nx = window.innerWidth - rect.width - 10;
      if (ny + rect.height > window.innerHeight - 10) ny = window.innerHeight - rect.height - 10;
      setAdjPos({ x: Math.max(10, nx), y: Math.max(10, ny) });
    });
  }, [info.x, info.y]);

  return (
    <>
      <div className="fixed inset-0 z-[110]" onClick={onClose} onContextMenu={e => { e.preventDefault(); onClose(); }} />
      <div ref={ref}
        className="fixed z-[110] flex flex-col gap-1 p-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 min-w-[160px]"
        style={{ left: adjPos.x, top: adjPos.y }} onClick={e => e.stopPropagation()}>
        <button onClick={handleCopy} className="flex items-center gap-2 text-xs text-foreground hover:bg-muted/60 px-2 py-1.5 rounded transition-colors"><Copy className="w-3 h-3" /> Copia</button>
        <button onClick={handlePaste} className="flex items-center gap-2 text-xs text-foreground hover:bg-muted/60 px-2 py-1.5 rounded transition-colors"><ClipboardPaste className="w-3 h-3" /> Incolla</button>
        <button onClick={handleReset} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded transition-colors"><RotateCcw className="w-3 h-3" /> Reset</button>
      </div>
    </>
  );
});

// --- Status Cell ---
function LazyStatusCell({ value, onChange, statusOptions }: { value: string; onChange: (v: string) => void; statusOptions: { value: string; label: string; color: string }[] }) {
  const [open, setOpen] = useState(false);
  const status = statusOptions.find(s => s.value === value) || STATUS_OPTIONS.find(s => s.value === value);
  if (!open) {
    return (
      <span className="block px-1 py-1 cursor-pointer hover:bg-secondary/50" onClick={e => { e.stopPropagation(); setOpen(true); }}>
        <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-semibold" style={{ backgroundColor: status?.color || '#666' }}>{status?.label || value}</span>
      </span>
    );
  }
  return (
    <Select value={value} onValueChange={v => { onChange(v); setOpen(false); }} open onOpenChange={o => { if (!o) setOpen(false); }}>
      <SelectTrigger className="h-7 border-0 bg-transparent shadow-none text-xs px-1 focus:ring-0">
        <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-semibold" style={{ backgroundColor: status?.color || '#666' }}>{status?.label || value}</span>
      </SelectTrigger>
      <SelectContent className="z-[200] bg-background border border-border">
        {statusOptions.map(s => (
          <SelectItem key={s.value} value={s.value}>
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />{s.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// --- Inline Text Cell ---
function InlineTextCell({ value, onChange }: { value: string; onChange?: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = useCallback(() => { setEditing(false); if (draft !== value && onChange) onChange(draft); }, [draft, value, onChange]);

  if (!onChange) return <span className="block text-xs px-2 py-1 min-h-[28px] break-words" title={value}>{value || '—'}</span>;
  if (!editing) {
    return (
      <span className="block text-xs px-2 py-1.5 cursor-text hover:bg-secondary/50 rounded min-h-[28px] break-words"
        onClick={e => { e.stopPropagation(); setEditing(true); setDraft(value); }} title={value}>{value || '—'}</span>
    );
  }
  return (
    <Input ref={el => { if (el) el.focus(); }}
      className="h-7 text-xs border-0 bg-primary/5 shadow-none rounded-none focus-visible:ring-2 focus-visible:ring-primary px-2"
      value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }} />
  );
}

// --- Inline Number Cell ---
function InlineNumberCell({ value, onChange }: { value: number | null; onChange?: (v: number | null) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));
  const commit = useCallback(() => {
    setEditing(false);
    if (onChange) onChange(draft ? Number(draft) : null);
  }, [draft, onChange]);

  const display = value ? (value >= 1000000 ? `€${(value / 1000000).toFixed(1)}M` : `€${(value / 1000).toFixed(0)}k`) : '—';

  if (!onChange) return <span className="block text-xs px-2 py-1 min-h-[28px]">{display}</span>;
  if (!editing) {
    return (
      <span className="block text-xs px-2 py-1.5 cursor-text hover:bg-secondary/50 rounded min-h-[28px]"
        onClick={e => { e.stopPropagation(); setEditing(true); setDraft(String(value ?? '')); }}>{display}</span>
    );
  }
  return (
    <Input ref={el => { if (el) el.focus(); }} type="number"
      className="h-7 text-xs border-0 bg-primary/5 shadow-none rounded-none focus-visible:ring-2 focus-visible:ring-primary px-2"
      value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value ?? '')); setEditing(false); } }} />
  );
}

// --- Color palette popover ---
function ColorPalettePopover({ currentColor, onSelect, children }: {
  currentColor: string | null; onSelect: (c: string | null) => void; children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[260px] p-2" align="start">
        <div className="grid grid-cols-8 gap-1">
          {PALETTE_COLORS.map(c => (
            <button key={c} className={cn("w-5 h-5 rounded-sm border border-border/50 hover:scale-125 transition-transform",
              currentColor === c && "ring-2 ring-primary ring-offset-1"
            )} style={{ backgroundColor: c }} onClick={() => onSelect(c)} />
          ))}
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => onSelect(null)}><X className="w-3 h-3 mr-1" /> Rimuovi colore</Button>
      </PopoverContent>
    </Popover>
  );
}

// --- Toolbar ---
type FormatState = { bold?: boolean; italic?: boolean; strikethrough?: boolean };

function SheetToolbar({
  selectedNotizia, selectedIndex, selectedColKey, onBgColorChange, onTextColorChange,
  currentFormat, onToggleFormat, currentBgColor, currentTextColor,
}: {
  selectedNotizia: Notizia | null; selectedIndex: number; selectedColKey: string | null;
  onBgColorChange: (c: string | null) => void; onTextColorChange: (c: string | null) => void;
  currentFormat: FormatState; onToggleFormat: (f: 'bold' | 'italic' | 'strikethrough') => void;
  currentBgColor: string | null; currentTextColor: string | null;
}) {
  const hasSelection = !!selectedNotizia || !!selectedColKey;
  const label = selectedColKey
    ? `Column — ${COLUMNS.find(c => c.key === selectedColKey)?.label || selectedColKey}`
    : selectedNotizia
      ? `Row ${selectedIndex + 1} — ${selectedNotizia.name}`.trim()
      : 'Seleziona una riga o colonna';

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/40 text-xs bg-background">
      <Button variant="ghost" size="sm" className={cn("h-7 w-7 p-0", currentFormat.bold && "bg-accent")} disabled={!hasSelection} onClick={() => onToggleFormat('bold')}><Bold className="w-3.5 h-3.5" /></Button>
      <Button variant="ghost" size="sm" className={cn("h-7 w-7 p-0", currentFormat.italic && "bg-accent")} disabled={!hasSelection} onClick={() => onToggleFormat('italic')}><Italic className="w-3.5 h-3.5" /></Button>
      <Button variant="ghost" size="sm" className={cn("h-7 w-7 p-0", currentFormat.strikethrough && "bg-accent")} disabled={!hasSelection} onClick={() => onToggleFormat('strikethrough')}><Strikethrough className="w-3.5 h-3.5" /></Button>
      <div className="h-4 w-px bg-border/30 mx-1" />
      <ColorPalettePopover currentColor={currentBgColor} onSelect={onBgColorChange}>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" disabled={!hasSelection}>
          <Paintbrush className="w-3.5 h-3.5" />
          <span className="w-3 h-3 rounded-sm border border-border/30" style={{ backgroundColor: currentBgColor || 'transparent' }} />
        </Button>
      </ColorPalettePopover>
      <ColorPalettePopover currentColor={currentTextColor} onSelect={onTextColorChange}>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" disabled={!hasSelection}>
          <Type className="w-3.5 h-3.5" />
          <span className="w-3 h-3 rounded-sm border border-border/30" style={{ backgroundColor: currentTextColor || 'transparent' }} />
        </Button>
      </ColorPalettePopover>
      <div className="h-4 w-px bg-border/30 mx-1" />
      <span className="text-muted-foreground tracking-wide">{label}</span>
    </div>
  );
}

// --- Column definitions ---
type ColumnDef = {
  key: string; label: string; width: number; minWidth: number;
  editable?: boolean; type?: 'text' | 'number' | 'status' | 'boolean';
};

const COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Nome', width: 180, minWidth: 120, editable: true, type: 'text' },
  { key: 'zona', label: 'Zona', width: 140, minWidth: 90, editable: true, type: 'text' },
  { key: 'phone', label: 'Telefono', width: 140, minWidth: 90, editable: true, type: 'text' },
  { key: 'type', label: 'Tipo', width: 120, minWidth: 80, editable: true, type: 'text' },
  { key: 'status', label: 'Status', width: 130, minWidth: 100, editable: true, type: 'status' },
  { key: 'prezzo_richiesto', label: 'Prezzo Rich.', width: 120, minWidth: 80, editable: true, type: 'number' },
  { key: 'valore', label: 'Valore', width: 120, minWidth: 80, editable: true, type: 'number' },
  { key: 'is_online', label: 'Online', width: 70, minWidth: 60, editable: false, type: 'boolean' },
  { key: 'created_at', label: 'Creata', width: 100, minWidth: 80, editable: false, type: 'text' },
  { key: 'notes', label: 'Note', width: 250, minWidth: 120, editable: true, type: 'text' },
];

function getCellValueStatic(n: Notizia, col: ColumnDef): string {
  switch (col.key) {
    case 'prezzo_richiesto': return n.prezzo_richiesto ? String(n.prezzo_richiesto) : '';
    case 'valore': return n.valore ? String(n.valore) : '';
    case 'is_online': return n.is_online ? '✅' : '';
    case 'created_at': try { return format(new Date(n.created_at), 'dd/MM/yyyy'); } catch { return ''; }
    case 'notes': return (n.notes || '').replace(/<[^>]+>/g, ' ').trim();
    default: return String((n as any)[col.key] ?? '');
  }
}

// --- Persistence ---
const LS_WIDTHS = 'notizie-sheet-col-widths-v2';
const LS_COL_FORMATS = 'notizie-sheet-col-formats';

function getSavedColWidths(): Record<string, number> | null {
  try { const r = localStorage.getItem(LS_WIDTHS); return r ? JSON.parse(r) : null; } catch { return null; }
}

// --- Column Filter ---
function ColumnFilterPopover({
  colKey, uniqueValues, activeFilter, onFilterChange,
}: { colKey: string; uniqueValues: string[]; activeFilter: Set<string>; onFilterChange: (k: string, v: Set<string>) => void; }) {
  const [search, setSearch] = useState('');
  const isActive = activeFilter.size > 0;
  const filteredValues = useMemo(() => {
    if (!search) return uniqueValues;
    const q = search.toLowerCase();
    return uniqueValues.filter(v => v.toLowerCase().includes(q));
  }, [uniqueValues, search]);

  const toggleValue = (val: string) => {
    const next = new Set(activeFilter);
    if (next.has(val)) next.delete(val); else next.add(val);
    onFilterChange(colKey, next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn("p-0.5 rounded hover:bg-muted/60 transition-colors", isActive && "text-primary")} onClick={e => e.stopPropagation()}>
          <Filter className={cn("w-3 h-3", isActive ? "opacity-100" : "opacity-30")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="start" onClick={e => e.stopPropagation()}>
        <Input placeholder="Cerca..." value={search} onChange={e => setSearch(e.target.value)} className="h-7 text-xs mb-2" />
        <div className="flex gap-1 mb-2">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] flex-1" onClick={() => onFilterChange(colKey, new Set())}>Tutti</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] flex-1" onClick={() => onFilterChange(colKey, new Set(uniqueValues))}>Nessuno</Button>
        </div>
        <div className="overflow-y-auto max-h-48 space-y-0.5">
          {filteredValues.map(val => {
            const checked = activeFilter.size === 0 || activeFilter.has(val);
            return (
              <button key={val} className={cn("flex items-center gap-2 w-full text-left text-xs px-2 py-1 rounded hover:bg-muted/60 transition-colors",
                !checked && activeFilter.size > 0 && "opacity-40")} onClick={() => toggleValue(val)}>
                <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0",
                  checked ? "bg-primary border-primary text-primary-foreground" : "border-border")}>
                  {checked && <Check className="w-2.5 h-2.5" />}
                </div>
                <span className="truncate">{val || '(vuoto)'}</span>
              </button>
            );
          })}
        </div>
        {isActive && (
          <Button variant="ghost" size="sm" className="w-full mt-2 h-6 text-[10px]" onClick={() => onFilterChange(colKey, new Set())}><X className="w-3 h-3 mr-1" /> Rimuovi filtro</Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// --- Override Dropdown Cell ---
function OverrideDropdownCell({ value, colKey, sheetId, onChange }: { value: string; colKey: string; sheetId: string; onChange?: (v: string) => void }) {
  const storageKey = `col-dropdown-opts-${sheetId}-${colKey}`;
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; } });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const saveOpts = (next: string[]) => { setOpts(next); localStorage.setItem(storageKey, JSON.stringify(next)); };
  if (!open) return <span className="block text-xs px-2 py-1.5 cursor-pointer hover:bg-secondary/50 rounded min-h-[28px] truncate" onClick={e => { e.stopPropagation(); setOpen(true); }}>{value || '—'}</span>;
  return (
    <div className="relative">
      <div className="fixed inset-0 z-[150]" onClick={() => setOpen(false)} />
      <div className="absolute left-0 top-0 z-[151] bg-background border border-border rounded-xl p-1.5 min-w-[140px] max-h-[200px] overflow-y-auto">
        <button onClick={() => { onChange?.(''); setOpen(false); }} className="w-full text-left px-2 py-1 text-xs rounded hover:bg-muted/60 text-muted-foreground">— Vuoto</button>
        {opts.map(o => <button key={o} onClick={() => { onChange?.(o); setOpen(false); }} className={cn("w-full text-left px-2 py-1 text-xs rounded hover:bg-muted/60", value === o && "font-semibold")}>{o}</button>)}
        {adding ? <input autoFocus className="w-full text-xs px-2 py-1 border border-border rounded mt-1" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) { saveOpts([...opts, draft.trim()]); setDraft(''); setAdding(false); } if (e.key === 'Escape') setAdding(false); }} onBlur={() => setAdding(false)} placeholder="Nuova opzione…" /> : <button onClick={() => setAdding(true)} className="w-full text-left px-2 py-1 text-xs text-muted-foreground hover:text-foreground">+ Aggiungi</button>}
      </div>
    </div>
  );
}

// --- Memoized Row ---
const MIN_ROW_HEIGHT = 32;

const SheetRow = memo(function SheetRow({
  notizia, idx, colWidths, rowNumWidth, isSelected, selectedColKey, rowFormat, colFormats, orderedColumns,
  onSelect, onCardClick, onCellChange, onContextMenu, onCellContextMenu, onCellSelect, colTypeOverrides,
  isDragOver, onRowDragStart, onRowDragOver, onRowDrop, onRowDragEnd,
  statusOptions,
}: {
  notizia: Notizia; idx: number; colWidths: Record<string, number>; rowNumWidth: number;
  isSelected: boolean; selectedColKey: string | null;
  rowFormat?: { bold?: boolean; italic?: boolean; strikethrough?: boolean };
  colFormats: Record<string, { bold?: boolean; italic?: boolean; strikethrough?: boolean; bgColor?: string | null; textColor?: string | null }>;
  orderedColumns: ColumnDef[];
  onSelect: (id: string) => void;
  onCardClick: (n: Notizia) => void;
  onCellChange: (id: string, key: string, val: string) => void;
  onContextMenu: (n: Notizia, x: number, y: number) => void;
  onCellContextMenu: (n: Notizia, col: ColumnDef, val: string, x: number, y: number) => void;
  onCellSelect?: (id: string, colKey: string) => void;
  isDragOver?: boolean;
  onRowDragStart?: (e: React.DragEvent) => void; onRowDragOver?: (e: React.DragEvent) => void;
  onRowDrop?: (e: React.DragEvent) => void; onRowDragEnd?: () => void;
  statusOptions: { value: string; label: string; color: string }[];
  colTypeOverrides: Record<string, string>;
}) {
  const longPressRef = useRef<NodeJS.Timeout | null>(null);

  const handleRowNumTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    longPressRef.current = setTimeout(() => { triggerHaptic('medium'); onContextMenu(notizia, touch.clientX, touch.clientY); }, 500);
  }, [notizia, onContextMenu]);
  const handleTouchEnd = useCallback(() => { if (longPressRef.current) clearTimeout(longPressRef.current); }, []);
  const handleTouchMove = useCallback(() => { if (longPressRef.current) clearTimeout(longPressRef.current); }, []);
  const handleRowNumRightClick = useCallback((e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onContextMenu(notizia, e.clientX, e.clientY); }, [notizia, onContextMenu]);
  const handleCellRightClick = useCallback((e: React.MouseEvent, col: ColumnDef) => {
    e.preventDefault(); e.stopPropagation();
    onCellContextMenu(notizia, col, getCellValueStatic(notizia, col), e.clientX, e.clientY);
  }, [notizia, onCellContextMenu]);

  return (
    <div
      className={cn("flex border-b border-border/20 transition-colors",
        isSelected ? 'ring-1 ring-foreground/20 ring-inset' : '',
        !notizia.card_color && (idx % 2 === 0 ? 'bg-card' : 'bg-card'),
        rowFormat?.bold && 'font-bold', rowFormat?.italic && 'italic', rowFormat?.strikethrough && 'line-through',
        isDragOver && 'border-t-2 border-t-primary',
      )}
      style={{ minHeight: MIN_ROW_HEIGHT, backgroundColor: notizia.card_color || undefined,
        color: notizia.card_color ? (isDarkColor(notizia.card_color) ? '#ffffff' : '#000000') : undefined }}
      onClick={() => onSelect(notizia.id)} onContextMenu={e => e.preventDefault()}
      onDragOver={onRowDragOver} onDrop={onRowDrop}>

      {/* Row number */}
      <div className="flex-shrink-0 flex items-center gap-0 border-r border-border/20 text-muted-foreground cursor-pointer hover:bg-muted/40 transition-colors"
        style={{ width: rowNumWidth }} onContextMenu={handleRowNumRightClick}
        onTouchStart={handleRowNumTouchStart} onTouchEnd={handleTouchEnd} onTouchMove={handleTouchMove}>
        <div className="flex items-center justify-center w-4 h-full cursor-grab active:cursor-grabbing opacity-30 hover:opacity-70 transition-opacity"
          draggable onDragStart={onRowDragStart} onDragEnd={onRowDragEnd}>
          <GripVertical className="w-3 h-3" />
        </div>
        <span className="text-[10px] font-medium flex-1 text-center select-none">{idx + 1}</span>
        <button className="flex items-center justify-center w-5 h-full hover:text-foreground transition-colors"
          onClick={e => { e.stopPropagation(); onCardClick(notizia); }} title="Apri scheda">
          <Eye className="w-3 h-3" />
        </button>
      </div>

      {/* Data cells */}
      {orderedColumns.map(col => {
        const cf = colFormats[col.key];
        return (
          <div key={col.key}
            className={cn("flex-shrink-0 border-r border-border/20",
              selectedColKey === col.key && "bg-accent/30",
              (cf?.bold || col.key === 'name') && 'font-bold', cf?.italic && 'italic', cf?.strikethrough && 'line-through',
            )}
            style={{ width: colWidths[col.key], backgroundColor: cf?.bgColor || undefined, color: cf?.textColor || undefined, wordBreak: 'break-word' }}
            onClick={e => { e.stopPropagation(); onSelect(notizia.id); onCellSelect?.(notizia.id, col.key); }}
            onContextMenu={e => handleCellRightClick(e, col)}>

            {/* Column type override rendering */}
            {colTypeOverrides[col.key] === 'checkbox' ? (
              <div className="flex items-center justify-center min-h-[28px] px-2">
                <input type="checkbox" className="w-4 h-4 cursor-pointer accent-foreground"
                  checked={!!getCellValueStatic(notizia, col) && getCellValueStatic(notizia, col) !== 'false' && getCellValueStatic(notizia, col) !== '0'}
                  onChange={e => col.editable && onCellChange(notizia.id, col.key, e.target.checked ? 'true' : '')} />
              </div>
            ) : colTypeOverrides[col.key] === 'url' ? (
              <div className="flex items-center gap-1 px-2 min-h-[28px]">
                {getCellValueStatic(notizia, col) ? (
                  <a href={getCellValueStatic(notizia, col).startsWith('http') ? getCellValueStatic(notizia, col) : `https://${getCellValueStatic(notizia, col)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate max-w-full"
                    onClick={e => e.stopPropagation()}>{getCellValueStatic(notizia, col)}</a>
                ) : (
                  <InlineTextCell value={getCellValueStatic(notizia, col)} onChange={col.editable ? v => onCellChange(notizia.id, col.key, v) : undefined} />
                )}
              </div>
            ) : colTypeOverrides[col.key] === 'dropdown' ? (
              <OverrideDropdownCell
                value={getCellValueStatic(notizia, col)}
                colKey={col.key}
                sheetId="notizie"
                onChange={col.editable ? v => onCellChange(notizia.id, col.key, v) : undefined}
              />
            ) : colTypeOverrides[col.key] === 'text' ? (
              <InlineTextCell value={getCellValueStatic(notizia, col)} onChange={col.editable ? v => onCellChange(notizia.id, col.key, v) : undefined} />
            ) : col.type === 'status' && col.editable ? (
              <LazyStatusCell value={getCellValueStatic(notizia, col)} onChange={v => onCellChange(notizia.id, col.key, v)} statusOptions={statusOptions} />
            ) : col.type === 'number' && col.editable ? (
              <InlineNumberCell value={(notizia as any)[col.key] ?? null} onChange={v => onCellChange(notizia.id, col.key, String(v ?? ''))} />
            ) : col.key === 'phone' ? (
              <div className="flex items-center gap-0.5">
                <div className="flex-1 overflow-hidden">
                  <InlineTextCell value={getCellValueStatic(notizia, col)} onChange={col.editable ? v => onCellChange(notizia.id, col.key, v) : undefined} />
                </div>
                {notizia.phone && (

                  <a href={`https://wa.me/${notizia.phone.replace(/[\s\-\(\)\+]/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 p-1 rounded hover:bg-accent transition-colors" onClick={e => e.stopPropagation()} title="WhatsApp">
                    <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                  </a>
                )}
              </div>
            ) : col.type === 'boolean' ? (
              <span className="block text-xs px-2 py-1 min-h-[28px]">{(notizia as any)[col.key] ? '✅' : ''}</span>
            ) : col.key === 'created_at' ? (
              <span className="block text-xs px-2 py-1 min-h-[28px]">{getCellValueStatic(notizia, col)}</span>
            ) : (
              <InlineTextCell value={getCellValueStatic(notizia, col)} onChange={col.editable ? v => onCellChange(notizia.id, col.key, v) : undefined} />
            )}
          </div>
        );
      })}
    </div>
  );
});

// ============ MAIN COMPONENT ============
const NotizieSheetView = ({ notizie, onNotiziaClick, onUpdate, onDelete, searchQuery, onAddNew }: NotizieSheetViewProps) => {
  const { columns: kanbanColumns } = useKanbanColumns();
  const { overrides: colTypeOverrides, setColumnType } = useColumnTypeOverrides('notizie-sheet');
  const [colTypeMenu, setColTypeMenu] = useState<{ colKey: string; colLabel: string; x: number; y: number } | null>(null);
  const statusOptions = useMemo(() =>
    kanbanColumns.length > 0
      ? kanbanColumns.map(c => ({ value: c.key, label: c.label, color: c.color }))
      : STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label, color: o.color })),
    [kanbanColumns]
  );
  const { columns: kanbanCols } = useKanbanColumns();
  const dynamicStatusOptions = kanbanCols.length > 0
    ? kanbanCols.map(c => ({ value: c.key, label: c.label, color: c.color }))
    : STATUS_OPTIONS;

  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const saved = getSavedColWidths();
    const defaults = Object.fromEntries(COLUMNS.map(c => [c.key, c.width]));
    return saved ? { ...defaults, ...saved } : defaults;
  });
  const [colOrder, setColOrder] = useState<string[]>(() => COLUMNS.map(c => c.key));
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedColKey, setSelectedColKey] = useState<string | null>(null);
  const [selectedCellCol, setSelectedCellCol] = useState<string | null>(null);
  const [colFilters, setColFilters] = useState<Record<string, Set<string>>>({});
  const [rowFormats, setRowFormats] = useState<Record<string, FormatState>>({});
  const [colFormats, setColFormats] = useState<Record<string, { bold?: boolean; italic?: boolean; strikethrough?: boolean; bgColor?: string | null; textColor?: string | null }>>(() => {
    try { const s = localStorage.getItem(LS_COL_FORMATS); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const [contextMenu, setContextMenu] = useState<{ notizia: Notizia; x: number; y: number } | null>(null);
  const [cellMenu, setCellMenu] = useState<CellMenuInfo | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [dragRowId, setDragRowId] = useState<string | null>(null);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  // Persist col formats
  useEffect(() => { try { localStorage.setItem(LS_COL_FORMATS, JSON.stringify(colFormats)); } catch {} }, [colFormats]);
  // Persist col widths
  useEffect(() => { try { localStorage.setItem(LS_WIDTHS, JSON.stringify(colWidths)); } catch {} }, [colWidths]);

  const orderedColumns = useMemo(() => colOrder.map(k => COLUMNS.find(c => c.key === k)!).filter(Boolean), [colOrder]);

  // Filter
  const filtered = useMemo(() => {
    if (!searchQuery) return notizie;
    const q = searchQuery.toLowerCase();
    return notizie.filter(n => n.name.toLowerCase().includes(q) || n.zona?.toLowerCase().includes(q) || n.notes?.toLowerCase().includes(q) || n.phone?.includes(q));
  }, [notizie, searchQuery]);

  // Column filters
  const colFiltered = useMemo(() => {
    const active = Object.entries(colFilters).filter(([, v]) => v.size > 0);
    if (active.length === 0) return filtered;
    return filtered.filter(n => active.every(([key, allowed]) => {
      const col = COLUMNS.find(c => c.key === key)!;
      return allowed.has(getCellValueStatic(n, col));
    }));
  }, [filtered, colFilters]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortCol) return colFiltered;
    return [...colFiltered].sort((a, b) => {
      const col = COLUMNS.find(c => c.key === sortCol)!;
      if (col.type === 'number') {
        const na = ((a as any)[col.key] as number) || 0;
        const nb = ((b as any)[col.key] as number) || 0;
        return sortDir === 'asc' ? na - nb : nb - na;
      }
      const va = getCellValueStatic(a, col);
      const vb = getCellValueStatic(b, col);
      const cmp = va.localeCompare(vb, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [colFiltered, sortCol, sortDir]);

  // Unique values for filters
  const uniqueValuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const col of COLUMNS) {
      const valSet = new Set<string>();
      for (const n of filtered) valSet.add(getCellValueStatic(n, col));
      map[col.key] = Array.from(valSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }
    return map;
  }, [filtered]);

  const handleFilterChange = useCallback((key: string, values: Set<string>) => {
    setColFilters(prev => ({ ...prev, [key]: values }));
  }, []);

  const handleHeaderClick = useCallback((key: string) => {
    setSelectedColKey(key); setSelectedRowId(null);
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(key); setSortDir('desc'); }
  }, [sortCol]);

  const handleResizeStart = useCallback((key: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    resizingRef.current = { key, startX: e.clientX, startWidth: colWidths[key] };
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const diff = ev.clientX - resizingRef.current.startX;
      const col = COLUMNS.find(c => c.key === resizingRef.current!.key);
      const newW = Math.max(col?.minWidth || 60, resizingRef.current.startWidth + diff);
      setColWidths(prev => ({ ...prev, [resizingRef.current!.key]: newW }));
    };
    const onUp = () => { resizingRef.current = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
  }, [colWidths]);

  const handleCellChange = useCallback((id: string, key: string, rawValue: string) => {
    const updates: Partial<any> = {};
    if (key === 'prezzo_richiesto' || key === 'valore') {
      updates[key] = rawValue ? Number(rawValue) : null;
    } else {
      updates[key] = rawValue || null;
    }
    onUpdate(id, updates);
  }, [onUpdate]);

  const selectedNotizia = useMemo(() => sorted.find(n => n.id === selectedRowId) || null, [sorted, selectedRowId]);
  const selectedIndex = useMemo(() => sorted.findIndex(n => n.id === selectedRowId), [sorted, selectedRowId]);

  const handleBgColorChange = useCallback((color: string | null) => {
    if (selectedColKey) setColFormats(prev => ({ ...prev, [selectedColKey]: { ...prev[selectedColKey], bgColor: color } }));
    else if (selectedRowId) onUpdate(selectedRowId, { card_color: color } as any);
  }, [selectedRowId, selectedColKey, onUpdate]);

  const handleTextColorChange = useCallback((color: string | null) => {
    if (selectedColKey) setColFormats(prev => ({ ...prev, [selectedColKey]: { ...prev[selectedColKey], textColor: color } }));
  }, [selectedColKey]);

  const handleToggleFormat = useCallback((fmt: 'bold' | 'italic' | 'strikethrough') => {
    if (selectedColKey) setColFormats(prev => ({ ...prev, [selectedColKey]: { ...prev[selectedColKey], [fmt]: !prev[selectedColKey]?.[fmt] } }));
    else if (selectedRowId) setRowFormats(prev => ({ ...prev, [selectedRowId]: { ...prev[selectedRowId], [fmt]: !prev[selectedRowId]?.[fmt] } }));
  }, [selectedRowId, selectedColKey]);

  const handleRowContextMenu = useCallback((notizia: Notizia, x: number, y: number) => { setCellMenu(null); setContextMenu({ notizia, x, y }); }, []);
  const handleCellContextMenu = useCallback((notizia: Notizia, col: ColumnDef, value: string, x: number, y: number) => {
    setContextMenu(null); setCellMenu({ notizia, colKey: col.key, value, x, y });
  }, []);

  const handleContextStatusChange = useCallback((status: NotiziaStatus) => {
    if (contextMenu) onUpdate(contextMenu.notizia.id, { status } as any);
  }, [contextMenu, onUpdate]);
  const handleContextEmojiChange = useCallback((emoji: string | null) => {
    if (contextMenu) onUpdate(contextMenu.notizia.id, { emoji } as any);
  }, [contextMenu, onUpdate]);
  const handleContextColorChange = useCallback((color: string | null) => {
    if (contextMenu) onUpdate(contextMenu.notizia.id, { card_color: color } as any);
  }, [contextMenu, onUpdate]);

  const currentFormat = useMemo(() => {
    if (selectedColKey) return colFormats[selectedColKey] || {};
    if (selectedRowId) return rowFormats[selectedRowId] || {};
    return {};
  }, [selectedColKey, selectedRowId, colFormats, rowFormats]);
  const currentBgColor = useMemo(() => selectedColKey ? colFormats[selectedColKey]?.bgColor || null : selectedNotizia?.card_color || null, [selectedColKey, colFormats, selectedNotizia]);
  const currentTextColor = useMemo(() => selectedColKey ? colFormats[selectedColKey]?.textColor || null : null, [selectedColKey, colFormats]);

  // Column drag
  const handleColDragStart = useCallback((key: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', key); e.dataTransfer.effectAllowed = 'move';
  }, []);
  const handleColDragOver = useCallback((key: string, e: React.DragEvent) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverCol(key);
  }, []);
  const handleColDrop = useCallback((targetKey: string, e: React.DragEvent) => {
    e.preventDefault();
    const sourceKey = e.dataTransfer.getData('text/plain');
    setDragOverCol(null);
    if (!sourceKey || sourceKey === targetKey) return;
    setColOrder(prev => {
      const arr = [...prev]; const from = arr.indexOf(sourceKey); const to = arr.indexOf(targetKey);
      if (from === -1 || to === -1) return prev;
      arr.splice(from, 1); arr.splice(to, 0, sourceKey); return arr;
    });
  }, []);

  // Copy/paste keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedRowId || !selectedCellCol) return;
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key === 'c') {
        e.preventDefault();
        const n = notizie.find(x => x.id === selectedRowId);
        const col = COLUMNS.find(c => c.key === selectedCellCol);
        if (n && col) navigator.clipboard.writeText(getCellValueStatic(n, col)).catch(() => {});
      }
      if (isCtrl && e.key === 'v') {
        e.preventDefault();
        navigator.clipboard.readText().then(text => {
          if (text && selectedRowId && selectedCellCol) {
            const col = COLUMNS.find(c => c.key === selectedCellCol);
            if (col?.editable) handleCellChange(selectedRowId, selectedCellCol, text);
          }
        }).catch(() => {});
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedRowId, selectedCellCol, notizie, handleCellChange]);

  const tableViewportRef = useRef<HTMLDivElement>(null);

  const rowNumWidth = 52;

  // Manteniamo la larghezza naturale delle colonne: niente compressione del contenuto.
  const adaptiveRowNumWidth = rowNumWidth;
  const adaptiveColWidths = useMemo(() => {
    const next: Record<string, number> = {};
    orderedColumns.forEach((col) => {
      next[col.key] = colWidths[col.key] || col.width;
    });
    return next;
  }, [orderedColumns, colWidths]);

  const totalWidth = adaptiveRowNumWidth + orderedColumns.reduce((sum, col) => sum + (adaptiveColWidths[col.key] || col.width), 0);

  return (
    <div className="rounded-lg sm:rounded-2xl bg-card overflow-hidden"
      onClick={e => { if (e.target === e.currentTarget) { setSelectedRowId(null); setSelectedColKey(null); } }}>

      {/* Add new + filter bar */}
      <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
        {onAddNew && (
          <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-xs font-semibold border-dashed border-2" onClick={onAddNew}>
            <Plus className="w-4 h-4" /> Nuova notizia
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <SheetToolbar
        selectedNotizia={selectedNotizia} selectedIndex={selectedIndex} selectedColKey={selectedColKey}
        onBgColorChange={handleBgColorChange} onTextColorChange={handleTextColorChange}
        currentFormat={currentFormat} onToggleFormat={handleToggleFormat}
        currentBgColor={currentBgColor} currentTextColor={currentTextColor} />

      {/* Table */}
      <div
        ref={tableViewportRef}
        className="overflow-x-auto [transform:rotateX(180deg)]"
        onClick={e => { if (e.target === e.currentTarget) { setSelectedRowId(null); setSelectedColKey(null); } }}>
        <div style={{ width: totalWidth, minWidth: '100%' }} className="[transform:rotateX(180deg)]">
          <div className="flex sticky top-0 z-10 bg-card border-b border-border/40">
            <div className="flex-shrink-0 flex items-center justify-center text-[10px] text-muted-foreground font-medium border-r border-border/20" style={{ width: adaptiveRowNumWidth }}>#</div>
            {orderedColumns.map(col => (
              <div key={col.key} draggable
                onDragStart={e => handleColDragStart(col.key, e)}
                onDragOver={e => handleColDragOver(col.key, e)}
                onDrop={e => handleColDrop(col.key, e)}
                onDragLeave={() => setDragOverCol(null)}
                className={cn(
                  "relative flex items-center border-r border-border/20 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2 select-none cursor-grab hover:bg-secondary/50 transition-colors",
                  selectedColKey === col.key && "bg-accent/40 text-foreground",
                  dragOverCol === col.key && "bg-accent/60 border-l-2 border-l-foreground/30"
                )}
                style={{ width: adaptiveColWidths[col.key], flexShrink: 0 }}
                onClick={() => handleHeaderClick(col.key)}
                onContextMenu={e => { e.preventDefault(); setColTypeMenu({ colKey: col.key, colLabel: col.label, x: e.clientX, y: e.clientY }); }}>
                <GripHorizontal className="w-3 h-3 mr-0.5 opacity-30 flex-shrink-0" />
                <span className="truncate flex-1">{col.label}</span>
                {colTypeOverrides[col.key] && <span className="text-[8px] text-muted-foreground ml-0.5 opacity-60" title={`Tipo: ${colTypeOverrides[col.key]}`}>⌗</span>}
                {sortCol === col.key && <span className="text-[8px] ml-0.5">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                <ColumnFilterPopover colKey={col.key} uniqueValues={uniqueValuesMap[col.key] || []} activeFilter={colFilters[col.key] || new Set()} onFilterChange={handleFilterChange} />
                <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-foreground/10 active:bg-foreground/20"
                  onMouseDown={e => handleResizeStart(col.key, e)} onClick={e => e.stopPropagation()} />
              </div>
            ))}
          </div>

          {/* Rows */}
          <div>
            {sorted.map((notizia, i) => (
              <SheetRow key={notizia.id} notizia={notizia} idx={i} colWidths={adaptiveColWidths} rowNumWidth={adaptiveRowNumWidth} colTypeOverrides={colTypeOverrides}
                isSelected={selectedRowId === notizia.id} selectedColKey={selectedColKey}
                rowFormat={rowFormats[notizia.id]} colFormats={colFormats} orderedColumns={orderedColumns}
                onSelect={setSelectedRowId} onCardClick={onNotiziaClick}
                onCellChange={handleCellChange} onContextMenu={handleRowContextMenu}
                onCellContextMenu={handleCellContextMenu}
                onCellSelect={(id, colKey) => { setSelectedRowId(id); setSelectedCellCol(colKey); }}
                isDragOver={dragOverRowId === notizia.id}
                onRowDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/row-id', notizia.id); setDragRowId(notizia.id); }}
                onRowDragOver={e => { e.preventDefault(); if (dragRowId && dragRowId !== notizia.id) setDragOverRowId(notizia.id); }}
                onRowDrop={e => { e.preventDefault(); const srcId = e.dataTransfer.getData('text/row-id'); setDragOverRowId(null); setDragRowId(null);
                  if (!srcId || srcId === notizia.id) return;
                  onUpdate(srcId, { display_order: notizia.display_order } as any);
                }}
                onRowDragEnd={() => { setDragRowId(null); setDragOverRowId(null); }}
                statusOptions={statusOptions}
              />
            ))}
          </div>

          {sorted.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">Nessuna notizia trovata</div>}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-card border-t border-border/40 px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
        <span className="flex-1">{sorted.length} notizie{filtered.length !== sorted.length ? ` (${filtered.length} totali)` : ''}</span>
        {Object.values(colFilters).some(s => s.size > 0) && (
          <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={() => setColFilters({})}><X className="w-3 h-3 mr-1" /> Rimuovi filtri</Button>
        )}
      </div>

      {/* Row context menu */}
      {contextMenu && (
        <SheetContextMenu position={{ x: contextMenu.x, y: contextMenu.y }} notizia={contextMenu.notizia}
          onStatusChange={handleContextStatusChange} onEmojiChange={handleContextEmojiChange}
          onColorChange={handleContextColorChange}
          onDelete={onDelete ? () => { onDelete(contextMenu.notizia.id); setContextMenu(null); } : undefined}
          onClose={() => setContextMenu(null)}
          statusOptions={statusOptions} />
      )}

      {/* Cell context menu */}
      {cellMenu && <CellContextMenu info={cellMenu} onCellChange={handleCellChange} onClose={() => setCellMenu(null)} />}
      {colTypeMenu && (
        <ColumnTypeMenu
          colKey={colTypeMenu.colKey}
          colLabel={colTypeMenu.colLabel}
          currentType={colTypeOverrides[colTypeMenu.colKey] ?? null}
          position={{ x: colTypeMenu.x, y: colTypeMenu.y }}
          onSelect={setColumnType}
          onClose={() => setColTypeMenu(null)}
        />
      )}
    </div>
  );
};

export default NotizieSheetView;
