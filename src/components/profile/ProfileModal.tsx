import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Settings, X } from 'lucide-react';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

const ProfileModal = ({ open, onClose, onOpenSettings }: ProfileModalProps) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (!open) return null;

  const handleGoToSettings = () => {
    onClose();
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      navigate('/settings');
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[55] flex flex-col bg-background md:left-[var(--sidebar-width,16rem)]",
        "animate-in slide-in-from-bottom duration-300",
      )}
      style={{ top: 'calc(var(--banner-height, 28px) + 3.5rem)' }}
    >
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-sm mx-auto w-full flex flex-col items-center justify-center gap-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground active:scale-95 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Avatar preview */}
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-5xl shadow-sm">
          {profile?.avatar_emoji || '👤'}
        </div>

        <div className="text-center">
          <p className="text-lg font-bold">{profile?.full_name || 'Profilo'}</p>
          <p className="text-sm text-muted-foreground">{profile?.sede}</p>
        </div>

        <button
          onClick={handleGoToSettings}
          className="w-full max-w-xs bg-foreground text-background rounded-full h-12 flex items-center justify-center gap-2 font-medium tracking-[0.15em] uppercase text-sm hover:bg-foreground/90 transition-colors active:scale-[0.98]"
        >
          <Settings className="w-4 h-4" />
          Vai alle Impostazioni
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;
