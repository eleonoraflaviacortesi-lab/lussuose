import { useState, useCallback, useRef, useMemo, memo } from 'react';
import { Cliente, ClienteStatus } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GripVertical, Paintbrush, Type, X, Bold, Italic, Strikethrough, MessageCircle, Eye, GripHorizontal, Filter, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { LINGUA_COLORS, PORTALE_COLORS, TIPO_CONTATTO_COLORS } from '@/lib/colorMaps';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  searchQuery: string;
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

const PORTALE_OPTIONS = [
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

// --- Lazy Badge Cell: only mounts Select on click ---
function LazyBadgeCell({
  value, onChange, options, colorMap,
}: {
  value: string; onChange: (val: string) => void; options: string[]; colorMap?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const bgColor = colorMap?.[value] || '#6b7280';

  if (!open && !value) {
    return (
      <span
        className="block text-xs px-2 py-1.5 cursor-pointer min-h-[28px] text-muted-foreground hover:bg-muted/30"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >—</span>
    );
  }

  if (!open) {
    return (
      <span
        className="block px-1 py-1 cursor-pointer hover:bg-muted/30"
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

// --- Lazy Status Cell ---
function LazyStatusCell({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const status = STATUS_OPTIONS.find(s => s.value === value);

  if (!open) {
    return (
      <span
        className="block px-1 py-1 cursor-pointer hover:bg-muted/30"
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
        className="block truncate text-xs px-2 py-1.5 cursor-pointer hover:bg-muted/30 min-h-[28px]"
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
    return <span className="block truncate text-xs px-2 py-1 min-h-[28px]" title={value}>{value || '—'}</span>;
  }

  if (!editing) {
    return (
      <span
        className="block truncate text-xs px-2 py-1.5 cursor-text hover:bg-muted/30 rounded min-h-[28px]"
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
    <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/60 border-b text-xs">
      <Button variant="ghost" size="sm" className={cn("h-7 w-7 p-0", currentFormat.bold && "bg-accent")} disabled={!hasSelection} onClick={() => onToggleFormat('bold')}>
        <Bold className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className={cn("h-7 w-7 p-0", currentFormat.italic && "bg-accent")} disabled={!hasSelection} onClick={() => onToggleFormat('italic')}>
        <Italic className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className={cn("h-7 w-7 p-0", currentFormat.strikethrough && "bg-accent")} disabled={!hasSelection} onClick={() => onToggleFormat('strikethrough')}>
        <Strikethrough className="w-3.5 h-3.5" />
      </Button>
      <div className="h-4 w-px bg-border mx-1" />
      <ColorPalettePopover currentColor={currentBgColor} onSelect={onBgColorChange}>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" disabled={!hasSelection}>
          <Paintbrush className="w-3.5 h-3.5" />
          <span className="w-3 h-3 rounded-sm border border-border/50" style={{ backgroundColor: currentBgColor || 'transparent' }} />
        </Button>
      </ColorPalettePopover>
      <ColorPalettePopover currentColor={currentTextColor} onSelect={onTextColorChange}>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" disabled={!hasSelection}>
          <Type className="w-3.5 h-3.5" />
          <span className="w-3 h-3 rounded-sm border border-border/50" style={{ backgroundColor: currentTextColor || 'transparent' }} />
        </Button>
      </ColorPalettePopover>
      <div className="h-4 w-px bg-border mx-1" />
      <span className="text-muted-foreground">{selectionLabel}</span>
    </div>
  );
}

// --- Memoized Row ---
const ROW_HEIGHT = 32;

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
}) {
  return (
    <div
      className={cn(
        "flex border-b transition-colors",
        isSelected ? 'ring-2 ring-primary/50 ring-inset' : '',
        !cliente.row_bg_color && (idx % 2 === 0 ? 'bg-card' : 'bg-muted/10'),
        rowFormat?.bold && 'font-bold',
        rowFormat?.italic && 'italic',
        rowFormat?.strikethrough && 'line-through',
      )}
      style={{
        height: ROW_HEIGHT,
        backgroundColor: cliente.row_bg_color || undefined,
        color: cliente.row_text_color || undefined,
      }}
      onClick={() => onSelect(cliente.id)}
    >
      {/* Row number + open detail */}
      <div
        className="flex-shrink-0 flex items-center gap-0.5 border-r bg-muted/20 text-muted-foreground"
        style={{ width: rowNumWidth, color: cliente.row_text_color || undefined }}
      >
        <span className="text-[10px] font-medium flex-1 text-center">{idx + 1}</span>
        <button
          className="flex items-center justify-center w-5 h-full hover:bg-primary/10 hover:text-primary transition-colors"
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
              "flex-shrink-0 border-r overflow-hidden",
              selectedColKey === col.key && "bg-primary/5",
              cf?.bold && 'font-bold',
              cf?.italic && 'italic',
              cf?.strikethrough && 'line-through',
            )}
            style={{
              width: colWidths[col.key],
              backgroundColor: cf?.bgColor || undefined,
              color: cf?.textColor || undefined,
            }}
          >
            {col.type === 'status' && col.editable ? (
              <LazyStatusCell value={getCellValueStatic(cliente, col)} onChange={(v) => onCellChange(cliente.id, col.key, v)} />
            ) : col.type === 'lingua' && col.editable ? (
              <LazyBadgeCell value={getCellValueStatic(cliente, col)} onChange={(v) => onCellChange(cliente.id, col.key, v)} options={LINGUA_OPTIONS_VALUES} colorMap={LINGUA_COLORS} />
            ) : col.type === 'portale' && col.editable ? (
              <LazyBadgeCell value={getCellValueStatic(cliente, col)} onChange={(v) => onCellChange(cliente.id, col.key, v)} options={PORTALE_OPTIONS} colorMap={PORTALE_COLORS} />
            ) : col.type === 'tipo_contatto' && col.editable ? (
              <LazyBadgeCell value={getCellValueStatic(cliente, col)} onChange={(v) => onCellChange(cliente.id, col.key, v)} options={TIPO_CONTATTO_OPTIONS} colorMap={TIPO_CONTATTO_COLORS} />
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
            ) : (
              <InlineTextCell value={getCellValueStatic(cliente, col)} onChange={col.editable ? (v) => onCellChange(cliente.id, col.key, v) : undefined} />
            )}
          </div>
        );
      })}
    </div>
  );
});

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

// --- Main Component ---
export function ClientiSheetView({ clienti, agents, onCardClick, onUpdate, searchQuery }: ClientiSheetViewProps) {
  const [colOrder, setColOrder] = useState<string[]>(() => COLUMNS.map(c => c.key));
  const [colWidths, setColWidths] = useState<Record<string, number>>(
    () => Object.fromEntries(COLUMNS.map(c => [c.key, c.width]))
  );
  const [sortCol, setSortCol] = useState<string | null>('data_submission');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedColKey, setSelectedColKey] = useState<string | null>(null);
  const [colFilters, setColFilters] = useState<Record<string, Set<string>>>({});
  const [rowFormats, setRowFormats] = useState<Record<string, FormatState>>({});
  const [colFormats, setColFormats] = useState<Record<string, { bold?: boolean; italic?: boolean; strikethrough?: boolean; bgColor?: string | null; textColor?: string | null }>>({});
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const dragColRef = useRef<{ key: string; startX: number } | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  const orderedColumns = useMemo(() => {
    return colOrder.map(key => COLUMNS.find(c => c.key === key)!).filter(Boolean);
  }, [colOrder]);

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
        const col = COLUMNS.find(cl => cl.key === key)!;
        const cellVal = getCellValueStatic(c, col);
        return allowedVals.has(cellVal);
      });
    });
  }, [filtered, colFilters]);

  const sorted = useMemo(() => {
    if (!sortCol) return colFiltered;
    return [...colFiltered].sort((a, b) => {
      const col = COLUMNS.find(c => c.key === sortCol)!;
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
    for (const col of COLUMNS) {
      const valSet = new Set<string>();
      for (const c of filtered) {
        const v = getCellValueStatic(c, col);
        valSet.add(v);
      }
      map[col.key] = Array.from(valSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }
    return map;
  }, [filtered]);

  const handleFilterChange = useCallback((key: string, values: Set<string>) => {
    setColFilters(prev => ({ ...prev, [key]: values }));
  }, []);

  // Virtualization
  const overscan = 10;
  const totalHeight = sorted.length * ROW_HEIGHT;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - overscan);
  const endIdx = Math.min(sorted.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + overscan);
  const visibleRows = sorted.slice(startIdx, endIdx);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Measure container
  const measureRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      scrollRef.current = el;
      const rect = el.getBoundingClientRect();
      setContainerHeight(rect.height);
    }
  }, []);

  const handleHeaderClick = useCallback((key: string) => {
    if (selectedColKey === key) {
      // Already selected this column, toggle sort
      if (sortCol === key) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
      else { setSortCol(key); setSortDir('asc'); }
    } else {
      // Select column
      setSelectedColKey(key);
      setSelectedRowId(null);
    }
  }, [sortCol, selectedColKey]);

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
    const updates: Partial<any> = {};
    if (key === 'budget_max') {
      const num = parseFloat(rawValue.replace(/[^0-9.]/g, ''));
      updates[key] = isNaN(num) ? null : num;
    } else if (key === 'regioni' || key === 'tipologia') {
      updates[key] = rawValue ? rawValue.split(',').map(s => s.trim()).filter(Boolean) : [];
    } else if (key === 'data_submission' || key === 'last_contact_date') {
      // Accept dd/mm/yyyy or yyyy-mm-dd
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
  }, [onUpdate]);

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
    <div className="border rounded-lg bg-card overflow-hidden flex flex-col max-h-[calc(100vh-280px)]">
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
        ref={measureRef}
        className="overflow-auto flex-1"
        onScroll={handleScroll}
      >
        <div style={{ minWidth: totalWidth }}>
          {/* Header */}
          <div className="flex sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b">
            <div className="flex-shrink-0 flex items-center justify-center text-[10px] text-muted-foreground font-medium border-r bg-muted/60" style={{ width: rowNumWidth }}>
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
                  "relative flex items-center border-r text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2 select-none cursor-grab hover:bg-muted/50",
                  sortCol === col.key && "bg-muted/60 text-foreground",
                  selectedColKey === col.key && "bg-primary/10 text-primary",
                  dragOverCol === col.key && "bg-primary/20 border-l-2 border-l-primary"
                )}
                style={{ width: colWidths[col.key], flexShrink: 0 }}
                onClick={() => handleHeaderClick(col.key)}
              >
                <GripHorizontal className="w-3 h-3 mr-0.5 opacity-30 flex-shrink-0" />
                <span className="truncate flex-1">{col.label}</span>
                {sortCol === col.key && (
                  <span className="ml-0.5 text-[9px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
                <ColumnFilterPopover
                  colKey={col.key}
                  uniqueValues={uniqueValuesMap[col.key] || []}
                  activeFilter={colFilters[col.key] || new Set()}
                  onFilterChange={handleFilterChange}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 active:bg-primary/50"
                  onMouseDown={e => handleResizeStart(col.key, e)}
                  onClick={e => e.stopPropagation()}
                />
              </div>
            ))}
          </div>

          {/* Virtualized rows */}
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ position: 'absolute', top: startIdx * ROW_HEIGHT, left: 0, right: 0 }}>
              {visibleRows.map((cliente, i) => (
                <SheetRow
                  key={cliente.id}
                  cliente={cliente}
                  idx={startIdx + i}
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
                />
              ))}
            </div>
          </div>

          {sorted.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">No buyers found</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-muted/60 backdrop-blur-sm border-t px-3 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
        <span>{sorted.length} buyers{filtered.length !== sorted.length ? ` (${filtered.length} totali)` : ''}</span>
        {Object.values(colFilters).some(s => s.size > 0) && (
          <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={() => setColFilters({})}>
            <X className="w-3 h-3 mr-1" /> Rimuovi filtri
          </Button>
        )}
      </div>
    </div>
  );
}

export default ClientiSheetView;
