

## Plan: Add Scrolling Banner Above Header and Sidebar

The user wants the announcement banner (with goal achievement text) to sit **above** both the sidebar and the header, spanning the full width of the viewport.

### Current State
- The app uses `AppLayout.tsx` with a sidebar + header layout (desktop)
- The banner with ticker animation and KPI interpolation currently lives only in `Header.tsx` (the legacy mobile component, not used in AppLayout)
- `AppLayout.tsx` has no banner — just sidebar + header + content
- The `useBannerSettings` hook fetches texts/colors/speed from `app_settings` table
- KPI data comes from `useKPIs` and `useSedeTargets`

### Plan

1. **Create an `AnnouncementBanner` component** (`src/components/layout/AnnouncementBanner.tsx`)
   - Uses `useBannerSettings` for text/colors/speed
   - Uses `useKPIs('year')` and `useSedeTargets` for the interpolation variables (`{remaining}`, `{target}`, `{fatturatoCredito}`)
   - Renders a full-width fixed bar at the very top (`z-40+`) with the ticker animation
   - Uses the existing `ticker` animation from tailwind config

2. **Update `AppLayout.tsx`**
   - Add `AnnouncementBanner` as the first element, **outside** the sidebar/header flex container, positioned fixed at `top-0` spanning full width
   - Push down the rest of the layout (sidebar + header) by the banner height using a top offset (e.g., `top-[banner-height]` on the sticky header, and padding-top on the sidebar)
   - The banner sits above everything: full viewport width, above sidebar and header

3. **Adjust sidebar top offset**
   - In `AppSidebar` or via CSS, ensure the sidebar starts below the banner height so the banner visually covers the full top strip

### Technical Details

- Banner height: ~28-30px (compact single-line ticker)
- The sidebar's top position and the header's `sticky top` value both need to account for the banner height
- The `ticker-smooth` class from Header.tsx maps to the `ticker` animation in tailwind config — will use `animate-ticker` with custom duration via inline style
- CSS variable `--banner-height` can coordinate offsets across sidebar and header

