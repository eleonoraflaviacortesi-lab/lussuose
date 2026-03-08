import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Settings, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16 px-4 max-w-sm mx-auto w-full">
      {/* Avatar */}
      <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center text-6xl shadow-sm">
        {profile?.avatar_emoji || '👤'}
      </div>

      {/* Info */}
      <div className="text-center space-y-1">
        <p className="text-xl font-bold tracking-tight">{profile?.full_name || 'Profilo'}</p>
        <p className="text-sm text-muted-foreground uppercase tracking-widest"
          style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
          {profile?.sede}
        </p>
        {profile?.role && (
          <p className="text-xs text-muted-foreground/70 uppercase tracking-wider"
            style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
            {profile.role}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => navigate('/settings')}
          className="w-full bg-foreground text-background rounded-full h-12 flex items-center justify-center gap-2 font-medium tracking-[0.15em] uppercase text-sm hover:bg-foreground/90 transition-colors active:scale-[0.98]"
        >
          <Settings className="w-4 h-4" />
          Impostazioni
        </button>

        <button
          onClick={handleSignOut}
          className="w-full border border-border text-muted-foreground rounded-full h-12 flex items-center justify-center gap-2 font-medium tracking-[0.15em] uppercase text-sm hover:text-destructive hover:border-destructive/30 transition-colors active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
