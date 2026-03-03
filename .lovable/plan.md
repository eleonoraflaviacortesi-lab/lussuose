

## Plan: Grid layout on desktop + neutral color scheme for KPI widgets

### Changes

**`src/components/dashboard/KPISummaryWidgets.tsx`**
- Change grid from `grid-cols-2` to `grid-cols-2 md:grid-cols-3` so desktop shows 3 per row (6 widgets = 2 rows of 3)
- Remove all custom color classes (`widget-peach`, `widget-mint`, etc.) and replace with standard card styling: `bg-card text-card-foreground` with `border border-border`
- Progress bar uses `bg-muted` track and `bg-foreground` fill instead of colored variants

**`src/index.css`** (optional cleanup)
- Remove the widget color CSS variables (`--widget-peach`, `--widget-mint`, etc.) since they're no longer used

### Result
Widgets will display in a clean white/black/grey palette matching the existing design language, and on desktop they'll show 3 across instead of 2.

