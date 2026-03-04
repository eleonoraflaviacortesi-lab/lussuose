import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import logoLarge from '@/assets/app_logo.svg';
import starIcon from '@/assets/star_icon.png';
import { cn } from '@/lib/utils';
import { Plus, X, UserPlus } from 'lucide-react';
import AnnouncementBanner from '@/components/layout/AnnouncementBanner';
import { useMemo } from 'react';

const headerQuotes = [
  { text: "The obstacle is the way.", author: "Ryan Holiday" },
  { text: "What you seek is seeking you.", author: "Rumi" },
  { text: "We suffer more in imagination than in reality.", author: "Seneca" },
  { text: "What we resist, persists.", author: "Carl Jung" },
  { text: "You are not your thoughts.", author: "Eckhart Tolle" },
  { text: "How we spend our days is how we spend our lives.", author: "Annie Dillard" },
  { text: "The only way out is through.", author: "Robert Frost" },
  { text: "He who has a why can bear almost any how.", author: "Nietzsche" },
  { text: "In the middle of difficulty lies opportunity.", author: "Einstein" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "One day or day one. You decide.", author: "Paulo Coelho" },
  { text: "The mind is everything. What you think, you become.", author: "Buddha" },
  { text: "Where attention goes, energy flows.", author: "James Redfield" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "What consumes your mind, controls your life.", author: "Stoic proverb" },
];

interface DemoAccount {
  user_id: string;
  email: string;
  full_name: string;
  avatar_emoji: string;
  sede?: string;
}

// Shared demo password (not exposed in UI)
const DEMO_PASSWORD = 'lussuose2025!';

const SEDI = ['CITTÀ DI CASTELLO', 'AREZZO'] as const;
const ROLES = ['agente', 'coordinatore'] as const;

const Auth = () => {
  const quote = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    return headerQuotes[dayOfYear % headerQuotes.length];
  }, []);
  const [loading, setLoading] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'agente' | 'coordinatore'>('agente');
  const [newSede, setNewSede] = useState<string>('CITTÀ DI CASTELLO');
  const [isCreating, setIsCreating] = useState(false);
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Fetch all profiles with their emails to show as selectable accounts
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.
      from('profiles').
      select('full_name, avatar_emoji, sede, user_id').
      order('full_name');

      if (data) {
        // Map user_id to known emails (fetched from auth.users reference)
        const emailMap: Record<string, string> = {
          '02c5c45d-f5db-415c-9ee3-b3b517b03762': 'dalila@lelussuose.it',
          '986533ef-e6f2-4e3a-a222-66d6abcaee58': 'eleonoraflaviacortesi@gmail.com',
          '78477b00-31bd-44a8-8dc2-6a8fa58e8c0c': 'elisa@lelussuose.it',
          '76b70b52-f636-4eb3-befa-b65a7751fb22': 'tizianello@lelussuose.it'
        };

        const accountList: DemoAccount[] = data.map((p) => ({
          user_id: p.user_id,
          email: emailMap[p.user_id] || `${p.full_name.toLowerCase().replace(/\s+/g, '.')}@lelussuose.it`,
          full_name: p.full_name,
          avatar_emoji: p.avatar_emoji || '🖤',
          sede: p.sede
        }));
        setAccounts(accountList);
      }
    };
    fetchProfiles();
  }, []);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSelectAccount = async (account: DemoAccount) => {
    setLoading(account.user_id);

    try {
      const { error } = await signIn(account.email, DEMO_PASSWORD);

      if (!error) {
        toast({ title: `Bentornato/a, ${account.full_name}!` });
        navigate('/');
      } else {
        toast({
          title: 'Errore',
          description: 'Account non configurato. Contatta l\'amministratore.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: 'Errore',
        description: 'Impossibile accedere',
        variant: 'destructive'
      });
    } finally {
      setLoading(null);
    }
  };

  const handleCreateAccount = async () => {
    if (!newName.trim()) {
      toast({ title: 'Inserisci un nome', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      // Generate email from name
      const emailName = newName.toLowerCase().trim().replace(/\s+/g, '.');
      const email = `${emailName}@lelussuose.it`;

      const { error } = await signUp(email, DEMO_PASSWORD, newName.trim(), newRole, newSede);

      if (error) {
        if (error.message.includes('already registered')) {
          toast({ title: 'Email già registrata', variant: 'destructive' });
        } else {
          throw error;
        }
      } else {
        toast({ title: `Account creato per ${newName}!` });
        setNewName('');
        setShowAddForm(false);
        // Refresh accounts list
        const { data } = await supabase.
        from('profiles').
        select('full_name, avatar_emoji, sede, user_id').
        order('full_name');
        if (data) {
          setAccounts(data.map((p) => ({
            user_id: p.user_id,
            email: `${p.full_name.toLowerCase().replace(/\s+/g, '.')}@lelussuose.it`,
            full_name: p.full_name,
            avatar_emoji: p.avatar_emoji || '🖤',
            sede: p.sede
          })));
        }
      }
    } catch (err: any) {
      toast({
        title: 'Errore',
        description: err.message || 'Impossibile creare account',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Group accounts by sede
  const accountsBySede = accounts.reduce((acc, account) => {
    const sede = account.sede || 'AREZZO';
    if (!acc[sede]) acc[sede] = [];
    acc[sede].push(account);
    return acc;
  }, {} as Record<string, DemoAccount[]>);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnnouncementBanner />

      {/* Header - Same glass style as app with daily quote */}
      <div
        className="flex items-center gap-2 px-4 min-h-14 py-2 mt-[calc(var(--banner-height,34px)+env(safe-area-inset-top,0px))]"
        style={{ backgroundColor: 'white', borderBottomRightRadius: '1.5rem', borderBottomLeftRadius: '1.5rem' }}
      >
        <div className="flex-1 min-w-0 flex items-center justify-center gap-1 px-1">
          <img src={starIcon} alt="" className="h-3 w-3 shrink-0 opacity-50" />
          <p
           className="text-[10px] text-muted-foreground/70 text-center leading-relaxed"
            style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
          >
            {quote.text} — {quote.author}
          </p>
          <img src={starIcon} alt="" className="h-3 w-3 shrink-0 opacity-50" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-center text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-6">
            SELEZIONA IL TUO ACCOUNT
          </h2>

          {/* Account Selection by Sede */}
          <div className="space-y-6">
            {Object.entries(accountsBySede).map(([sede, sedeAccounts]) =>
            <div key={sede}>
                <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground/60 mb-2 px-1">
                  {sede}
                </p>
                <div className="space-y-2">
                  {sedeAccounts.map((account) =>
                <button
                  key={account.full_name}
                  onClick={() => handleSelectAccount(account)}
                  disabled={loading !== null}
                  className={cn(
                    "w-full flex items-center gap-4 p-3 rounded-2xl transition-all",
                    "bg-card border border-border",
                    "hover:scale-[1.02]",
                    "active:scale-[0.98]",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    loading === account.user_id && "ring-2 ring-foreground"
                  )}>
                  
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-muted">
                        {account.avatar_emoji}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-foreground tracking-tight text-sm">{account.full_name}</p>
                        <p className="text-xs text-muted-foreground">Tocca per accedere</p>
                      </div>
                      {loading === account.user_id &&
                  <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                  }
                    </button>
                )}
                </div>
              </div>
            )}
          </div>

          {/* Add Account Form */}
          {showAddForm ?
          <div className="mt-6 p-4 bg-card rounded-2xl border border-border animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Nuovo Account</h3>
                <button onClick={() => setShowAddForm(false)} className="text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <input
                type="text"
                placeholder="Nome"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              
                
                <div className="flex gap-2">
                  {ROLES.map((role) =>
                <button
                  key={role}
                  onClick={() => setNewRole(role)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all",
                    newRole === role ?
                    "bg-foreground text-background" :
                    "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}>
                  
                      {role}
                    </button>
                )}
                </div>

                <div className="flex gap-2">
                  {SEDI.map((sede) =>
                <button
                  key={sede}
                  onClick={() => setNewSede(sede)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[10px] font-medium transition-all",
                    newSede === sede ?
                    "bg-foreground text-background" :
                    "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}>
                  
                      {sede}
                    </button>
                )}
                </div>

                <button
                onClick={handleCreateAccount}
                disabled={isCreating || !newName.trim()}
                className="w-full bg-foreground text-background rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                
                  {isCreating ?
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> :

                <>
                      <UserPlus className="w-4 h-4" />
                      Crea Account
                    </>
                }
                </button>
              </div>
            </div> :

          <button
            onClick={() => setShowAddForm(true)}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-border/50 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors">
            
              <Plus className="w-4 h-4" />
              <span className="text-xs font-medium tracking-wide">AGGIUNGI ACCOUNT</span>
            </button>
          }

          <p className="text-center text-[10px] text-muted-foreground/60 mt-6 tracking-[0.2em] uppercase">
            ACCESSO RISERVATO AL TEAM
          </p>
        </div>
      </div>
    </div>);

};

export default Auth;