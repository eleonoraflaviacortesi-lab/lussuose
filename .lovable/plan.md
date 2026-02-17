

# Rivoluzione Visiva: Stile Minimal, Liquid Glass & Fluid

Trasformazione completa dell'interfaccia per ottenere un design ultra-raffinato con bordi arrotondati, animazioni fluide con rimbalzo e un'estetica "liquid glass" coerente su ogni elemento.

---

## 1. Sistema di Animazioni Fluide con Rimbalzo

Aggiungere nuove keyframes e animazioni in **tailwind.config.ts**:

- **spring-in**: animazione di entrata con effetto rimbalzo (bounce elastico) usando `cubic-bezier(0.34, 1.56, 0.64, 1)`
- **spring-scale**: scala da 0.9 a 1 con overshoot elastico
- **float**: animazione sottile di galleggiamento continuo per elementi decorativi
- **slide-up-spring**: slide dal basso con rimbalzo elastico
- **glass-shimmer**: effetto luce che scorre sulle superfici glass

Queste animazioni verranno applicate automaticamente a card, dialog, popover, dropdown e transizioni di pagina.

---

## 2. Border Radius Globale Aumentato

Modifiche in **tailwind.config.ts** e **src/index.css**:

- `--radius` da `1rem` a `1.5rem` (aumento globale)
- Card: da `rounded-2xl` a `rounded-3xl`
- Input, Select, Textarea: da `rounded-xl` a `rounded-2xl`
- Dialog: da `sm:rounded-lg` a `rounded-3xl`
- Sheet: `rounded-t-[2rem]` per bottom sheet
- Dropdown/Context Menu: da `rounded-md` a `rounded-2xl`
- Toast: da `rounded-md` a `rounded-2xl`
- Badge: mantiene `rounded-full`
- Accordion items: bordi arrotondati con separazione morbida
- Progress bar: mantiene `rounded-full`

---

## 3. Componenti UI Aggiornati

### Card (`src/components/ui/card.tsx`)
- `rounded-3xl` con ombra morbida e diffusa
- Bordo sottile semitrasparente `border border-white/60`
- Background con leggera trasparenza `bg-white/90 backdrop-blur-sm`

### Button (`src/components/ui/button.tsx`)
- Mantiene `rounded-full` (gia pill-shaped)
- Aggiungere transizione con `transition-all duration-200` e `active:scale-[0.95]` con easing spring

### Input (`src/components/ui/input.tsx`)
- `rounded-2xl` con ombra interna sottile
- Focus ring piu morbido

### Select (`src/components/ui/select.tsx`)
- Trigger: `rounded-2xl`
- Content: `rounded-2xl` con `bg-white/95 backdrop-blur-xl`
- Items: `rounded-xl`

### Dialog (`src/components/ui/dialog.tsx`)
- Content: `rounded-3xl` con animazione spring-in
- Overlay: sfocatura piu intensa `backdrop-blur-xl`

### Sheet (`src/components/ui/sheet.tsx`)
- Bottom: `rounded-t-[2rem]`
- Overlay: `bg-black/15 backdrop-blur-lg`

### Dropdown Menu (`src/components/ui/dropdown-menu.tsx`)
- Content: `rounded-2xl bg-white/95 backdrop-blur-xl`
- Items: `rounded-xl`
- SubContent: stessi stili

### Context Menu (`src/components/ui/context-menu.tsx`)
- Stessi aggiornamenti del Dropdown Menu

### Popover (`src/components/ui/popover.tsx`)
- `rounded-3xl` con glass effect potenziato

### Toast (`src/components/ui/toast.tsx`)
- `rounded-2xl` con glass effect

### Tabs (`src/components/ui/tabs.tsx`)
- TabsList: `rounded-full` con `bg-muted/40 backdrop-blur-sm`
- TabsTrigger: `rounded-full` con animazione spring

### Accordion (`src/components/ui/accordion.tsx`)
- Rimuovere `border-b`, usare spacing verticale
- Items con `rounded-2xl` e background morbido

### Textarea (`src/components/ui/textarea.tsx`)
- `rounded-2xl`

### Badge (`src/components/ui/badge.tsx`)
- Mantiene `rounded-full`

---

## 4. Glass Effect Potenziato (src/index.css)

Aggiornare le classi `.glass-header`, `.glass-nav`, `.glass-button`:
- Aumentare la sfocatura a `blur(80px)`
- Maggiore trasparenza controllata
- Ombre piu diffuse e morbide
- Aggiungere classe `.glass-card` per card con effetto vetro

Nuova classe `.glass-surface` generica:
```css
.glass-surface {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
}
```

---

## 5. Animazioni di Pagina e Transizioni

### PersonalDashboard, UnifiedDashboard, e altre pagine
- Container principale: `animate-slide-up-spring` per entrata
- Card interne: entrata sfalsata (staggered) usando `animation-delay`
- Transizioni tra tab con fade + spring

### Navigation (`src/components/layout/Navigation.tsx`)
- Indicatore attivo: transizione posizione con spring CSS
- Icone: leggero spring su tap

### KPICard, dark-card, e contenitori
- `rounded-3xl` coerente
- Hover/active con spring scale

---

## 6. Font (nessun cambio)

Il font Outfit e gia perfetto per lo stile minimal-elegante. Viene mantenuto. Leggero aumento del letter-spacing globale per maggiore respiro.

---

## File coinvolti

1. `tailwind.config.ts` - nuove keyframes, animazioni, radius
2. `src/index.css` - variabili CSS, classi glass potenziate, animazioni spring
3. `src/components/ui/card.tsx` - rounded-3xl, glass surface
4. `src/components/ui/button.tsx` - transizioni spring
5. `src/components/ui/input.tsx` - rounded-2xl
6. `src/components/ui/textarea.tsx` - rounded-2xl
7. `src/components/ui/select.tsx` - rounded-2xl, glass content
8. `src/components/ui/dialog.tsx` - rounded-3xl, spring animation
9. `src/components/ui/sheet.tsx` - rounded-t-[2rem], glass overlay
10. `src/components/ui/dropdown-menu.tsx` - rounded-2xl, glass
11. `src/components/ui/context-menu.tsx` - rounded-2xl, glass
12. `src/components/ui/popover.tsx` - rounded-3xl
13. `src/components/ui/toast.tsx` - rounded-2xl
14. `src/components/ui/tabs.tsx` - rounded-full, spring
15. `src/components/ui/accordion.tsx` - rounded-2xl, no border
16. `src/components/ui/badge.tsx` - invariato (gia rounded-full)
17. `src/components/dashboard/PersonalDashboard.tsx` - rounded-3xl, spring animations
18. `src/components/dashboard/UnifiedDashboard.tsx` - spring tab transitions
19. `src/components/dashboard/KPICard.tsx` - rounded-3xl
20. `src/components/layout/Navigation.tsx` - spring indicator
21. `src/components/layout/Header.tsx` - glass potenziato

