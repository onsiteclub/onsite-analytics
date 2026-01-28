'use client';

import { useUser } from '@/lib/hooks';
import { getInitials } from '@/lib/utils';
import { useHourglassTheme } from '@/lib/theme';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { user } = useUser();
  const { theme, labelPt, accentClass } = useHourglassTheme();

  const dotColor = {
    entrada: 'bg-cyan-500',
    saida: 'bg-amber-500',
    gargalo: 'bg-blue-500',
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        {/* Section indicator */}
        <div className={cn('w-2 h-2 rounded-full shrink-0', dotColor[theme])} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-[10px] font-semibold uppercase tracking-widest', accentClass)}>
              {labelPt}
            </span>
            <span className="text-muted-foreground text-[10px]">/</span>
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-9 w-56 h-9 text-sm"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
        </Button>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-medium">
              {getInitials(user?.email || 'U')}
            </span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium leading-tight">{user?.email}</p>
            <p className="text-[10px] text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
