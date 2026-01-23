import { useState, useEffect } from 'react';
import { X, Check, User, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/haptics';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['👑', '👩‍💼', '📈', '🏠', '✨', '🖤', '💼', '💎', '🌸', '💅', '👠', '💄'];
const SEDI = ['CITTÀ DI CASTELLO', 'AREZZO'] as const;

const pillInputClass = "w-full bg-white rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 focus:outline-none focus:ring-2 focus:ring-primary/20";

const ProfileModal = ({ open, onClose }: ProfileModalProps) => {
  const { profile, user, refetchProfile } = useAuth();
  const [selectedEmoji, setSelectedEmoji] = useState('🖤');
  const [customEmoji, setCustomEmoji] = useState('');
  const [fullName, setFullName] = useState('');
  const [sede, setSede] = useState<string>('AREZZO');
  const [selectedSedi, setSelectedSedi] = useState<string[]>([]);
  const [role, setRole] = useState<string>('agente');
  const [isLoading, setIsLoading] = useState(false);

  const isCoordinator = role === 'coordinatore' || role === 'admin';

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setSede(profile.sede || 'AREZZO');
      setSelectedSedi((profile as any).sedi || []);
      setRole(profile.role || 'agente');
      if (profile.avatar_emoji) {
        setSelectedEmoji(profile.avatar_emoji);
      }
    }
  }, [profile]);

  const toggleSede = (s: string) => {
    triggerHaptic('selection');
    setSelectedSedi(prev => 
      prev.includes(s) 
        ? prev.filter(x => x !== s)
        : [...prev, s]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const avatarToSave = customEmoji || selectedEmoji;
      const isCoord = role === 'coordinatore' || role === 'admin';
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          avatar_emoji: avatarToSave,
          sede: sede,
          role: role,
          sedi: isCoord ? selectedSedi : []
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      triggerHaptic('success');
      await refetchProfile();
      toast({ title: 'Profilo aggiornato!' });
      onClose();
    } catch (error: any) {
      triggerHaptic('error');
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

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-md" />
      
      {/* Liquid Glass Card */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative z-10 w-full max-w-sm",
          "bg-white/85 backdrop-blur-2xl",
          "rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]",
          "p-6 animate-in zoom-in-95 fade-in duration-200",
          "max-h-[90vh] overflow-y-auto"
        )}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground active:scale-95 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h3 className="text-center text-base font-bold tracking-wide uppercase mb-6">
          Il Mio Profilo
        </h3>

        <div className="space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex items-center justify-center text-5xl">
                {currentEmoji}
              </div>
            </div>
          </div>

          {/* Emoji Selector */}
          <div className="space-y-3">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground text-center">
              SCEGLI AVATAR
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setSelectedEmoji(emoji);
                    setCustomEmoji('');
                  }}
                  className={cn(
                    "w-10 h-10 text-xl rounded-full flex items-center justify-center transition-all active:scale-95",
                    selectedEmoji === emoji && !customEmoji
                      ? 'bg-foreground text-background shadow-lg'
                      : 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-md'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input
              placeholder="Oppure incolla emoji personalizzata..."
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              className={cn(pillInputClass, "text-center")}
            />
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
              NOME COMPLETO
            </p>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={cn(pillInputClass, "pl-11")}
                placeholder="Il tuo nome"
              />
            </div>
          </div>

          {/* Role and Sede */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
                RUOLO
              </p>
              <div className="flex gap-1">
                {(['agente', 'coordinatore'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      triggerHaptic('selection');
                      setRole(r);
                    }}
                    className={cn(
                      "flex-1 h-10 rounded-full text-[10px] font-medium transition-all flex items-center justify-center capitalize active:scale-95",
                      role === r
                        ? "bg-foreground text-background"
                        : "bg-muted/50 text-muted-foreground"
                    )}
                  >
                    {r === 'coordinatore' ? 'Coord.' : 'Agente'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
                {isCoordinator ? 'SEDE PRINCIPALE' : 'SEDE'}
              </p>
              <div className="flex gap-1">
                {SEDI.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      triggerHaptic('selection');
                      setSede(s);
                    }}
                    className={cn(
                      "flex-1 h-10 rounded-full text-[10px] font-medium transition-all flex items-center justify-center gap-1 active:scale-95",
                      sede === s
                        ? "bg-foreground text-background"
                        : "bg-muted/50 text-muted-foreground"
                    )}
                  >
                    <MapPin className="w-3 h-3" />
                    {s === 'CITTÀ DI CASTELLO' ? 'CDT' : 'AR'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Multi-sede for coordinators */}
          {isCoordinator && (
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground">
                SEDI GESTITE (MULTI-SELEZIONE)
              </p>
              <div className="flex gap-2">
                {SEDI.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSede(s)}
                    className={cn(
                      "flex-1 h-12 rounded-2xl text-xs font-medium transition-all flex items-center justify-center gap-2 active:scale-95",
                      selectedSedi.includes(s)
                        ? "bg-foreground text-background shadow-lg"
                        : "bg-muted/50 text-muted-foreground border-2 border-dashed border-muted-foreground/30"
                    )}
                  >
                    <MapPin className="w-4 h-4" />
                    {s === 'CITTÀ DI CASTELLO' ? 'Città di Castello' : 'Arezzo'}
                    {selectedSedi.includes(s) && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Seleziona le sedi di cui vuoi vedere clienti e notizie
              </p>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-foreground text-background rounded-full h-12 flex items-center justify-center gap-2 font-medium tracking-[0.15em] uppercase text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            {isLoading ? 'SALVATAGGIO...' : 'SALVA'}
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
