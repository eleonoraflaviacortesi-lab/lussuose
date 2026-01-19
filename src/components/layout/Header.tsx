import { useAuth } from '@/hooks/useAuth';
import { Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-card border-b border-border">
      <div className="flex items-center gap-2">
        <span className="font-serif text-xl md:text-2xl font-semibold tracking-wide text-foreground">
          LUXURY
        </span>
        <span className="font-serif text-xl md:text-2xl font-light text-accent">
          ESTATES
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {profile && (
          <div className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg">
            <Avatar className="h-8 w-8 md:h-9 md:w-9 bg-accent text-accent-foreground">
              <AvatarFallback className="bg-accent text-accent-foreground font-medium text-xs md:text-sm">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{profile.sede}</p>
            </div>
          </div>
        )}

        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <button 
          onClick={handleSignOut}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
