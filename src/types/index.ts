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

// Cliente (Buyer Client) types
export type ClienteStatus = 
  | 'new' 
  | 'contacted' 
  | 'qualified' 
  | 'proposal' 
  | 'negotiation' 
  | 'closed_won' 
  | 'closed_lost';

export interface ClienteComment {
  id: string;
  text: string;
  author: string;
  authorId: string;
  createdAt: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cognome: string | null;
  telefono: string | null;
  email: string | null;
  paese: string | null;
  lingua: string | null;
  budget_max: number | null;
  mutuo: string | null;
  tempo_ricerca: string | null;
  ha_visitato: boolean;
  regioni: string[];
  vicinanza_citta: boolean;
  motivo_zona: string[];
  tipologia: string[];
  stile: string | null;
  contesto: string[];
  dimensioni_min: number | null;
  dimensioni_max: number | null;
  camere: string | null;
  bagni: number | null;
  layout: string | null;
  dependance: string | null;
  terreno: string | null;
  piscina: string | null;
  uso: string | null;
  interesse_affitto: string | null;
  portale: string | null;
  property_name: string | null;
  ref_number: string | null;
  contattato_da: string | null;
  tipo_contatto: string | null;
  status: ClienteStatus;
  display_order: number;
  assigned_to: string | null;
  sede: string;
  emoji: string;
  card_color: string | null;
  comments: ClienteComment[];
  descrizione: string | null;
  note_extra: string | null;
  tally_submission_id: string | null;
  data_submission: string | null;
  reminder_date: string | null;
  last_contact_date: string | null;
  row_bg_color: string | null;
  row_text_color: string | null;
  created_at: string;
  updated_at: string;
}

export type ClienteGroupBy = 'status' | 'regione' | 'tipologia' | 'budget' | 'agente';

export interface ClienteFilters {
  mutuo?: string;
  piscina?: string;
  nonAssegnati?: boolean;
  conTerreno?: boolean;
  urgenti?: boolean;
  search?: string;
  paese?: string;
  lingua?: string;
  portale?: string;
  regione?: string;
  tipologia?: string;
  stile?: string;
  uso?: string;
}

// Activity Log types
export type ClienteActivityType = 
  | 'call' 
  | 'email' 
  | 'visit' 
  | 'proposal' 
  | 'status_change' 
  | 'assignment' 
  | 'comment';

export interface ClienteActivity {
  id: string;
  cliente_id: string;
  activity_type: ClienteActivityType;
  title: string;
  description: string | null;
  property_id: string | null;
  created_by: string;
  created_at: string;
  // Joined fields
  author_name?: string;
  author_emoji?: string;
  property_title?: string;
}
