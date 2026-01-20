import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
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
    <div className="min-h-screen bg-background">
      <Header />
      {/* Spacer for fixed header */}
      <div className="h-[120px]" />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-3xl mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <IndexContent />
    </AuthProvider>
  );
};

export default Index;
