import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';

// Lazy-load tabs to make first paint instant and avoid loading heavy widgets until needed
const PersonalDashboard = lazy(() => import('@/components/dashboard/PersonalDashboard'));
const NotiziePage = lazy(() => import('@/components/notizie/NotiziePage'));
const ReportForm = lazy(() => import('@/components/dashboard/ReportForm'));
const ReportAnalysisTab = lazy(() => import('@/components/dashboard/ReportAnalysisTab'));
const AgencyDashboard = lazy(() => import('@/components/dashboard/AgencyDashboard'));
const SettingsPage = lazy(() => import('@/components/settings/SettingsPage'));

const IndexContent = () => {
  const [activeTab, setActiveTab] = useState('numeri');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
        return <PersonalDashboard />;
      case 'notizie':
        return <NotiziePage />;
      case 'inserisci':
        return <ReportForm />;
      case 'analisi':
        return <ReportAnalysisTab />;
      case 'agenzia':
        return <AgencyDashboard />;
      case 'impostazioni':
        return <SettingsPage />;
      default:
        return <PersonalDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="h-[100px]" />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-3xl lg:max-w-7xl mx-auto px-3 lg:px-6 animate-in fade-in duration-150">
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
    </div>
  );
};

export default IndexContent;
