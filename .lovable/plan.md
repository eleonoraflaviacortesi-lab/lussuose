

## Fix Font Futura Medium - Piano Definitivo

### Problema
I nomi degli account nella pagina di login (e altri elementi) mostrano **Futura Light** invece di **Futura Medium**, nonostante la classe `font-title` sia applicata.

**Causa**: La regola `p { font-family: var(--font-light); }` nel CSS base forza **tutti** i tag `<p>` a usare Light. Anche se la classe `.font-title` dovrebbe sovrascriverla, in pratica non funziona perche' entrambe le regole impostano `font-family` direttamente e il browser da' precedenza alla regola sul tag `p` nel contesto dei layer CSS.

### Soluzione

1. **Rimuovere la regola `p`** dal `@layer base` -- e' ridondante perche' il `body` gia' imposta FuturaLight come font predefinito, e tutti i `<p>` lo ereditano automaticamente.

2. **Spostare `.font-title` e `.font-important`** da `@layer components` a `@layer utilities` per garantire la massima priorita' CSS (le utilities vincono sempre su base e components).

3. **Aggiungere `!important`** come sicurezza extra sulle classi `.font-title` e `.font-important`.

### Dettagli tecnici

**File: `src/index.css`**

Rimuovere (righe 178-180):
```css
p {
  font-family: var(--font-light);
}
```

Spostare da `@layer components` a `@layer utilities`:
```css
@layer utilities {
  .font-title {
    font-family: var(--font-medium) !important;
  }
  .font-important {
    font-family: var(--font-bold) !important;
  }
}
```

Nessuna modifica necessaria ad `Auth.tsx` o `toast.tsx` -- usano gia' `font-title` correttamente.

### Risultato atteso
- Nomi account nella login: **Futura Medium**
- Corpo del testo e sottotitoli: **Futura Light** (ereditato dal body)
- Titoli h2-h6, strong: **Futura Medium** (dalle regole base)
- H1 e elementi importanti: **Futura Bold**
