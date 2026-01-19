import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('agente');
  const [sede, setSede] = useState('AREZZO');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Errore di accesso',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Benvenuto!' });
          navigate('/');
        }
      } else {
        if (!fullName.trim()) {
          toast({
            title: 'Errore',
            description: 'Inserisci il tuo nome completo',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName, role, sede);
        if (error) {
          toast({
            title: 'Errore di registrazione',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Account creato con successo!' });
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold text-foreground">
            LUXURY <span className="text-accent">ESTATES</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? 'Accedi al tuo account' : 'Crea un nuovo account'}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="es. Eleonora Rossi"
                  required={!isLogin}
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@esempio.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-1"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="role">Ruolo</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agente">Agente</SelectItem>
                      <SelectItem value="coordinatore">Coordinatore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sede">Sede</Label>
                  <Select value={sede} onValueChange={setSede}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AREZZO">AREZZO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={loading}
            >
              {loading ? 'Caricamento...' : isLogin ? 'Accedi' : 'Registrati'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
