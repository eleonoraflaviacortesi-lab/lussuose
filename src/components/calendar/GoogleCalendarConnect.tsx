import { useState } from 'react';
import { ExternalLink, Check, Loader2 } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const GoogleCalendarConnect = () => {
  const { profile } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if Google is connected (has tokens stored)
  const isConnected = !!(profile as any)?.google_access_token;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        console.error('Google OAuth error:', result.error);
        toast.error('Errore nella connessione con Google');
      }
    } catch (error) {
      console.error('Google connect error:', error);
      toast.error('Errore nella connessione');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Clear Google tokens from profile
      const { error } = await supabase
        .from('profiles')
        .update({
          google_access_token: null,
          google_refresh_token: null,
          google_token_expiry: null,
        })
        .eq('id', profile?.id);

      if (error) throw error;
      toast.success('Account Google disconnesso');
      window.location.reload();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Errore nella disconnessione');
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-xl">
          <Check className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-medium text-emerald-600">Google Calendar connesso</span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Disconnetti
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
    >
      {isConnecting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700">Connetti Google Calendar</span>
        </>
      )}
    </button>
  );
};

export default GoogleCalendarConnect;
