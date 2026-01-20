import { useAuth } from '@/hooks/useAuth';
import { LogOut, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKPIs } from '@/hooks/useKPIs';

const Header = () => {
  const { signOut } = useAuth();
  const { kpis } = useKPIs('year');
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const target = 1600010;
  const current = kpis?.fatturato?.value || 0;
  const remaining = Math.max(0, target - current);

  return (
    <header className="relative">
      {/* Ticker Banner */}
      <div className="bg-primary text-primary-foreground py-3 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="flex items-center gap-4 mx-8 text-sm font-medium tracking-widest uppercase">
              <span>€ {formatCurrency(target)}</span>
              <span>★</span>
              <span>MANCANO: € {formatCurrency(remaining)}</span>
              <span className="mx-4">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-background">
        {/* Logo with Heart */}
        <button className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border">
          <Heart className="w-5 h-5 text-foreground" fill="currentColor" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-0.5">
          <span className="text-xl font-semibold tracking-[0.2em] text-foreground">LE LUSSUOS</span>
          <span className="text-xl font-semibold text-primary">E</span>
        </div>

        {/* Logout */}
        <button 
          onClick={handleSignOut}
          className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;