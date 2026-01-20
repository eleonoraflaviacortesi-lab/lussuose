import { useState, useEffect } from 'react';
import { X, Camera, Check, User, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['👑', '👩‍💼', '📈', '🏠', '✨', '🖤', '💼', '💎'];

const ProfileModal = ({ open, onClose }: ProfileModalProps) => {
  const { profile, user, refetchProfile } = useAuth();
  const [avatarType, setAvatarType] = useState<'emoji' | 'photo'>('emoji');
  const [selectedEmoji, setSelectedEmoji] = useState('🖤');
  const [customEmoji, setCustomEmoji] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      if (profile.avatar_emoji) {
        setSelectedEmoji(profile.avatar_emoji);
      }
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const avatarToSave = customEmoji || selectedEmoji;
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          avatar_emoji: avatarToSave
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await refetchProfile();
      toast({ title: 'Profilo aggiornato con successo!' });
      onClose();
    } catch (error: any) {
      toast({ 
        title: 'Errore', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentEmoji = customEmoji || selectedEmoji;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-card border-border rounded-3xl p-8">
        <DialogHeader className="flex flex-row items-center justify-between pb-6 border-b border-border">
          <div>
            <DialogTitle className="text-2xl font-bold tracking-tight">PROFILO</DialogTitle>
            <div className="w-12 h-1 bg-primary mt-2" />
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
        </DialogHeader>

        <div className="space-y-8 pt-6">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center text-6xl border-4 border-background shadow-lg">
                {currentEmoji}
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg">
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Photo/Emoji Toggle */}
          <div className="flex rounded-full bg-muted p-1">
            <button
              onClick={() => setAvatarType('photo')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-medium tracking-wider uppercase transition-colors ${
                avatarType === 'photo' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
              }`}
            >
              <span>📷</span> FOTO
            </button>
            <button
              onClick={() => setAvatarType('emoji')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-medium tracking-wider uppercase transition-colors ${
                avatarType === 'emoji' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
              }`}
            >
              <span>😊</span> EMOJI
            </button>
          </div>

          {/* Emoji Selector */}
          {avatarType === 'emoji' && (
            <div className="space-y-4">
              <div className="flex justify-center gap-3 flex-wrap">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setSelectedEmoji(emoji);
                      setCustomEmoji('');
                    }}
                    className={`w-12 h-12 text-2xl rounded-xl flex items-center justify-center transition-all ${
                      selectedEmoji === emoji && !customEmoji
                        ? 'bg-foreground text-background ring-2 ring-foreground ring-offset-2'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Input
                  placeholder="Custom emoji..."
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  className="text-center bg-muted border-0 rounded-xl h-12"
                />
                <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Identity Section */}
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
              IDENTITÀ COLLABORATORE
            </p>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-12 bg-muted border-0 rounded-xl h-14 text-base"
                placeholder="Nome completo"
              />
            </div>
          </div>

          {/* Role and Sede */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
                RUOLO OPERATIVO
              </p>
              <div className="bg-muted rounded-xl h-14 flex items-center px-4">
                <span className="text-base capitalize">{profile?.role || 'Agente'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
                SEDE DI RIFERIMENTO
              </p>
              <div className="relative bg-muted rounded-xl h-14 flex items-center px-4">
                <MapPin className="w-5 h-5 text-muted-foreground mr-3" />
                <span className="text-base">{profile?.sede || 'AREZZO'}</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-foreground text-background rounded-full h-14 flex items-center justify-center gap-3 font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'SALVATAGGIO...' : 'AGGIORNA PROFILO'}
            <Check className="w-5 h-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
