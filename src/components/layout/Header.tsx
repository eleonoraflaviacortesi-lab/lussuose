import { useAuth } from '@/hooks/useAuth';
import { LogOut, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKPIs } from '@/hooks/useKPIs';
import logo from '@/assets/le_lussuose.svg';

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
    <header className="fixed top-0 left-0 right-0 z-50">
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

      {/* Main Header - Liquid Glass Effect */}
      <div className="glass-header flex items-center justify-between px-6 py-4 rounded-b-3xl">
        {/* Logo with Heart */}
        <button className="w-11 h-11 rounded-full glass-button flex items-center justify-center">
          <Heart className="w-5 h-5 text-foreground" fill="currentColor" />
        </button>

        {/* Brand Logo */}
        <img src={logo} alt="Le Lussuose" className="h-20" />

        {/* Logout */}
        <button 
          onClick={handleSignOut}
          className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;