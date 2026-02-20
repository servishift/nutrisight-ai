import { Bell, Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '../contexts/AdminAuthContext';

interface Props {
  onMobileMenuToggle: () => void;
}

export default function AdminHeader({ onMobileMenuToggle }: Props) {
  const { admin } = useAdminAuth();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-sm lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMobileMenuToggle}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search…" className="pl-9 h-9 bg-muted/50 border-0" />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {admin?.displayName?.charAt(0) || 'A'}
          </div>
          <span className="hidden text-sm font-medium text-foreground sm:block">
            {admin?.displayName || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  );
}
