import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKPIs } from '@/hooks/useKPIs';
import logo from '@/assets/le_lussuose_large.svg';
import ProfileModal from '@/components/profile/ProfileModal';

interface HeaderProps {
  onOpenProfile?: () => void;
}

const Header = ({ onOpenProfile }: HeaderProps) => {
  const { signOut, profile } = useAuth();
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
        {/* iOS Safe Area Background */}
        <div className="absolute inset-x-0 top-0 h-[env(safe-area-inset-top)] bg-primary" />
        
        {/* Ticker Banner */}
        <div className="bg-primary text-primary-foreground pt-[env(safe-area-inset-top)] pb-2.5 overflow-hidden">
          <div className="flex animate-ticker whitespace-nowrap pt-2.5">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="flex items-center gap-6 mx-6 text-sm font-bold tracking-[0.2em] uppercase">
                <span>MANCANO €{formatCurrency(remaining)} AL TRAGUARDO</span>
                <span>★</span>
                <span>OBBIETTIVO FATTURATO AGENZIA €{formatCurrency(target)}</span>
                <span>★</span>
              </span>
            ))}
          </div>
        </div>

        {/* Main Header - Liquid Glass Effect */}
        <div className="glass-header flex items-center justify-between px-6 rounded-b-[2rem]">
          {/* Profile Button */}
          <button 
            onClick={() => setShowProfile(true)}
            className="w-11 h-11 rounded-full glass-button flex items-center justify-center hover:scale-105 transition-transform text-xl"
          >
            {profile?.avatar_emoji || '🖤'}
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