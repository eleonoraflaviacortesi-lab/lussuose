

## Plan: Restructure Navigation with Left Sidebar

### Current State
- Navigation uses a hamburger menu in the header (slide-in drawer) + a floating right-side quick-nav on desktop
- All pages are tab-based, rendered via `activeTab` state in `Index.tsx`
- The shadcn `Sidebar` component already exists in `src/components/ui/sidebar.tsx`
- Breadcrumb component already exists in `src/components/ui/breadcrumb.tsx`

### Implementation Steps

#### 1. Create AppSidebar component
**New file**: `src/components/layout/AppSidebar.tsx`
- 5 nav items: Dashboard, Properties, Contacts, Activities, Settings
- Icons: LayoutDashboard, Building2, Users, CalendarDays, Settings
- Use shadcn `Sidebar` with `collapsible="icon"` (mini mode on collapse)
- Logo at top in `SidebarHeader`
- Profile avatar + sign-out in `SidebarFooter`
- Persistent "+ New" dropdown button using `DropdownMenu` with 3 options: New Property, New Contact, New Activity
- Active state highlighting via `useLocation`

#### 2. Create Breadcrumbs component
**New file**: `src/components/layout/AppBreadcrumbs.tsx`
- Uses existing `breadcrumb.tsx` UI components
- Reads current route + any detail context (property name, contact name) from a React context or props
- Shows: Section > Detail Name when on a detail view

#### 3. Create new layout wrapper
**New file**: `src/components/layout/AppLayout.tsx`
- Wraps `SidebarProvider` + `AppSidebar` + `SidebarInset` with header containing `SidebarTrigger` + breadcrumbs + notification bell
- Replaces the old `Header` + `DesktopQuickNav` combo
- Contains the main content area with `PullToRefresh`

#### 4. Update routing in App.tsx
- Update routes to use cleaner paths: `/`, `/properties`, `/contacts`, `/activities`, `/settings`
- Keep old paths as redirects temporarily

#### 5. Refactor Index.tsx
- Remove old `Header` import and `DesktopQuickNav`
- Remove `FloatingSparkles` and `MagicCursor` (not premium/calm)
- Wrap content in new `AppLayout`
- Derive active section from URL path instead of `activeTab` state
- Map sections: Dashboard → `PersonalDashboard`, Properties → `NotiziePage`, Contacts → `ClientiPage`, Activities → `CalendarPage`, Settings → `SettingsPage`

#### 6. Update index.css
- Remove `glass-header`, `glass-nav`, `ticker-smooth` styles (no longer needed)
- Ensure sidebar CSS variables are clean

#### 7. Remove obsolete files
- `src/components/layout/DesktopQuickNav.tsx` — replaced by sidebar
- Old hamburger menu code in `Header.tsx` — replaced entirely

### Route Mapping (old → new)
| Old | New | Component |
|-----|-----|-----------|
| `/` | `/` | PersonalDashboard |
| `/notizie` | `/properties` | NotiziePage |
| `/clienti` | `/contacts` | ClientiPage |
| `/calendario` | `/activities` | CalendarPage |
| `/impostazioni` | `/settings` | SettingsPage |
| `/chat` | `/chat` | OfficeChatPage (hidden from sidebar for now) |
| `/ufficio` | `/office` | UfficioPage (hidden from sidebar for now) |

### "+New" Button Behavior
- Positioned prominently in sidebar below nav items
- Dropdown with 3 options that open the respective "Add" dialogs:
  - New Property → opens `AddNotiziaDialog`
  - New Contact → opens `AddClienteDialog`  
  - New Activity → opens `AddAppointmentDialog`

