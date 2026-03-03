import { useState, useCallback, useRef } from 'react';
import ProfileModal from '@/components/profile/ProfileModal';
import { LayoutDashboard, Building2, Users, CalendarDays, Settings, Plus, LogOut, ClipboardList } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { triggerArcaneFog } from '@/lib/arcaneFog';
import { triggerHaptic } from '@/lib/haptics';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/app_logo.svg';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Notizie', url: '/properties', icon: Building2 },
  { title: 'Buyers', url: '/contacts', icon: Users },
  { title: 'Calendar', url: '/activities', icon: CalendarDays },
  { title: 'Settings', url: '/settings', icon: Settings },
];

interface AppSidebarProps {
  onNewProperty?: () => void;
  onNewContact?: () => void;
  onNewActivity?: () => void;
  onNewDailyReport?: () => void;
}

export function AppSidebar({ onNewProperty, onNewContact, onNewActivity, onNewDailyReport }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (url: string) => {
    if (url === '/') return location.pathname === '/';
    return location.pathname.startsWith(url);
  };

  return (
    <>
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-3">
        {/* Profile avatar - clickable to open profile modal */}
        {!collapsed && profile && (
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 px-1 py-1 rounded-xl hover:bg-sidebar-accent/60 transition-colors w-full text-left"
          >
            <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-base shrink-0">
              {profile.avatar_emoji || '👤'}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.sede}</p>
            </div>
          </button>
        )}
        {collapsed && profile && (
          <button
            onClick={() => setShowProfile(true)}
            className="flex justify-center w-full rounded-lg hover:bg-sidebar-accent/60 transition-colors py-1"
          >
            <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm">
              {profile.avatar_emoji || '👤'}
            </span>
          </button>
        )}
      </SidebarHeader>

      <SidebarSeparator className="bg-white/30" />

      {/* + New button */}
      <div className="px-2 pt-3 pb-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size={collapsed ? 'icon' : 'default'}
              className="w-full gap-2 rounded-lg bg-foreground text-background hover:bg-foreground/90"
            >
              <Plus className="h-4 w-4" />
              {!collapsed && <span className="text-xs font-semibold tracking-wide uppercase">New</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-48">
            <DropdownMenuItem onClick={onNewProperty} className="gap-2">
              <Building2 className="h-4 w-4" />
              New Property
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewContact} className="gap-2">
              <Users className="h-4 w-4" />
              New Contact
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewActivity} className="gap-2">
              <CalendarDays className="h-4 w-4" />
              New Activity
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewDailyReport} className="gap-2">
              <ClipboardList className="h-4 w-4" />
              New Daily Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-sidebar-accent/60"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sign out"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>

      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} onOpenSettings={() => { setShowProfile(false); navigate('/settings'); }} />
    </>
  );
}
