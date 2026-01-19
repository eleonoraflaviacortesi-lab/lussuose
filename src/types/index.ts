export interface User {
  id: string;
  name: string;
  role: 'agente' | 'coordinatore';
  avatar?: string;
  sede: string;
}

export interface DailyData {
  id: string;
  date: string;
  userId: string;
  contattiReali: number;
  contattiIdeali: number;
  notizieReali: number;
  notizieIdeali: number;
  clientiGestiti: number;
  appuntamentiVendita: number;
  acquisizioni: number;
  incarichiVendita: number;
  venditeNumero: number;
  venditeValore: number;
  affittiNumero: number;
  affittiValore: number;
}

export interface KPICard {
  title: string;
  value: number | string;
  target?: number;
  delta?: number;
  deltaType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  format?: 'number' | 'currency';
}

export interface Operation {
  id: string;
  date: string;
  agentId: string;
  agentName: string;
  type: 'acquisizione' | 'vendita' | 'incarico';
  value?: number;
}

export interface AgentRanking {
  userId: string;
  name: string;
  vendite: number;
  appuntamenti: number;
  fatturato: number;
  rank: number;
}
