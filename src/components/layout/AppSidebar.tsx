import { useState } from 'react';
import { cn } from '@/lib/utils';
import ProfileModal from '@/components/profile/ProfileModal';
import { LayoutDashboard, Building2, Users, CalendarDays, Settings, Plus, LogOut, ClipboardList, Target } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
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
  { title: 'Obiettivi Agenzia', url: '/sede-targets', icon: Target },
];

interface AppSidebarProps {
  onNewProperty?: () => void;
  onNewContact?: () => void;
  onNewActivity?: () => void;
  onNewDailyReport?: () => void;
}

export function AppSidebar({ onNewProperty, onNewContact, onNewActivity, onNewDailyReport }: AppSidebarProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (url: string) => {
    if (url === '/') return location.pathname === '/';
    return location.pathname.startsWith(url);
  };

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-none">
        <SidebarHeader className="p-2 space-y-2">
          {/* Profile row */}
          {profile && (
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 px-1 py-1 rounded-xl hover:bg-sidebar-accent/60 transition-colors w-full text-left"
            >
              <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm shrink-0">
                {profile.avatar_emoji || '👤'}
              </span>
              <span className="text-[9px] uppercase tracking-[0.15em] font-medium truncate min-w-0">{profile.full_name}</span>
            </button>
          )}

          {/* Add button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="w-full gap-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90 h-8 text-[9px] tracking-[0.15em]"
              >
                <Plus className="h-3 w-3" />
                <span>Aggiungi</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side={isMobile ? "bottom" : "right"} align="start" className="w-48">
              <DropdownMenuItem onClick={() => { onNewProperty?.(); handleNavClick(); }} className="gap-2">
                <Building2 className="h-4 w-4" />
                New Property
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { onNewContact?.(); handleNavClick(); }} className="gap-2">
                <Users className="h-4 w-4" />
                New Contact
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { onNewActivity?.(); handleNavClick(); }} className="gap-2">
                <CalendarDays className="h-4 w-4" />
                New Activity
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { onNewDailyReport?.(); handleNavClick(); }} className="gap-2">
                <ClipboardList className="h-4 w-4" />
                New Daily Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarHeader>

        <SidebarSeparator className="bg-border/30" />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <NavLink
                          to={item.url}
                          end={item.url === '/'}
                          onClick={handleNavClick}
                          className={cn(
                            'transition-colors rounded-lg text-[9px] tracking-[0.15em] uppercase',
                            isMobile ? 'h-10 gap-3' : '',
                            active
                              ? 'bg-foreground text-background font-medium hover:bg-foreground/90 hover:text-background'
                              : 'hover:bg-muted text-muted-foreground font-normal'
                          )}
                          activeClassName=""
                        >
                          <item.icon className={cn(isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
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
                className={cn(
                  'text-muted-foreground hover:text-destructive text-[9px] tracking-[0.15em] uppercase',
                  isMobile && 'h-10 gap-3'
                )}
              >
                <LogOut className={cn(isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <ProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        onOpenSettings={() => {
          setShowProfile(false);
          navigate('/settings');
        }}
      />
    </>
  );
}
