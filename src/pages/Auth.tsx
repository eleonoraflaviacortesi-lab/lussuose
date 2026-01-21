import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import logoLarge from '@/assets/le_lussuose_large.svg';
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


const Auth = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Fetch demo accounts from database - match by name patterns
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_emoji, user_id');

        if (error) throw error;

        // Match profiles to emails by name pattern
        const accountsWithEmails: DemoAccount[] = DEMO_EMAILS.map((email) => {
          const emailPrefix = email.split('@')[0].toLowerCase();
          
          // Find matching profile by checking if the name contains part of the email
          const matchedProfile = data?.find(profile => {
            const fullNameLower = profile.full_name.toLowerCase();
            // Check if first name matches email prefix
            const firstName = fullNameLower.split(' ')[0];
            return emailPrefix.includes(firstName) || firstName.includes(emailPrefix.slice(0, 4));
          });
          
          return {
            email,
            full_name: matchedProfile?.full_name || email.split('@')[0],
            avatar_emoji: matchedProfile?.avatar_emoji || '🖤',
          };
        });

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
                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all shadow-lg",
                    "bg-card border border-border/30",
                    "hover:scale-[1.02] hover:shadow-xl",
                    "active:scale-[0.98]",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    loading === account.email && "ring-2 ring-foreground"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-muted",
                  )}>
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
          )}

          <p className="text-center text-[10px] text-muted-foreground/60 mt-8 tracking-[0.2em] uppercase">
            ACCESSO RISERVATO AL TEAM
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;