import { useState } from 'react';
import { Bell, Check, Users, ExternalLink, AtSign, FileText } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface NotificationBellProps {
  onOpenCliente?: (clienteId: string) => void;
}

export function NotificationBell({ onOpenCliente }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    
    // If it's an assignment notification with a reference, open the client
    if (notification.type === 'assignment' && notification.reference_id && onOpenCliente) {
      setOpen(false);
      onOpenCliente(notification.reference_id);
    }
    // Handle mention notifications - open the referenced entity
    if (notification.type === 'mention' && notification.reference_id && onOpenCliente) {
      setOpen(false);
      onOpenCliente(notification.reference_id);
    }
    if (notification.type === 'tally_submission' && notification.reference_id && onOpenCliente) {
      setOpen(false);
      onOpenCliente(notification.reference_id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <Users className="w-4 h-4 text-[hsl(var(--banner))]" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-[hsl(var(--banner))]" />;
      case 'tally_submission':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed bottom-24 left-4 z-40">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button 
            className="relative w-12 h-12 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label={`Notifiche${unreadCount > 0 ? ` (${unreadCount} non lette)` : ''}`}
          >
            {/* Starburst background */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
              style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.18))' }}
            >
              <polygon
                fill="white"
                points={Array.from({ length: 16 }, (_, i) => {
                  const angle = (i * 360) / 16 - 90;
                  const r = i % 2 === 0 ? 50 : 35;
                  const x = 50 + r * Math.cos((angle * Math.PI) / 180);
                  const y = 50 + r * Math.sin((angle * Math.PI) / 180);
                  return `${x},${y}`;
                }).join(' ')}
              />
            </svg>
            <Bell className="w-5 h-5 relative z-10" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[hsl(var(--banner))] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md z-10">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent 
          side="top"
          align="start"
          sideOffset={12}
          className="w-80 p-0 bg-white rounded-2xl shadow-xl"
        >
          <div className="flex items-center justify-between p-3">
            <h3 className="font-semibold text-sm">Notifiche</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7"
                onClick={() => markAllAsRead()}
              >
                <Check className="w-3 h-3 mr-1" />
                Segna tutte lette
              </Button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Nessuna notifica
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3",
                    !notification.read && "bg-[hsl(var(--banner))]/5"
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm",
                      !notification.read && "font-medium"
                    )}>
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { 
                        addSuffix: true, 
                        locale: it 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {notification.type === 'assignment' && notification.reference_id && (
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    )}
                    {!notification.read && (
                      <div className="w-2 h-2 bg-[hsl(var(--banner))] rounded-full" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
