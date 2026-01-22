import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import logoLarge from '@/assets/le_lussuose_large.svg';
import { cn } from '@/lib/utils';
import { Plus, X, UserPlus } from 'lucide-react';

interface DemoAccount {
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
  const [loading, setLoading] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'agente' | 'coordinatore'>('agente');
  const [newSede, setNewSede] = useState<string>('CITTÀ DI CASTELLO');
  const [isCreating, setIsCreating] = useState(false);
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Fetch all profiles to show as selectable accounts
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_emoji, sede, user_id')
        .order('full_name');
      
      if (data) {
        // Get emails from auth (we'll use user_id as identifier)
        const accountList: DemoAccount[] = data.map(p => ({
          email: `${p.user_id}`, // We'll lookup email later
          full_name: p.full_name,
          avatar_emoji: p.avatar_emoji || '🖤',
          sede: p.sede,
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
    setLoading(account.email);

    try {
      // Try to find the user's email by their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('full_name', account.full_name)
        .maybeSingle();
      
      if (!profile) {
        toast({
          title: 'Errore',
          description: 'Profilo non trovato.',
          variant: 'destructive',
        });
        setLoading(null);
        return;
      }

      // Get user email from a predefined mapping or try common patterns
      const emailPatterns = [
        `${account.full_name.toLowerCase()}@lelussuose.it`,
        `${account.full_name.toLowerCase().replace(' ', '.')}@lelussuose.it`,
      ];

      let loggedIn = false;
      
      // Try known emails first
      const knownEmails: Record<string, string> = {
        'Eleonora': 'eleonoraflaviacortesi@gmail.com',
        'Dalila': 'dalila@lelussuose.it',
        'Elisa': 'elisa@lelussuose.it',
      };

      const email = knownEmails[account.full_name] || emailPatterns[0];
      
      const { error } = await signIn(email, DEMO_PASSWORD);
      
      if (!error) {
        loggedIn = true;
        toast({ title: `Benvenuta, ${account.full_name}!` });
        navigate('/');
      } else {
        toast({
          title: 'Errore',
          description: 'Account non configurato. Contatta l\'amministratore.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Errore',
        description: 'Impossibile accedere',
        variant: 'destructive',
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
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_emoji, sede, user_id')
          .order('full_name');
        if (data) {
          setAccounts(data.map(p => ({
            email: `${p.user_id}`,
            full_name: p.full_name,
            avatar_emoji: p.avatar_emoji || '🖤',
            sede: p.sede,
          })));
        }
      }
    } catch (err: any) {
      toast({
        title: 'Errore',
        description: err.message || 'Impossibile creare account',
        variant: 'destructive',
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
      {/* Header - Liquid Glass Style */}
      <div className="bg-card/80 backdrop-blur-xl py-4 text-center rounded-b-[2rem] shadow-lg border-b border-border/30">
        <img 
          src={logoLarge} 
          alt="Le Lussuose" 
          className="h-16 mx-auto dark:invert" 
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-center text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-6">
            SELEZIONA IL TUO ACCOUNT
          </h2>

          {/* Account Selection by Sede */}
          <div className="space-y-6">
            {Object.entries(accountsBySede).map(([sede, sedeAccounts]) => (
              <div key={sede}>
                <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground/60 mb-2 px-1">
                  {sede}
                </p>
                <div className="space-y-2">
                  {sedeAccounts.map((account) => (
                    <button
                      key={account.full_name}
                      onClick={() => handleSelectAccount(account)}
                      disabled={loading !== null}
                      className={cn(
                        "w-full flex items-center gap-4 p-3 rounded-2xl transition-all shadow-md",
                        "bg-card border border-border/30",
                        "hover:scale-[1.02] hover:shadow-lg",
                        "active:scale-[0.98]",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        loading === account.email && "ring-2 ring-foreground"
                      )}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-muted">
                        {account.avatar_emoji}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-foreground tracking-tight">{account.full_name}</p>
                        <p className="text-xs text-muted-foreground">Tocca per accedere</p>
                      </div>
                      {loading === account.email && (
                        <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Add Account Form */}
          {showAddForm ? (
            <div className="mt-6 p-4 bg-card rounded-2xl border border-border/30 shadow-lg animate-in slide-in-from-bottom-2">
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
                  className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                
                <div className="flex gap-2">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      onClick={() => setNewRole(role)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all",
                        newRole === role
                          ? "bg-foreground text-background"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  {SEDI.map((sede) => (
                    <button
                      key={sede}
                      onClick={() => setNewSede(sede)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-[10px] font-medium transition-all",
                        newSede === sede
                          ? "bg-foreground text-background"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {sede}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCreateAccount}
                  disabled={isCreating || !newName.trim()}
                  className="w-full bg-foreground text-background rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? (
                    <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Crea Account
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-border/50 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs font-medium tracking-wide">AGGIUNGI ACCOUNT</span>
            </button>
          )}

          <p className="text-center text-[10px] text-muted-foreground/60 mt-6 tracking-[0.2em] uppercase">
            ACCESSO RISERVATO AL TEAM
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
