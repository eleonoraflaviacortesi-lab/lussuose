import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Heart, User } from 'lucide-react';
import logo from '@/assets/le_lussuose.svg';
import { cn } from '@/lib/utils';

// Demo accounts - no password required
const demoAccounts = [
  { 
    id: 'eleonora',
    name: 'Eleonora', 
    emoji: '👸', 
    email: 'eleonoraflaviacortesi@gmail.com',
    color: 'bg-pink-100 dark:bg-pink-900/30'
  },
  { 
    id: 'dalila',
    name: 'Dalila', 
    emoji: '💎', 
    email: 'dalila@lelussuose.it',
    color: 'bg-purple-100 dark:bg-purple-900/30'
  },
  { 
    id: 'elisa',
    name: 'Elisa', 
    emoji: '🌸', 
    email: 'elisa@lelussuose.it',
    color: 'bg-rose-100 dark:bg-rose-900/30'
  },
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

  const handleSelectAccount = async (account: typeof demoAccounts[0]) => {
    setLoading(account.id);

    try {
      const { error } = await signIn(account.email, DEMO_PASSWORD);
      
      if (error) {
        // If user doesn't exist, we'd need to create them first
        // For now, show error
        toast({
          title: 'Errore',
          description: 'Account non configurato. Contatta l\'amministratore.',
          variant: 'destructive',
        });
      } else {
        toast({ title: `Benvenuta, ${account.name}!` });
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
      {/* Pink Header */}
      <div className="bg-primary py-8 text-center rounded-b-3xl">
        <img src={logo} alt="Le Lussuose" className="h-16 mx-auto invert brightness-0 invert" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full glass-button flex items-center justify-center">
              <Heart className="w-7 h-7 text-foreground" fill="currentColor" />
            </div>
          </div>

          <h2 className="text-center text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-8">
            SELEZIONA IL TUO ACCOUNT
          </h2>

          {/* Account Selection */}
          <div className="space-y-3">
            {demoAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleSelectAccount(account)}
                disabled={loading !== null}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                  "bg-card/80 backdrop-blur-sm border border-border/50",
                  "hover:scale-[1.02] hover:shadow-lg hover:border-primary/30",
                  "active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  loading === account.id && "ring-2 ring-primary animate-pulse"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center text-2xl",
                  account.color
                )}>
                  {account.emoji}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">{account.name}</p>
                  <p className="text-xs text-muted-foreground">Tocca per accedere</p>
                </div>
                {loading === account.id ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>

          <p className="text-center text-[10px] text-muted-foreground/60 mt-8 tracking-wide">
            ACCESSO RISERVATO AL TEAM
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;