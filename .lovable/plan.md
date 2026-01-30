

# Piano: Forzare Aggiornamento PWA

## Problema
Stai vedendo una versione cache dell'app nonostante le modifiche siano state fatte. Questo succede spesso su iOS e dispositivi mobile dove il Service Worker della PWA mantiene in cache la vecchia versione.

## Soluzione Immediata (Lato Utente)

### Per iOS (Safari / PWA installata):
1. **Se hai l'app installata come PWA:**
   - Elimina l'app dalla schermata Home
   - Vai su Safari e apri l'URL dell'app
   - Aggiungi nuovamente alla schermata Home

2. **Se usi Safari:**
   - Impostazioni → Safari → Cancella dati siti web e cronologia
   - Oppure: Safari → tieni premuto il tasto ricarica → "Richiedi sito desktop" e poi torna a "mobile"

### Per Android / Chrome:
1. Impostazioni Chrome → Siti → [URL app] → Cancella dati
2. Oppure: Menu (⋮) → Aggiorna mentre tieni premuto → "Svuota cache e ricarica"

## Modifiche Tecniche Proposte

Per rendere gli aggiornamenti ancora più aggressivi:

| File | Modifica |
|------|----------|
| `src/main.tsx` | Incrementare BUILD_VERSION a "v2.1.0" |
| `vite.config.ts` | Aggiungere `navigateFallback` e header di no-cache |

### Dettagli Tecnici

1. **Bump versione esplicita** - Cambiare da `v2.0.0` a `v2.1.0` per forzare log differente in console
2. **Aggiungere navigateFallback** nella config Workbox per garantire che le nuove pagine vengano servite
3. **Forzare refresh immediato** - Modificare la logica di `onNeedRefresh` per essere più aggressiva

### Codice da modificare

**src/main.tsx** - Bump versione:
```typescript
const BUILD_VERSION = "v2.1.0"; // era v2.0.0
```

**vite.config.ts** - Workbox più aggressivo:
```typescript
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  clientsClaim: true,
  skipWaiting: true,
  cleanupOutdatedCaches: true,
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/api/],
  // ... rest
}
```

## Riepilogo

- **Azione immediata**: Cancella cache/reinstalla PWA sul tuo dispositivo
- **Modifica tecnica**: Bump versione + Workbox più aggressivo per futuri deploy

