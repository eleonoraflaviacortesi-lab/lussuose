import { useState, lazy, Suspense, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const AgencyDashboard = lazy(() => import('@/components/dashboard/AgencyDashboard'));
const MeetingsPage = lazy(() => import('@/components/meetings/MeetingsPage').then((m) => ({ default: m.MeetingsPage })));
const ReportAnalysisTab = lazy(() => import('@/components/dashboard/ReportAnalysisTab'));

type SubTab = 'ufficio' | 'riunioni' | 'analisi';

const allSubTabs: { id: SubTab; label: string; coordinatorOnly?: boolean }[] = [
  { id: 'ufficio', label: 'Ufficio', coordinatorOnly: true },
  { id: 'riunioni', label: 'Riunioni' },
  { id: 'analisi', label: 'Analisi' },
];

const UfficioPage = () => {
  const { profile } = useAuth();
  const isCoordinator = profile?.role === 'coordinatore' || profile?.role === 'admin';

  const visibleTabs = useMemo(
    () => allSubTabs.filter((t) => !t.coordinatorOnly || isCoordinator),
    [isCoordinator],
  );

  const [active, setActive] = useState<SubTab>(isCoordinator ? 'ufficio' : 'riunioni');

  return (
    <div className="space-y-4">
      <div className="flex justify-center pt-[25px]">
        <div className="glass-surface inline-flex items-center gap-1 p-1 rounded-full">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                'px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ease-out',
                active === tab.id
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Suspense
        fallback={
          <div className="py-10 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <div key={active} className="animate-fade-in">
          {active === 'ufficio' && isCoordinator && <AgencyDashboard />}
          {active === 'riunioni' && <MeetingsPage />}
          {active === 'analisi' && <ReportAnalysisTab />}
        </div>
      </Suspense>
    </div>
  );
};

export default UfficioPage;
