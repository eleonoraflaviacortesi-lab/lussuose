import { useMemo } from 'react';
import { Cliente, ClienteGroupBy, ClienteStatus, ClienteFilters as Filters } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  X,
  LayoutGrid,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientiFiltersProps {
  groupBy: ClienteGroupBy;
  onGroupByChange: (groupBy: ClienteGroupBy) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  totalCount: number;
  filteredCount: number;
  clienti: Cliente[];
  dateSortDir?: 'desc' | 'asc' | null;
  onDateSortChange?: () => void;
}

const groupByOptions: { value: ClienteGroupBy; label: string }[] = [
  { value: 'status', label: 'Per Stato' },
  { value: 'regione', label: 'Per Regione' },
  { value: 'tipologia', label: 'Per Tipologia' },
  { value: 'budget', label: 'Per Budget' },
  { value: 'agente', label: 'Per Agente' },
];

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuovi',
  contacted: 'Contattati',
  qualified: 'Qualificati',
  proposal: 'Proposta',
  negotiation: 'Trattativa',
  closed_won: 'Chiusi ✓',
  closed_lost: 'Persi',
};

export function ClientiFilters({
  groupBy,
  onGroupByChange,
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
  clienti,
  dateSortDir,
  onDateSortChange,
}: ClientiFiltersProps) {
  const uniqueValues = useMemo(() => {
    const unique = (arr: (string | null | undefined)[]) => 
      [...new Set(arr.filter(Boolean) as string[])].sort();
    
    return {
      portale: unique(clienti.map(c => c.portale)),
      regione: unique(clienti.flatMap(c => c.regioni || [])),
      ref_number: unique(clienti.map(c => c.ref_number)),
      status: unique(clienti.map(c => c.status)),
    };
  }, [clienti]);

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.entries(filters).some(([k, v]) => k !== 'search' && v);

  const dropdownFilters: { key: keyof Filters; label: string; options: string[]; labelMap?: Record<string, string> }[] = [
    { key: 'status', label: 'Status', options: uniqueValues.status, labelMap: STATUS_LABELS },
    { key: 'portale', label: 'Portale', options: uniqueValues.portale },
    { key: 'regione', label: 'Regione', options: uniqueValues.regione },
    { key: 'ref_number', label: 'Riferimento', options: uniqueValues.ref_number },
  ];

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Top row: Search + GroupBy */}
      <div className="flex gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca nome, telefono, paese, regione..."
            value={filters.search || ''}
            onChange={e => onFiltersChange({ ...filters, search: e.target.value || undefined })}
            className="pl-9 h-9"
          />
        </div>

        <Select value={groupBy} onValueChange={v => onGroupByChange(v as ClienteGroupBy)}>
          <SelectTrigger className="w-auto sm:w-[180px] h-9 shrink-0">
            <LayoutGrid className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline"><SelectValue /></span>
            <span className="sm:hidden"><SelectValue /></span>
          </SelectTrigger>
          <SelectContent>
            {groupByOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {onDateSortChange && (
          <Button
            variant={dateSortDir ? 'default' : 'outline'}
            size="icon"
            className="shrink-0 h-9 w-9"
            onClick={onDateSortChange}
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filter chips - horizontal scroll on mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

        {dropdownFilters.map(df => df.options.length > 0 && (
          <Select
            key={df.key}
            value={(filters[df.key] as string) || 'all'}
            onValueChange={v => onFiltersChange({ ...filters, [df.key]: v === 'all' ? undefined : v })}
          >
            <SelectTrigger className={cn(
              "h-7 w-auto px-2.5 text-xs rounded-full border-0 shrink-0",
              filters[df.key] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <SelectValue placeholder={df.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{df.label}: Tutti</SelectItem>
              {df.options.map(opt => (
                <SelectItem key={opt} value={opt}>
                  {df.labelMap?.[opt] || opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-3 h-3" />
            Cancella
          </button>
        )}

        <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap shrink-0">
          {filteredCount === totalCount
            ? `${totalCount} clienti`
            : `${filteredCount} di ${totalCount} clienti`}
        </span>
      </div>
    </div>
  );
}

export default ClientiFilters;
