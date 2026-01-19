import { User, DailyData, Operation, AgentRanking } from '@/types';

export const users: User[] = [
  { id: '1', name: 'Eleonora', role: 'coordinatore', sede: 'AREZZO' },
  { id: '2', name: 'Elisa', role: 'agente', sede: 'AREZZO' },
  { id: '3', name: 'Dalila', role: 'agente', sede: 'AREZZO' },
];

export const mockDailyData: DailyData[] = [
  {
    id: '1',
    date: '2026-01-19',
    userId: '2',
    contattiReali: 12,
    contattiIdeali: 25,
    notizieReali: 4,
    notizieIdeali: 3,
    clientiGestiti: 3,
    appuntamentiVendita: 1,
    acquisizioni: 1,
    incarichiVendita: 0,
    venditeNumero: 0,
    venditeValore: 0,
    affittiNumero: 0,
    affittiValore: 0,
  },
  {
    id: '2',
    date: '2026-01-18',
    userId: '3',
    contattiReali: 8,
    contattiIdeali: 25,
    notizieReali: 3,
    notizieIdeali: 3,
    clientiGestiti: 4,
    appuntamentiVendita: 0,
    acquisizioni: 1,
    incarichiVendita: 0,
    venditeNumero: 0,
    venditeValore: 0,
    affittiNumero: 0,
    affittiValore: 0,
  },
  {
    id: '3',
    date: '2026-01-14',
    userId: '2',
    contattiReali: 10,
    contattiIdeali: 25,
    notizieReali: 3,
    notizieIdeali: 3,
    clientiGestiti: 2,
    appuntamentiVendita: 1,
    acquisizioni: 0,
    incarichiVendita: 0,
    venditeNumero: 0,
    venditeValore: 0,
    affittiNumero: 0,
    affittiValore: 0,
  },
  {
    id: '4',
    date: '2025-12-18',
    userId: '3',
    contattiReali: 5,
    contattiIdeali: 25,
    notizieReali: 0,
    notizieIdeali: 3,
    clientiGestiti: 1,
    appuntamentiVendita: 3,
    acquisizioni: 0,
    incarichiVendita: 0,
    venditeNumero: 1,
    venditeValore: 40000,
    affittiNumero: 0,
    affittiValore: 0,
  },
];

export const recentOperations: Operation[] = [
  { id: '1', date: '2026-01-14', agentId: '2', agentName: 'Elisa', type: 'acquisizione' },
  { id: '2', date: '2026-01-12', agentId: '3', agentName: 'Dalila', type: 'acquisizione' },
  { id: '3', date: '2025-12-18', agentId: '3', agentName: 'Dalila', type: 'vendita', value: 40000 },
];

export const agentRankings: AgentRanking[] = [
  { userId: '2', name: 'Elisa', vendite: 0, appuntamenti: 2, fatturato: 0, rank: 1 },
  { userId: '3', name: 'Dalila', vendite: 1, appuntamenti: 3, fatturato: 40000, rank: 2 },
];

export const sedeKPIs = {
  contatti: { value: 31, target: 0, delta: 31 },
  notizieVendita: { value: 11, target: 0, delta: 11 },
  clientiGestiti: { value: 10, target: 0, delta: 10 },
  appuntamentiVendita: { value: 1, target: 0, delta: 1 },
  acquisizioni: { value: 2, target: 0, delta: 2 },
  incarichi: { value: 0, target: 0, delta: 0 },
  venditeRogiti: { value: 0, target: 4, delta: -4 },
  fatturato: { value: 0, target: 100000, delta: -100000 },
};
