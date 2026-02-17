import { useState } from 'react';
import { lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';
import { UsersRound, TrendingUp, Building2 } from 'lucide-react';

const MeetingsPage = lazy(() => import('@/components/meetings/MeetingsPage').then(m => ({ default: m.MeetingsPage })));
const ReportAnalysisTab = lazy(() => import('@/components/dashboard/ReportAnalysisTab'));
const AgencyDashboard = lazy(() => import('@/components/dashboard/AgencyDashboard'));

const TABS = [
  { id: 'riunioni', label: 'Riunioni', icon: UsersRound },
  { id: 'report', label: 'Report', icon: TrendingUp },
  { id: 'agenzia', label: 'Agenzia', icon: Building2 },
] as const;

type TabId = typeof TABS[number]['id'];

interface UfficioPageProps {
  initialTab?: string;
}

const UfficioPage = ({ initialTab }: UfficioPageProps) => {
  const [activeTab, setActiveTab] = useState<TabId>(
    (initialTab === 'report' || initialTab === 'agenzia' || initialTab === 'riunioni') 
      ? initialTab 
      : 'riunioni'
  );

  const handleTabChange = (tab: TabId) => {
    triggerHaptic('selection');
    setActiveTab(tab);
  };

  return (
    <div>
      {/* Tab Switcher */}
      <div className="flex gap-1.5 mb-4 bg-muted/50 rounded-2xl p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all',
                isActive
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <Suspense
        fallback={
          <div className="py-10 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        {activeTab === 'riunioni' && <MeetingsPage />}
        {activeTab === 'report' && <ReportAnalysisTab />}
        {activeTab === 'agenzia' && <AgencyDashboard />}
      </Suspense>
    </div>
  );
};

export default UfficioPage;
