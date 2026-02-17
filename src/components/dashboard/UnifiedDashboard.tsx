import { useState, lazy, Suspense } from 'react';
import { User, TrendingUp, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import type { Notizia } from '@/hooks/useNotizie';

const PersonalDashboard = lazy(() => import('./PersonalDashboard'));
const ReportAnalysisTab = lazy(() => import('./ReportAnalysisTab'));
const AgencyDashboard = lazy(() => import('./AgencyDashboard'));

type Tab = 'personal' | 'report' | 'agency';

type UnifiedDashboardProps = {
  onGoToCalendar?: () => void;
  onOpenNotizia?: (notizia: Notizia) => void;
};

const tabs: { id: Tab; icon: typeof User; label: string }[] = [
  { id: 'personal', icon: User, label: 'Personale' },
  { id: 'report', icon: TrendingUp, label: 'Report' },
  { id: 'agency', icon: Building2, label: 'Ufficio' },
];

const UnifiedDashboard = ({ onGoToCalendar, onOpenNotizia }: UnifiedDashboardProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('personal');

  const handleTabChange = (tab: Tab) => {
    triggerHaptic('selection');
    setActiveTab(tab);
  };

  return (
    <div className="animate-fade-in">
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
                  ? 'bg-card text-foreground shadow-md'
                  : 'text-muted-foreground active:scale-95'
              )}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,1)',
              } : undefined}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.5} />
              <span className="hidden sm:inline">{tab.label}</span>
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
          {activeTab === 'personal' && (
            <PersonalDashboard onGoToCalendar={onGoToCalendar} onOpenNotizia={onOpenNotizia} />
          )}
          {activeTab === 'report' && <ReportAnalysisTab />}
          {activeTab === 'agency' && <AgencyDashboard />}
        </div>
      </Suspense>
    </div>
  );
};

export default UnifiedDashboard;
