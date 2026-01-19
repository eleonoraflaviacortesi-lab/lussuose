import { Trophy } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useProfiles } from '@/hooks/useProfiles';
import { useDailyData } from '@/hooks/useDailyData';
import { useMemo } from 'react';

const MonthlyRanking = () => {
  const { profiles } = useProfiles();
  const { allData } = useDailyData();

  const rankings = useMemo(() => {
    if (!profiles || !allData) return [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const agentStats = profiles
      .filter(p => p.role === 'agente')
      .map(profile => {
        const agentData = allData.filter(
          d => d.user_id === profile.user_id && new Date(d.date) >= startOfMonth
        );

        const totals = agentData.reduce(
          (acc, d) => ({
            vendite: acc.vendite + (d.vendite_numero || 0),
            appuntamenti: acc.appuntamenti + (d.appuntamenti_vendita || 0),
            fatturato: acc.fatturato + Number(d.vendite_valore || 0),
          }),
          { vendite: 0, appuntamenti: 0, fatturato: 0 }
        );

        return {
          userId: profile.user_id,
          name: profile.full_name,
          ...totals,
        };
      })
      .sort((a, b) => b.fatturato - a.fatturato || b.vendite - a.vendite);

    return agentStats.map((agent, index) => ({ ...agent, rank: index + 1 }));
  }, [profiles, allData]);

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <Trophy className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-base md:text-lg font-semibold text-foreground">Classifica Mensile</h3>
      </div>

      <div className="space-y-3 md:space-y-4">
        {rankings.length > 0 ? (
          rankings.map((agent) => (
            <div
              key={agent.userId}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex items-center justify-center w-6">
                  {agent.rank === 1 ? (
                    <Trophy className="w-4 h-4 text-accent" />
                  ) : (
                    <span className="text-sm text-muted-foreground font-medium">#{agent.rank}</span>
                  )}
                </div>
                <Avatar className="h-7 w-7 md:h-8 md:w-8 bg-accent/20">
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
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nessun agente registrato
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyRanking;
