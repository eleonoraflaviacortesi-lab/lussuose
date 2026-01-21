import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Heart, User, Loader2 } from 'lucide-react';
import logo from '@/assets/le_lussuose.svg';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface DemoAccount {
  email: string;
  full_name: string;
  avatar_emoji: string;
}

// Demo account emails (order matters for display)
const DEMO_EMAILS = [
  'eleonoraflaviacortesi@gmail.com',
  'dalila@lelussuose.it',
  'elisa@lelussuose.it',
];

// Shared demo password (not exposed in UI)
const DEMO_PASSWORD = 'lussuose2025!';

// Background colors for variety
const bgColors = [
  'bg-pink-100 dark:bg-pink-900/30',
  'bg-purple-100 dark:bg-purple-900/30',
  'bg-rose-100 dark:bg-rose-900/30',
];

const Auth = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Fetch demo accounts from database
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_emoji')
          .order('created_at');

        if (error) throw error;

        // Get emails from auth users via a workaround - use known demo emails
        const accountsWithEmails: DemoAccount[] = DEMO_EMAILS.map((email, index) => ({
          email,
          full_name: data?.[index]?.full_name || email.split('@')[0],
          avatar_emoji: data?.[index]?.avatar_emoji || '🖤',
        }));

        setAccounts(accountsWithEmails);
      } catch (err) {
        console.error('Error fetching accounts:', err);
        // Fallback to demo emails only
        setAccounts(DEMO_EMAILS.map(email => ({
          email,
          full_name: email.split('@')[0],
          avatar_emoji: '🖤',
        })));
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
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
      const { error } = await signIn(account.email, DEMO_PASSWORD);
      
      if (error) {
        toast({
          title: 'Errore',
          description: 'Account non configurato. Contatta l\'amministratore.',
          variant: 'destructive',
        });
      } else {
        const firstName = account.full_name.split(' ')[0];
        toast({ title: `Benvenuta, ${firstName}!` });
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
          {loadingAccounts ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account, index) => (
                <button
                  key={account.email}
                  onClick={() => handleSelectAccount(account)}
                  disabled={loading !== null}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                    "bg-card/80 backdrop-blur-sm border border-border/50",
                    "hover:scale-[1.02] hover:shadow-lg hover:border-primary/30",
                    "active:scale-[0.98]",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    loading === account.email && "ring-2 ring-primary animate-pulse"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center text-2xl",
                    bgColors[index % bgColors.length]
                  )}>
                    {account.avatar_emoji}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">{account.full_name}</p>
                    <p className="text-xs text-muted-foreground">Tocca per accedere</p>
                  </div>
                  {loading === account.email ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          )}

          <p className="text-center text-[10px] text-muted-foreground/60 mt-8 tracking-wide">
            ACCESSO RISERVATO AL TEAM
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;