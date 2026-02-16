import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Paintbrush, Type, X, Bold, Italic, Strikethrough } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

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
  'James Edition', 'Idealista', 'Gate-away', 'Sito Cortesi', 'Immobiliare.it', 'Altro',
];
const TIPO_CONTATTO_OPTIONS = ['Mail', 'WhatsApp', 'Call', 'Idealista', 'Sito Cortesi'];
const LINGUA_OPTIONS_VALUES = ['ENG', 'ITA', 'FRA', 'DEU', 'ESP'];

const PORTALE_COLORS: Record<string, string> = {
  'James Edition': '#f59e0b', 'Idealista': '#22c55e', 'Gate-away': '#60a5fa',
  'Sito Cortesi': '#a855f7', 'Immobiliare.it': '#ef4444', 'Altro': '#6b7280',
};
const TIPO_CONTATTO_COLORS: Record<string, string> = {
  'Mail': '#ef4444', 'WhatsApp': '#22c55e', 'Call': '#f59e0b',
  'Idealista': '#22c55e', 'Sito Cortesi': '#a855f7',
};
const LINGUA_COLORS: Record<string, string> = {
  'ENG': '#22c55e', 'ITA': '#22c55e', 'FRA': '#3b82f6', 'DEU': '#f59e0b', 'ESP': '#ef4444',
};

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
  { key: 'data_submission', label: 'Data', width: 110, minWidth: 80, editable: false, type: 'date' },
  { key: 'property_name', label: 'Property', width: 150, minWidth: 100, editable: true, type: 'text' },
  { key: 'ref_number', label: 'Ref.', width: 80, minWidth: 60, editable: true, type: 'text' },
  { key: 'last_contact_date', label: 'Data Contatto', width: 120, minWidth: 80, editable: false, type: 'date' },
  { key: 'contattato_da', label: 'Contattato da', width: 120, minWidth: 80, editable: true, type: 'text' },
  { key: 'tipo_contatto', label: 'Tipo Contatto', width: 120, minWidth: 90, editable: true, type: 'tipo_contatto' },
  { key: 'telefono', label: 'Contatto 1', width: 150, minWidth: 100, editable: true, type: 'text' },
  { key: 'email', label: 'Contatto 2', width: 200, minWidth: 120, editable: true, type: 'text' },
  { key: 'status', label: 'Status', width: 130, minWidth: 100, editable: true, type: 'status' },
  { key: 'regioni', label: 'Regions', width: 160, minWidth: 100, editable: false, type: 'regions' },
  { key: 'budget_max', label: 'Budget Max', width: 120, minWidth: 80, editable: true, type: 'number' },
  { key: 'tipologia', label: 'Type', width: 150, minWidth: 100, editable: false, type: 'types' },
  { key: 'assigned_to', label: 'Agent', width: 140, minWidth: 100, editable: true, type: 'agent' },
  { key: 'camere', label: 'Rooms', width: 80, minWidth: 60, editable: true, type: 'text' },
  { key: 'piscina', label: 'Pool', width: 80, minWidth: 60, editable: true, type: 'text' },
  { key: 'terreno', label: 'Land', width: 80, minWidth: 60, editable: true, type: 'text' },
  { key: 'note_extra', label: 'Notes', width: 250, minWidth: 150, editable: true, type: 'text' },
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

// --- Badge Select ---
function BadgeSelect({
  value, onChange, options, colorMap,
}: {
  value: string; onChange: (val: string) => void; options: string[]; colorMap?: Record<string, string>;
}) {
  const bgColor = colorMap?.[value] || '#6b7280';
  return (
    <Select value={value || '__none'} onValueChange={v => onChange(v === '__none' ? '' : v)}>
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

// --- Editable Cell ---
function EditableCell({
  value, onChange, type = 'text', agents, onClick,
}: {
  value: string; onChange?: (val: string) => void; type?: ColumnDef['type']; agents?: Agent[]; onClick?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft !== value && onChange) onChange(draft);
  }, [draft, value, onChange]);

  if (type === 'status') {
    const status = STATUS_OPTIONS.find(s => s.value === value);
    return (
      <Select value={value} onValueChange={v => onChange?.(v)}>
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
  if (type === 'lingua' && onChange) return <BadgeSelect value={value} onChange={onChange} options={LINGUA_OPTIONS_VALUES} colorMap={LINGUA_COLORS} />;
  if (type === 'portale' && onChange) return <BadgeSelect value={value} onChange={onChange} options={PORTALE_OPTIONS} colorMap={PORTALE_COLORS} />;
  if (type === 'tipo_contatto' && onChange) return <BadgeSelect value={value} onChange={onChange} options={TIPO_CONTATTO_OPTIONS} colorMap={TIPO_CONTATTO_COLORS} />;

  if (type === 'agent' && agents) {
    return (
      <Select value={value || '__none'} onValueChange={v => onChange?.(v === '__none' ? '' : v)}>
        <SelectTrigger className="h-7 border-0 bg-transparent shadow-none text-xs px-1 focus:ring-0">
          <SelectValue>
            {(() => {
              const agent = agents.find(a => a.user_id === value);
              return agent ? `${agent.avatar_emoji || ''} ${agent.full_name}` : 'Not assigned';
            })()}
          </SelectValue>
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

  if (!onChange) {
    return (
      <span className="block truncate text-xs px-2 py-1 cursor-pointer" onClick={onClick} title={value}>
        {value || '—'}
      </span>
    );
  }

  if (!editing) {
    return (
      <span
        className="block truncate text-xs px-2 py-1.5 cursor-text hover:bg-muted/30 rounded min-h-[28px]"
        onDoubleClick={() => setEditing(true)}
        onClick={onClick}
        title={value}
      >
        {value || '—'}
      </span>
    );
  }

  return (
    <Input
      ref={inputRef}
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
function SheetToolbar({
  selectedCliente,
  selectedIndex,
  onBgColorChange,
  onTextColorChange,
  rowFormats,
  onToggleFormat,
}: {
  selectedCliente: Cliente | null;
  selectedIndex: number;
  onBgColorChange: (color: string | null) => void;
  onTextColorChange: (color: string | null) => void;
  rowFormats: Record<string, { bold?: boolean; italic?: boolean; strikethrough?: boolean }>;
  onToggleFormat: (format: 'bold' | 'italic' | 'strikethrough') => void;
}) {
  const fmt = selectedCliente ? rowFormats[selectedCliente.id] || {} : {};
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/60 border-b text-xs">
      <Button
        variant="ghost" size="sm"
        className={cn("h-7 w-7 p-0", fmt.bold && "bg-accent")}
        disabled={!selectedCliente}
        onClick={() => onToggleFormat('bold')}
      >
        <Bold className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost" size="sm"
        className={cn("h-7 w-7 p-0", fmt.italic && "bg-accent")}
        disabled={!selectedCliente}
        onClick={() => onToggleFormat('italic')}
      >
        <Italic className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost" size="sm"
        className={cn("h-7 w-7 p-0", fmt.strikethrough && "bg-accent")}
        disabled={!selectedCliente}
        onClick={() => onToggleFormat('strikethrough')}
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </Button>

      <div className="h-4 w-px bg-border mx-1" />

      <ColorPalettePopover currentColor={selectedCliente?.row_bg_color ?? null} onSelect={onBgColorChange}>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" disabled={!selectedCliente}>
          <Paintbrush className="w-3.5 h-3.5" />
          <span className="w-3 h-3 rounded-sm border border-border/50" style={{ backgroundColor: selectedCliente?.row_bg_color || 'transparent' }} />
        </Button>
      </ColorPalettePopover>

      <ColorPalettePopover currentColor={selectedCliente?.row_text_color ?? null} onSelect={onTextColorChange}>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" disabled={!selectedCliente}>
          <Type className="w-3.5 h-3.5" />
          <span className="w-3 h-3 rounded-sm border border-border/50" style={{ backgroundColor: selectedCliente?.row_text_color || 'transparent' }} />
        </Button>
      </ColorPalettePopover>

      <div className="h-4 w-px bg-border mx-1" />

      <span className="text-muted-foreground">
        {selectedCliente
          ? `Row ${selectedIndex + 1} — ${selectedCliente.cognome || ''} ${selectedCliente.nome}`.trim()
          : 'Seleziona una riga'}
      </span>
    </div>
  );
}

// --- Main Component ---
export function ClientiSheetView({ clienti, agents, onCardClick, onUpdate, searchQuery }: ClientiSheetViewProps) {
  const [colWidths, setColWidths] = useState<Record<string, number>>(
    () => Object.fromEntries(COLUMNS.map(c => [c.key, c.width]))
  );
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [rowFormats, setRowFormats] = useState<Record<string, { bold?: boolean; italic?: boolean; strikethrough?: boolean }>>({});
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

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

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const col = COLUMNS.find(c => c.key === sortCol)!;
      const va = getCellValueStatic(a, col);
      const vb = getCellValueStatic(b, col);
      const cmp = va.localeCompare(vb, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const handleHeaderClick = useCallback((key: string) => {
    if (sortCol === key) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortCol(key); setSortDir('asc'); }
  }, [sortCol]);

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
    } else {
      updates[key] = rawValue || null;
    }
    await onUpdate(clienteId, updates);
  }, [onUpdate]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const srcIdx = result.source.index;
    const destIdx = result.destination.index;
    const item = sorted[srcIdx];
    if (!item) return;
    // Update display_order to reflect new position
    const targetItem = sorted[destIdx];
    if (targetItem) {
      await onUpdate(item.id, { display_order: targetItem.display_order });
    }
  }, [sorted, onUpdate]);

  const selectedCliente = useMemo(() => sorted.find(c => c.id === selectedRowId) || null, [sorted, selectedRowId]);
  const selectedIndex = useMemo(() => sorted.findIndex(c => c.id === selectedRowId), [sorted, selectedRowId]);

  const handleBgColorChange = useCallback(async (color: string | null) => {
    if (!selectedRowId) return;
    await onUpdate(selectedRowId, { row_bg_color: color } as any);
  }, [selectedRowId, onUpdate]);

  const handleTextColorChange = useCallback(async (color: string | null) => {
    if (!selectedRowId) return;
    await onUpdate(selectedRowId, { row_text_color: color } as any);
  }, [selectedRowId, onUpdate]);

  const rowNumWidth = 52;
  const totalWidth = rowNumWidth + COLUMNS.reduce((s, c) => s + (colWidths[c.key] || c.width), 0);

  return (
    <div className="border rounded-lg bg-card overflow-hidden flex flex-col max-h-[calc(100vh-280px)]">
      {/* Toolbar */}
      <SheetToolbar
        selectedCliente={selectedCliente}
        selectedIndex={selectedIndex}
        onBgColorChange={handleBgColorChange}
        onTextColorChange={handleTextColorChange}
        rowFormats={rowFormats}
        onToggleFormat={(fmt) => {
          if (!selectedRowId) return;
          setRowFormats(prev => ({
            ...prev,
            [selectedRowId]: { ...prev[selectedRowId], [fmt]: !prev[selectedRowId]?.[fmt] }
          }));
        }}
      />

      {/* Table */}
      <div className="overflow-auto flex-1">
        <div style={{ minWidth: totalWidth }}>
          {/* Header */}
          <div className="flex sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b">
            <div className="flex-shrink-0 flex items-center justify-center text-[10px] text-muted-foreground font-medium border-r bg-muted/60" style={{ width: rowNumWidth }}>
              #
            </div>
            {COLUMNS.map(col => (
              <div
                key={col.key}
                className={cn(
                  "relative flex items-center border-r text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2 select-none cursor-pointer hover:bg-muted/50",
                  sortCol === col.key && "bg-muted/60 text-foreground"
                )}
                style={{ width: colWidths[col.key], flexShrink: 0 }}
                onClick={() => handleHeaderClick(col.key)}
              >
                <span className="truncate">{col.label}</span>
                {sortCol === col.key && (
                  <span className="ml-1 text-[9px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 active:bg-primary/50"
                  onMouseDown={e => handleResizeStart(col.key, e)}
                  onClick={e => e.stopPropagation()}
                />
              </div>
            ))}
          </div>

          {/* Rows with DnD */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sheet-rows">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {sorted.map((cliente, idx) => (
                    <Draggable key={cliente.id} draggableId={cliente.id} index={idx}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={cn(
                            "flex border-b transition-colors group",
                            selectedRowId === cliente.id ? 'ring-2 ring-primary/50 ring-inset' : '',
                            dragSnapshot.isDragging && 'shadow-lg opacity-90',
                            !cliente.row_bg_color && (idx % 2 === 0 ? 'bg-card' : 'bg-muted/10'),
                            rowFormats[cliente.id]?.bold && 'font-bold',
                            rowFormats[cliente.id]?.italic && 'italic',
                            rowFormats[cliente.id]?.strikethrough && 'line-through',
                          )}
                          style={{
                            ...dragProvided.draggableProps.style,
                            backgroundColor: cliente.row_bg_color || undefined,
                            color: cliente.row_text_color || undefined,
                          }}
                          onClick={() => setSelectedRowId(cliente.id)}
                        >
                          {/* Row number + drag handle */}
                          <div
                            className="flex-shrink-0 flex items-center gap-0.5 border-r bg-muted/20 text-muted-foreground"
                            style={{ width: rowNumWidth, color: cliente.row_text_color || undefined }}
                          >
                            <div
                              {...dragProvided.dragHandleProps}
                              className="flex items-center justify-center w-5 h-full cursor-grab active:cursor-grabbing hover:bg-muted/40"
                            >
                              <GripVertical className="w-3 h-3" />
                            </div>
                            <span
                              className="text-[10px] font-medium cursor-pointer hover:text-primary flex-1 text-center"
                              onClick={(e) => { e.stopPropagation(); onCardClick(cliente); }}
                            >
                              {idx + 1}
                            </span>
                          </div>

                          {/* Data cells */}
                          {COLUMNS.map(col => (
                            <div
                              key={col.key}
                              className="flex-shrink-0 border-r overflow-hidden"
                              style={{ width: colWidths[col.key] }}
                            >
                              <EditableCell
                                value={getCellValueStatic(cliente, col)}
                                onChange={col.editable ? (val) => handleCellChange(cliente.id, col.key, val) : undefined}
                                type={col.type}
                                agents={agents}
                                onClick={() => !col.editable ? onCardClick(cliente) : undefined}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {sorted.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">No buyers found</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-muted/60 backdrop-blur-sm border-t px-3 py-1.5 text-xs text-muted-foreground">
        {sorted.length} buyers
      </div>
    </div>
  );
}

export default ClientiSheetView;
