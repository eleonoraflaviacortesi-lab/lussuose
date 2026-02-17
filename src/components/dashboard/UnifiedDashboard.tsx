import { useState, lazy, Suspense } from 'react';
import { Building2, UsersRound, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';

const AgencyDashboard = lazy(() => import('./AgencyDashboard'));
const ReportAnalysisTab = lazy(() => import('./ReportAnalysisTab'));
const MeetingsPage = lazy(() => import('@/components/meetings/MeetingsPage').then(m => ({ default: m.MeetingsPage })));

type Tab = 'agency' | 'meetings' | 'report';

const tabs: { id: Tab; icon: typeof Building2; label: string }[] = [
  { id: 'agency', icon: Building2, label: 'Ufficio' },
  { id: 'meetings', icon: UsersRound, label: 'Riunioni' },
  { id: 'report', icon: TrendingUp, label: 'Analisi' },
];

const UnifiedDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('agency');

  const handleTabChange = (tab: Tab) => {
    triggerHaptic('selection');
    setActiveTab(tab);
  };

  return (
    <div className="animate-slide-up-spring">
      {/* Tab Selector - Pill style */}
      <div className="flex items-center justify-center gap-1 p-1 mx-4 mb-4 bg-muted/50 rounded-full backdrop-blur-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-medium tracking-[0.1em] uppercase transition-all duration-200',
                isActive
                  ? 'text-foreground shadow-md'
                  : 'text-muted-foreground active:scale-95'
              )}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,1)',
              } : undefined}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.5} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <Suspense
        fallback={
          <div className="py-10 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <div key={activeTab} className="animate-fade-in">
          {activeTab === 'agency' && <AgencyDashboard />}
          {activeTab === 'meetings' && <MeetingsPage />}
          {activeTab === 'report' && <ReportAnalysisTab />}
        </div>
      </Suspense>
    </div>
  );
};

export default UnifiedDashboard;
