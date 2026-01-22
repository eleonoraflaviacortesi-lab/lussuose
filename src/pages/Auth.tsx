import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import logoLarge from '@/assets/le_lussuose_large.svg';
import { cn } from '@/lib/utils';

interface DemoAccount {
  email: string;
  full_name: string;
  avatar_emoji: string;
}

// Demo accounts with hardcoded data (RLS blocks profile access when not logged in)
const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'eleonoraflaviacortesi@gmail.com', full_name: 'Eleonora', avatar_emoji: '🖤' },
  { email: 'dalila@lelussuose.it', full_name: 'Dalila', avatar_emoji: '💎' },
  { email: 'elisa@lelussuose.it', full_name: 'Elisa', avatar_emoji: '🌸' },
];

// Shared demo password (not exposed in UI)
const DEMO_PASSWORD = 'lussuose2025!';


const Auth = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSelectAccount = async (account: DemoAccount) => {
    setLoading(account.email);

    try {
      const { error } = await signIn(account.email, DEMO_PASSWORD);
      
      if (error) {
        toast({
          title: 'Errore',
          description: 'Account non configurato. Contatta l\'amministratore.',
          variant: 'destructive',
        });
      } else {
        toast({ title: `Benvenuta, ${account.full_name}!` });
        navigate('/');
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
          <h2 className="text-center text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-8">
            SELEZIONA IL TUO ACCOUNT
          </h2>

          {/* Account Selection */}
          <div className="space-y-3">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                onClick={() => handleSelectAccount(account)}
                disabled={loading !== null}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl transition-all shadow-lg",
                  "bg-card border border-border/30",
                  "hover:scale-[1.02] hover:shadow-xl",
                  "active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  loading === account.email && "ring-2 ring-foreground"
                )}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-muted">
                  {account.avatar_emoji}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground tracking-tight">{account.full_name}</p>
                  <p className="text-xs text-muted-foreground tracking-wide">Tocca per accedere</p>
                </div>
                {loading === account.email && (
                  <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            ))}
          </div>

          <p className="text-center text-[10px] text-muted-foreground/60 mt-8 tracking-[0.2em] uppercase">
            ACCESSO RISERVATO AL TEAM
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
