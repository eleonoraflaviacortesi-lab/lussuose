import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Heart } from 'lucide-react';
import logo from '@/assets/le_lussuose.svg';
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Pink Header */}
      <div className="bg-primary py-8 text-center rounded-b-3xl">
        <img src={logo} alt="Le Lussuose" className="h-12 mx-auto invert brightness-0 invert" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full glass-button flex items-center justify-center">
              <Heart className="w-7 h-7 text-foreground" fill="currentColor" />
            </div>
          </div>

          <h2 className="text-center text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-8">
            {isLogin ? 'ACCEDI AL TUO ACCOUNT' : 'CREA UN NUOVO ACCOUNT'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <Label className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Nome Completo</Label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="es. Eleonora Rossi"
                  required={!isLogin}
                  className="mt-2 rounded-full px-5 py-6 bg-secondary border-0"
                />
              </div>
            )}

            <div>
              <Label className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@esempio.com"
                required
                className="mt-2 rounded-full px-5 py-6 bg-secondary border-0"
              />
            </div>

            <div>
              <Label className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-2 rounded-full px-5 py-6 bg-secondary border-0"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <Label className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Ruolo</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="mt-2 rounded-full px-5 py-6 bg-secondary border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agente">Agente</SelectItem>
                      <SelectItem value="coordinatore">Coordinatore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Sede</Label>
                  <Select value={sede} onValueChange={setSede}>
                    <SelectTrigger className="mt-2 rounded-full px-5 py-6 bg-secondary border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AREZZO">AREZZO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn-pink w-full mt-6"
              disabled={loading}
            >
              <span className="text-sm tracking-[0.2em]">
                {loading ? 'CARICAMENTO...' : isLogin ? 'ACCEDI' : 'REGISTRATI'}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors"
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