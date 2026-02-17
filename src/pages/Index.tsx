import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import PullToRefresh from '@/components/ui/pull-to-refresh';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { FloatingSparkles } from '@/components/ui/floating-sparkles';
import { MagicCursor } from '@/components/ui/magic-cursor';
import NotiziaDetail from '@/components/notizie/NotiziaDetail';
import type { Notizia } from '@/hooks/useNotizie';

// Lazy-load tabs to make first paint instant and avoid loading heavy widgets until needed
const PersonalDashboard = lazy(() => import('@/components/dashboard/PersonalDashboard'));
const UnifiedDashboard = lazy(() => import('@/components/dashboard/UnifiedDashboard'));
const NotiziePage = lazy(() => import('@/components/notizie/NotiziePage'));

const SettingsPage = lazy(() => import('@/components/settings/SettingsPage'));
const ClientiPage = lazy(() => import('@/components/clienti/ClientiPage'));
const CalendarPage = lazy(() => import('@/components/calendar/CalendarPage'));
const ReportForm = lazy(() => import('@/components/dashboard/ReportForm'));

// Map URL paths to tab ids
const pathToTab: Record<string, string> = {
  '/': 'numeri',
  '/calendario': 'calendario',
  '/notizie': 'notizie',
  '/clienti': 'clienti',
  '/ufficio': 'ufficio',
  '/riunioni': 'ufficio',
  '/report': 'ufficio',
  '/agenzia': 'ufficio',
  '/impostazioni': 'impostazioni',
  '/inserisci': 'inserisci',
};

type IndexContentProps = {
  initialTab?: string;
};

const IndexContent = ({ initialTab }: IndexContentProps) => {
  const location = useLocation();
  // Derive initial tab from URL path, falling back to initialTab prop or 'numeri'
  const getTabFromPath = () => pathToTab[location.pathname] || initialTab || 'numeri';
  const [activeTab, setActiveTab] = useState(getTabFromPath);
  const [pendingClienteId, setPendingClienteId] = useState<string | null>(null);
  const [selectedNotizia, setSelectedNotizia] = useState<Notizia | null>(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Keep tab state in sync with URL changes (e.g. deep links, navigate('/inserisci'), back/forward)
  useEffect(() => {
    const tabFromPath = pathToTab[location.pathname];
    if (tabFromPath && tabFromPath !== activeTab) {
      setActiveTab(tabFromPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleRefresh = useCallback(async () => {
    // Invalidate only frequently-changing queries (not profiles, columns, settings)
    const keysToRefresh = ['tasks', 'notizie', 'clienti', 'appointments', 'daily-data', 'kpis', 'weekly-goals', 'notifications'];
    await Promise.all(keysToRefresh.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
    await new Promise(resolve => setTimeout(resolve, 300));
  }, [queryClient]);

  const handleOpenCliente = useCallback((clienteId: string) => {
    // Navigate to clienti tab and set pending cliente to open
    setPendingClienteId(clienteId);
    setActiveTab('clienti');
  }, []);

  const handleOpenNotiziaFromReminder = useCallback((notizia: Notizia) => {
    // Go to calendar tab and open the requested notizia
    setActiveTab('calendario');
    setSelectedNotizia(notizia);
  }, []);

  // Clear pending cliente when leaving clienti tab
  useEffect(() => {
    if (activeTab !== 'clienti') {
      setPendingClienteId(null);
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'numeri':
        return (
          <PersonalDashboard
            onGoToCalendar={() => setActiveTab('calendario')}
            onOpenNotizia={handleOpenNotiziaFromReminder}
          />
        );
      case 'notizie':
        return <NotiziePage />;
      case 'clienti':
        return <ClientiPage initialClienteId={pendingClienteId} onClienteOpened={() => setPendingClienteId(null)} />;
      case 'calendario':
        return <CalendarPage />;
      case 'ufficio':
        return <UnifiedDashboard />;
      case 'inserisci':
        return <ReportForm />;
      case 'impostazioni':
        return <SettingsPage />;
      default:
        return <PersonalDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Ambient magic effects */}
      <FloatingSparkles />
      <MagicCursor />
      {/* Fixed elements - not affected by pull-to-refresh */}
      <Header />
      <div style={{ height: 'calc(175px + env(safe-area-inset-top, 0px))' }} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main content with pull-to-refresh */}
      <PullToRefresh 
        onRefresh={handleRefresh}
        className="overflow-x-hidden"
      >
        <main className={`mx-auto animate-in fade-in duration-150 overflow-x-hidden ${activeTab === 'clienti' ? 'max-w-full px-2 lg:px-4' : 'max-w-3xl lg:max-w-7xl px-3 lg:px-6'}`}>
          <Suspense
            fallback={
              <div className="py-10 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <div key={activeTab} className="animate-fade-in">
              {renderContent()}
            </div>
          </Suspense>
        </main>
      </PullToRefresh>
      
      {/* Fixed Notification Bell */}
      <NotificationBell onOpenCliente={handleOpenCliente} />

      {/* Global Notizia Detail Modal (can be opened from any tab) */}
      <NotiziaDetail
        notizia={selectedNotizia}
        open={!!selectedNotizia}
        onOpenChange={(open) => !open && setSelectedNotizia(null)}
      />
    </div>
  );
};

export default IndexContent;
