import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Phone, Loader2 } from 'lucide-react';

interface ActivityQuickActionsProps {
  onLogCall: (description?: string) => Promise<unknown>;
  isLoading?: boolean;
}

export const ActivityQuickActions = memo(({ 
  onLogCall, 
  isLoading 
}: ActivityQuickActionsProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await onLogCall(description.trim() || undefined);
      setShowDialog(false);
      setDescription('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        className="w-full bg-green-500 hover:bg-green-600 text-white"
        onClick={() => setShowDialog(true)}
        disabled={isLoading}
      >
        <Phone className="w-4 h-4 mr-1.5" />
        Chiama
      </Button>

      {/* Description Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Registra Chiamata
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Note sulla chiamata (opzionale)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
            
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowDialog(false)}
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
