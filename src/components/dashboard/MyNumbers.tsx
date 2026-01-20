import { useAuth } from '@/hooks/useAuth';
import { useKPIs } from '@/hooks/useKPIs';
import { useDailyData } from '@/hooks/useDailyData';
import { Progress } from '@/components/ui/progress';

const MyNumbers = () => {
  const { profile } = useAuth();
  const { kpis, isLoading } = useKPIs('year');
  const { myData } = useDailyData();

  const annualTarget = 26;
  const currentSales = kpis?.vendite?.value || 0;
  const completionPercent = Math.round((currentSales / annualTarget) * 100);
  const fatturato = kpis?.fatturato?.value || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-8 space-y-8 animate-fade-in">
      {/* Status Annuale Personale */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-foreground" />
          <h2 className="text-xs font-medium tracking-[0.3em] uppercase text-foreground">
            STATUS ANNUALE PERSONALE
          </h2>
        </div>

        {/* Big Number */}
        <div className="space-y-1">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-8xl font-light text-foreground tracking-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              {currentSales}
            </span>
            <span className="text-3xl font-light text-muted-foreground">/{annualTarget}</span>
          </div>
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary">
            VENDITE
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto space-y-3">
          <Progress value={completionPercent} className="h-1 bg-muted" />
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium tracking-[0.2em] uppercase text-muted-foreground">
              AVANZAMENTO TARGET
            </span>
            <span className="font-semibold text-foreground">{completionPercent}%</span>
          </div>
        </div>
      </div>

      {/* Volume Generato - Dark Card */}
      <div className="dark-card">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">
          VOLUME GENERATO
        </p>
        <p className="text-4xl font-light text-white mb-2">
          {formatCurrency(fatturato)}
        </p>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
          FATTURATO AGENZIA
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">
            CONTATTI
          </p>
          <p className="text-3xl font-light text-foreground">{kpis?.contatti?.value || 0}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">
            NOTIZIE
          </p>
          <p className="text-3xl font-light text-foreground">{kpis?.notizie?.value || 0}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">
            CLIENTI
          </p>
          <p className="text-3xl font-light text-foreground">{kpis?.clienti?.value || 0}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-2">
            APPUNTAMENTI
          </p>
          <p className="text-3xl font-light text-foreground">{kpis?.appuntamenti?.value || 0}</p>
        </div>
      </div>

      {/* Recent Activity */}
      {myData && myData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-center text-muted-foreground">
            ULTIME ATTIVITÀ
          </h3>
          <div className="space-y-2">
            {myData.slice(0, 3).map((entry) => (
              <div 
                key={entry.id} 
                className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border"
              >
                <span className="text-sm text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString('it-IT', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span>{entry.contatti_reali} contatti</span>
                  <span>{entry.notizie_reali} notizie</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyNumbers;