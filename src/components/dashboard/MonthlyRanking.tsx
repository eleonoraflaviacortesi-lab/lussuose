import { Trophy } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { agentRankings } from '@/data/mockData';

const MonthlyRanking = () => {
  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-semibold text-foreground">Classifica Mensile</h3>
      </div>

      <div className="space-y-4">
        {agentRankings.map((agent) => (
          <div
            key={agent.userId}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6">
                {agent.rank === 1 ? (
                  <Trophy className="w-4 h-4 text-accent" />
                ) : (
                  <span className="text-sm text-muted-foreground font-medium">#{agent.rank}</span>
                )}
              </div>
              <Avatar className="h-8 w-8 bg-accent/20">
                <AvatarFallback className="text-xs font-medium bg-accent/20 text-accent">
                  {getInitials(agent.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{agent.name}</p>
                <p className="text-xs text-muted-foreground">
                  V: {agent.vendite} · App: {agent.appuntamenti}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-accent">
                {formatCurrency(agent.fatturato)}
              </span>
              <p className="text-xs text-muted-foreground">Fatturato</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlyRanking;
