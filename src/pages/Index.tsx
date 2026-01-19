import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import DashboardSede from '@/components/dashboard/DashboardSede';
import MyNumbers from '@/components/dashboard/MyNumbers';
import DataEntry from '@/components/dashboard/DataEntry';
import { useEffect } from 'react';

const IndexContent = () => {
  const [activeTab, setActiveTab] = useState('andamento');
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
        return <MyNumbers />;
      case 'inserisci':
        return <DataEntry />;
      case 'andamento':
      default:
        return <DashboardSede />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container max-w-7xl pb-8">
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
