
## Sostituzione indicatore pagina attiva nella barra di navigazione

L'attuale indicatore di pagina attiva e un cerchio liscio con ombra. Lo sostituiremo con una forma a "stella/sole" (starburst) come nello screenshot fornito, bianca con ombra per effetto rilievo.

### Cosa cambia

**1. Aggiunta forma starburst come sfondo dell'icona attiva**

Nel file `src/components/layout/Navigation.tsx`, aggiungeremo un elemento SVG inline dietro l'icona quando il tab e attivo. La forma sara quella del primo screenshot (cerchio a punte, circa 16 punte), colorata di bianco con un'ombra `drop-shadow` per l'effetto rilievo.

**2. Aggiornamento stili CSS**

Nel file `src/index.css`, la classe `.pill-nav-item.active` verra modificata:
- Rimossa l'ombra e il background attuale (cerchio liscio)
- L'effetto rilievo sara gestito dall'SVG starburst stesso tramite `filter: drop-shadow()`

### Dettagli tecnici

**`src/components/layout/Navigation.tsx`**
- Il bottone attivo conterra un SVG starburst posizionato in absolute dietro l'icona (z-index negativo)
- L'SVG usera un path poligonale a 16 punte, fill bianco, con `filter: drop-shadow(0 3px 6px rgba(0,0,0,0.18))`
- Dimensione della forma: circa 38-40px per coprire l'area del bottone

**`src/index.css`**
- `.pill-nav-item.active`: rimozione di `box-shadow` e `background`, aggiunta di `position: relative` e `overflow: visible`
- L'icona attiva mantiene il colore `text-foreground` e strokeWidth 2
