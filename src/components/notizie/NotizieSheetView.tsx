import { useState, useCallback, useRef, useMemo, memo } from 'react';
import { Notizia, NotiziaStatus, useNotizie } from '@/hooks/useNotizie';
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
import { Eye, GripVertical, Phone, MessageCircle } from 'lucide-react';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';

// Helper
const isDarkColor = (color: string | null): boolean => {
  if (!color) return false;
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
};

function formatPrice(val: number | null): string {
  if (!val) return '';
  if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `€${(val / 1000).toFixed(0)}k`;
  return `€${val}`;
}

interface NotizieSheetViewProps {
  notizie: Notizia[];
  searchQuery: string;
  onNotiziaClick: (notizia: Notizia) => void;
}

type ColumnDef = {
  key: string;
  label: string;
  width: number;
  minWidth: number;
  editable?: boolean;
  type?: 'text' | 'number' | 'status';
};

const COLUMNS: ColumnDef[] = [
  { key: 'emoji', label: '😀', width: 50, minWidth: 40, editable: false },
  { key: 'name', label: 'Nome', width: 180, minWidth: 120, editable: true, type: 'text' },
  { key: 'zona', label: 'Zona', width: 130, minWidth: 80, editable: true, type: 'text' },
  { key: 'type', label: 'Tipo', width: 110, minWidth: 70, editable: true, type: 'text' },
  { key: 'phone', label: 'Telefono', width: 140, minWidth: 100, editable: true, type: 'text' },
  { key: 'prezzo_richiesto', label: 'Prezzo Rich.', width: 120, minWidth: 80, editable: true, type: 'number' },
  { key: 'valore', label: 'Valore', width: 110, minWidth: 80, editable: true, type: 'number' },
  { key: 'status', label: 'Status', width: 120, minWidth: 90, editable: true, type: 'status' },
  { key: 'notes', label: 'Note', width: 220, minWidth: 120, editable: true, type: 'text' },
  { key: 'created_at', label: 'Data', width: 100, minWidth: 80, editable: false },
];

const STORAGE_KEY = 'notizie-sheet-col-widths';

function getStoredWidths(): Record<string, number> {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

function getCellValue(notizia: Notizia, col: ColumnDef): string {
  switch (col.key) {
    case 'emoji': return notizia.emoji || '📋';
    case 'prezzo_richiesto': return formatPrice(notizia.prezzo_richiesto);
    case 'valore': return formatPrice(notizia.valore);
    case 'created_at':
      try { return format(new Date(notizia.created_at), 'dd/MM/yyyy'); } catch { return ''; }
    default: return String((notizia as any)[col.key] ?? '');
  }
}

// --- Inline Text Cell ---
function InlineTextCell({ value, onChange }: { value: string; onChange?: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

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

// --- Status Cell ---
function StatusCell({ value, columns: statusCols, onChange }: { value: string; columns: { key: string; label: string; color: string }[]; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const col = statusCols.find(s => s.key === value);

  if (!open) {
    return (
      <span
        className="block px-1 py-1 cursor-pointer hover:bg-secondary/50"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >
        <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-semibold" style={{ backgroundColor: col?.color || '#666' }}>
          {col?.label || value}
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
        <span className="px-2 py-0.5 rounded-full text-white text-[10px] font-semibold" style={{ backgroundColor: col?.color || '#666' }}>
          {col?.label || value}
        </span>
      </SelectTrigger>
      <SelectContent>
        {statusCols.map(s => (
          <SelectItem key={s.key} value={s.key}>
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

// --- Sheet Row ---
const MIN_ROW_HEIGHT = 32;

const SheetRow = memo(function SheetRow({
  notizia,
  idx,
  colWidths,
  rowNumWidth,
  statusColumns,
  onNotiziaClick,
  onCellChange,
}: {
  notizia: Notizia;
  idx: number;
  colWidths: Record<string, number>;
  rowNumWidth: number;
  statusColumns: { key: string; label: string; color: string }[];
  onNotiziaClick: (n: Notizia) => void;
  onCellChange: (id: string, key: string, val: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex border-b border-border/20 transition-colors",
        idx % 2 === 0 ? 'bg-background' : 'bg-secondary/30',
      )}
      style={{
        minHeight: MIN_ROW_HEIGHT,
        backgroundColor: notizia.card_color || undefined,
        color: notizia.card_color ? (isDarkColor(notizia.card_color) ? '#ffffff' : '#000000') : undefined,
      }}
    >
      {/* Row number + open detail */}
      <div
        className="flex-shrink-0 flex items-center gap-0 border-r border-border/20 text-muted-foreground"
        style={{ width: rowNumWidth }}
      >
        <span className="text-[10px] font-medium flex-1 text-center select-none">{idx + 1}</span>
        <button
          className="flex items-center justify-center w-5 h-full hover:text-foreground transition-colors"
          onClick={(e) => { e.stopPropagation(); onNotiziaClick(notizia); }}
          title="Apri scheda"
        >
          <Eye className="w-3 h-3" />
        </button>
      </div>

      {/* Data cells */}
      {COLUMNS.map(col => (
        <div
          key={col.key}
          className={cn(
            "flex-shrink-0 border-r border-border/20",
            (col.key === 'name') && 'font-bold',
          )}
          style={{
            width: colWidths[col.key],
            wordBreak: 'break-word',
          }}
        >
          {col.key === 'emoji' ? (
            <span className="block text-center text-base py-1">{notizia.emoji || '📋'}</span>
          ) : col.type === 'status' && col.editable ? (
            <StatusCell value={getCellValue(notizia, col)} columns={statusColumns} onChange={(v) => onCellChange(notizia.id, col.key, v)} />
          ) : col.key === 'phone' ? (
            <div className="flex items-center gap-0.5">
              <div className="flex-1 overflow-hidden">
                <InlineTextCell value={getCellValue(notizia, col)} onChange={col.editable ? (v) => onCellChange(notizia.id, col.key, v) : undefined} />
              </div>
              {notizia.phone && (
                <a
                  href={`tel:${notizia.phone}`}
                  className="flex-shrink-0 p-1 rounded hover:bg-accent transition-colors"
                  onClick={e => e.stopPropagation()}
                  title="Chiama"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" />
                </a>
              )}
            </div>
          ) : (
            <InlineTextCell
              value={getCellValue(notizia, col)}
              onChange={col.editable ? (v) => onCellChange(notizia.id, col.key, v) : undefined}
            />
          )}
        </div>
      ))}
    </div>
  );
});

// --- Main Sheet ---
const NotizieSheetView = ({ notizie, searchQuery, onNotiziaClick }: NotizieSheetViewProps) => {
  const { updateNotizia } = useNotizie();
  const { columns: kanbanColumns } = useKanbanColumns();
  const storedWidths = useMemo(() => getStoredWidths(), []);
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    COLUMNS.forEach(c => { initial[c.key] = storedWidths[c.key] || c.width; });
    return initial;
  });

  const rowNumWidth = 55;
  const resizingCol = useRef<string | null>(null);
  const startX = useRef(0);
  const startW = useRef(0);

  const statusColumns = useMemo(() =>
    kanbanColumns.map(c => ({ key: c.key, label: c.label, color: c.color })),
    [kanbanColumns]
  );

  const filteredNotizie = useMemo(() => {
    if (!searchQuery.trim()) return notizie;
    const q = searchQuery.toLowerCase();
    return notizie.filter(n =>
      n.name.toLowerCase().includes(q) ||
      n.zona?.toLowerCase().includes(q) ||
      n.type?.toLowerCase().includes(q)
    );
  }, [notizie, searchQuery]);

  const handleCellChange = useCallback((id: string, key: string, val: string) => {
    const updates: any = {};
    if (key === 'prezzo_richiesto' || key === 'valore') {
      updates[key] = val ? Number(val) : null;
    } else {
      updates[key] = val || null;
    }
    updateNotizia.mutate({ id, ...updates, silent: true });
  }, [updateNotizia]);

  const handleResizeStart = useCallback((colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingCol.current = colKey;
    startX.current = e.clientX;
    startW.current = colWidths[colKey];

    const onMove = (ev: MouseEvent) => {
      if (!resizingCol.current) return;
      const diff = ev.clientX - startX.current;
      const colDef = COLUMNS.find(c => c.key === resizingCol.current);
      const min = colDef?.minWidth || 60;
      const newW = Math.max(min, startW.current + diff);
      setColWidths(prev => ({ ...prev, [resizingCol.current!]: newW }));
    };

    const onUp = () => {
      if (resizingCol.current) {
        setColWidths(prev => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
          return prev;
        });
      }
      resizingCol.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [colWidths]);

  const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0) + rowNumWidth;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="overflow-x-auto scrollbar-thin" style={{ direction: 'rtl' }}>
        <div style={{ direction: 'ltr', minWidth: totalWidth }}>
          {/* Column headers */}
          <div className="flex border-b border-border/40 bg-muted/50 sticky top-0 z-10">
            <div className="flex-shrink-0 text-[10px] font-semibold text-muted-foreground flex items-center justify-center border-r border-border/20" style={{ width: rowNumWidth }}>
              #
            </div>
            {COLUMNS.map(col => (
              <div
                key={col.key}
                className="flex-shrink-0 relative text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2 border-r border-border/20 select-none flex items-center"
                style={{ width: colWidths[col.key] }}
              >
                {col.label}
                {/* Resize handle */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 transition-colors"
                  onMouseDown={(e) => handleResizeStart(col.key, e)}
                />
              </div>
            ))}
          </div>

          {/* Rows */}
          {filteredNotizie.map((notizia, idx) => (
            <SheetRow
              key={notizia.id}
              notizia={notizia}
              idx={idx}
              colWidths={colWidths}
              rowNumWidth={rowNumWidth}
              statusColumns={statusColumns}
              onNotiziaClick={onNotiziaClick}
              onCellChange={handleCellChange}
            />
          ))}

          {filteredNotizie.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              Nessuna notizia trovata
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotizieSheetView;
