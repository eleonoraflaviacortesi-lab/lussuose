import { useState } from 'react';
import ReportForm from './ReportForm';
import ReportListTab from './ReportListTab';

const ReportPage = () => {
  const [activeTab, setActiveTab] = useState<'nuovo' | 'storico'>('nuovo');
  const [editDate, setEditDate] = useState<string | null>(null);

  const handleEditReport = (date: string) => {
    setEditDate(date);
    setActiveTab('nuovo');
  };

  return (
    <div>
      {/* Tab pills */}
      <div className="flex items-center justify-center gap-2 px-6 pt-2 pb-4">
        <button
          onClick={() => setActiveTab('nuovo')}
          className={`px-5 py-2 rounded-full text-sm font-medium tracking-wide transition-colors ${
            activeTab === 'nuovo'
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          NUOVO REPORT
        </button>
        <button
          onClick={() => setActiveTab('storico')}
          className={`px-5 py-2 rounded-full text-sm font-medium tracking-wide transition-colors ${
            activeTab === 'storico'
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          I MIEI REPORT
        </button>
      </div>

      {activeTab === 'nuovo' ? (
        <ReportForm initialDate={editDate} onDateUsed={() => setEditDate(null)} />
      ) : (
        <ReportListTab onEditReport={handleEditReport} />
      )}
    </div>
  );
};

export default ReportPage;
