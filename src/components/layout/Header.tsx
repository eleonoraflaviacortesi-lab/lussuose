import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKPIs } from '@/hooks/useKPIs';
import logo from '@/assets/le_lussuose_large.svg';
import ProfileModal from '@/components/profile/ProfileModal';

interface HeaderProps {
  onOpenProfile?: () => void;
}

const Header = ({ onOpenProfile }: HeaderProps) => {
  const { signOut } = useAuth();
  const { kpis } = useKPIs('year');
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

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

  const target = 500000;
  const current = kpis?.fatturato?.value || 0;
  const remaining = Math.max(0, target - current);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Ticker Banner */}
        <div className="bg-primary text-primary-foreground py-2 overflow-hidden">
          <div className="flex animate-ticker whitespace-nowrap">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="flex items-center gap-4 mx-8 text-xs tracking-widest uppercase">
                <span className="font-light">OBBIETTIVO FATTURATO AGENZIA:</span>
                <span className="font-bold">€ {formatCurrency(target)}</span>
                <span className="font-light">★</span>
                <span className="font-light">MANCANO:</span>
                <span className="font-bold">€ {formatCurrency(remaining)}</span>
                <span className="font-light">AL TRAGUARDO</span>
                <span className="font-light">★</span>
              </span>
            ))}
          </div>
        </div>

        {/* Main Header - Liquid Glass Effect */}
        <div className="glass-header flex items-center justify-between px-6 rounded-b-3xl">
          {/* Profile Button with Heart */}
          <button 
            onClick={() => setShowProfile(true)}
            className="w-11 h-11 rounded-full glass-button flex items-center justify-center hover:scale-105 transition-transform"
          >
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

      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
};

export default Header;