import { useState } from 'react';
import { Bell, Check, Users } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = async (id: string) => {
    await markAsRead(id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <Users className="w-4 h-4 text-primary" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-80 p-0 bg-white rounded-2xl shadow-xl"
      >
        <div className="flex items-center justify-between p-3 border-b">
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
                onClick={() => handleNotificationClick(notification.id)}
                className={cn(
                  "w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3",
                  !notification.read && "bg-primary/5"
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
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
