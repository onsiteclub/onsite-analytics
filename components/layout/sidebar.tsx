'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Lightbulb,
  Bug,
  Sparkles,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  {
    name: 'Overview',
    href: '/dashboard/overview',
    icon: LayoutDashboard,
  },
  {
    name: 'Identity',
    href: '/dashboard/identity',
    icon: Users,
    description: 'Quem são os usuários',
    color: 'text-blue-500',
  },
  {
    name: 'Business',
    href: '/dashboard/business',
    icon: Briefcase,
    description: 'Valor gerado',
    color: 'text-orange-500',
  },
  {
    name: 'Product',
    href: '/dashboard/product',
    icon: Lightbulb,
    description: 'UX & Engagement',
    color: 'text-yellow-500',
  },
  {
    name: 'Debug',
    href: '/dashboard/debug',
    icon: Bug,
    description: 'Saúde do sistema',
    color: 'text-red-500',
  },
];

const tools = [
  {
    name: 'Dr. André',
    href: '/dashboard/assistant',
    icon: Sparkles,
    badge: 'IA',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">OS</span>
        </div>
        <div>
          <span className="font-semibold">OnSite</span>
          <span className="text-muted-foreground text-sm ml-1">Analytics</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Main */}
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Dashboard
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className={cn('h-4 w-4', item.color)} />
                <div className="flex-1">
                  <span>{item.name}</span>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Tools */}
        <div className="pt-4 border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Ferramentas
          </p>
          {tools.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="text-[10px] font-medium bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Sistema operacional</span>
        </div>
      </div>
    </div>
  );
}
