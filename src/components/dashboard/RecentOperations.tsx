import { FileText } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useOperations } from '@/hooks/useOperations';
import { cn } from '@/lib/utils';

const RecentOperations = () => {
  const { operations, isLoading } = useOperations();

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getOperationBadge = (type: string) => {
    const styles: Record<string, string> = {
      acquisizione: 'bg-accent/10 text-accent border-accent/20',
      vendita: 'bg-success/10 text-success border-success/20',
      incarico: 'bg-primary/10 text-primary border-primary/20',
      affitto: 'bg-muted text-muted-foreground border-muted',
    };
    return styles[type] || styles.acquisizione;
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 md:p-6 animate-fade-in">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <FileText className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-base md:text-lg font-semibold text-foreground">Operazioni Recenti</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Agente</th>
              <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Operazione</th>
              <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valore</th>
            </tr>
          </thead>
          <tbody>
            {operations && operations.length > 0 ? (
              operations.map((op: any) => (
                <tr key={op.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 md:py-4 px-2 text-xs md:text-sm text-foreground">{formatDate(op.date)}</td>
                  <td className="py-3 md:py-4 px-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 md:h-7 md:w-7 bg-muted">
                        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                          {getInitials(op.profiles?.full_name || 'NN')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs md:text-sm text-foreground hidden sm:inline">{op.profiles?.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 md:py-4 px-2">
                    <Badge variant="outline" className={cn('uppercase text-xs tracking-wide', getOperationBadge(op.type))}>
                      {op.type}
                    </Badge>
                  </td>
                  <td className="py-3 md:py-4 px-2 text-right text-xs md:text-sm font-medium text-foreground">
                    {op.value ? formatCurrency(Number(op.value)) : '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">
                  Nessuna operazione registrata
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOperations;
