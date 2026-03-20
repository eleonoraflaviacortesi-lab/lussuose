import { cn } from '@/lib/utils';
import { LayoutDashboard, Building2, Users, CalendarDays, Settings, Plus, LogOut, ClipboardList, Target, User } from 'lucide-react';
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
  { title: 'Ciclo Produttivo', url: '/inserisci', icon: ClipboardList },
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
          {/* Mobile: profile + name + add button */}
          {isMobile && profile && (
            <div className="flex items-start gap-2 px-1 py-1">
              <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm shrink-0 mt-0.5">
                {profile.avatar_emoji || '👤'}
              </span>
              <span className="!uppercase !tracking-[0.18em] !text-[10px] min-w-0 break-words leading-relaxed" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>{profile.full_name}</span>
            </div>
          )}

          {/* Desktop collapsed: just emoji */}
          {!isMobile && collapsed && profile && (
            <div className="w-full flex justify-center py-1">
              <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-base">
                {profile.avatar_emoji || '👤'}
              </span>
            </div>
          )}

          {/* Desktop expanded: emoji + name */}
          {!isMobile && !collapsed && profile && (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-base shrink-0">
                {profile.avatar_emoji || '👤'}
              </span>
              <div className="min-w-0">
                <p className="!uppercase !tracking-[0.15em] !text-[10px] font-medium break-words leading-tight" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>{profile.full_name}</p>
                <p className="!uppercase !tracking-[0.12em] !text-[9px] text-muted-foreground truncate mt-0.5" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>{profile.sede}</p>
              </div>
            </div>
          )}

          {/* Mobile: pill add button */}
          {isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full gap-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90 h-8">
                  <Plus className="h-3 w-3" />
                  <span className="!uppercase !tracking-[0.15em] !text-[9px]" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Aggiungi</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start" className="w-48">
                <DropdownMenuItem onClick={() => { onNewProperty?.(); handleNavClick(); }} className="gap-2">
                  <Building2 className="h-4 w-4" /> New Property
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onNewContact?.(); handleNavClick(); }} className="gap-2">
                  <Users className="h-4 w-4" /> New Contact
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onNewActivity?.(); handleNavClick(); }} className="gap-2">
                  <CalendarDays className="h-4 w-4" /> New Activity
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onNewDailyReport?.(); handleNavClick(); }} className="gap-2">
                  <ClipboardList className="h-4 w-4" /> New Daily Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Desktop: original + New button */}
          {!isMobile && (
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {collapsed ? (
                    <Button size="icon" className="h-10 w-10 rounded-full bg-foreground text-background hover:bg-foreground/90">
                      <Plus className="h-5 w-5" />
                    </Button>
                  ) : (
                    <Button className="w-full gap-2 rounded-full bg-foreground text-background hover:bg-foreground/90 h-11">
                      <Plus className="h-4 w-4" />
                      <span className="!uppercase !tracking-[0.15em] text-xs font-semibold" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>New</span>
                    </Button>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-48">
                  <DropdownMenuItem onClick={onNewProperty} className="gap-2">
                    <Building2 className="h-4 w-4" /> New Property
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onNewContact} className="gap-2">
                    <Users className="h-4 w-4" /> New Contact
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onNewActivity} className="gap-2">
                    <CalendarDays className="h-4 w-4" /> New Activity
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onNewDailyReport} className="gap-2">
                    <ClipboardList className="h-4 w-4" /> New Daily Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </SidebarHeader>

        <SidebarSeparator className="bg-border/30" />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className={collapsed && !isMobile ? 'items-center' : ''}>
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
                            'transition-colors rounded-lg',
                            isMobile ? 'h-10 gap-3' : '',
                            active
                              ? 'bg-foreground text-background font-medium hover:bg-foreground/90 hover:text-background'
                              : 'hover:bg-muted text-muted-foreground font-normal'
                          )}
                          activeClassName=""
                        >
                          <item.icon className={cn(isMobile ? 'h-4 w-4' : 'h-4 w-4')} />
                          {isMobile ? (
                            <span className="!uppercase !tracking-[0.18em] !text-[10px]" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>{item.title}</span>
                          ) : (
                            <span className="!uppercase !tracking-[0.15em] !text-[10px]" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>{item.title}</span>
                          )}
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
            {/* Profile link */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive('/profile')}
                tooltip="Profilo"
                className={cn(isMobile && 'h-10 gap-3')}
              >
                <NavLink
                  to="/profile"
                  onClick={handleNavClick}
                  className={cn(
                    'transition-colors rounded-lg',
                    isActive('/profile')
                      ? 'bg-foreground text-background font-medium hover:bg-foreground/90 hover:text-background'
                      : 'hover:bg-muted text-muted-foreground font-normal'
                  )}
                  activeClassName=""
                >
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs shrink-0">
                    {profile?.avatar_emoji || '👤'}
                  </span>
                  <span className="!uppercase !tracking-[0.15em] !text-[10px]" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Profilo</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Sign out */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSignOut}
                tooltip="Sign out"
                className={cn(
                  'text-muted-foreground hover:text-destructive',
                  isMobile && 'h-10 gap-3'
                )}
              >
                <LogOut className="h-4 w-4" />
                <span className="!uppercase !tracking-[0.15em] !text-[10px]" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
