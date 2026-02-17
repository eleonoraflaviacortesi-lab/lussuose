
# Semplificazione Menu + Cerchio Nav Bar

## Cosa cambia

### 1. Raggruppamento "Ufficio"
Le 3 voci **Riunioni**, **I Miei Report** e **Performance Ufficio** vengono unificate in una singola icona "Ufficio" (icona `Newspaper`) nella nav bar. Cliccandoci si apre una pagina con un selettore a pillola interno per navigare tra le 3 sotto-sezioni.

La nav bar passa da **8 icone** a **6 icone**:
Home | Calendario | Notizie | Buyers | **Ufficio** | Impostazioni

### 2. Cerchio al posto della stella
L'indicatore della pagina attiva torna a essere un **cerchio bianco** con ombra (drop-shadow), sostituendo l'attuale poligono a 16 punte (stella).

---

## Dettagli tecnici

### File: `src/components/layout/Navigation.tsx`
- Rimuovere le 3 voci separate (riunioni, report, agenzia) dalla lista `tabs`
- Aggiungere una singola voce `{ id: 'ufficio', icon: Newspaper, label: 'Ufficio' }`
- Aggiornare `tabToPath` con la nuova rotta `/ufficio`
- Sostituire l'SVG `<polygon>` (stella) con un semplice `<circle cx="50" cy="50" r="44" fill="white" />` con drop-shadow

### File: `src/pages/Index.tsx`
- Aggiornare `pathToTab` aggiungendo `'/ufficio': 'ufficio'` e rimuovendo le rotte singole di riunioni/report/agenzia
- Nel `renderContent`, il case `'ufficio'` renderizza il nuovo componente `UfficioPage`

### File: `src/App.tsx`
- Aggiungere la rotta `/ufficio`
- Mantenere le vecchie rotte `/riunioni`, `/report`, `/agenzia` come redirect a `/ufficio` per evitare 404

### Nuovo file: `src/components/ufficio/UfficioPage.tsx`
- Componente con selettore a pillola in alto (stile coerente con il design system liquid glass)
- 3 sotto-tab: **Ufficio** (AgencyDashboard), **Riunioni** (MeetingsPage), **Analisi** (ReportAnalysisTab)
- Lo stato della sotto-tab selezionata viene mantenuto internamente
- Le pillole sono `rounded-full` con transizione fluida sull'indicatore attivo
