import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Menu, X, User, LogOut, LayoutDashboard, Upload, Beaker, Crown, Sparkles, Brain, ArrowRightLeft, Atom, Key, Terminal, Activity, Webhook, BarChart3, Network, Utensils, Database } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRegion } from '@/contexts/RegionContext';
import { Button } from '@/components/ui/button';
import { DatabaseToggle } from '@/components/DatabaseToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PUBLIC_NAV = [
  { label: 'Home', path: '/' },
  { label: 'Analyzer', path: '/analyzer' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Docs', path: '/docs' },
];

const AUTH_NAV = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Analyzer', path: '/analyzer' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Batch', path: '/batch' },
  { label: 'Additives', path: '/additives' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Diet Engine', path: '/diet-engine' },
];

const INDIAN_PUBLIC_NAV = [
  { label: '🇮🇳 Home', path: '/indian' },
  { label: 'Search', path: '/indian/search' },
  { label: 'AI Predict', path: '/indian/predict' },
  { label: 'Analyzer', path: '/indian/analyzer' },
];

const INDIAN_AUTH_NAV = [
  { label: '🇮🇳 Home', path: '/indian' },
  { label: 'Search', path: '/indian/search' },
  { label: 'AI Predict', path: '/indian/predict' },
  { label: 'Analyzer', path: '/indian/analyzer' },
  { label: 'Diet Engine', path: '/diet-engine' },
];

export default function Header() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { isIndian } = useRegion();

  const navItems = isIndian 
    ? (isAuthenticated ? INDIAN_AUTH_NAV : INDIAN_PUBLIC_NAV)
    : (isAuthenticated ? AUTH_NAV : PUBLIC_NAV);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to={isIndian ? '/indian' : (isAuthenticated ? '/dashboard' : '/')} className="flex items-center gap-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isIndian ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-primary'}`}>
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            NutriSight<span className={isIndian ? 'text-orange-600' : 'text-accent'}>AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-x-2 -bottom-[1px] h-0.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Auth controls */}
        <div className="hidden items-center gap-3 md:flex">
          <DatabaseToggle />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 max-h-[80vh] overflow-y-auto">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{user?.displayName || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/pricing" className="cursor-pointer">
                    <Crown className="mr-2 h-4 w-4" /> Plans
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border bg-background px-4 pb-4 md:hidden"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-md px-3 py-2.5 text-sm font-medium ${
                location.pathname === item.path ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-border pt-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground"
                >
                  Profile
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="block w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-destructive"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-primary"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </motion.nav>
      )}
    </header>
  );
}
