
# Magia da Stregoni - Effetti Visivi Mistici

Trasformazione degli effetti visivi attuali da "festosi/rosa" a un'estetica mistica e arcana, come magia da stregoni.

## Cosa cambia

### 1. Floating Sparkles --> Rune Arcane Fluttuanti
Le particelle rosa che salgono verso l'alto diventano particelle mistiche che si muovono in modo organico e imprevedibile:
- Colori: dal rosa al **viola profondo, indaco e ciano pallido** (palette arcana)
- Movimento: non piu' lineari verso l'alto, ma con traiettorie sinuose e spirali lente, come energia magica sospesa nell'aria
- Forma: oltre ai cerchi, alcune particelle disegnano piccoli "sigilli" (cerchi con raggi) che appaiono e svaniscono
- Pulsazione: ritmo piu' lento e irregolare, come un battito magico

### 2. Magic Cursor --> Scia di Energia Arcana
La scia del mouse diventa un effetto tipo incantesimo:
- Colori: gradiente da **viola scuro a ciano elettrico** con un nucleo bianco brillante
- Scia piu' lunga (30 punti invece di 20) e che si dissipa con un effetto "fumo mistico"
- Particelle secondarie che si staccano dalla scia e si dissolvono lateralmente, come scintille di magia nera
- Dimensione variabile: la scia pulsa leggermente come se fosse viva

### 3. Easter Egg del Logo --> Incantesimo
Il triple-tap sul logo attiva un effetto piu' misterioso:
- I coriandoli diventano di colori arcani (viola, indaco, ciano, nero, argento)
- Aggiunta di un breve flash luminoso viola che si espande dal centro

## File coinvolti

| File | Modifica |
|------|----------|
| `src/components/ui/floating-sparkles.tsx` | Riscrittura completa: palette arcana, movimento a spirale, sigilli mistici |
| `src/components/ui/magic-cursor.tsx` | Scia viola-ciano, particelle secondarie, effetto fumo |
| `src/lib/confetti.ts` | Palette arcana per `celebrateGasiAbbestia` (viola, indaco, ciano, argento) |

## Dettagli tecnici

- Le particelle ambientali useranno colori HSL nell'intervallo 250-280 (viola/indaco) con accenti a 180-200 (ciano)
- Il movimento a spirale si ottiene combinando sin/cos con fasi diverse per x e y
- Le particelle "sigillo" disegnano un cerchio con 4-6 linee radiali che ruotano lentamente
- La scia del cursor usa `globalCompositeOperation: 'lighter'` per un effetto di energia additiva
- Opacita' generale ridotta per mantenere la leggibilita' dell'interfaccia
