
## Barra di navigazione fissa con effetto Liquid Glass

### Cosa cambia

La pill-nav attualmente scorre via con la pagina. Verra' resa **fissa sotto l'header** e acquisira' un effetto **liquid glass** allo scorrimento, con bordi arrotondati e ombra per creare rilievo.

### Comportamento

1. **Sempre visibile**: la barra resta ancorata sotto l'header durante lo scroll
2. **Effetto liquid glass**: sfondo semi-trasparente con backdrop-blur, ombra morbida e bordi arrotondati (come l'header esistente ma adattato alla pill-nav)
3. **Transizione fluida**: il contenuto della pagina scorre sotto la barra con l'effetto vetro che lascia intravedere gli elementi sottostanti

### Dettagli tecnici

**Navigation.tsx**:
- Rendere il wrapper `nav` con `fixed` positioning, posizionato subito sotto l'header (circa `top-[88px]` considerando ticker + header)
- Aggiungere `z-[55]` per restare sopra il contenuto ma sotto l'header
- Applicare una nuova classe CSS `glass-nav` alla pill-nav

**index.css**:
- Creare la classe `.glass-nav` con lo stesso stile liquid glass dell'header (`backdrop-filter: blur`, sfondo semi-trasparente bianco, `box-shadow` per il rilievo) adattato alla forma pill con bordi arrotondati

**Index.tsx**:
- Aggiornare lo spacer (`h-[120px]`) per compensare sia l'header che la nav ora entrambi fissi (circa `h-[160px]`)
- Rimuovere il rendering diretto di `Navigation` dal flusso normale e posizionarlo nel blocco fisso insieme all'header

### File coinvolti
- `src/components/layout/Navigation.tsx`
- `src/index.css`
- `src/pages/Index.tsx`
