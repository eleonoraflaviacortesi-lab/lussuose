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
import { GripVertical, Paintbrush, Type, X, Bold, Italic, Strikethrough, MessageCircle, Eye, GripHorizontal, Filter, Check, Star, Plus, Trash2 } from 'lucide-react';
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

// Full color palette for context menu (matches ClienteCard)
const CONTEXT_PALETTE_COLORS: (string | null)[] = [
  null,      '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529',
  '#fff3cd', '#fef9c3', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f',
  '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#022c22',
  '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554',
  '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843', '#500724',
  '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a',
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

// Sheet context menu (status + emoji + color)
const SheetContextMenu = memo(function SheetContextMenu({
  position,
  cliente,
  onStatusChange,
  onEmojiChange,
  onColorChange,
  onDelete,
  onClose,
}: {
  position: { x: number; y: number };
  cliente: Cliente;
  onStatusChange: (status: ClienteStatus) => void;
  onEmojiChange: (emoji: string | null) => void;
  onColorChange: (color: string | null) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [customCardColor, setCustomCardColor] = useState(cliente.card_color || '#fef3c7');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const { favorites, addFavorite, removeFavorite } = useFavoriteColors();

  return (
    <>
      <div
        className="fixed inset-0 z-[110]"
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        className="fixed z-[110] flex flex-col gap-2.5 p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150 max-h-[85vh] overflow-y-auto"
        style={{
          left: Math.min(Math.max(10, position.x), window.innerWidth - 260),
          top: Math.min(Math.max(10, position.y), window.innerHeight - 40),
          transform: position.y > window.innerHeight * 0.6 ? 'translateY(-100%)' : 'none',
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
          <div className="grid grid-cols-10 gap-1 max-w-[240px]">
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

        {/* Delete */}
        {onDelete && (
          <>
            <div className="h-px bg-muted/50" />
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
          </>
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

// --- Color Palette Picker ---
const PALETTE_COLORS = [
  '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529',
  '#fff3cd', '#fef9c3', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f',
  '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#022c22',
  '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554',
  '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843', '#500724',
  '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a',
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
        <div className="grid grid-cols-10 gap-1">
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

// --- Simple Badge Cell (for lingua, tipo_contatto) ---
function SimpleBadgeCell({
  value, onChange, options, colorMap,
}: {
  value: string; onChange: (val: string) => void; options: string[]; colorMap?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const bgColor = colorMap?.[value] || '#6b7280';

  if (!open && !value) {
    return (
      <span
        className="block text-xs px-2 py-1.5 cursor-pointer min-h-[28px] text-muted-foreground hover:bg-secondary/50"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >—</span>
    );
  }

  if (!open) {
    return (
      <span
        className="block px-1 py-1 cursor-pointer hover:bg-secondary/50"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >
        <span className="px-2 py-0.5 rounded text-white text-[10px] font-semibold" style={{ backgroundColor: bgColor }}>{value}</span>
      </span>
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
        {value ? (
          <span className="px-2 py-0.5 rounded text-white text-[10px] font-semibold" style={{ backgroundColor: bgColor }}>{value}</span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none">—</SelectItem>
        {options.map(o => (
          <SelectItem key={o} value={o}>
            <span className="flex items-center gap-2">
              {colorMap && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorMap[o] || '#6b7280' }} />}
              {o}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// --- Portal Badge Cell with right-click color change and custom portals ---
function PortalBadgeCell({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [colorMenuPortal, setColorMenuPortal] = useState<string | null>(null);
  const [colorMenuPos, setColorMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [addingNew, setAddingNew] = useState(false);
  const [newPortal, setNewPortal] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);
  const [customPortals, setCustomPortals] = useState(getCustomPortals);
  const [customColors, setCustomColors] = useState(getCustomPortaleColors);

  const allOptions = useMemo(() => [...DEFAULT_PORTALE_OPTIONS, ...customPortals], [customPortals]);
  const mergedColors = useMemo(() => ({ ...PORTALE_COLORS, ...customColors }), [customColors]);
  const bgColor = mergedColors[value] || '#6b7280';

  // Sync colors from other cells via storage event
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

  const handleAddPortal = () => {
    if (newPortal.trim() && !allOptions.includes(newPortal.trim())) {
      const updated = [...customPortals, newPortal.trim()];
      setCustomPortals(updated);
      saveCustomPortals(updated);
      onChange(newPortal.trim());
    }
    setNewPortal('');
    setAddingNew(false);
    setOpen(false);
  };

  const handleColorSelect = (portal: string, color: string) => {
    const updated = { ...customColors, [portal]: color };
    setCustomColors(updated);
    saveCustomPortaleColors(updated);
    setColorMenuPortal(null);
  };

  const handleContextMenuPortal = useCallback((o: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setColorMenuPortal(o);
    setColorMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  if (!open && !value) {
    return (
      <span
        className="block text-xs px-2 py-1.5 cursor-pointer min-h-[28px] text-muted-foreground hover:bg-secondary/50"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >—</span>
    );
  }

  if (!open) {
    return (
      <span
        className="block px-1 py-1 cursor-pointer hover:bg-secondary/50"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >
        <span className="px-2 py-0.5 rounded text-white text-[10px] font-semibold" style={{ backgroundColor: bgColor }}>{value}</span>
      </span>
    );
  }

  // When color menu opens, close the Select to remove Radix's pointer-blocking overlay
  const selectOpen = !colorMenuPortal;


  return (
    <>
      <Select
        value={value || '__none'}
        onValueChange={v => { onChange(v === '__none' ? '' : v); setOpen(false); }}
        open={selectOpen}
        onOpenChange={(o) => { if (!o && !colorMenuPortal) { setOpen(false); } }}
      >
        <SelectTrigger className="h-7 border-0 bg-transparent shadow-none text-xs px-1 focus:ring-0">
          {value ? (
            <span className="px-2 py-0.5 rounded text-white text-[10px] font-semibold" style={{ backgroundColor: bgColor }}>{value}</span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">—</SelectItem>
          {allOptions.map(o => (
            <div
              key={o}
              className="relative"
              onContextMenu={(e) => handleContextMenuPortal(o, e)}
            >
              <SelectItem value={o}>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mergedColors[o] || '#6b7280' }} />
                  {o}
                </span>
              </SelectItem>
            </div>
          ))}
          {/* Add new portal */}
          {addingNew ? (
            <div className="px-2 py-1.5 flex items-center gap-1">
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
              className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/60 flex items-center gap-1.5 transition-colors"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAddingNew(true); }}
            >
              <Plus className="w-3 h-3" /> Aggiungi portale
            </button>
          )}
        </SelectContent>
      </Select>

      {/* Portal color picker overlay - Select is closed so no Radix overlay blocks */}
      {colorMenuPortal && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => { setColorMenuPortal(null); setOpen(false); }} />
          <div
            className="fixed z-[9999] p-2 bg-popover backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-150"
            style={{
              left: Math.min(colorMenuPos.x, window.innerWidth - 280),
              top: Math.min(colorMenuPos.y, window.innerHeight - 200),
            }}
          >
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              Colore: {colorMenuPortal}
            </p>
            <div className="grid grid-cols-10 gap-1">
              {PALETTE_COLORS.map(c => (
                <button
                  key={c}
                  className={cn(
                    "w-5 h-5 rounded-full border border-border/30 hover:scale-125 transition-transform",
                    mergedColors[colorMenuPortal!] === c && "ring-2 ring-foreground ring-offset-1"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => handleColorSelect(colorMenuPortal!, c)}
                />
              ))}
            </div>
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
  onCellSelect,
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
  onCellSelect?: (clienteId: string, colKey: string) => void;
}) {
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
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

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(cliente, e.clientX, e.clientY);
  }, [cliente, onContextMenu]);
  return (
    <div
      className={cn(
        "flex border-b border-border/20 transition-colors",
        isSelected ? 'ring-1 ring-foreground/20 ring-inset' : '',
        !cliente.row_bg_color && (idx % 2 === 0 ? 'bg-background' : 'bg-secondary/30'),
        rowFormat?.bold && 'font-bold',
        rowFormat?.italic && 'italic',
        rowFormat?.strikethrough && 'line-through',
      )}
      style={{
        minHeight: MIN_ROW_HEIGHT,
        backgroundColor: cliente.row_bg_color || cliente.card_color || undefined,
        color: cliente.row_text_color || (cliente.card_color ? (isDarkColor(cliente.card_color) ? '#ffffff' : '#000000') : undefined),
      }}
      onClick={() => onSelect(cliente.id)}
      onContextMenu={handleRightClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {/* Row number + open detail */}
      <div
        className="flex-shrink-0 flex items-center gap-0.5 border-r border-border/20 text-muted-foreground"
        style={{ width: rowNumWidth, color: cliente.row_text_color || undefined }}
      >
        <span className="text-[10px] font-medium flex-1 text-center">{idx + 1}</span>
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
          >
            {col.type === 'status' && col.editable ? (
              <LazyStatusCell value={getCellValueStatic(cliente, col)} onChange={(v) => onCellChange(cliente.id, col.key, v)} />
            ) : col.type === 'lingua' && col.editable ? (
              <SimpleBadgeCell value={getCellValueStatic(cliente, col)} onChange={(v) => onCellChange(cliente.id, col.key, v)} options={LINGUA_OPTIONS_VALUES} colorMap={LINGUA_COLORS} />
            ) : col.type === 'portale' && col.editable ? (
              <PortalBadgeCell value={getCellValueStatic(cliente, col)} onChange={(v) => onCellChange(cliente.id, col.key, v)} />
            ) : col.type === 'tipo_contatto' && col.editable ? (
              <SimpleBadgeCell value={getCellValueStatic(cliente, col)} onChange={(v) => onCellChange(cliente.id, col.key, v)} options={TIPO_CONTATTO_OPTIONS} colorMap={TIPO_CONTATTO_COLORS} />
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
export function ClientiSheetView({ clienti, agents, onCardClick, onUpdate, onDelete, searchQuery, onAddNew }: ClientiSheetViewProps) {
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
  const [sortCol, setSortCol] = useState<string | null>(null);
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
    const activeFilters = Object.entries(colFilters).filter(([, vals]) => vals.size > 0);
    if (activeFilters.length === 0) return filtered;
    return filtered.filter(c => {
      return activeFilters.every(([key, allowedVals]) => {
        const col = allColumns.find(cl => cl.key === key)!;
        const cellVal = col.key.startsWith('custom_') ? getCustomFieldValue(c, col.key) : getCellValueStatic(c, col);
        return allowedVals.has(cellVal);
      });
    });
  }, [filtered, colFilters]);

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
    setContextMenu({ cliente, x, y });
  }, []);

  const handleContextStatusChange = useCallback(async (status: ClienteStatus) => {
    if (contextMenu) await onUpdate(contextMenu.cliente.id, { status } as any);
  }, [contextMenu, onUpdate]);

  const handleContextEmojiChange = useCallback(async (emoji: string | null) => {
    if (contextMenu) await onUpdate(contextMenu.cliente.id, { emoji } as any);
  }, [contextMenu, onUpdate]);

  const handleContextColorChange = useCallback(async (color: string | null) => {
    if (contextMenu) {
      // Sync card_color + row_bg_color + auto text color
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

  const rowNumWidth = 52;
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
      {/* Add new row button */}
      {onAddNew && (
        <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-xs font-semibold border-dashed border-2" onClick={onAddNew}>
            <Plus className="w-4 h-4" /> Nuova richiesta
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
        className="overflow-x-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedRowId(null);
            setSelectedColKey(null);
          }
        }}
      >
        <div style={{ minWidth: totalWidth }}>
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
                onCellSelect={(clienteId, colKey) => { setSelectedRowId(clienteId); setSelectedCellCol(colKey); }}
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

      {/* Context menu */}
      {contextMenu && (
        <SheetContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          cliente={contextMenu.cliente}
          onStatusChange={handleContextStatusChange}
          onEmojiChange={handleContextEmojiChange}
          onColorChange={handleContextColorChange}
          onDelete={onDelete ? async () => { await onDelete(contextMenu.cliente.id); setContextMenu(null); } : undefined}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

export default ClientiSheetView;
