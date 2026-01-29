import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKPIs } from '@/hooks/useKPIs';
import { useSedeTargets } from '@/hooks/useSedeTargets';
import logo from '@/assets/keipiai_logo.svg';
import ProfileModal from '@/components/profile/ProfileModal';

interface HeaderProps {
  onOpenProfile?: () => void;
}

const Header = ({ onOpenProfile }: HeaderProps) => {
  const { signOut, profile } = useAuth();
  const { kpis } = useKPIs('year');
  const { targets } = useSedeTargets();
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

  // Use fatturato_target from sede_targets (annual value)
  const target = targets.fatturato_target || 500000;
  const current = kpis?.fatturato?.value || 0;
  const remaining = Math.max(0, target - current);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[60]">
        {/* iOS Safe Area Background */}
        <div className="absolute inset-x-0 top-0 h-[env(safe-area-inset-top)] bg-black" />
        
        {/* Ticker Banner - Black with smooth scroll */}
        <div className="bg-black text-white pt-[env(safe-area-inset-top)] pb-2 overflow-hidden">
          <div className="flex ticker-smooth whitespace-nowrap pt-2">
            {[...Array(8)].map((_, i) => (
              <span key={i} className="flex items-center gap-6 mx-6 text-sm font-bold tracking-[0.15em] uppercase">
                <span>MANCANO €{formatCurrency(remaining)} AL TRAGUARDO</span>
                <span>★</span>
                <span>OBBIETTIVO FATTURATO AGENZIA €{formatCurrency(target)}</span>
                <span>★</span>
              </span>
            ))}
          </div>
        </div>

        {/* Main Header - Liquid Glass Effect */}
        <div className="glass-header flex items-center justify-between px-4 py-0.5 rounded-b-[2rem]">
          {/* Profile Button */}
          <button 
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 rounded-full glass-button flex items-center justify-center hover:scale-105 transition-transform text-xl"
          >
            {profile?.avatar_emoji || '🖤'}
          </button>

          {/* Brand Logo */}
          <img src={logo} alt="Cortesi Luxury Real Estate" className="h-12" />

          {/* Logout */}
          <button 
            onClick={handleSignOut}
            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
};

export default Header;