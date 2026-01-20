import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import PersonalDashboard from '@/components/dashboard/PersonalDashboard';
import ReportForm from '@/components/dashboard/ReportForm';
import AgencyDashboard from '@/components/dashboard/AgencyDashboard';
import SettingsPage from '@/components/settings/SettingsPage';

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
      case 'inserisci':
        return <ReportForm />;
      case 'agenzia':
        return <AgencyDashboard />;
      case 'impostazioni':
        return <SettingsPage />;
      default:
        return <PersonalDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Header />
      {/* Spacer che considera safe-area-inset-top + altezza header */}
      <div className="h-[120px]" style={{ marginTop: 'env(safe-area-inset-top)' }} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-3xl mx-auto animate-in fade-in duration-150 px-4">
        {renderContent()}
      </main>
    </div>
  );
};

export default IndexContent;
