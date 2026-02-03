import { NotiziaInput, NotiziaStatus } from '@/hooks/useNotizie';

interface DalilaNotiziaRaw {
  name: string;
  zona: string;
  phone: string;
  dataOriginale: string;
  informatore: string;
  fonte: string;
  azione: string;
  link: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  noteOriginali: string;
}

// Mappatura status basata sulla colonna AZIONE
const mapAzioneToStatus = (azione: string): NotiziaStatus => {
  const azioneLower = azione.toLowerCase().trim();
  
  // Status "no" - Non interessati / Non richiamare
  if (
    azioneLower.includes('non richiamare') ||
    azioneLower.includes('per adesso non vende') ||
    azioneLower.includes('non più interessata') ||
    azioneLower.includes('all\'asta') ||
    azioneLower.includes('non vende')
  ) {
    return 'no';
  }
  
  // Status "done" - Appuntamento fissato
  if (
    azioneLower.includes('app. fissato') ||
    azioneLower.includes('appuntamento fissato')
  ) {
    return 'done';
  }
  
  // Status "in_progress" - Da sviluppare / richiamare
  if (
    azioneLower.includes('sviluppare') ||
    azioneLower.includes('da richiamare') ||
    azioneLower.includes('attendere') ||
    azioneLower.includes('richiama')
  ) {
    return 'in_progress';
  }
  
  // Default per azioni non mappate
  return 'new';
};

// Costruisce le note consolidate con tutte le info
const buildConsolidatedNotes = (raw: DalilaNotiziaRaw): string => {
  const sections: string[] = [];
  
  // Info principali
  if (raw.informatore) {
    sections.push(`📋 INFORMATORE: ${raw.informatore}`);
  }
  if (raw.fonte) {
    sections.push(`📞 FONTE: ${raw.fonte}`);
  }
  if (raw.azione) {
    sections.push(`📝 AZIONE: ${raw.azione}`);
  }
  if (raw.link) {
    sections.push(`🔗 LINK: ${raw.link}`);
  }
  
  // Storico steps
  const steps: string[] = [];
  if (raw.step1) steps.push(`▸ STEP 1: ${raw.step1}`);
  if (raw.step2) steps.push(`▸ STEP 2: ${raw.step2}`);
  if (raw.step3) steps.push(`▸ STEP 3: ${raw.step3}`);
  if (raw.step4) steps.push(`▸ STEP 4: ${raw.step4}`);
  
  if (steps.length > 0) {
    sections.push('');
    sections.push('--- STORICO ---');
    sections.push(...steps);
  }
  
  // Note originali
  if (raw.noteOriginali) {
    sections.push('');
    sections.push('--- NOTE ORIGINALI ---');
    sections.push(raw.noteOriginali);
  }
  
  return sections.join('\n');
};

// Converte data italiana DD/MM/YYYY in ISO
const parseItalianDate = (dateStr: string): string => {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return new Date().toISOString();
  
  const [day, month, year] = parts;
  const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T10:00:00.000Z`;
  return isoDate;
};

// Dati delle 17 notizie dal file Excel (raggruppate per zona)
const dalilaNotizie: DalilaNotiziaRaw[] = [
  // === CORTONA (15 notizie) - ordine cronologico ===
  {
    name: 'IL CASALE',
    zona: 'Cortona',
    phone: '0575 612531',
    dataOriginale: '03/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'Non richiamare!',
    link: '',
    step1: 'Avevano due appartamenti a Morra ma ora sono di proprietà dei figli',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  {
    name: 'POGGIOBELLO',
    zona: 'Cortona',
    phone: '3334937894',
    dataOriginale: '03/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'Per adesso non vende',
    link: '',
    step1: 'È andata in pensione da poco ma non vogliono vendere',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  {
    name: 'PODERE LA VECCHIA FORNACE',
    zona: 'Cortona',
    phone: '0575 601359',
    dataOriginale: '03/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'Sviluppare',
    link: '',
    step1: 'Ha lasciato messaggio su Idealist, vedere se risp',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  {
    name: 'LA MUCCHIA',
    zona: 'Cortona',
    phone: '335 8097912',
    dataOriginale: '03/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'App. fissato',
    link: '',
    step1: 'Numero funziona - richiamare per fissare app',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  {
    name: 'IL GRIFONE A CORTONA',
    zona: 'Cortona',
    phone: '3474865489',
    dataOriginale: '04/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'Sviluppare',
    link: '',
    step1: 'In vendita a 3.5 M ma proprietario non risponde, continuare a chiamare',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  {
    name: 'IL CASALE DI LEDA',
    zona: 'Cortona',
    phone: '0575 603230',
    dataOriginale: '04/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'Non più interessata',
    link: '',
    step1: 'Parlato con proprietaria, non interessata a vendere',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  {
    name: 'FATTORIA BORGONUOVO',
    zona: 'Cortona',
    phone: '348 047 0286',
    dataOriginale: '04/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'Sviluppare',
    link: '',
    step1: 'Mandato messaggio WhatsApp, attendere risposta',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  {
    name: 'RELAIS VILLA PETRISCHIO',
    zona: 'Cortona',
    phone: '0575 610316',
    dataOriginale: '05/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'Sviluppato --> All\'asta',
    link: '',
    step1: 'Proprietà all\'asta, non proseguire',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  {
    name: 'VILLA SANTA MARGHERITA',
    zona: 'Cortona',
    phone: '0575 082440',
    dataOriginale: '11/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'Da richiamare',
    link: '',
    step1: 'Proprietario interessato ma deve parlare con famiglia',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  {
    name: 'SOMMAVILLA',
    zona: 'Cortona',
    phone: '335436174',
    dataOriginale: '13/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'Sviluppare',
    link: '',
    step1: 'Lasciato messaggio, richiamare',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  {
    name: 'VILLA GLORIA',
    zona: 'Cortona',
    phone: '0575 690037',
    dataOriginale: '16/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'App. fissato',
    link: '',
    step1: 'Appuntamento fissato per valutazione',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  {
    name: 'PILARI',
    zona: 'Cortona',
    phone: '0575 619231',
    dataOriginale: '16/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'App. fissato',
    link: '',
    step1: 'Fissato appuntamento',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  {
    name: 'LE MACINE',
    zona: 'Cortona',
    phone: '0575 616018',
    dataOriginale: '17/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'App. fissato',
    link: '',
    step1: 'Appuntamento confermato',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  {
    name: 'L\'ETRUSCA',
    zona: 'Cortona',
    phone: '0575 691006',
    dataOriginale: '17/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'App. fissato',
    link: '',
    step1: 'Appuntamento fissato con proprietario',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  {
    name: 'VILLA GIARRADEA',
    zona: 'Cortona',
    phone: '3398258670',
    dataOriginale: '23/01/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'Sviluppare',
    link: '',
    step1: 'Contattare per valutazione',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  
  // === CAMUCIA (1 notizia) ===
  {
    name: 'HOTEL NUOVO CENTRALE',
    zona: 'Camucia',
    phone: '0575 630578',
    dataOriginale: '06/12/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'Sviluppare',
    link: '',
    step1: 'Hotel in zona Camucia, verificare interesse vendita',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  },
  
  // === MONTERCHI (1 notizia) ===
  {
    name: 'RISTORANTE LA PIEVE VECCHIA',
    zona: 'Monterchi',
    phone: '0575 709053',
    dataOriginale: '24/01/2025',
    informatore: '',
    fonte: 'Agriturismi',
    azione: 'Da richiamare',
    link: '',
    step1: 'Ristorante con possibile vendita, richiamare',
    step2: '',
    step3: '',
    step4: '',
    noteOriginali: ''
  }
];

// Converte i dati raw in NotiziaInput pronti per l'inserimento
export const getDalilaNotizie = (): NotiziaInput[] => {
  return dalilaNotizie.map((raw, index) => ({
    name: raw.name,
    zona: raw.zona,
    phone: raw.phone,
    notes: buildConsolidatedNotes(raw),
    status: mapAzioneToStatus(raw.azione),
    created_at: parseItalianDate(raw.dataOriginale),
    display_order: index,
    is_online: false
  }));
};

// Esporta il conteggio per statistiche
export const getDalilaNotizieSummary = () => {
  const notizie = getDalilaNotizie();
  const byStatus = notizie.reduce((acc, n) => {
    acc[n.status || 'new'] = (acc[n.status || 'new'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byZona = notizie.reduce((acc, n) => {
    const zona = n.zona || 'Altro';
    acc[zona] = (acc[zona] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    total: notizie.length,
    byStatus,
    byZona
  };
};
