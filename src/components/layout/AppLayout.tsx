import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useClienti } from '@/hooks/useClienti';
import { useProfiles } from '@/hooks/useProfiles';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import logo from '@/assets/app_logo.svg';
import { AppSidebar } from './AppSidebar';
import { AppBreadcrumbs } from './AppBreadcrumbs';
import { NotificationBell } from './NotificationBell';
import PullToRefresh from '@/components/ui/pull-to-refresh';
import ChatGlobalListener from '@/components/chat/ChatGlobalListener';

// Lazy-load page components
const PersonalDashboard = lazy(() => import('@/components/dashboard/PersonalDashboard'));
const NotiziePage = lazy(() => import('@/components/notizie/NotiziePage'));
const ClientiPage = lazy(() => import('@/components/clienti/ClientiPage'));
const CalendarPage = lazy(() => import('@/components/calendar/CalendarPage'));
const SettingsPage = lazy(() => import('@/components/settings/SettingsPage'));
const OfficeChatPage = lazy(() => import('@/components/chat/OfficeChatPage'));
const UfficioPage = lazy(() => import('@/components/ufficio/UfficioPage'));
const ReportForm = lazy(() => import('@/components/dashboard/ReportForm'));

// Dialog components for "+ New" actions
const AddNotiziaDialog = lazy(() => import('@/components/notizie/AddNotiziaDialog'));
const AddClienteDialog = lazy(() => import('@/components/clienti/AddClienteDialog'));
const AddAppointmentDialog = lazy(() => import('@/components/calendar/AddAppointmentDialog'));

const pathToSection: Record<string, string> = {
  '/': 'dashboard',
  '/properties': 'properties',
  '/contacts': 'contacts',
  '/activities': 'activities',
  '/settings': 'settings',
  '/chat': 'chat',
  '/office': 'office',
  '/inserisci': 'inserisci',
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();

  const [pendingClienteId, setPendingClienteId] = useState<string | null>(null);
  const [showNewProperty, setShowNewProperty] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [showNewActivity, setShowNewActivity] = useState(false);

  const { createCliente } = useClienti();
  const { profiles } = useProfiles();
  const agents = (profiles || []).map(p => ({ user_id: p.user_id, full_name: p.full_name, avatar_emoji: p.avatar_emoji || '👤' }));

  const section = pathToSection[location.pathname] || 'dashboard';

  const handleRefresh = useCallback(async () => {
    const keysToRefresh = ['tasks', 'notizie', 'clienti', 'appointments', 'daily-data', 'kpis', 'weekly-goals', 'notifications'];
    await Promise.all(keysToRefresh.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
    await new Promise(resolve => setTimeout(resolve, 300));
  }, [queryClient]);

  const handleOpenCliente = useCallback((clienteId: string) => {
    setPendingClienteId(clienteId);
    navigate('/contacts');
  }, [navigate]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const renderContent = () => {
    switch (section) {
      case 'dashboard':
        return <PersonalDashboard onGoToCalendar={() => navigate('/activities')} />;
      case 'properties':
        return <NotiziePage />;
      case 'contacts':
        return (
          <ClientiPage
            initialClienteId={pendingClienteId}
            onClienteOpened={() => setPendingClienteId(null)}
          />
        );
      case 'activities':
        return <CalendarPage />;
      case 'settings':
        return <SettingsPage />;
      case 'chat':
        return <OfficeChatPage />;
      case 'office':
        return <UfficioPage />;
      case 'inserisci':
        return <ReportForm />;
      default:
        return <PersonalDashboard />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar
          onNewProperty={() => setShowNewProperty(true)}
          onNewContact={() => setShowNewContact(true)}
          onNewActivity={() => setShowNewActivity(true)}
        />

        <SidebarInset>
          {/* Liquid glass header with logo */}
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 px-4"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.85) 100%)',
              backdropFilter: 'blur(60px) saturate(250%) brightness(1.15)',
              WebkitBackdropFilter: 'blur(60px) saturate(250%) brightness(1.15)',
              boxShadow: '0 4px 20px -4px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,1)',
              borderBottom: '1px solid rgba(255,255,255,0.4)',
            }}
          >
            <SidebarTrigger className="-ml-1" />
            <img
              src={logo}
              alt="Logo"
              className="h-14 -my-3 w-auto cursor-pointer select-none"
              onClick={() => navigate('/')}
            />
            <div className="h-4 w-px bg-border/40 mx-1" />
            <AppBreadcrumbs />
            <div className="ml-auto">
              <NotificationBell onOpenCliente={handleOpenCliente} inline />
            </div>
          </header>

          {/* Main content */}
          <PullToRefresh onRefresh={handleRefresh} className="flex-1 overflow-x-hidden">
            <main className={`mx-auto animate-in fade-in duration-150 ${section === 'contacts' ? 'max-w-full px-2 lg:px-4' : 'max-w-5xl px-4 lg:px-8'} py-6`}>
              <Suspense
                fallback={
                  <div className="py-10 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                  </div>
                }
              >
                <div key={section} className="animate-fade-in">
                  {renderContent()}
                </div>
              </Suspense>
            </main>
          </PullToRefresh>
        </SidebarInset>

        {/* Global chat listener */}
        <ChatGlobalListener
          activeTab={section}
          onGoToChat={() => navigate('/chat')}
        />

        {/* "+ New" dialogs */}
        <Suspense fallback={null}>
          {showNewProperty && (
            <AddNotiziaDialog
              open={showNewProperty}
              onOpenChange={setShowNewProperty}
            />
          )}
          {showNewContact && (
            <AddClienteDialog
              open={showNewContact}
              onOpenChange={setShowNewContact}
              onAdd={async (c) => { await createCliente(c); setShowNewContact(false); }}
              agents={agents}
            />
          )}
          {showNewActivity && (
            <AddAppointmentDialog
              open={showNewActivity}
              onOpenChange={setShowNewActivity}
            />
          )}
        </Suspense>
      </div>
    </SidebarProvider>
  );
}
