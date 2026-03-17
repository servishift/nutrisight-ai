import { useState } from 'react';
import { Bell, Search, Menu, User, FileText, Settings, Megaphone, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface Props {
  onMobileMenuToggle: () => void;
}

export default function AdminHeader({ onMobileMenuToggle }: Props) {
  const { admin } = useAdminAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSearch = (value: string) => {
    setOpen(false);
    if (value.startsWith('/')) {
      navigate(value);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-sm lg:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMobileMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search users, settings, logs... (Ctrl+K)" 
            className="pl-9 h-9 bg-muted/50 border-0 cursor-pointer" 
            onClick={() => setOpen(true)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(true);
              }
            }}
            readOnly
          />
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

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type to search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => handleSearch('/admin')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSearch('/admin/users')}>
              <User className="mr-2 h-4 w-4" />
              <span>Users</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSearch('/admin/additives')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Additives</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSearch('/admin/analytics')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Analytics</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSearch('/admin/reports')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              <span>Reports</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSearch('/admin/marketing')}>
              <Megaphone className="mr-2 h-4 w-4" />
              <span>Marketing</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSearch('/admin/content')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Content</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSearch('/admin/audit-logs')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Audit Logs</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSearch('/admin/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => handleSearch('/admin/users')}>
              <span>Search Users</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSearch('/admin/additives')}>
              <span>Search Additives</span>
            </CommandItem>
            <CommandItem onSelect={() => handleSearch('/admin/settings')}>
              <span>Platform Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
