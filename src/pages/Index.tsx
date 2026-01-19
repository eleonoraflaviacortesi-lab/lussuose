import { useState } from 'react';
import { UserProvider } from '@/context/UserContext';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import DashboardSede from '@/components/dashboard/DashboardSede';
import MyNumbers from '@/components/dashboard/MyNumbers';
import DataEntry from '@/components/dashboard/DataEntry';

const Index = () => {
  const [activeTab, setActiveTab] = useState('andamento');

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
    <UserProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="container max-w-7xl">
          {renderContent()}
        </main>
      </div>
    </UserProvider>
  );
};

export default Index;
