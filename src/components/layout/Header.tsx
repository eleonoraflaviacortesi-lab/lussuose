import { useUser } from '@/context/UserContext';
import { Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Header = () => {
  const { currentUser, setCurrentUser, allUsers } = useUser();

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
      <div className="flex items-center gap-2">
        <span className="font-serif text-2xl font-semibold tracking-wide text-foreground">
          LUXURY
        </span>
        <span className="font-serif text-2xl font-light text-accent">
          ESTATES
        </span>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
            <Avatar className="h-9 w-9 bg-accent text-accent-foreground">
              <AvatarFallback className="bg-accent text-accent-foreground font-medium text-sm">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{currentUser.sede}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {allUsers.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => setCurrentUser(user)}
                className={currentUser.id === user.id ? 'bg-muted' : ''}
              >
                <Avatar className="h-6 w-6 mr-2 bg-accent/20">
                  <AvatarFallback className="text-xs bg-accent/20 text-accent">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {user.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
