import { useState } from 'react';
import { triggerHaptic } from '@/lib/haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { startOfWeek, format } from 'date-fns';
import { Target, Check, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMeetings } from '@/hooks/useMeetings';
import { useWeeklyProductionData } from '@/hooks/useWeeklyProductionData';
import { celebrateGasiAbbestia } from '@/lib/confetti';
import { GasiCelebration } from '@/components/ui/gasi-celebration';
import { cn } from '@/lib/utils';

export const WeeklyGoalsWidget = () => {
  const { user, profile } = useAuth();
  const { updateItem } = useMeetings();
  const queryClient = useQueryClient();
  const [showCelebration, setShowCelebration] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Get current week start
  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Fetch real production data for this week
  const { data: productionData } = useWeeklyProductionData(currentWeekStart, user?.id || null);

  // Fetch user's goals for current week
  const { data: goals, isLoading } = useQuery({
    queryKey: ['weekly-goals', user?.id, currentWeekStart],
    queryFn: async () => {
      if (!user?.id || !profile?.sede) return [];

      // Find meeting for current week
      const { data: meeting } = await supabase
        .from('meetings')
        .select('id')
        .eq('sede', profile.sede)
        .eq('week_start', currentWeekStart)
        .single();

      if (!meeting) return [];

      // Fetch goals assigned to current user
      const { data: items, error } = await supabase
        .from('meeting_items')
        .select('*')
        .eq('meeting_id', meeting.id)
        .eq('item_type', 'obiettivo')
        .eq('assigned_to', user.id);

      if (error) throw error;
      return items || [];
    },
    enabled: !!user?.id && !!profile?.sede,
  });

  const handleCompleteGoal = async (goalId: string, meetingId: string) => {
    setCompletingId(goalId);
    
    try {
      await updateItem.mutateAsync({
        id: goalId,
        meeting_id: meetingId,
        status: 'completed',
      });

      // Trigger celebration
      triggerHaptic('success');
      celebrateGasiAbbestia();
      setShowCelebration(true);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['weekly-goals'] });
      queryClient.invalidateQueries({ queryKey: ['meeting'] });
    } finally {
      setCompletingId(null);
    }
  };

  const handleReopenGoal = async (goalId: string, meetingId: string) => {
    await updateItem.mutateAsync({
      id: goalId,
      meeting_id: meetingId,
      status: 'open',
    });
    
    queryClient.invalidateQueries({ queryKey: ['weekly-goals'] });
    queryClient.invalidateQueries({ queryKey: ['meeting'] });
  };

  // Don't render if no goals
  if (isLoading || !goals || goals.length === 0) {
    return null;
  }

  const openGoals = goals.filter(g => g.status === 'open');
  const completedGoals = goals.filter(g => g.status === 'completed');

  // Helper to check if actual >= target
  const isGoalMet = (actual: number, target: number) => target > 0 && actual >= target;

  return (
    <>
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-amber-500" />
          <h3 className="text-xs font-semibold tracking-wider uppercase">
            Obiettivi Settimana
          </h3>
        </div>

        <div className="space-y-2">
          {openGoals.map(goal => (
            <div 
              key={goal.id}
              className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-2 gap-1 text-sm">
                  {goal.goal_incarichi > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Incarichi:</span>
                      <span className={cn(
                        "font-semibold",
                        productionData && isGoalMet(productionData.incarichi, goal.goal_incarichi) && "text-green-600"
                      )}>
                        {productionData ? `${productionData.incarichi}/` : ''}{goal.goal_incarichi}
                      </span>
                    </div>
                  )}
                  {goal.goal_notizie > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Notizie:</span>
                      <span className={cn(
                        "font-semibold",
                        productionData && isGoalMet(productionData.notizie, goal.goal_notizie) && "text-green-600"
                      )}>
                        {productionData ? `${productionData.notizie}/` : ''}{goal.goal_notizie}
                      </span>
                    </div>
                  )}
                  {goal.goal_acquisizioni > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Acquisizioni:</span>
                      <span className={cn(
                        "font-semibold",
                        productionData && isGoalMet(productionData.valutazioni, goal.goal_acquisizioni) && "text-green-600"
                      )}>
                        {productionData ? `${productionData.valutazioni}/` : ''}{goal.goal_acquisizioni}
                      </span>
                    </div>
                  )}
                  {goal.goal_trattative > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Trattative:</span>
                      <span className={cn(
                        "font-semibold",
                        productionData && isGoalMet(productionData.trattative, goal.goal_trattative) && "text-green-600"
                      )}>
                        {productionData ? `${productionData.trattative}/` : ''}{goal.goal_trattative}
                      </span>
                    </div>
                  )}
                </div>
                {goal.notes && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{goal.notes}</p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => handleCompleteGoal(goal.id, goal.meeting_id)}
                disabled={completingId === goal.id}
                className="shrink-0"
              >
                {completingId === goal.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Fatto
                  </>
                )}
              </Button>
            </div>
          ))}

          {completedGoals.map(goal => (
            <div 
              key={goal.id}
              className="flex items-center justify-between gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg opacity-75"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Check className="h-4 w-4 text-green-600 shrink-0" />
                <div className="text-sm text-muted-foreground line-through">
                  {goal.goal_incarichi > 0 && <span>Incarichi: {goal.goal_incarichi} </span>}
                  {goal.goal_notizie > 0 && <span>Notizie: {goal.goal_notizie} </span>}
                  {goal.goal_acquisizioni > 0 && <span>Acq: {goal.goal_acquisizioni} </span>}
                  {goal.goal_trattative > 0 && <span>Tratt: {goal.goal_trattative}</span>}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleReopenGoal(goal.id, goal.meeting_id)}
                className="shrink-0 text-xs"
              >
                Riapri
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Celebration overlay */}
      <GasiCelebration 
        show={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />
    </>
  );
};

export default WeeklyGoalsWidget;
