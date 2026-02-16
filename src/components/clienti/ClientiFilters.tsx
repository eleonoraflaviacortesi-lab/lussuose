import { useMemo } from 'react';
import { Cliente, ClienteGroupBy, ClienteFilters as Filters } from '@/types';
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
  Droplets, 
  Trees, 
  Clock, 
  UserX,
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

interface FilterChip {
  key: keyof Filters;
  label: string;
  icon: React.ElementType;
  active: boolean;
}

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
  // Extract unique values dynamically from data
  const uniqueValues = useMemo(() => {
    const unique = (arr: (string | null | undefined)[]) => 
      [...new Set(arr.filter(Boolean) as string[])].sort();
    
    return {
      paese: unique(clienti.map(c => c.paese)),
      lingua: unique(clienti.map(c => c.lingua)),
      portale: unique(clienti.map(c => c.portale)),
      regione: unique(clienti.flatMap(c => c.regioni || [])),
      tipologia: unique(clienti.flatMap(c => c.tipologia || [])),
      stile: unique(clienti.map(c => c.stile)),
      uso: unique(clienti.map(c => c.uso)),
    };
  }, [clienti]);

  const chips: FilterChip[] = [
    { key: 'urgenti', label: 'Urgenti', icon: Clock, active: !!filters.urgenti },
    { key: 'nonAssegnati', label: 'Non assegnati', icon: UserX, active: !!filters.nonAssegnati },
    { key: 'conTerreno', label: 'Con terreno', icon: Trees, active: !!filters.conTerreno },
  ];

  const toggleFilter = (key: keyof Filters) => {
    onFiltersChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.entries(filters).some(([k, v]) => k !== 'search' && v);

  // Dropdown filter config
  const dropdownFilters: { key: keyof Filters; label: string; options: string[] }[] = [
    { key: 'paese', label: 'Paese', options: uniqueValues.paese },
    { key: 'lingua', label: 'Lingua', options: uniqueValues.lingua },
    { key: 'regione', label: 'Regione', options: uniqueValues.regione },
    { key: 'portale', label: 'Portale', options: uniqueValues.portale },
    { key: 'tipologia', label: 'Tipologia', options: uniqueValues.tipologia },
    { key: 'stile', label: 'Stile', options: uniqueValues.stile },
    { key: 'uso', label: 'Uso', options: uniqueValues.uso },
    { key: 'piscina', label: 'Piscina', options: ['Essential', 'Optional', 'Not needed'] },
  ];

  return (
    <div className="space-y-3">
      {/* Top row: Search + GroupBy */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca nome, telefono, paese, regione..."
            value={filters.search || ''}
            onChange={e => onFiltersChange({ ...filters, search: e.target.value || undefined })}
            className="pl-9"
          />
        </div>

        {/* GroupBy Selector */}
        <Select value={groupBy} onValueChange={v => onGroupByChange(v as ClienteGroupBy)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <LayoutGrid className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groupByOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Sort */}
        {onDateSortChange && (
          <Button
            variant={dateSortDir ? 'default' : 'outline'}
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={onDateSortChange}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden sm:inline">
              {dateSortDir === 'desc' ? 'Recenti ↓' : dateSortDir === 'asc' ? 'Vecchi ↓' : 'Data'}
            </span>
          </Button>
        )}
      </div>

      {/* Filter chips + dropdowns */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        
        {chips.map(chip => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.key}
              onClick={() => toggleFilter(chip.key)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                chip.active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              <Icon className="w-3 h-3" />
              {chip.label}
            </button>
          );
        })}

        {/* Dynamic dropdown filters */}
        {dropdownFilters.map(df => df.options.length > 0 && (
          <Select
            key={df.key}
            value={(filters[df.key] as string) || 'all'}
            onValueChange={v => onFiltersChange({ ...filters, [df.key]: v === 'all' ? undefined : v })}
          >
            <SelectTrigger className={cn(
              "h-7 w-auto px-2.5 text-xs rounded-full border-0",
              filters[df.key] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <SelectValue placeholder={df.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{df.label}: Tutti</SelectItem>
              {df.options.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
            Cancella
          </button>
        )}

        {/* Count */}
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredCount === totalCount
            ? `${totalCount} clienti`
            : `${filteredCount} di ${totalCount} clienti`}
        </span>
      </div>
    </div>
  );
}

export default ClientiFilters;
