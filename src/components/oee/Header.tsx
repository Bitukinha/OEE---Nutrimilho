import { Link, useLocation } from 'react-router-dom';
import logo from '@/assets/logo-nutrimilho.png';
import { Bell, Settings, User, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';
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
  { href: '/motivos', label: 'Motivos' },
];

const HeaderActions = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" className="relative" onClick={() => toast('Notificações ativadas')}>
        <Bell className="h-5 w-5" />
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
      </Button>

      <div className="relative">
        <Button variant="ghost" size="icon" className="hidden sm:flex" onClick={() => setOpen(!open)}>
          <Settings className="h-5 w-5" />
        </Button>

        {open && (
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
                    setOpen(false);
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

      <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
        <User className="h-5 w-5" />
      </Button>
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
