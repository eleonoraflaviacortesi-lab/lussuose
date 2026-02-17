import { useState, useCallback, useRef, useMemo, useEffect, memo } from 'react';
import { Notizia, NotiziaStatus } from '@/hooks/useNotizie';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { GripVertical, Filter, Eye } from 'lucide-react';

interface NotizieSheetViewProps {
  notizie: Notizia[];
  onNotiziaClick: (notizia: Notizia) => void;
  onUpdate: (id: string, updates: Partial<Notizia>) => void;
  searchQuery: string;
}

interface ColumnDef {
  key: string;
  label: string;
  width: number;
  minWidth: number;
  editable: boolean;
  type: 'text' | 'number' | 'status' | 'boolean';
}

const COLUMNS: ColumnDef[] = [
  { key: 'emoji', label: '😀', width: 44, minWidth: 44, editable: false, type: 'text' },
  { key: 'name', label: 'Nome', width: 180, minWidth: 120, editable: true, type: 'text' },
  { key: 'zona', label: 'Zona', width: 140, minWidth: 90, editable: true, type: 'text' },
  { key: 'phone', label: 'Telefono', width: 130, minWidth: 90, editable: true, type: 'text' },
  { key: 'type', label: 'Tipo', width: 120, minWidth: 80, editable: true, type: 'text' },
  { key: 'status', label: 'Status', width: 120, minWidth: 80, editable: false, type: 'status' },
  { key: 'prezzo_richiesto', label: 'Prezzo Rich.', width: 120, minWidth: 80, editable: true, type: 'number' },
  { key: 'valore', label: 'Valore', width: 120, minWidth: 80, editable: true, type: 'number' },
  { key: 'is_online', label: 'Online', width: 70, minWidth: 60, editable: false, type: 'boolean' },
  { key: 'created_at', label: 'Creata', width: 100, minWidth: 80, editable: false, type: 'text' },
  { key: 'notes', label: 'Note', width: 250, minWidth: 120, editable: true, type: 'text' },
];

const LS_KEY = 'notizie-sheet-col-widths';

function getSavedColWidths(): Record<string, number> | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function formatCurrency(val: number | null): string {
  if (!val) return '';
  if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
  return `€${(val / 1000).toFixed(0)}k`;
}

function getCellValue(notizia: Notizia, col: ColumnDef): string {
  switch (col.key) {
    case 'emoji': return notizia.emoji || '📋';
    case 'prezzo_richiesto': return formatCurrency(notizia.prezzo_richiesto);
    case 'valore': return formatCurrency(notizia.valore);
    case 'is_online': return notizia.is_online ? '✅' : '';
    case 'created_at':
      try { return format(new Date(notizia.created_at), 'dd/MM/yyyy'); } catch { return ''; }
    case 'notes': {
      const n = notizia.notes || '';
      return n.replace(/<[^>]+>/g, ' ').trim();
    }
    default: return String((notizia as any)[col.key] ?? '');
  }
}

const NotizieSheetView = ({ notizie, onNotiziaClick, onUpdate, searchQuery }: NotizieSheetViewProps) => {
  const { columns: kanbanCols } = useKanbanColumns();
  
  const [colWidths, setColWidths] = useState<Record<string, number>>(
    () => {
      const saved = getSavedColWidths();
      const defaults = Object.fromEntries(COLUMNS.map(c => [c.key, c.width]));
      return saved ? { ...defaults, ...saved } : defaults;
    }
  );
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [editingCell, setEditingCell] = useState<{ id: string; key: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<HTMLInputElement>(null);
  const resizingRef = useRef<{ key: string; startX: number; startW: number } | null>(null);

  // Filter
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return notizie;
    const q = searchQuery.toLowerCase();
    return notizie.filter(n =>
      n.name.toLowerCase().includes(q) ||
      n.zona?.toLowerCase().includes(q) ||
      n.notes?.toLowerCase().includes(q)
    );
  }, [notizie, searchQuery]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const col = COLUMNS.find(c => c.key === sortCol)!;
      const va = getCellValue(a, col);
      const vb = getCellValue(b, col);
      if (col.type === 'number') {
        const na = parseFloat(va.replace(/[€kM,]/g, '')) || 0;
        const nb = parseFloat(vb.replace(/[€kM,]/g, '')) || 0;
        return sortDir === 'asc' ? na - nb : nb - na;
      }
      const cmp = va.localeCompare(vb, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  // Column resize
  const handleResizeStart = useCallback((key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { key, startX: e.clientX, startW: colWidths[key] || 100 };
    
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const diff = ev.clientX - resizingRef.current.startX;
      const col = COLUMNS.find(c => c.key === resizingRef.current!.key);
      const minW = col?.minWidth || 60;
      const newW = Math.max(minW, resizingRef.current.startW + diff);
      setColWidths(prev => {
        const updated = { ...prev, [resizingRef.current!.key]: newW };
        localStorage.setItem(LS_KEY, JSON.stringify(updated));
        return updated;
      });
    };
    
    const onUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [colWidths]);

  // Header click to sort
  const handleHeaderClick = useCallback((key: string) => {
    if (sortCol === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(key);
      setSortDir('desc');
    }
  }, [sortCol]);

  // Cell editing
  const startEditing = useCallback((id: string, key: string, currentValue: string) => {
    const col = COLUMNS.find(c => c.key === key);
    if (!col?.editable) return;
    setEditingCell({ id, key });
    setEditValue(currentValue);
    setTimeout(() => editRef.current?.focus(), 0);
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const { id, key } = editingCell;
    const col = COLUMNS.find(c => c.key === key);
    
    let value: any = editValue;
    if (col?.type === 'number') {
      value = editValue ? Number(editValue) : null;
    }
    
    onUpdate(id, { [key]: value } as any);
    setEditingCell(null);
  }, [editingCell, editValue, onUpdate]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  // Status color helper
  const getStatusInfo = useCallback((status: string) => {
    const col = kanbanCols.find(c => c.key === status);
    return col ? { label: col.label, color: col.color } : { label: status, color: '#e5e7eb' };
  }, [kanbanCols]);

  const totalWidth = COLUMNS.reduce((sum, c) => sum + (colWidths[c.key] || c.width), 0) + 50; // +50 for row number

  return (
    <div className="w-full overflow-x-auto border rounded-lg bg-background">
      <table className="border-collapse" style={{ width: totalWidth, minWidth: '100%' }}>
        <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
          <tr>
            <th className="w-[50px] min-w-[50px] px-2 py-2 text-[10px] font-bold text-muted-foreground border-b border-r text-center">#</th>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className="relative px-2 py-2 text-[10px] font-bold text-muted-foreground border-b border-r cursor-pointer hover:bg-muted select-none"
                style={{ width: colWidths[col.key] || col.width }}
                onClick={() => handleHeaderClick(col.key)}
              >
                <div className="flex items-center gap-1">
                  <span className="truncate uppercase">{col.label}</span>
                  {sortCol === col.key && (
                    <span className="text-[8px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </div>
                {/* Resize handle */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40 z-20"
                  onMouseDown={(e) => handleResizeStart(col.key, e)}
                  onClick={(e) => e.stopPropagation()}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((notizia, rowIdx) => (
            <tr key={notizia.id} className="group hover:bg-muted/30 transition-colors">
              <td
                className="px-2 py-1 text-[10px] text-muted-foreground border-b border-r text-center cursor-pointer"
                onClick={() => onNotiziaClick(notizia)}
                title="Apri dettaglio"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <Eye className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                  <span>{rowIdx + 1}</span>
                </div>
              </td>
              {COLUMNS.map(col => {
                const isEditing = editingCell?.id === notizia.id && editingCell?.key === col.key;
                const cellVal = getCellValue(notizia, col);

                return (
                  <td
                    key={col.key}
                    className={cn(
                      "px-2 py-1 text-xs border-b border-r truncate",
                      col.editable && "cursor-text",
                      col.key === 'emoji' && "text-center text-base"
                    )}
                    style={{ 
                      width: colWidths[col.key] || col.width,
                      maxWidth: colWidths[col.key] || col.width,
                      backgroundColor: notizia.card_color || undefined,
                    }}
                    onDoubleClick={() => {
                      if (col.type === 'number') {
                        startEditing(notizia.id, col.key, String((notizia as any)[col.key] ?? ''));
                      } else if (col.editable) {
                        startEditing(notizia.id, col.key, (notizia as any)[col.key] ?? '');
                      }
                    }}
                  >
                    {isEditing ? (
                      <input
                        ref={editRef}
                        className="w-full bg-background border rounded px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        type={col.type === 'number' ? 'number' : 'text'}
                      />
                    ) : col.key === 'status' ? (
                      (() => {
                        const info = getStatusInfo(notizia.status);
                        return (
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{
                              backgroundColor: info.color,
                              color: isDarkColor(info.color) ? 'white' : 'black',
                            }}
                          >
                            {info.label}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="truncate block">{cellVal}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nessuna notizia trovata
        </div>
      )}
    </div>
  );
};

function isDarkColor(color: string | null): boolean {
  if (!color) return false;
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

export default NotizieSheetView;
