import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Phone, Mail, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityQuickActionsProps {
  onLogCall: (description?: string) => Promise<unknown>;
  onLogEmail: (description?: string) => Promise<unknown>;
  onLogVisit: (description?: string) => Promise<unknown>;
  isLoading?: boolean;
}

type ActionType = 'call' | 'email' | 'visit' | null;

const actionConfig = {
  call: { 
    icon: Phone, 
    label: 'Chiamata',
    placeholder: 'Note sulla chiamata (opzionale)...',
    color: 'bg-green-500 hover:bg-green-600' 
  },
  email: { 
    icon: Mail, 
    label: 'Email',
    placeholder: 'Oggetto/contenuto email (opzionale)...',
    color: 'bg-blue-500 hover:bg-blue-600' 
  },
  visit: { 
    icon: Calendar, 
    label: 'Visita',
    placeholder: 'Dettagli appuntamento (opzionale)...',
    color: 'bg-purple-500 hover:bg-purple-600' 
  },
};

export const ActivityQuickActions = memo(({ 
  onLogCall, 
  onLogEmail, 
  onLogVisit,
  isLoading 
}: ActivityQuickActionsProps) => {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    if (!activeAction) return;
    
    setIsSaving(true);
    try {
      const desc = description.trim() || undefined;
      if (activeAction === 'call') await onLogCall(desc);
      else if (activeAction === 'email') await onLogEmail(desc);
      else if (activeAction === 'visit') await onLogVisit(desc);
      
      setActiveAction(null);
      setDescription('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAction = async (type: ActionType) => {
    // If shift key is held, skip the dialog and log immediately
    setActiveAction(type);
  };

  return (
    <>
      <div className="flex gap-2">
        {(Object.keys(actionConfig) as ActionType[]).filter(Boolean).map(type => {
          if (!type) return null;
          const config = actionConfig[type];
          const Icon = config.icon;
          return (
            <Button
              key={type}
              size="sm"
              variant="secondary"
              className={cn("flex-1 text-white", config.color)}
              onClick={() => handleQuickAction(type)}
              disabled={isLoading}
            >
              <Icon className="w-4 h-4 mr-1.5" />
              {config.label}
            </Button>
          );
        })}
      </div>

      {/* Description Dialog */}
      <Dialog open={!!activeAction} onOpenChange={(open) => !open && setActiveAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeAction && (
                <>
                  {(() => {
                    const Icon = actionConfig[activeAction].icon;
                    return <Icon className="w-5 h-5" />;
                  })()}
                  Registra {actionConfig[activeAction]?.label}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder={activeAction ? actionConfig[activeAction].placeholder : ''}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
            
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setActiveAction(null)}
                disabled={isSaving}
              >
                Annulla
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Conferma
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
ActivityQuickActions.displayName = 'ActivityQuickActions';

export default ActivityQuickActions;
