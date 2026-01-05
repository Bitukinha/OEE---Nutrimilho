import { Link, useLocation } from 'react-router-dom';
import logo from '@/assets/logo-nutrimilho.png';
import { Bell, Settings, Menu } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';
import { onLocalNotify } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/producao', label: 'Produção' },
  { href: '/equipamentos', label: 'Segmentos' },
  { href: '/paradas', label: 'Paradas' },
  { href: '/qualidade', label: 'Qualidade' },
  // Motivos tab removed per user request; revert to free-text input
];

const HeaderActions = () => {
  const { user, signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ table: string; event: string; ts: string }>>([]);
  const bellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = onLocalNotify((payload) => {
      setNotifications((prev) => [{ ...payload, ts: new Date().toISOString() }, ...prev].slice(0, 20));
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={bellRef}>
        <Button variant="ghost" size="icon" className="relative" onClick={() => setBellOpen((s) => !s)}>
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] flex items-center justify-center px-1 text-xs rounded-full bg-destructive text-white">
              {notifications.length}
            </span>
          )}
        </Button>

        {bellOpen && (
          <div className="absolute right-0 mt-2 w-80 max-h-80 overflow-auto bg-card border border-border rounded-md shadow-lg p-2 z-20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Notificações</div>
              {notifications.length > 0 && (
                <button
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() => setNotifications([])}
                >
                  Limpar
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhuma notificação</div>
            ) : (
              notifications.map((n, idx) => (
                <div key={n.ts + idx} className="py-1 border-b last:border-b-0 text-sm flex justify-between items-start">
                  <div>
                    <div className="font-medium">{n.table}</div>
                    <div className="text-xs text-muted-foreground">{n.event} • {new Date(n.ts).toLocaleTimeString()}</div>
                  </div>
                  <button
                    className="ml-4 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => setNotifications((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remover notificação"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <Button variant="ghost" size="icon" className="hidden sm:flex" onClick={() => setSettingsOpen(!settingsOpen)}>
          <Settings className="h-5 w-5" />
        </Button>

        {settingsOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg p-2 z-10">
            {user ? (
              <>
                <Link to="/admin/profile" className="block px-2 py-1 hover:bg-muted rounded text-sm">
                  Perfil
                </Link>
                <button
                  className="w-full text-left px-2 py-1 hover:bg-muted rounded text-sm"
                  onClick={() => {
                    signOut();
                    setSettingsOpen(false);
                  }}
                >
                  Sair
                </button>
              </>
            ) : (
              <Link to="/login" className="block px-2 py-1 hover:bg-muted rounded text-sm">
                Entrar
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Header = () => {
  const location = useLocation();

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            "text-sm font-medium transition-colors",
            mobile
              ? "block py-2 px-4 rounded-lg hover:bg-muted"
              : "px-3 py-2 rounded-md hover:bg-muted/50",
            location.pathname === item.href
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Nutrimilho" className="h-10 object-contain" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-display font-semibold text-foreground">
                  Sistema OEE
                </h1>
                <p className="text-xs text-muted-foreground">
                  Gestão de Eficiência Operacional
                </p>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <NavLinks />
          </nav>

          <div className="flex items-center gap-2">
            <HeaderActions />

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <nav className="flex flex-col gap-2 mt-8">
                  <NavLinks mobile />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
