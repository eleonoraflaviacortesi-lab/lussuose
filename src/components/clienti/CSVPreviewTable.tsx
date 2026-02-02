import { ColumnInfo, AVAILABLE_FIELDS } from '@/lib/csvParser';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface CSVPreviewTableProps {
  headers: string[];
  rows: string[][];
  columnInfos: ColumnInfo[];
  onColumnMappingChange: (index: number, field: string) => void;
  previewRowCount?: number;
}

export function CSVPreviewTable({
  headers,
  rows,
  columnInfos,
  onColumnMappingChange,
  previewRowCount = 3,
}: CSVPreviewTableProps) {
  const previewRows = rows.slice(0, previewRowCount);
  
  // Get mapping for a column index
  const getMapping = (index: number): ColumnInfo | undefined => {
    return columnInfos.find(c => c.index === index);
  };

  // Count mapped vs unmapped columns
  const mappedCount = columnInfos.filter(c => c.field).length;
  const unmappedCount = headers.length - mappedCount;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>{mappedCount} colonne mappate</span>
        </div>
        {unmappedCount > 0 && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span>{unmappedCount} non mappate</span>
          </div>
        )}
        <span className="text-muted-foreground">• {rows.length} righe totali</span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {headers.map((header, index) => {
                const mapping = getMapping(index);
                const isMapped = mapping?.field;
                
                return (
                  <TableHead key={index} className="min-w-[180px] p-2">
                    <div className="space-y-2">
                      {/* Original header */}
                      <div className="text-xs font-normal text-muted-foreground truncate max-w-[200px]" title={header}>
                        {header || <span className="italic">Colonna {index + 1}</span>}
                      </div>
                      
                      {/* Field mapping selector */}
                      <Select
                        value={mapping?.field || ''}
                        onValueChange={(value) => onColumnMappingChange(index, value)}
                      >
                        <SelectTrigger className={`h-8 text-xs ${isMapped ? 'border-green-500/50' : 'border-dashed'}`}>
                          <SelectValue placeholder="Seleziona campo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_FIELDS.map(f => (
                            <SelectItem key={f.value} value={f.value} className="text-xs">
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Option value badge if present */}
                      {mapping?.optionValue && (
                        <Badge variant="secondary" className="text-[10px]">
                          Opzione: {mapping.optionValue}
                        </Badge>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((_, colIndex) => {
                  const value = row[colIndex] || '';
                  const mapping = getMapping(colIndex);
                  const isBooleanLike = value.toLowerCase() === 'true' || value.toLowerCase() === 'false';
                  
                  return (
                    <TableCell 
                      key={colIndex} 
                      className={`text-xs p-2 max-w-[200px] truncate ${
                        !mapping?.field ? 'text-muted-foreground/50' : ''
                      }`}
                      title={value}
                    >
                      {isBooleanLike ? (
                        <Badge variant={value.toLowerCase() === 'true' ? 'default' : 'outline'} className="text-[10px]">
                          {value}
                        </Badge>
                      ) : (
                        value || <span className="text-muted-foreground/30">—</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {rows.length > previewRowCount && (
        <p className="text-xs text-muted-foreground text-center">
          Mostrando {previewRowCount} di {rows.length} righe
        </p>
      )}
    </div>
  );
}

export default CSVPreviewTable;
