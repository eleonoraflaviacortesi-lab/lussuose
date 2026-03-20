

## Plan: Add "Ciclo Produttivo" link to Sidebar

The route `/inserisci` already exists and renders `ReportPage` (with the NUOVO REPORT / I MIEI REPORT tabs shown in the screenshot). It just needs a sidebar entry.

### Changes

**1. `src/components/layout/AppSidebar.tsx`**
- Add `ClipboardList` (already imported) to `navItems` array:
  ```ts
  { title: 'Ciclo Produttivo', url: '/inserisci', icon: ClipboardList }
  ```
- Place it after "Calendar" and before "Settings" for logical grouping.

That's it — the route, page component, and tab UI (screenshot view) already exist and work correctly. Only the sidebar link is missing.

