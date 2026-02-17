import { useState, useCallback, useRef, useMemo, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { Cliente, ClienteStatus } from '@/types';
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
import { GripVertical, Paintbrush, Type, X, Bold, Italic, Strikethrough, MessageCircle, Eye, GripHorizontal, Filter, Check, Star, Plus, Trash2, Copy, ClipboardPaste, Calendar as CalendarIcon, RotateCcw, StickyNote, Palette } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { UndoRedoButtons } from '@/components/ui/undo-redo-buttons';
import { LINGUA_COLORS, PORTALE_COLORS, TIPO_CONTATTO_COLORS } from '@/lib/colorMaps';

import { ColorPickerOverlay } from '@/components/ui/color-picker-overlay';
import { triggerHaptic } from '@/lib/haptics';
import { useFavoriteColors } from '@/hooks/useFavoriteColors';

interface Agent {
  user_id: string;
  full_name: string;
  avatar_emoji: string | null;
}

interface ClientiSheetViewProps {
  clienti: Cliente[];
  agents: Agent[];
  onCardClick: (cliente: Cliente) => void;
  onUpdate: (id: string, updates: Partial<Cliente>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onDuplicate?: (cliente: Cliente) => Promise<void>;
  searchQuery: string;
  onAddNew?: () => void | Promise<void>;
}

const STATUS_OPTIONS: { value: ClienteStatus; label: string; color: string }[] = [
  { value: 'new', label: 'Nuovo', color: '#f59e0b' },
  { value: 'contacted', label: 'Contattato', color: '#60a5fa' },
  { value: 'qualified', label: 'Qualificato', color: '#2563eb' },
  { value: 'proposal', label: 'Proposta', color: '#f97316' },
  { value: 'negotiation', label: 'Trattativa', color: '#ef4444' },
  { value: 'closed_won', label: 'Chiuso ✓', color: '#22c55e' },
  { value: 'closed_lost', label: 'Perso', color: '#6b7280' },
];

// Full color palette for context menu — 8 columns × 8 rows
const CONTEXT_PALETTE_COLORS: (string | null)[] = [
  null,      '#f0eeec', '#e0ddda', '#c8c4c0', '#a8a4a0', '#808080', '#585858', '#303030',
  '#fef9e7', '#fef3c7', '#fde68a', '#f5c842', '#e8a317', '#c47f17', '#8b5e14', '#6b3f0d',
  '#e8f8e8', '#b5f0c0', '#6ddba0', '#38c77e', '#1a9a6c', '#0f7a5a', '#0a5e44', '#053d2e',
  '#dce8fc', '#b0ccf8', '#6fa2f0', '#3b7de8', '#2060d8', '#1648b8', '#0e3490', '#091e5c',
  '#f8e0ec', '#f0b0cc', '#e87aaa', '#d8488a', '#c02a70', '#981e5a', '#701644', '#480e2e',
  null,      null,      null,      null,      null,      null,      null,      null,
];
const QUICK_EMOJIS = ['🏠', '🏡', '🏰', '🏛️', '🌳', '🌊', '⭐', '🔥', '💎', '🎯', '📞', '📸'];

// Emoji grid with custom "+" input
const EmojiGridWithCustom = memo(function EmojiGridWithCustom({ currentEmoji, onSelect, onRemove }: {
  currentEmoji: string | null;
  onSelect: (emoji: string) => void;
  onRemove: () => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput && inputRef.current) inputRef.current.focus();
  }, [showInput]);

  return (
    <div className="flex flex-wrap items-center gap-1 max-w-[220px]">
      {currentEmoji && (
        <button
          onClick={onRemove}
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted hover:bg-destructive hover:text-white transition-colors"
          title="Rimuovi emoji"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-base hover:bg-muted transition-colors",
            currentEmoji === emoji && "bg-muted ring-1 ring-foreground"
          )}
        >
          {emoji}
        </button>
      ))}
      {showInput ? (
        <input
          ref={inputRef}
          value={customEmoji}
          onChange={(e) => setCustomEmoji(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && customEmoji.trim()) {
              onSelect(customEmoji.trim());
              setCustomEmoji('');
              setShowInput(false);
            }
          }}
          onBlur={() => { setShowInput(false); setCustomEmoji(''); }}
          className="w-10 h-7 text-center text-base bg-muted rounded-lg border-0 outline-none focus:ring-1 focus:ring-foreground"
          placeholder="😀"
          maxLength={2}
        />
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="w-7 h-7 rounded-lg bg-white shadow-md flex items-center justify-center text-sm font-bold text-black transition-all active:scale-90 hover:bg-muted"
        >
          +
        </button>
      )}
    </div>
  );
});

// --- Lingua colors persistence (global) ---
function getCustomLinguaColors(): Record<string, string> {
  try {
    const saved = localStorage.getItem('custom-lingua-colors');
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}
function saveCustomLinguaColors(colors: Record<string, string>) {
  localStorage.setItem('custom-lingua-colors', JSON.stringify(colors));
  window.dispatchEvent(new StorageEvent('storage', { key: 'custom-lingua-colors' }));
}
function getMergedLinguaColors(): Record<string, string> {
  return { ...LINGUA_COLORS, ...getCustomLinguaColors() };
}

// Sheet context menu (status + emoji + color + duplicate)
const SheetContextMenu = memo(function SheetContextMenu({
  position,
  cliente,
  onStatusChange,
  onEmojiChange,
  onColorChange,
  onDuplicate,
  onDelete,
  onClose,
}: {
  position: { x: number; y: number };
  cliente: Cliente;
  onStatusChange: (status: ClienteStatus) => void;
  onEmojiChange: (emoji: string | null) => void;
  onColorChange: (color: string | null) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [customCardColor, setCustomCardColor] = useState(cliente.card_color || '#fef3c7');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const { favorites, addFavorite, removeFavorite } = useFavoriteColors();
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState(position);

  useEffect(() => {
    requestAnimationFrame(() => {
      const el = menuRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pad = 10;
      let nx = position.x, ny = position.y;
      if (nx + rect.width > window.innerWidth - pad) nx = window.innerWidth - rect.width - pad;
      if (nx < pad) nx = pad;
      if (ny + rect.height > window.innerHeight - pad) ny = window.innerHeight - rect.height - pad;
      if (ny < pad) ny = pad;
      setAdjustedPos({ x: nx, y: ny });
    });
  }, [position]);

  return (
    <>
      <div
        className="fixed inset-0 z-[110]"
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        ref={menuRef}
        className="fixed z-[110] flex flex-col gap-2.5 p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 max-h-[85vh] overflow-y-auto"
        style={{
          left: adjustedPos.x,
          top: adjustedPos.y,
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Status */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Stato</span>
          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
            {STATUS_OPTIONS.map((col) => (
              <button
                key={col.value}
                onClick={() => { onStatusChange(col.value); onClose(); }}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-medium rounded-full transition-all active:scale-95",
                  cliente.status === col.value && "ring-2 ring-foreground ring-offset-1"
                )}
                style={{
                  backgroundColor: col.color,
                  color: isDarkColor(col.color) ? 'white' : 'black'
                }}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-muted/50" />

        {/* Emoji */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Emoji</span>
          <EmojiGridWithCustom
            currentEmoji={cliente.emoji}
            onSelect={(emoji) => { onEmojiChange(emoji); onClose(); }}
            onRemove={() => { onEmojiChange(null); onClose(); }}
          />
        </div>

        <div className="h-px bg-muted/50" />

        {/* Color */}
        <div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Colore card</span>
          <div className="grid grid-cols-8 gap-1 max-w-[220px]">
            {CONTEXT_PALETTE_COLORS.map((c) => (
              <button
                key={c || 'default'}
                onClick={() => { onColorChange(c); onClose(); }}
                className={cn(
                  "w-5 h-5 rounded-sm border border-border/30 hover:scale-125 transition-transform",
                  !c && "bg-card border-2 border-muted",
                  cliente.card_color === c && "ring-2 ring-foreground ring-offset-1"
                )}
                style={c ? { backgroundColor: c } : undefined}
                title={c || 'Default'}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={cn(
                "text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1",
                showCustomPicker && "text-foreground font-medium"
              )}
            >
              + Colore personalizzato
            </button>
            {cliente.card_color && !CONTEXT_PALETTE_COLORS.includes(cliente.card_color) && !favorites.includes(cliente.card_color) && (
              <button
                onClick={() => { addFavorite(cliente.card_color!); triggerHaptic('light'); }}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Star className="w-3 h-3" />
                Salva
              </button>
            )}
          </div>
          {cliente.card_color && (
            <button
              onClick={() => { onColorChange(null); onClose(); }}
              className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
              Rimuovi colore
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
                    onClick={() => { onColorChange(color); onClose(); }}
                    onContextMenu={(e) => { e.preventDefault(); removeFavorite(color); triggerHaptic('light'); }}
                    className={cn(
                      "w-7 h-7 rounded-lg transition-all hover:scale-110 relative group",
                      cliente.card_color === color && "ring-2 ring-offset-1 ring-foreground"
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

        {/* Separator before destructive actions */}
        <div className="h-px bg-muted/50" />

        {/* Duplicate */}
        {onDuplicate && (
          <button
            onClick={() => { onDuplicate(); onClose(); }}
            className="flex items-center gap-2 text-xs text-foreground hover:text-foreground/80 transition-colors py-1"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplica riga
          </button>
        )}

        {/* Separator before delete */}
        {onDelete && <div className="h-px bg-destructive/20" />}

        {/* Delete */}
        {onDelete && (
          <button
            onClick={() => {
              if (window.confirm('Eliminare questo cliente?')) {
                onDelete();
                onClose();
              }
            }}
            className="flex items-center gap-2 text-xs text-destructive hover:text-destructive/80 transition-colors py-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Elimina cliente
          </button>
        )}

        <ColorPickerOverlay
          open={showCustomPicker}
          color={customCardColor}
          onChange={(newColor) => { onColorChange(newColor); onClose(); }}
          onClose={() => setShowCustomPicker(false)}
        />
      </div>
    </>
  );
});
SheetContextMenu.displayName = 'SheetContextMenu';

// --- Cell Context Menu ---
type CellMenuInfo = {
  cliente: Cliente;
  colKey: string;
  colType: string;
  value: string;
  x: number;
  y: number;
};

const CellContextMenu = memo(function CellContextMenu({
  info,
  onCellChange,
  onClose,
}: {
  info: CellMenuInfo;
  onCellChange: (id: string, key: string, val: string) => void;
  onClose: () => void;
}) {
  const { cliente, colKey, colType, value, x, y } = info;
  const [linguaColors, setLinguaColors] = useState(getMergedLinguaColors);
  const [portaleColors, setPortaleColors] = useState<Record<string, string>>(() => ({ ...PORTALE_COLORS, ...getCustomPortaleColors() }));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (!value) return undefined;
    const parts = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (parts) return new Date(+parts[3], +parts[2] - 1, +parts[1]);
    return undefined;
  });

  const [colorTarget, setColorTarget] = useState<string | null>(null);
  const isPill = colType === 'lingua' || colType === 'portale' || colType === 'tipo_contatto';
  const isDate = colKey === 'data_submission' || colKey === 'last_contact_date';

  const handleCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    onClose();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onCellChange(cliente.id, colKey, text);
    } catch {}
    onClose();
  };

  const handleReset = () => {
    onCellChange(cliente.id, colKey, '');
    onClose();
  };

  // Pill color change — uses colorTarget to know which option to color
  const handlePillColorChange = (color: string) => {
    const target = colorTarget || value;
    if (!target) return;
    if (colType === 'lingua') {
      const updated = { ...getCustomLinguaColors(), [target]: color };
      saveCustomLinguaColors(updated);
      setLinguaColors({ ...LINGUA_COLORS, ...updated });
    } else if (colType === 'portale') {
      const updated = { ...getCustomPortaleColors(), [target]: color };
      saveCustomPortaleColors(updated);
      setPortaleColors({ ...PORTALE_COLORS, ...updated });
    } else if (colType === 'tipo_contatto') {
      const updated = { ...getCustomPortaleColors(), [`tc_${target}`]: color };
      saveCustomPortaleColors(updated);
    }
    setColorTarget(null);
  };

  const handleResetPillColor = () => {
    if (colType === 'lingua' && value) {
      const updated = { ...getCustomLinguaColors() };
      delete updated[value];
      saveCustomLinguaColors(updated);
    } else if (colType === 'portale' && value) {
      const updated = { ...getCustomPortaleColors() };
      delete updated[value];
      saveCustomPortaleColors(updated);
    }
    onClose();
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, 'dd/MM/yyyy');
      onCellChange(cliente.id, colKey, formatted);
    }
    onClose();
  };

  // Pill value options
  const pillOptions = colType === 'lingua' ? LINGUA_OPTIONS_VALUES
    : colType === 'portale' ? [...DEFAULT_PORTALE_OPTIONS, ...getCustomPortals()]
    : colType === 'tipo_contatto' ? TIPO_CONTATTO_OPTIONS
    : [];

  const pillColorMap = colType === 'lingua' ? linguaColors
    : colType === 'portale' ? portaleColors
    : TIPO_CONTATTO_COLORS;

  const cellMenuRef = useRef<HTMLDivElement>(null);
  const [adjPos, setAdjPos] = useState({ x, y });

  useEffect(() => {
    requestAnimationFrame(() => {
      const el = cellMenuRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pad = 10;
      let nx = x, ny = y;
      if (nx + rect.width > window.innerWidth - pad) nx = window.innerWidth - rect.width - pad;
      if (nx < pad) nx = pad;
      if (ny + rect.height > window.innerHeight - pad) ny = window.innerHeight - rect.height - pad;
      if (ny < pad) ny = pad;
      setAdjPos({ x: nx, y: ny });
    });
  }, [x, y]);

  return (
    <>
      <div className="fixed inset-0 z-[110]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        ref={cellMenuRef}
        className="fixed z-[110] flex flex-col gap-1 p-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 max-h-[85vh] overflow-y-auto min-w-[180px]"
        style={{
          left: adjPos.x,
          top: adjPos.y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- PILL MENU --- */}
        {isPill && (
          <>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground px-2 pt-1">Modifica valore</span>
            <div className="flex flex-wrap gap-1 px-2 py-1 max-w-[260px]">
              {pillOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => {
                    if (value === opt) {
                      // Already selected → toggle color picker for this option
                      setColorTarget(prev => prev === opt ? null : opt);
                    } else {
                      onCellChange(cliente.id, colKey, opt);
                      onClose();
                    }
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-semibold text-white transition-all hover:scale-105",
                    value === opt && "ring-2 ring-foreground ring-offset-1",
                    colorTarget === opt && "ring-2 ring-amber-400 ring-offset-1"
                  )}
                  style={{ backgroundColor: pillColorMap[opt] || '#6b7280' }}
                >
                  {opt} {colorTarget === opt && '🎨'}
                </button>
              ))}
            </div>
            {/* Color palette — shown when a pill is targeted */}
            {colorTarget && (
              <>
                <div className="h-px bg-muted/50" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground px-2 pt-1">
                  Colore: {colorTarget}
                </span>
                <div className="grid grid-cols-8 gap-1 px-2 py-1">
                  {CONTEXT_PALETTE_COLORS.filter(Boolean).map(c => (
                    <button
                      key={c}
                      className={cn(
                        "w-4 h-4 rounded-full border border-border/30 hover:scale-125 transition-transform",
                        pillColorMap[colorTarget] === c && "ring-2 ring-foreground ring-offset-1"
                      )}
                      style={{ backgroundColor: c! }}
                      onClick={() => handlePillColorChange(c!)}
                    />
                  ))}
                </div>
                <button onClick={() => { handleResetPillColor(); setColorTarget(null); }} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 transition-colors">
                  <RotateCcw className="w-3 h-3" /> Reset colore
                </button>
              </>
            )}
            <div className="h-px bg-muted/50" />
          </>
        )}

        {/* --- DATE MENU --- */}
        {isDate && (
          <>
            <div className="px-1">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="text-xs"
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-2",
                  caption: "flex justify-center pt-1 relative items-center text-xs font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center",
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-7 font-normal text-[10px]",
                  row: "flex w-full mt-1",
                  cell: "text-center text-[11px] p-0 relative focus-within:relative focus-within:z-20",
                  day: "h-7 w-7 p-0 font-normal hover:bg-accent rounded-md inline-flex items-center justify-center",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary",
                  day_today: "bg-accent text-accent-foreground",
                }}
              />
            </div>
            <div className="h-px bg-muted/50" />
            <button onClick={handleReset} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 transition-colors">
              <RotateCcw className="w-3 h-3" /> Reset data
            </button>
            <div className="h-px bg-muted/50" />
          </>
        )}

        {/* --- COMMON ACTIONS --- */}
        <button onClick={handleCopy} className="flex items-center gap-2 text-xs text-foreground hover:bg-muted/60 px-2 py-1.5 rounded transition-colors">
          <Copy className="w-3 h-3" /> Copia valore
        </button>
        <button onClick={handlePaste} className="flex items-center gap-2 text-xs text-foreground hover:bg-muted/60 px-2 py-1.5 rounded transition-colors">
          <ClipboardPaste className="w-3 h-3" /> Incolla
        </button>
        {!isPill && !isDate && (
          <button onClick={handleReset} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded transition-colors">
            <RotateCcw className="w-3 h-3" /> Reset formato
          </button>
        )}
      </div>
    </>
  );
});
CellContextMenu.displayName = 'CellContextMenu';

// Portal options stored in localStorage for customization
function getCustomPortals(): string[] {
  try {
    const saved = localStorage.getItem('custom-portals');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveCustomPortals(portals: string[]) {
  localStorage.setItem('custom-portals', JSON.stringify(portals));
}

// Custom lingua options persistence
function getCustomLinguaOptions(): string[] {
  try {
    const saved = localStorage.getItem('custom-lingua-options');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}
function saveCustomLinguaOptions(opts: string[]) {
  localStorage.setItem('custom-lingua-options', JSON.stringify(opts));
}

// Custom tipo_contatto options persistence
function getCustomTipoContattoOptions(): string[] {
  try {
    const saved = localStorage.getItem('custom-tipo-contatto-options');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}
function saveCustomTipoContattoOptions(opts: string[]) {
  localStorage.setItem('custom-tipo-contatto-options', JSON.stringify(opts));
}

function getCustomPortaleColors(): Record<string, string> {
  try {
    const saved = localStorage.getItem('custom-portale-colors');
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveCustomPortaleColors(colors: Record<string, string>) {
  localStorage.setItem('custom-portale-colors', JSON.stringify(colors));
  // Dispatch storage event so other PortalBadgeCell instances sync
  window.dispatchEvent(new StorageEvent('storage', { key: 'custom-portale-colors' }));
}

const DEFAULT_PORTALE_OPTIONS = [
  'James Edition', 'Idealista', 'Gate-away', 'Sito Cortesi', 'Immobiliare.it', 'Rightmove', 'TALLY', 'Altro',
];
const TIPO_CONTATTO_OPTIONS = ['Mail', 'WhatsApp', 'Call', 'Idealista', 'Sito Cortesi'];
const LINGUA_OPTIONS_VALUES = ['ENG', 'ITA', 'FRA', 'DEU', 'ESP'];

type ColumnDef = {
  key: string;
  label: string;
  width: number;
  minWidth: number;
  editable?: boolean;
  type?: 'text' | 'number' | 'date' | 'select' | 'status' | 'agent' | 'regions' | 'types' | 'lingua' | 'portale' | 'tipo_contatto';
};

const COLUMNS: ColumnDef[] = [
  { key: 'paese', label: 'Country', width: 100, minWidth: 70, editable: true, type: 'text' },
  { key: 'lingua', label: 'Language', width: 90, minWidth: 70, editable: true, type: 'lingua' },
  { key: 'cognome', label: 'Surname', width: 130, minWidth: 80, editable: true, type: 'text' },
  { key: 'nome', label: 'Name', width: 140, minWidth: 100, editable: true, type: 'text' },
  { key: 'portale', label: 'Portale', width: 130, minWidth: 90, editable: true, type: 'portale' },
  { key: 'data_submission', label: 'Data', width: 110, minWidth: 80, editable: true, type: 'text' },
  { key: 'property_name', label: 'Property', width: 150, minWidth: 100, editable: true, type: 'text' },
  { key: 'ref_number', label: 'Ref.', width: 80, minWidth: 60, editable: true, type: 'text' },
  { key: 'last_contact_date', label: 'Data Contatto', width: 120, minWidth: 80, editable: true, type: 'text' },
  { key: 'contattato_da', label: 'Contattato da', width: 120, minWidth: 80, editable: true, type: 'text' },
  { key: 'tipo_contatto', label: 'Tipo Contatto', width: 120, minWidth: 90, editable: true, type: 'tipo_contatto' },
  { key: 'telefono', label: 'Contatto 1', width: 150, minWidth: 100, editable: true, type: 'text' },
  { key: 'email', label: 'Contatto 2', width: 200, minWidth: 120, editable: true, type: 'text' },
  { key: 'status', label: 'Status', width: 130, minWidth: 100, editable: true, type: 'status' },
  { key: 'note_extra', label: 'Note', width: 200, minWidth: 120, editable: true, type: 'text' },
];

// --- Helpers ---
function getDataRichiestaFromNotes(noteExtra: string | null): string | null {
  if (!noteExtra) return null;
  const match = noteExtra.match(/📅\s*Data richiesta:\s*(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return null;
}
function getEffectiveDate(cliente: Cliente): string | null {
  return cliente.data_submission || getDataRichiestaFromNotes(cliente.note_extra) || null;
}
function formatBudget(val: number | null): string {
  if (!val) return '';
  if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
  return `€${(val / 1000).toFixed(0)}k`;
}
function getCellValueStatic(cliente: Cliente, col: ColumnDef): string {
  switch (col.key) {
    case 'budget_max': return formatBudget(cliente.budget_max);
    case 'data_submission': {
      const d = getEffectiveDate(cliente);
      if (!d) return '';
      try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return d; }
    }
    case 'last_contact_date': {
      if (!cliente.last_contact_date) return '';
      try { return format(new Date(cliente.last_contact_date), 'dd/MM/yyyy'); } catch { return ''; }
    }
    case 'regioni': return cliente.regioni.join(', ');
    case 'tipologia': return cliente.tipologia.join(', ');
    default: return String((cliente as any)[col.key] ?? '');
  }
}

// --- Color Palette Picker (8-col matching CONTEXT_PALETTE_COLORS) ---
const PALETTE_COLORS = [
  '#ffffff', '#f0eeec', '#e0ddda', '#c8c4c0', '#a8a4a0', '#808080', '#585858', '#303030',
  '#fef9e7', '#fef3c7', '#fde68a', '#f5c842', '#e8a317', '#c47f17', '#8b5e14', '#6b3f0d',
  '#e8f8e8', '#b5f0c0', '#6ddba0', '#38c77e', '#1a9a6c', '#0f7a5a', '#0a5e44', '#053d2e',
  '#dce8fc', '#b0ccf8', '#6fa2f0', '#3b7de8', '#2060d8', '#1648b8', '#0e3490', '#091e5c',
  '#f8e0ec', '#f0b0cc', '#e87aaa', '#d8488a', '#c02a70', '#981e5a', '#701644', '#480e2e',
];

function ColorPalettePopover({
  currentColor,
  onSelect,
  children,
}: {
  currentColor: string | null;
  onSelect: (color: string | null) => void;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[260px] p-2" align="start">
        <div className="grid grid-cols-8 gap-1">
          {PALETTE_COLORS.map(c => (
            <button
              key={c}
              className={cn(
                "w-5 h-5 rounded-sm border border-border/50 hover:scale-125 transition-transform",
                currentColor === c && "ring-2 ring-primary ring-offset-1"
              )}
              style={{ backgroundColor: c }}
              onClick={() => onSelect(c)}
            />
          ))}
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => onSelect(null)}>
          <X className="w-3 h-3 mr-1" /> Rimuovi colore
        </Button>
      </PopoverContent>
    </Popover>
  );
}

// --- Simple Badge Cell (for lingua, tipo_contatto) — click opens pill context menu ---
function SimpleBadgeCell({
  value, onChange, defaultOptions, colorMap, colType,
}: {
  value: string; onChange: (val: string) => void; defaultOptions: string[]; colorMap?: Record<string, string>; colType?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [colorTarget, setColorTarget] = useState<string | null>(null);
  const [localColors, setLocalColors] = useState(colorMap || {});
  const [addingNew, setAddingNew] = useState(false);
  const [newValue, setNewValue] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);

  const getCustomOpts = colType === 'lingua' ? getCustomLinguaOptions : getCustomTipoContattoOptions;
  const saveCustomOpts = colType === 'lingua' ? saveCustomLinguaOptions : saveCustomTipoContattoOptions;
  const [customOpts, setCustomOpts] = useState(getCustomOpts);
  const allOptions = useMemo(() => [...defaultOptions, ...customOpts], [defaultOptions, customOpts]);

  useEffect(() => {
    if (colType === 'lingua') {
      const handler = (e: StorageEvent) => {
        if (e.key === 'custom-lingua-colors') setLocalColors(getMergedLinguaColors());
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }
  }, [colType]);

  useEffect(() => { setLocalColors(colorMap || {}); }, [colorMap]);
  useEffect(() => { if (addingNew && newInputRef.current) newInputRef.current.focus(); }, [addingNew]);

  const bgColor = localColors[value] || '#6b7280';

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ x: rect.left, y: rect.bottom + 4 });
    setMenuOpen(true);
    setColorTarget(null);
    setAddingNew(false);
  };

  const handleColorChange = (item: string, color: string) => {
    if (colType === 'lingua') {
      const updated = { ...getCustomLinguaColors(), [item]: color };
      saveCustomLinguaColors(updated);
      setLocalColors({ ...LINGUA_COLORS, ...updated });
    }
    setColorTarget(null);
  };

  const handleAddOption = () => {
    const trimmed = newValue.trim().toUpperCase();
    if (trimmed && !allOptions.includes(trimmed)) {
      const updated = [...customOpts, trimmed];
      setCustomOpts(updated);
      saveCustomOpts(updated);
      onChange(trimmed);
    }
    setNewValue('');
    setAddingNew(false);
    setMenuOpen(false);
  };

  const handleDeleteOption = (opt: string) => {
    // Only allow deleting custom options
    if (customOpts.includes(opt)) {
      const updated = customOpts.filter(o => o !== opt);
      setCustomOpts(updated);
      saveCustomOpts(updated);
      if (value === opt) onChange('');
    }
  };

  return (
    <>
      <span
        className="block px-1 py-1 cursor-pointer hover:bg-secondary/50 min-h-[28px]"
        onClick={openMenu}
        onContextMenu={openMenu}
      >
        {value ? (
          <span className="px-2 py-0.5 rounded text-white text-[10px] font-semibold" style={{ backgroundColor: bgColor }}>{value}</span>
        ) : (
          <span className="text-muted-foreground text-xs px-1">—</span>
        )}
      </span>

      {menuOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setMenuOpen(false)} onContextMenu={(e) => { e.preventDefault(); setMenuOpen(false); }} />
          <div
            className="fixed z-[9999] p-2 bg-popover backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 min-w-[180px] max-h-[80vh] overflow-y-auto"
            ref={(el) => {
              if (el) {
                const rect = el.getBoundingClientRect();
                const safeLeft = Math.min(menuPos.x, window.innerWidth - rect.width - 8);
                const safeTop = menuPos.y + rect.height > window.innerHeight - 8
                  ? Math.max(8, window.innerHeight - rect.height - 8)
                  : menuPos.y;
                el.style.left = `${Math.max(8, safeLeft)}px`;
                el.style.top = `${safeTop}px`;
              }
            }}
            style={{ left: -9999, top: -9999 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground px-2 pt-1">Modifica valore</span>
            <div className="flex flex-wrap gap-1 px-2 py-1.5 max-w-[260px]">
              {allOptions.map(opt => (
                <div key={opt} className="relative group">
                  <button
                    onClick={() => {
                      if (value === opt) {
                        setColorTarget(prev => prev === opt ? null : opt);
                      } else {
                        onChange(opt);
                        setMenuOpen(false);
                      }
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-semibold text-white transition-all hover:scale-105",
                      value === opt && "ring-2 ring-foreground ring-offset-1",
                      colorTarget === opt && "ring-2 ring-amber-400 ring-offset-1"
                    )}
                    style={{ backgroundColor: localColors[opt] || '#6b7280' }}
                  >
                    {opt}
                  </button>
                  {/* Delete button for custom options */}
                  {customOpts.includes(opt) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteOption(opt); }}
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-destructive text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {colorTarget && (
              <>
                <div className="h-px bg-muted/50" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground px-2 pt-1">Colore: {colorTarget}</span>
                <div className="grid grid-cols-8 gap-1 px-2 py-1.5">
                  {PALETTE_COLORS.map(c => (
                    <button
                      key={c}
                      className={cn(
                        "w-5 h-5 rounded-full border border-border/30 hover:scale-125 transition-transform",
                        localColors[colorTarget!] === c && "ring-2 ring-foreground ring-offset-1"
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => handleColorChange(colorTarget!, c)}
                    />
                  ))}
                </div>
              </>
            )}
            <div className="h-px bg-muted/50" />
            {addingNew ? (
              <div className="px-2 py-1 flex items-center gap-1">
                <input
                  ref={newInputRef}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddOption();
                    if (e.key === 'Escape') { setAddingNew(false); setNewValue(''); }
                  }}
                  className="flex-1 h-6 text-xs bg-muted rounded px-2 outline-none focus:ring-1 focus:ring-foreground/20"
                  placeholder="Nuovo valore..."
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <button
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 transition-colors w-full"
                onClick={() => setAddingNew(true)}
              >
                <Plus className="w-3 h-3" /> Aggiungi
              </button>
            )}
            <button
              onClick={() => { onChange(''); setMenuOpen(false); }}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 transition-colors w-full"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// --- Portal Badge Cell — click opens pill context menu ---
function PortalBadgeCell({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [colorTarget, setColorTarget] = useState<string | null>(null);
  const [customPortals, setCustomPortals] = useState(getCustomPortals);
  const [customColors, setCustomColors] = useState(getCustomPortaleColors);
  const [addingNew, setAddingNew] = useState(false);
  const [newPortal, setNewPortal] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);

  const allOptions = useMemo(() => [...DEFAULT_PORTALE_OPTIONS, ...customPortals], [customPortals]);
  const mergedColors = useMemo(() => ({ ...PORTALE_COLORS, ...customColors }), [customColors]);
  const bgColor = mergedColors[value] || '#6b7280';

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'custom-portale-colors') setCustomColors(getCustomPortaleColors());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    if (addingNew && newInputRef.current) newInputRef.current.focus();
  }, [addingNew]);

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ x: rect.left, y: rect.bottom + 4 });
    setMenuOpen(true);
    setColorTarget(null);
  };

  const handleColorChange = (portal: string, color: string) => {
    const updated = { ...customColors, [portal]: color };
    setCustomColors(updated);
    saveCustomPortaleColors(updated);
    setColorTarget(null);
  };

  const handleAddPortal = () => {
    if (newPortal.trim() && !allOptions.includes(newPortal.trim())) {
      const updated = [...customPortals, newPortal.trim()];
      setCustomPortals(updated);
      saveCustomPortals(updated);
      onChange(newPortal.trim());
    }
    setNewPortal('');
    setAddingNew(false);
    setMenuOpen(false);
  };

  return (
    <>
      <span
        className="block px-1 py-1 cursor-pointer hover:bg-secondary/50 min-h-[28px]"
        onClick={openMenu}
        onContextMenu={openMenu}
      >
        {value ? (
          <span className="px-2 py-0.5 rounded text-white text-[10px] font-semibold" style={{ backgroundColor: bgColor }}>{value}</span>
        ) : (
          <span className="text-muted-foreground text-xs px-1">—</span>
        )}
      </span>

      {menuOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setMenuOpen(false)} onContextMenu={(e) => { e.preventDefault(); setMenuOpen(false); }} />
          <div
            className="fixed z-[9999] p-2 bg-popover backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 min-w-[180px] max-h-[80vh] overflow-y-auto"
            ref={(el) => {
              if (el) {
                const rect = el.getBoundingClientRect();
                const safeLeft = Math.min(menuPos.x, window.innerWidth - rect.width - 8);
                const safeTop = menuPos.y + rect.height > window.innerHeight - 8
                  ? Math.max(8, window.innerHeight - rect.height - 8)
                  : menuPos.y;
                el.style.left = `${Math.max(8, safeLeft)}px`;
                el.style.top = `${safeTop}px`;
              }
            }}
            style={{ left: -9999, top: -9999 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground px-2 pt-1">Modifica valore</span>
            <div className="flex flex-wrap gap-1 px-2 py-1.5 max-w-[260px]">
              {allOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => {
                    if (value === opt) {
                      setColorTarget(prev => prev === opt ? null : opt);
                    } else {
                      onChange(opt);
                      setMenuOpen(false);
                    }
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-semibold text-white transition-all hover:scale-105",
                    value === opt && "ring-2 ring-foreground ring-offset-1",
                    colorTarget === opt && "ring-2 ring-amber-400 ring-offset-1"
                  )}
                  style={{ backgroundColor: mergedColors[opt] || '#6b7280' }}
                >
                  {opt}
                </button>
              ))}
            </div>
            {colorTarget && (
              <>
                <div className="h-px bg-muted/50" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground px-2 pt-1">Colore: {colorTarget}</span>
                <div className="grid grid-cols-8 gap-1 px-2 py-1.5">
                  {PALETTE_COLORS.map(c => (
                    <button
                      key={c}
                      className={cn(
                        "w-5 h-5 rounded-full border border-border/30 hover:scale-125 transition-transform",
                        mergedColors[colorTarget!] === c && "ring-2 ring-foreground ring-offset-1"
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => handleColorChange(colorTarget!, c)}
                    />
                  ))}
                </div>
              </>
            )}
            <div className="h-px bg-muted/50" />
            {addingNew ? (
              <div className="px-2 py-1 flex items-center gap-1">
                <input
                  ref={newInputRef}
                  value={newPortal}
                  onChange={(e) => setNewPortal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddPortal();
                    if (e.key === 'Escape') { setAddingNew(false); setNewPortal(''); }
                  }}
                  className="flex-1 h-6 text-xs bg-muted rounded px-2 outline-none focus:ring-1 focus:ring-foreground/20"
                  placeholder="Nuovo portale..."
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <button
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 transition-colors w-full"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAddingNew(true); }}
              >
                <Plus className="w-3 h-3" /> Aggiungi portale
              </button>
            )}
            <button
              onClick={() => { onChange(''); setMenuOpen(false); }}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 transition-colors w-full"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
// --- Lazy Status Cell ---
function LazyStatusCell({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const status = STATUS_OPTIONS.find(s => s.value === value);

  if (!open) {
    return (
      <span
        className="block px-1 py-1 cursor-pointer hover:bg-secondary/50"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >
        <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-semibold" style={{ backgroundColor: status?.color || '#666' }}>
          {status?.label || value}
        </span>
      </span>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={v => { onChange(v); setOpen(false); }}
      open={true}
      onOpenChange={(o) => { if (!o) setOpen(false); }}
    >
      <SelectTrigger className="h-7 border-0 bg-transparent shadow-none text-xs px-1 focus:ring-0">
        <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-semibold" style={{ backgroundColor: status?.color || '#666' }}>
          {status?.label || value}
        </span>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map(s => (
          <SelectItem key={s.value} value={s.value}>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// --- Lazy Agent Cell ---
function LazyAgentCell({ value, onChange, agents }: { value: string; onChange: (val: string) => void; agents: Agent[] }) {
  const [open, setOpen] = useState(false);
  const agent = agents.find(a => a.user_id === value);
  const display = agent ? `${agent.avatar_emoji || ''} ${agent.full_name}` : 'Not assigned';

  if (!open) {
    return (
      <span
        className="block text-xs px-2 py-1.5 cursor-pointer hover:bg-secondary/50 min-h-[28px] break-words"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >{display}</span>
    );
  }

  return (
    <Select
      value={value || '__none'}
      onValueChange={v => { onChange(v === '__none' ? '' : v); setOpen(false); }}
      open={true}
      onOpenChange={(o) => { if (!o) setOpen(false); }}
    >
      <SelectTrigger className="h-7 border-0 bg-transparent shadow-none text-xs px-1 focus:ring-0">
        <SelectValue>{display}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none">Not assigned</SelectItem>
        {agents.map(a => (
          <SelectItem key={a.user_id} value={a.user_id}>
            {a.avatar_emoji || '👤'} {a.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// --- Inline Text Cell ---
function InlineTextCell({ value, onChange }: { value: string; onChange?: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft !== value && onChange) onChange(draft);
  }, [draft, value, onChange]);

  if (!onChange) {
    return <span className="block text-xs px-2 py-1 min-h-[28px] break-words" title={value}>{value || '—'}</span>;
  }

  if (!editing) {
    return (
      <span
        className="block text-xs px-2 py-1.5 cursor-text hover:bg-secondary/50 rounded min-h-[28px] break-words"
        onClick={(e) => { e.stopPropagation(); setEditing(true); setDraft(value); }}
        title={value}
      >
        {value || '—'}
      </span>
    );
  }

  return (
    <Input
      ref={(el) => { if (el) el.focus(); }}
      className="h-7 text-xs border-0 bg-primary/5 shadow-none rounded-none focus-visible:ring-2 focus-visible:ring-primary px-2"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') { setDraft(value); setEditing(false); }
      }}
    />
  );
}

// --- Sheet Toolbar ---
type FormatState = { bold?: boolean; italic?: boolean; strikethrough?: boolean };

function SheetToolbar({
  selectedCliente,
  selectedIndex,
  selectedColKey,
  onBgColorChange,
  onTextColorChange,
  currentFormat,
  onToggleFormat,
  currentBgColor,
  currentTextColor,
}: {
  selectedCliente: Cliente | null;
  selectedIndex: number;
  selectedColKey: string | null;
  onBgColorChange: (color: string | null) => void;
  onTextColorChange: (color: string | null) => void;
  currentFormat: FormatState;
  onToggleFormat: (format: 'bold' | 'italic' | 'strikethrough') => void;
  currentBgColor: string | null;
  currentTextColor: string | null;
}) {
  const hasSelection = !!selectedCliente || !!selectedColKey;
  const selectionLabel = selectedColKey
    ? `Column — ${COLUMNS.find(c => c.key === selectedColKey)?.label || selectedColKey}`
    : selectedCliente
      ? `Row ${selectedIndex + 1} — ${selectedCliente.cognome || ''} ${selectedCliente.nome}`.trim()
      : 'Seleziona una riga o colonna';

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/40 text-xs bg-background">
      <Button variant="ghost" size="sm" className={cn("h-7 w-7 p-0", currentFormat.bold && "bg-accent")} disabled={!hasSelection} onClick={() => onToggleFormat('bold')}>
        <Bold className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className={cn("h-7 w-7 p-0", currentFormat.italic && "bg-accent")} disabled={!hasSelection} onClick={() => onToggleFormat('italic')}>
        <Italic className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className={cn("h-7 w-7 p-0", currentFormat.strikethrough && "bg-accent")} disabled={!hasSelection} onClick={() => onToggleFormat('strikethrough')}>
        <Strikethrough className="w-3.5 h-3.5" />
      </Button>
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
      <span className="text-muted-foreground tracking-wide">{selectionLabel}</span>
    </div>
  );
}

// --- Memoized Row ---
const MIN_ROW_HEIGHT = 32;

const SheetRow = memo(function SheetRow({
  cliente,
  idx,
  colWidths,
  agents,
  rowNumWidth,
  isSelected,
  selectedColKey,
  rowFormat,
  colFormats,
  orderedColumns,
  onSelect,
  onCardClick,
  onCellChange,
  onContextMenu,
  onCellContextMenu,
  onCellSelect,
  isDragOver,
  onRowDragStart,
  onRowDragOver,
  onRowDrop,
  onRowDragEnd,
}: {
  cliente: Cliente;
  idx: number;
  colWidths: Record<string, number>;
  agents: Agent[];
  rowNumWidth: number;
  isSelected: boolean;
  selectedColKey: string | null;
  rowFormat?: FormatState;
  colFormats: Record<string, { bold?: boolean; italic?: boolean; strikethrough?: boolean; bgColor?: string | null; textColor?: string | null }>;
  orderedColumns: ColumnDef[];
  onSelect: (id: string) => void;
  onCardClick: (c: Cliente) => void;
  onCellChange: (id: string, key: string, val: string) => void;
  onContextMenu: (cliente: Cliente, x: number, y: number) => void;
  onCellContextMenu: (cliente: Cliente, col: ColumnDef, value: string, x: number, y: number) => void;
  onCellSelect?: (clienteId: string, colKey: string) => void;
  isDragOver?: boolean;
  onRowDragStart?: (e: React.DragEvent) => void;
  onRowDragOver?: (e: React.DragEvent) => void;
  onRowDrop?: (e: React.DragEvent) => void;
  onRowDragEnd?: () => void;
}) {
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  // Long press on # cell for mobile → row context menu
  const handleRowNumTouchStart = useCallback((e: React.TouchEvent) => {
    longPressTriggered.current = false;
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    longPressRef.current = setTimeout(() => {
      longPressTriggered.current = true;
      triggerHaptic('medium');
      onContextMenu(cliente, x, y);
    }, 500);
  }, [cliente, onContextMenu]);

  const handleTouchEnd = useCallback(() => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  }, []);

  // Right-click on # cell → row context menu
  const handleRowNumRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(cliente, e.clientX, e.clientY);
  }, [cliente, onContextMenu]);

  // Right-click on data cell → cell context menu
  const handleCellRightClick = useCallback((e: React.MouseEvent, col: ColumnDef) => {
    e.preventDefault();
    e.stopPropagation();
    const value = col.key.startsWith('custom_') ? getCustomFieldValue(cliente, col.key) : getCellValueStatic(cliente, col);
    onCellContextMenu(cliente, col, value, e.clientX, e.clientY);
  }, [cliente, onCellContextMenu]);

  // Prevent browser default context menu on the row itself
  const handleRowContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      className={cn(
        "flex border-b border-border/20 transition-colors",
        isSelected ? 'ring-1 ring-foreground/20 ring-inset' : '',
        !cliente.row_bg_color && (idx % 2 === 0 ? 'bg-background' : 'bg-secondary/30'),
        rowFormat?.bold && 'font-bold',
        rowFormat?.italic && 'italic',
        rowFormat?.strikethrough && 'line-through',
        isDragOver && 'border-t-2 border-t-primary',
      )}
      style={{
        minHeight: MIN_ROW_HEIGHT,
        backgroundColor: cliente.row_bg_color || cliente.card_color || undefined,
        color: cliente.row_text_color || (cliente.card_color ? (isDarkColor(cliente.card_color) ? '#ffffff' : '#000000') : undefined),
      }}
      onClick={() => onSelect(cliente.id)}
      onContextMenu={handleRowContextMenu}
      onDragOver={onRowDragOver}
      onDrop={onRowDrop}
    >
      {/* Row number + drag handle + open detail */}
      <div
        className="flex-shrink-0 flex items-center gap-0 border-r border-border/20 text-muted-foreground cursor-pointer hover:bg-muted/40 transition-colors"
        style={{ width: rowNumWidth, color: cliente.row_text_color || undefined }}
        onContextMenu={handleRowNumRightClick}
        onTouchStart={handleRowNumTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        <div
          className="flex items-center justify-center w-4 h-full cursor-grab active:cursor-grabbing opacity-30 hover:opacity-70 transition-opacity"
          draggable
          onDragStart={onRowDragStart}
          onDragEnd={onRowDragEnd}
        >
          <GripVertical className="w-3 h-3" />
        </div>
        <span className="text-[10px] font-medium flex-1 text-center select-none flex items-center justify-center gap-0.5">
          {idx + 1}
          {cliente.tally_submission_id && (
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 drop-shadow-[0_0_3px_rgba(245,158,11,0.6)]" fill="#f59e0b">
              <path d="M12 1l3 8.5L24 12l-9 2.5L12 23l-3-8.5L0 12l9-2.5z" />
            </svg>
          )}
        </span>
        <button
          className="flex items-center justify-center w-5 h-full hover:text-foreground transition-colors"
          onClick={(e) => { e.stopPropagation(); onCardClick(cliente); }}
          title="Apri scheda"
        >
          <Eye className="w-3 h-3" />
        </button>
      </div>

      {/* Data cells */}
      {orderedColumns.map(col => {
        const cf = colFormats[col.key];
        return (
          <div
            key={col.key}
            className={cn(
              "flex-shrink-0 border-r border-border/20",
              selectedColKey === col.key && "bg-accent/30",
              (cf?.bold || col.key === 'nome' || col.key === 'cognome') && 'font-bold',
              cf?.italic && 'italic',
              cf?.strikethrough && 'line-through',
            )}
            style={{
              width: colWidths[col.key],
              backgroundColor: cf?.bgColor || undefined,
              color: cf?.textColor || undefined,
              wordBreak: 'break-word',
            }}
            onClick={(e) => { e.stopPropagation(); onSelect(cliente.id); onCellSelect?.(cliente.id, col.key); }}
            onContextMenu={(e) => handleCellRightClick(e, col)}
          >
            {col.type === 'status' && col.editable ? (
              <LazyStatusCell value={getCellValueStatic(cliente, col)} onChange={(v) => onCellChange(cliente.id, col.key, v)} />
            ) : col.type === 'lingua' && col.editable ? (
              <SimpleBadgeCell value={getCellValueStatic(cliente, col)} onChange={(v) => onCellChange(cliente.id, col.key, v)} defaultOptions={LINGUA_OPTIONS_VALUES} colorMap={getMergedLinguaColors()} colType="lingua" />
            ) : col.type === 'portale' && col.editable ? (
              <PortalBadgeCell value={getCellValueStatic(cliente, col)} onChange={(v) => onCellChange(cliente.id, col.key, v)} />
            ) : col.type === 'tipo_contatto' && col.editable ? (
              <SimpleBadgeCell value={getCellValueStatic(cliente, col)} onChange={(v) => onCellChange(cliente.id, col.key, v)} defaultOptions={TIPO_CONTATTO_OPTIONS} colorMap={TIPO_CONTATTO_COLORS} colType="tipo_contatto" />
            ) : col.type === 'agent' && col.editable ? (
              <LazyAgentCell value={getCellValueStatic(cliente, col)} onChange={(v) => onCellChange(cliente.id, col.key, v)} agents={agents} />
            ) : col.key === 'telefono' ? (
              <div className="flex items-center gap-0.5">
                <div className="flex-1 overflow-hidden">
                  <InlineTextCell value={getCellValueStatic(cliente, col)} onChange={col.editable ? (v) => onCellChange(cliente.id, col.key, v) : undefined} />
                </div>
                {cliente.telefono && (
                  <a
                    href={`https://wa.me/${cliente.telefono.replace(/[\s\-\(\)\+]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-1 rounded hover:bg-accent transition-colors"
                    onClick={e => e.stopPropagation()}
                    title="Apri WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                  </a>
                )}
              </div>
            ) : col.key.startsWith('custom_') ? (
              <InlineTextCell value={getCustomFieldValue(cliente, col.key)} onChange={col.editable ? (v) => onCellChange(cliente.id, col.key, v) : undefined} />
            ) : (
              <InlineTextCell value={getCellValueStatic(cliente, col)} onChange={col.editable ? (v) => onCellChange(cliente.id, col.key, v) : undefined} />
            )}
          </div>
        );
      })}
    </div>
  );
});

const DATE_COLUMNS = ['data_submission', 'last_contact_date'];

// --- Date (Month) Filter Popover ---
function DateColumnFilterPopover({
  colKey,
  uniqueValues,
  activeFilter,
  onFilterChange,
}: {
  colKey: string;
  uniqueValues: string[];
  activeFilter: Set<string>;
  onFilterChange: (key: string, values: Set<string>) => void;
}) {
  const isActive = activeFilter.size > 0;

  // Extract unique months from date values (dd/MM/yyyy -> MM/yyyy)
  const months = useMemo(() => {
    const monthSet = new Map<string, string>();
    uniqueValues.forEach(v => {
      if (!v) return;
      const parts = v.split('/');
      if (parts.length === 3) {
        const key = `${parts[1]}/${parts[2]}`; // MM/yyyy
        const label = `${['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'][parseInt(parts[1], 10) - 1] || parts[1]} ${parts[2]}`;
        monthSet.set(key, label);
      }
    });
    return Array.from(monthSet.entries())
      .sort((a, b) => {
        const [mA, yA] = a[0].split('/');
        const [mB, yB] = b[0].split('/');
        return yB.localeCompare(yA) || mB.localeCompare(mA);
      });
  }, [uniqueValues]);

  const toggleMonth = (monthKey: string) => {
    // Get all date values that belong to this month
    const datesInMonth = uniqueValues.filter(v => {
      if (!v) return false;
      const parts = v.split('/');
      return parts.length === 3 && `${parts[1]}/${parts[2]}` === monthKey;
    });

    const next = new Set(activeFilter);
    const allIncluded = datesInMonth.every(d => next.has(d));
    if (allIncluded) {
      datesInMonth.forEach(d => next.delete(d));
    } else {
      datesInMonth.forEach(d => next.add(d));
    }
    // If all selected, clear filter
    if (next.size === uniqueValues.filter(v => !!v).length) {
      onFilterChange(colKey, new Set());
    } else {
      onFilterChange(colKey, next);
    }
  };

  const selectAll = () => onFilterChange(colKey, new Set());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "p-0.5 rounded hover:bg-muted/60 transition-colors",
            isActive && "text-primary"
          )}
          onClick={e => e.stopPropagation()}
        >
          <Filter className={cn("w-3 h-3", isActive ? "opacity-100" : "opacity-30")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start" onClick={e => e.stopPropagation()}>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Filtra per mese</p>
        <div className="overflow-y-auto max-h-48 space-y-0.5">
          {months.map(([monthKey, label]) => {
            const datesInMonth = uniqueValues.filter(v => {
              if (!v) return false;
              const parts = v.split('/');
              return parts.length === 3 && `${parts[1]}/${parts[2]}` === monthKey;
            });
            const checked = activeFilter.size === 0 || datesInMonth.some(d => activeFilter.has(d));
            const count = datesInMonth.length;
            return (
              <button
                key={monthKey}
                className={cn(
                  "flex items-center gap-2 w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted/60 transition-colors",
                  !checked && activeFilter.size > 0 && "opacity-40"
                )}
                onClick={() => toggleMonth(monthKey)}
              >
                <div className={cn(
                  "w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0",
                  checked ? "bg-primary border-primary text-primary-foreground" : "border-border"
                )}>
                  {checked && <Check className="w-2.5 h-2.5" />}
                </div>
                <span className="flex-1">{label}</span>
                <span className="text-muted-foreground text-[10px]">{count}</span>
              </button>
            );
          })}
        </div>
        {isActive && (
          <Button variant="ghost" size="sm" className="w-full mt-2 h-6 text-[10px]" onClick={selectAll}>
            <X className="w-3 h-3 mr-1" /> Rimuovi filtro
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// --- Column Filter Popover ---
function ColumnFilterPopover({
  colKey,
  uniqueValues,
  activeFilter,
  onFilterChange,
}: {
  colKey: string;
  uniqueValues: string[];
  activeFilter: Set<string>;
  onFilterChange: (key: string, values: Set<string>) => void;
}) {
  const [search, setSearch] = useState('');
  const isActive = activeFilter.size > 0;
  const filteredValues = useMemo(() => {
    if (!search) return uniqueValues;
    const q = search.toLowerCase();
    return uniqueValues.filter(v => v.toLowerCase().includes(q));
  }, [uniqueValues, search]);

  const toggleValue = (val: string) => {
    const next = new Set(activeFilter);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    onFilterChange(colKey, next);
  };

  const selectAll = () => onFilterChange(colKey, new Set());
  const selectNone = () => onFilterChange(colKey, new Set(uniqueValues));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "p-0.5 rounded hover:bg-muted/60 transition-colors",
            isActive && "text-primary"
          )}
          onClick={e => e.stopPropagation()}
        >
          <Filter className={cn("w-3 h-3", isActive ? "opacity-100" : "opacity-30")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="start" onClick={e => e.stopPropagation()}>
        <Input
          placeholder="Cerca..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-7 text-xs mb-2"
        />
        <div className="flex gap-1 mb-2">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] flex-1" onClick={selectAll}>Tutti</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] flex-1" onClick={selectNone}>Nessuno</Button>
        </div>
        <div className="overflow-y-auto max-h-48 space-y-0.5">
            {filteredValues.map(val => {
              const checked = activeFilter.size === 0 || activeFilter.has(val);
              return (
                <button
                  key={val}
                  className={cn(
                    "flex items-center gap-2 w-full text-left text-xs px-2 py-1 rounded hover:bg-muted/60 transition-colors",
                    !checked && activeFilter.size > 0 && "opacity-40"
                  )}
                  onClick={() => toggleValue(val)}
                >
                  <div className={cn(
                    "w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0",
                    checked ? "bg-primary border-primary text-primary-foreground" : "border-border"
                  )}>
                    {checked && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span className="truncate">{val || '(vuoto)'}</span>
                </button>
              );
            })}
        </div>
        {isActive && (
          <Button variant="ghost" size="sm" className="w-full mt-2 h-6 text-[10px]" onClick={selectAll}>
            <X className="w-3 h-3 mr-1" /> Rimuovi filtro
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// --- Custom columns management ---
function getCustomColumns(): ColumnDef[] {
  try {
    const saved = localStorage.getItem('clienti-custom-columns');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveCustomColumns(cols: ColumnDef[]) {
  localStorage.setItem('clienti-custom-columns', JSON.stringify(cols));
}

function getCustomFieldValue(cliente: Cliente, key: string): string {
  const cf = (cliente as any).custom_fields;
  if (!cf || typeof cf !== 'object') return '';
  return String(cf[key] ?? '');
}

// --- Persistence helpers for column widths ---
function getSavedColWidths(): Record<string, number> | null {
  try {
    const saved = localStorage.getItem('clienti-sheet-col-widths');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function saveColWidths(widths: Record<string, number>) {
  localStorage.setItem('clienti-sheet-col-widths', JSON.stringify(widths));
}

// --- Main Component ---
export function ClientiSheetView({ clienti, agents, onCardClick, onUpdate, onDelete, onDuplicate, searchQuery, onAddNew }: ClientiSheetViewProps) {
  const [customCols, setCustomCols] = useState<ColumnDef[]>(getCustomColumns);
  const allColumns = useMemo(() => [...COLUMNS, ...customCols], [customCols]);
  const [colOrder, setColOrder] = useState<string[]>(() => [...COLUMNS.map(c => c.key), ...getCustomColumns().map(c => c.key)]);
  const [colWidths, setColWidths] = useState<Record<string, number>>(
    () => {
      const saved = getSavedColWidths();
      const defaults = Object.fromEntries([...COLUMNS, ...getCustomColumns()].map(c => [c.key, c.width]));
      return saved ? { ...defaults, ...saved } : defaults;
    }
  );
  const [sortCol, setSortCol] = useState<string | null>('data_submission');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedColKey, setSelectedColKey] = useState<string | null>(null);
  const [selectedCellCol, setSelectedCellCol] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [colFilters, setColFilters] = useState<Record<string, Set<string>>>({});
  const [rowFormats, setRowFormats] = useState<Record<string, FormatState>>({});
  const [colFormats, setColFormats] = useState<Record<string, { bold?: boolean; italic?: boolean; strikethrough?: boolean; bgColor?: string | null; textColor?: string | null }>>(() => {
    try {
      const saved = localStorage.getItem('clienti-sheet-col-formats');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [qualifiedFilter, setQualifiedFilter] = useState(false);
  const newColRef = useRef<HTMLInputElement>(null);

  // Persist colFormats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('clienti-sheet-col-formats', JSON.stringify(colFormats));
    } catch {}
  }, [colFormats]);

  useEffect(() => {
    if (addingColumn && newColRef.current) newColRef.current.focus();
  }, [addingColumn]);

  const handleAddColumn = useCallback(() => {
    const name = newColName.trim();
    if (!name) return;
    const key = `custom_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    if (allColumns.some(c => c.key === key)) return;
    const newCol: ColumnDef = { key, label: name, width: 130, minWidth: 80, editable: true, type: 'text' };
    const updated = [...customCols, newCol];
    setCustomCols(updated);
    saveCustomColumns(updated);
    setColOrder(prev => [...prev, key]);
    setColWidths(prev => ({ ...prev, [key]: 130 }));
    setNewColName('');
    setAddingColumn(false);
  }, [newColName, allColumns, customCols]);

  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const dragColRef = useRef<{ key: string; startX: number } | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ cliente: Cliente; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Row drag-and-drop state
  const [dragRowId, setDragRowId] = useState<string | null>(null);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);

  // Copy/Paste keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedRowId || !selectedCellCol) return;
      const isCtrl = e.ctrlKey || e.metaKey;
      
      if (isCtrl && e.key === 'c') {
        e.preventDefault();
        const cliente = clienti.find(c => c.id === selectedRowId);
        if (cliente) {
          const col = allColumns.find(c => c.key === selectedCellCol);
          if (col) {
            const val = col.key.startsWith('custom_') ? getCustomFieldValue(cliente, col.key) : getCellValueStatic(cliente, col);
            setCopiedValue(val);
            navigator.clipboard.writeText(val).catch(() => {});
          }
        }
      }
      
      if (isCtrl && e.key === 'v') {
        e.preventDefault();
        navigator.clipboard.readText().then(text => {
          if (text && selectedRowId && selectedCellCol) {
            const col = allColumns.find(c => c.key === selectedCellCol);
            if (col?.editable) {
              handleCellChange(selectedRowId, selectedCellCol, text);
            }
          }
        }).catch(() => {
          // Fallback to internal copied value
          if (copiedValue && selectedRowId && selectedCellCol) {
            const col = allColumns.find(c => c.key === selectedCellCol);
            if (col?.editable) {
              handleCellChange(selectedRowId, selectedCellCol, copiedValue);
            }
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRowId, selectedCellCol, clienti, copiedValue]);

  const orderedColumns = useMemo(() => {
    return colOrder.map(key => allColumns.find(c => c.key === key)!).filter(Boolean);
  }, [colOrder, allColumns]);

  const filtered = useMemo(() => {
    if (!searchQuery) return clienti;
    const q = searchQuery.toLowerCase();
    return clienti.filter(c =>
      c.nome.toLowerCase().includes(q) ||
      (c.cognome || '').toLowerCase().includes(q) ||
      (c.paese || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.telefono || '').toLowerCase().includes(q) ||
      (c.note_extra || '').toLowerCase().includes(q) ||
      (c.portale || '').toLowerCase().includes(q) ||
      (c.property_name || '').toLowerCase().includes(q) ||
      (c.ref_number || '').toLowerCase().includes(q) ||
      c.regioni.some(r => r.toLowerCase().includes(q))
    );
  }, [clienti, searchQuery]);

  // Apply column filters
  const colFiltered = useMemo(() => {
    let result = filtered;
    // Qualified filter
    if (qualifiedFilter) {
      result = result.filter(c => c.status === 'qualified');
    }
    const activeFilters = Object.entries(colFilters).filter(([, vals]) => vals.size > 0);
    if (activeFilters.length === 0) return result;
    return result.filter(c => {
      return activeFilters.every(([key, allowedVals]) => {
        const col = allColumns.find(cl => cl.key === key)!;
        const cellVal = col.key.startsWith('custom_') ? getCustomFieldValue(c, col.key) : getCellValueStatic(c, col);
        return allowedVals.has(cellVal);
      });
    });
  }, [filtered, colFilters, qualifiedFilter]);

  const sorted = useMemo(() => {
    if (!sortCol) return colFiltered;
    return [...colFiltered].sort((a, b) => {
      const col = allColumns.find(c => c.key === sortCol)!;
      const va = getCellValueStatic(a, col);
      const vb = getCellValueStatic(b, col);
      // Date-aware sorting for date columns
      if (sortCol === 'data_submission' || sortCol === 'last_contact_date') {
        const da = va ? new Date(va.split('/').reverse().join('-')).getTime() : 0;
        const db = vb ? new Date(vb.split('/').reverse().join('-')).getTime() : 0;
        return sortDir === 'asc' ? da - db : db - da;
      }
      const cmp = va.localeCompare(vb, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [colFiltered, sortCol, sortDir]);

  // Compute unique values per column for filters
  const uniqueValuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const col of allColumns) {
      const valSet = new Set<string>();
      for (const c of filtered) {
        const v = col.key.startsWith('custom_') ? getCustomFieldValue(c, col.key) : getCellValueStatic(c, col);
        valSet.add(v);
      }
      map[col.key] = Array.from(valSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }
    return map;
  }, [filtered, allColumns]);

  const handleFilterChange = useCallback((key: string, values: Set<string>) => {
    setColFilters(prev => ({ ...prev, [key]: values }));
  }, []);

  // Persist column widths
  useEffect(() => {
    saveColWidths(colWidths);
  }, [colWidths]);

  const handleHeaderClick = useCallback((key: string) => {
    // Date columns no longer sortable from header (use top-level button instead)
    setSelectedColKey(key);
    setSelectedRowId(null);
  }, []);

  const handleResizeStart = useCallback((key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { key, startX: e.clientX, startWidth: colWidths[key] };
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const diff = ev.clientX - resizingRef.current.startX;
      const col = COLUMNS.find(c => c.key === resizingRef.current!.key)!;
      const newW = Math.max(col.minWidth, resizingRef.current.startWidth + diff);
      setColWidths(prev => ({ ...prev, [resizingRef.current!.key]: newW }));
    };
    const onUp = () => { resizingRef.current = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [colWidths]);

  const handleCellChange = useCallback(async (clienteId: string, key: string, rawValue: string) => {
    // Custom fields go into the custom_fields JSONB
    if (key.startsWith('custom_')) {
      const cliente = clienti.find(c => c.id === clienteId);
      const existingFields = (cliente as any)?.custom_fields || {};
      const updatedFields = { ...existingFields, [key]: rawValue || null };
      await onUpdate(clienteId, { custom_fields: updatedFields } as any);
      return;
    }
    
    const updates: Partial<any> = {};
    if (key === 'budget_max') {
      const num = parseFloat(rawValue.replace(/[^0-9.]/g, ''));
      updates[key] = isNaN(num) ? null : num;
    } else if (key === 'regioni' || key === 'tipologia') {
      updates[key] = rawValue ? rawValue.split(',').map(s => s.trim()).filter(Boolean) : [];
    } else if (key === 'data_submission' || key === 'last_contact_date') {
      const dmy = rawValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (dmy) {
        updates[key] = `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
      } else {
        updates[key] = rawValue || null;
      }
    } else {
      updates[key] = rawValue || null;
    }
    await onUpdate(clienteId, updates);
  }, [onUpdate, clienti]);

  const selectedCliente = useMemo(() => sorted.find(c => c.id === selectedRowId) || null, [sorted, selectedRowId]);
  const selectedIndex = useMemo(() => sorted.findIndex(c => c.id === selectedRowId), [sorted, selectedRowId]);

  const handleBgColorChange = useCallback(async (color: string | null) => {
    if (selectedColKey) {
      setColFormats(prev => ({ ...prev, [selectedColKey]: { ...prev[selectedColKey], bgColor: color } }));
    } else if (selectedRowId) {
      await onUpdate(selectedRowId, { row_bg_color: color } as any);
    }
  }, [selectedRowId, selectedColKey, onUpdate]);

  const handleTextColorChange = useCallback(async (color: string | null) => {
    if (selectedColKey) {
      setColFormats(prev => ({ ...prev, [selectedColKey]: { ...prev[selectedColKey], textColor: color } }));
    } else if (selectedRowId) {
      await onUpdate(selectedRowId, { row_text_color: color } as any);
    }
  }, [selectedRowId, selectedColKey, onUpdate]);

  const handleToggleFormat = useCallback((fmt: 'bold' | 'italic' | 'strikethrough') => {
    if (selectedColKey) {
      setColFormats(prev => ({
        ...prev,
        [selectedColKey]: { ...prev[selectedColKey], [fmt]: !prev[selectedColKey]?.[fmt] }
      }));
    } else if (selectedRowId) {
      setRowFormats(prev => ({
        ...prev,
        [selectedRowId]: { ...prev[selectedRowId], [fmt]: !prev[selectedRowId]?.[fmt] }
      }));
    }
  }, [selectedRowId, selectedColKey]);

  const handleRowContextMenu = useCallback((cliente: Cliente, x: number, y: number) => {
    setCellMenu(null); // close cell menu if open
    setContextMenu({ cliente, x, y });
  }, []);

  // Cell context menu
  const [cellMenu, setCellMenu] = useState<CellMenuInfo | null>(null);

  const handleCellContextMenu = useCallback((cliente: Cliente, col: ColumnDef, value: string, x: number, y: number) => {
    setContextMenu(null); // close row menu if open
    setCellMenu({ cliente, colKey: col.key, colType: col.type || 'text', value, x, y });
  }, []);

  // Duplicate handler
  const handleDuplicate = useCallback(async () => {
    if (contextMenu && onDuplicate) {
      await onDuplicate(contextMenu.cliente);
      setContextMenu(null);
    }
  }, [contextMenu, onDuplicate]);

  const handleContextStatusChange = useCallback(async (status: ClienteStatus) => {
    if (contextMenu) await onUpdate(contextMenu.cliente.id, { status } as any);
  }, [contextMenu, onUpdate]);

  const handleContextEmojiChange = useCallback(async (emoji: string | null) => {
    if (contextMenu) await onUpdate(contextMenu.cliente.id, { emoji } as any);
  }, [contextMenu, onUpdate]);

  const handleContextColorChange = useCallback(async (color: string | null) => {
    if (contextMenu) {
      const autoTextColor = color ? (isDarkColor(color) ? '#ffffff' : '#000000') : null;
      await onUpdate(contextMenu.cliente.id, { 
        card_color: color, 
        row_bg_color: color, 
        row_text_color: autoTextColor 
      } as any);
    }
  }, [contextMenu, onUpdate]);

  const currentFormat = useMemo(() => {
    if (selectedColKey) return colFormats[selectedColKey] || {};
    if (selectedRowId) return rowFormats[selectedRowId] || {};
    return {};
  }, [selectedColKey, selectedRowId, colFormats, rowFormats]);

  const currentBgColor = useMemo(() => {
    if (selectedColKey) return colFormats[selectedColKey]?.bgColor || null;
    return selectedCliente?.row_bg_color || null;
  }, [selectedColKey, colFormats, selectedCliente]);

  const currentTextColor = useMemo(() => {
    if (selectedColKey) return colFormats[selectedColKey]?.textColor || null;
    return selectedCliente?.row_text_color || null;
  }, [selectedColKey, colFormats, selectedCliente]);

  // Column drag-and-drop
  const handleColDragStart = useCallback((key: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
    dragColRef.current = { key, startX: e.clientX };
  }, []);

  const handleColDragOver = useCallback((key: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(key);
  }, []);

  const handleColDrop = useCallback((targetKey: string, e: React.DragEvent) => {
    e.preventDefault();
    const sourceKey = e.dataTransfer.getData('text/plain');
    setDragOverCol(null);
    if (!sourceKey || sourceKey === targetKey) return;
    setColOrder(prev => {
      const newOrder = [...prev];
      const fromIdx = newOrder.indexOf(sourceKey);
      const toIdx = newOrder.indexOf(targetKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, sourceKey);
      return newOrder;
    });
  }, []);

  const rowNumWidth = 62;
  const totalWidth = rowNumWidth + orderedColumns.reduce((s, c) => s + (colWidths[c.key] || c.width), 0);

  return (
    <div
      className="border border-border/30 rounded-2xl bg-background overflow-hidden shadow-sm"
      onClick={(e) => {
        // Deselect when clicking on the container background (not on rows/headers)
        if (e.target === e.currentTarget) {
          setSelectedRowId(null);
          setSelectedColKey(null);
        }
      }}
    >
      {/* Add new row button + quick filters */}
      {onAddNew && (
        <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-xs font-semibold border-dashed border-2" onClick={onAddNew}>
            <Plus className="w-4 h-4" /> Nuova richiesta
          </Button>
          <Button
            variant={qualifiedFilter ? 'default' : 'outline'}
            size="sm"
            className="h-8 px-3 gap-1.5 text-xs font-semibold"
            onClick={() => setQualifiedFilter(prev => !prev)}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M12 1l3 8.5L24 12l-9 2.5L12 23l-3-8.5L0 12l9-2.5z" />
            </svg>
            Qualificati
          </Button>
          <UndoRedoButtons />
        </div>
      )}

      {/* Toolbar */}
      <SheetToolbar
        selectedCliente={selectedCliente}
        selectedIndex={selectedIndex}
        selectedColKey={selectedColKey}
        onBgColorChange={handleBgColorChange}
        onTextColorChange={handleTextColorChange}
        currentFormat={currentFormat}
        onToggleFormat={handleToggleFormat}
        currentBgColor={currentBgColor}
        currentTextColor={currentTextColor}
      />

      {/* Table */}
      <div
        className="overflow-x-auto [transform:rotateX(180deg)]"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedRowId(null);
            setSelectedColKey(null);
          }
        }}
      >
        <div style={{ minWidth: totalWidth }} className="[transform:rotateX(180deg)]">
          {/* Header */}
          <div className="flex sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40">
            <div className="flex-shrink-0 flex items-center justify-center text-[10px] text-muted-foreground font-medium border-r border-border/20" style={{ width: rowNumWidth }}>
              #
            </div>
            {orderedColumns.map(col => (
              <div
                key={col.key}
                draggable
                onDragStart={e => handleColDragStart(col.key, e)}
                onDragOver={e => handleColDragOver(col.key, e)}
                onDrop={e => handleColDrop(col.key, e)}
                onDragLeave={() => setDragOverCol(null)}
                className={cn(
                  "relative flex items-center border-r border-border/20 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2 select-none cursor-grab hover:bg-secondary/50 transition-colors",
                  selectedColKey === col.key && "bg-accent/40 text-foreground",
                  dragOverCol === col.key && "bg-accent/60 border-l-2 border-l-foreground/30"
                )}
                style={{ width: colWidths[col.key], flexShrink: 0 }}
                onClick={() => handleHeaderClick(col.key)}
              >
                <GripHorizontal className="w-3 h-3 mr-0.5 opacity-30 flex-shrink-0" />
                <span className="truncate flex-1">{col.label}</span>
                {DATE_COLUMNS.includes(col.key) ? (
                  <DateColumnFilterPopover
                    colKey={col.key}
                    uniqueValues={uniqueValuesMap[col.key] || []}
                    activeFilter={colFilters[col.key] || new Set()}
                    onFilterChange={handleFilterChange}
                  />
                ) : (
                  <ColumnFilterPopover
                    colKey={col.key}
                    uniqueValues={uniqueValuesMap[col.key] || []}
                    activeFilter={colFilters[col.key] || new Set()}
                    onFilterChange={handleFilterChange}
                  />
                )}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-foreground/10 active:bg-foreground/20"
                  onMouseDown={e => handleResizeStart(col.key, e)}
                  onClick={e => e.stopPropagation()}
                />
              </div>
            ))}
            {/* Add column button */}
            {addingColumn ? (
              <div className="flex-shrink-0 flex items-center px-2 py-2 border-r border-border/20" style={{ width: 140 }}>
                <input
                  ref={newColRef}
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddColumn();
                    if (e.key === 'Escape') { setAddingColumn(false); setNewColName(''); }
                  }}
                  onBlur={() => { if (!newColName.trim()) { setAddingColumn(false); setNewColName(''); } }}
                  className="w-full h-6 text-xs bg-muted rounded px-2 outline-none focus:ring-1 focus:ring-foreground/20"
                  placeholder="Nome colonna..."
                />
              </div>
            ) : (
              <div
                className="flex-shrink-0 flex items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors border-r border-border/20"
                style={{ width: 40 }}
                onClick={() => setAddingColumn(true)}
                title="Aggiungi colonna"
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Rows */}
          <div>
            {sorted.map((cliente, i) => (
              <SheetRow
                key={cliente.id}
                cliente={cliente}
                idx={i}
                colWidths={colWidths}
                agents={agents}
                rowNumWidth={rowNumWidth}
                isSelected={selectedRowId === cliente.id}
                selectedColKey={selectedColKey}
                rowFormat={rowFormats[cliente.id]}
                colFormats={colFormats}
                orderedColumns={orderedColumns}
                onSelect={setSelectedRowId}
                onCardClick={onCardClick}
                onCellChange={handleCellChange}
                onContextMenu={handleRowContextMenu}
                onCellContextMenu={handleCellContextMenu}
                onCellSelect={(clienteId, colKey) => { setSelectedRowId(clienteId); setSelectedCellCol(colKey); }}
                isDragOver={dragOverRowId === cliente.id}
                onRowDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/row-id', cliente.id);
                  setDragRowId(cliente.id);
                }}
                onRowDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragRowId && dragRowId !== cliente.id) {
                    setDragOverRowId(cliente.id);
                  }
                }}
                onRowDrop={async (e) => {
                  e.preventDefault();
                  const sourceId = e.dataTransfer.getData('text/row-id');
                  setDragOverRowId(null);
                  setDragRowId(null);
                  if (!sourceId || sourceId === cliente.id) return;
                  // Find indices in sorted array
                  const fromIdx = sorted.findIndex(c => c.id === sourceId);
                  const toIdx = sorted.findIndex(c => c.id === cliente.id);
                  if (fromIdx === -1 || toIdx === -1) return;
                  // Update display_order for moved row
                  const targetOrder = sorted[toIdx].display_order;
                  await onUpdate(sourceId, { display_order: targetOrder } as any);
                  // Shift other rows
                  const direction = fromIdx < toIdx ? -1 : 1;
                  const start = Math.min(fromIdx, toIdx);
                  const end = Math.max(fromIdx, toIdx);
                  for (let j = start; j <= end; j++) {
                    if (sorted[j].id !== sourceId) {
                      await onUpdate(sorted[j].id, { display_order: sorted[j].display_order + direction * 10 } as any);
                    }
                  }
                }}
                onRowDragEnd={() => {
                  setDragRowId(null);
                  setDragOverRowId(null);
                }}
              />
            ))}
          </div>

          {sorted.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">No buyers found</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-background border-t border-border/40 px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
        <span className="flex-1">{sorted.length} buyers{filtered.length !== sorted.length ? ` (${filtered.length} totali)` : ''}</span>
        {Object.values(colFilters).some(s => s.size > 0) && (
          <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={() => setColFilters({})}>
            <X className="w-3 h-3 mr-1" /> Rimuovi filtri
          </Button>
        )}
      </div>

      {/* Row Context menu */}
      {contextMenu && (
        <SheetContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          cliente={contextMenu.cliente}
          onStatusChange={handleContextStatusChange}
          onEmojiChange={handleContextEmojiChange}
          onColorChange={handleContextColorChange}
          onDuplicate={onDuplicate ? handleDuplicate : undefined}
          onDelete={onDelete ? async () => { await onDelete(contextMenu.cliente.id); setContextMenu(null); } : undefined}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Cell Context menu */}
      {cellMenu && (
        <CellContextMenu
          info={cellMenu}
          onCellChange={handleCellChange}
          onClose={() => setCellMenu(null)}
        />
      )}
    </div>
  );
}

export default ClientiSheetView;
