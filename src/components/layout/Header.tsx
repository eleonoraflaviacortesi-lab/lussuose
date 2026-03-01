import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Menu, X, House, CalendarDays, Send, Briefcase, Building2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKPIs } from '@/hooks/useKPIs';
import { useSedeTargets } from '@/hooks/useSedeTargets';
import { useBannerSettings } from '@/hooks/useBannerSettings';
import logo from '@/assets/app_logo.svg';
import ProfileModal from '@/components/profile/ProfileModal';
import { triggerArcaneFog } from '@/lib/arcaneFog';
import { triggerHaptic } from '@/lib/haptics';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/layout/NotificationBell';

interface HeaderProps {
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenCliente?: (clienteId: string) => void;
}

const tabToPath: Record<string, string> = {
  numeri: '/',
  calendario: '/calendario',
  notizie: '/notizie',
  clienti: '/clienti',
  chat: '/chat',
  ufficio: '/ufficio',
};

const menuItems = [
  { id: 'numeri', icon: House, label: 'Home' },
  { id: 'calendario', icon: CalendarDays, label: 'Calendario' },
  { id: 'notizie', icon: Send, label: 'Notizie' },
  { id: 'clienti', icon: Briefcase, label: 'Buyers' },
  { id: 'chat', icon: MessageCircle, label: 'Chat' },
  { id: 'ufficio', icon: Building2, label: 'Ufficio' },
];

const Header = ({ onOpenProfile, onOpenSettings, activeTab, onTabChange, onOpenCliente }: HeaderProps) => {
  const { signOut, profile } = useAuth();
  const { kpis } = useKPIs('year');
  const { targets } = useSedeTargets();
  const { settings: bannerSettings } = useBannerSettings();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoWiggle, setLogoWiggle] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const playTrillo = useCallback(() => {
    try {
      const audio = new Audio('/sounds/trillo_msn.mp3');
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    const channel = supabase.channel('arcane-fog-broadcast')
      .on('broadcast', { event: 'arcane-fog' }, () => {
        triggerArcaneFog();
        playTrillo();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [playTrillo]);

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
      // Single tap → go home
      tapTimerRef.current = setTimeout(() => {
        if (tapCountRef.current === 1) {
          triggerHaptic('selection');
          onTabChange?.('numeri');
          navigate('/');
        }
        tapCountRef.current = 0;
      }, 400);
    } else {
      tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 600);
    }
  }, [onTabChange, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleNavigate = (tabId: string) => {
    triggerHaptic('selection');
    onTabChange?.(tabId);
    navigate(tabToPath[tabId] || '/');
    setMenuOpen(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'decimal', minimumFractionDigits: 0 }).format(value);
  };

  const target = targets.fatturato_target || 500000;
  const current = kpis?.fatturato?.value || 0;
  const remaining = Math.max(0, target - current);
  const fatturatoCredito = kpis?.fatturatoCredito?.value || 0;

  const interpolateBannerText = (template: string) => {
    return template
      .replace(/\{remaining\}/g, formatCurrency(remaining))
      .replace(/\{target\}/g, formatCurrency(target))
      .replace(/\{fatturatoCredito\}/g, formatCurrency(fatturatoCredito));
  };

  const bannerTexts = [bannerSettings.text1, bannerSettings.text2, bannerSettings.text3, bannerSettings.text4]
    .filter(Boolean)
    .map(interpolateBannerText);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[60]">
        <div className="absolute inset-x-0 top-0 h-[env(safe-area-inset-top)]" style={{ backgroundColor: bannerSettings.bgColor }} />
        <div className="pt-[env(safe-area-inset-top)] pb-2 overflow-hidden" style={{ backgroundColor: bannerSettings.bgColor, color: bannerSettings.textColor }}>
          <div
            className="flex animate-ticker whitespace-nowrap pt-2"
            style={{ animationDuration: `${bannerSettings.speed}s` }}
          >
            {[...Array(3)].map((_, i) => (
              <span key={i} className="flex items-center gap-6 mx-6 text-sm font-bold tracking-[0.15em] uppercase">
                {bannerTexts.map((text, j) => (
                  <span key={j} className="flex items-center gap-6">
                    <span>{text}</span>
                    <span>★</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
        <div className="glass-header flex items-center px-4 py-1 rounded-b-[2rem]">
          <div className="flex-1 flex justify-start">
            <button 
              onClick={() => { triggerHaptic('selection'); setMenuOpen(true); }}
              className="flex items-center justify-center hover:scale-105 transition-transform"
              aria-label="Apri menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <img 
            src={logo} 
            alt="Logo" 
            className={`h-[5.5rem] w-auto max-w-[60vw] -my-4 cursor-pointer select-none transition-all duration-75 ${logoWiggle ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}
            onClick={handleLogoTap}
          />
          <div className="flex-1 flex justify-end">
            <NotificationBell onOpenCliente={onOpenCliente} inline />
          </div>
        </div>
        
      </header>

      {/* Slide-in menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[70]" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-background shadow-2xl animate-in slide-in-from-left duration-200 flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile */}
            <button
              onClick={() => { setMenuOpen(false); setShowProfile(true); }}
              className="mx-3 mb-2 flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-muted/60 transition-colors"
            >
              <span className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
                {profile?.avatar_emoji || '🖤'}
              </span>
              <div className="text-left">
                <p className="font-semibold text-sm">{profile?.full_name || 'Profilo'}</p>
                <p className="text-xs text-muted-foreground">Profilo ed Impostazioni</p>
              </div>
            </button>

            <div className="border-t mx-4 my-1" />

            {/* Nav items */}
            <div className="flex-1 px-3 py-2 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all text-sm font-medium",
                      isActive
                        ? "bg-foreground text-background"
                        : "text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Sign out at bottom */}
            <div className="border-t mx-4" />
            <button
              onClick={() => { setMenuOpen(false); handleSignOut(); }}
              className="mx-3 my-3 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Esci
            </button>
          </div>
        </div>
      )}

      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} onOpenSettings={onOpenSettings} />
    </>
  );
};

export default Header;
