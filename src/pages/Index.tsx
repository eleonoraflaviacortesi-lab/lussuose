import { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import PullToRefresh from '@/components/ui/pull-to-refresh';
import { NotificationBell } from '@/components/layout/NotificationBell';
import NotiziaDetail from '@/components/notizie/NotiziaDetail';
import type { Notizia } from '@/hooks/useNotizie';

// Lazy-load tabs to make first paint instant and avoid loading heavy widgets until needed
const PersonalDashboard = lazy(() => import('@/components/dashboard/PersonalDashboard'));
const NotiziePage = lazy(() => import('@/components/notizie/NotiziePage'));
const ReportForm = lazy(() => import('@/components/dashboard/ReportForm'));
const ReportAnalysisTab = lazy(() => import('@/components/dashboard/ReportAnalysisTab'));
const AgencyDashboard = lazy(() => import('@/components/dashboard/AgencyDashboard'));
const SettingsPage = lazy(() => import('@/components/settings/SettingsPage'));
const ClientiPage = lazy(() => import('@/components/clienti/ClientiPage'));
const CalendarPage = lazy(() => import('@/components/calendar/CalendarPage'));

type IndexContentProps = {
  initialTab?: string;
};

const IndexContent = ({ initialTab }: IndexContentProps) => {
  const [activeTab, setActiveTab] = useState(initialTab ?? 'numeri');
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

  const handleRefresh = useCallback(async () => {
    // Invalidate all queries to refetch fresh data
    await queryClient.invalidateQueries();
    // Small delay for visual feedback
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
      case 'inserisci':
        return <ReportForm />;
      case 'analisi':
        return <ReportAnalysisTab />;
      case 'agenzia':
        return <AgencyDashboard />;
      case 'clienti':
        return <ClientiPage initialClienteId={pendingClienteId} onClienteOpened={() => setPendingClienteId(null)} />;
      case 'calendario':
        return <CalendarPage />;
      case 'impostazioni':
        return <SettingsPage />;
      default:
        return <PersonalDashboard />;
    }
  };

  return (
    <PullToRefresh 
      onRefresh={handleRefresh}
      className="min-h-screen bg-background overflow-x-hidden"
    >
      <Header />
      <div className="h-[120px]" />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-3xl lg:max-w-7xl mx-auto px-3 lg:px-6 animate-in fade-in duration-150 overflow-x-hidden">
        <Suspense
          fallback={
            <div className="py-10 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          {renderContent()}
        </Suspense>
      </main>
      
      {/* Fixed Notification Bell */}
      <NotificationBell onOpenCliente={handleOpenCliente} />

      {/* Global Notizia Detail Modal (can be opened from any tab) */}
      <NotiziaDetail
        notizia={selectedNotizia}
        open={!!selectedNotizia}
        onOpenChange={(open) => !open && setSelectedNotizia(null)}
      />
    </PullToRefresh>
  );
};

export default IndexContent;
