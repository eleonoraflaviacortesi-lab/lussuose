import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useClienti } from '@/hooks/useClienti';
import { useProfiles } from '@/hooks/useProfiles';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import logo from '@/assets/app_logo.svg';
import { AppSidebar } from './AppSidebar';
import { AppBreadcrumbs } from './AppBreadcrumbs';
import { NotificationBell } from './NotificationBell';
import PullToRefresh from '@/components/ui/pull-to-refresh';
import ChatGlobalListener from '@/components/chat/ChatGlobalListener';
import { triggerArcaneFog } from '@/lib/arcaneFog';
import AnnouncementBanner from './AnnouncementBanner';
import { triggerHaptic } from '@/lib/haptics';
import { supabase } from '@/integrations/supabase/client';

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

function FixedHeader({ onOpenCliente }: { onOpenCliente: (id: string) => void }) {
  const { state, isMobile } = useSidebar();
  const sidebarLeft = isMobile ? '0px' : state === 'expanded' ? '18rem' : '3.5rem';
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  return (
    <header
      className="fixed z-30 flex h-14 items-center gap-2 px-4 right-0 transition-[left] duration-200 ease-linear overflow-visible"
      style={{
        left: sidebarLeft,
        top: 'var(--banner-height, 28px)',
        backgroundColor: 'white',
        borderBottomRightRadius: '1.5rem',
      }}
    >
      {/* Left: sidebar trigger + notifications */}
      <div className="flex items-center gap-1 shrink-0">
        <SidebarTrigger className="-ml-1 md:flex hidden" />
        <NotificationBell onOpenCliente={onOpenCliente} inline />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Expandable search */}
      <div className="flex items-center shrink-0">
        {!searchOpen && (
          <button
            onClick={() => setSearchOpen(true)}
            className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center hover:bg-foreground/85 transition-colors"
          >
            <Search className="h-3.5 w-3.5 text-background" />
          </button>
        )}
        <div
          className={`flex items-center overflow-hidden transition-all duration-300 ease-out ${
            searchOpen ? 'w-56 opacity-100' : 'w-0 opacity-0'
          }`}
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => { if (!search) setSearchOpen(false); }}
              placeholder="Cerca..."
              className="w-full h-8 rounded-full bg-muted/60 pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring/30 transition-all"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();

  const [pendingClienteId, setPendingClienteId] = useState<string | null>(null);
  const [showNewProperty, setShowNewProperty] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [logoWiggle, setLogoWiggle] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const { createCliente } = useClienti();
  const { profiles } = useProfiles();
  const agents = (profiles || []).map(p => ({ user_id: p.user_id, full_name: p.full_name, avatar_emoji: p.avatar_emoji || '👤' }));

  const section = pathToSection[location.pathname] || 'dashboard';

  const handleRefresh = useCallback(async () => {
    const keysToRefresh = ['tasks', 'notizie', 'clienti', 'appointments', 'daily-data', 'kpis', 'weekly-goals', 'notifications'];
    await Promise.all(keysToRefresh.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
    await new Promise(resolve => setTimeout(resolve, 300));
  }, [queryClient]);

  const playTrillo = useCallback(() => {
    try {
      const audio = new Audio('/sounds/trillo_msn.mp3');
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  const handleLogoTap = useCallback(() => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    setLogoWiggle(true);
    setTimeout(() => setLogoWiggle(false), 400);
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      triggerHaptic('success');
      triggerArcaneFog();
      playTrillo();
      supabase.channel('arcane-fog-broadcast').send({ type: 'broadcast', event: 'arcane-fog', payload: {} });
    } else if (tapCountRef.current === 1) {
      tapTimerRef.current = setTimeout(() => {
        if (tapCountRef.current === 1) {
          triggerHaptic('selection');
          navigate('/');
        }
        tapCountRef.current = 0;
      }, 400);
    } else {
      tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 600);
    }
  }, [navigate, playTrillo]);

  // Listen for arcane-fog broadcast from other clients
  useEffect(() => {
    const channel = supabase.channel('arcane-fog-broadcast')
      .on('broadcast', { event: 'arcane-fog' }, () => {
        triggerArcaneFog();
        playTrillo();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [playTrillo]);

  const handleOpenCliente = useCallback((clienteId: string) => {
    setPendingClienteId(clienteId);
    navigate('/contacts');
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

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
    <SidebarProvider defaultOpen={false}>
      <AnnouncementBanner />
      <div className="min-h-screen flex w-full pt-[var(--banner-height,28px)]">
        <AppSidebar
          onNewProperty={() => setShowNewProperty(true)}
          onNewContact={() => setShowNewContact(true)}
          onNewActivity={() => setShowNewActivity(true)}
          onNewDailyReport={() => navigate('/inserisci')}
        />

        <SidebarInset>
          <FixedHeader onOpenCliente={handleOpenCliente} />
          {/* Spacer for fixed header */}
          <div className="h-14 shrink-0" />

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
