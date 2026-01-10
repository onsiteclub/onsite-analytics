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
  Bot,
  Wrench,
  LogOut,
} from 'lucide-react';

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
    description: 'Who are the users',
    color: 'text-blue-500',
  },
  {
    name: 'Business',
    href: '/dashboard/business',
    icon: Briefcase,
    description: 'Value generated',
    color: 'text-sky-500',
  },
  {
    name: 'Product',
    href: '/dashboard/product',
    icon: Lightbulb,
    description: 'UX & Engagement',
    color: 'text-indigo-500',
  },
  {
    name: 'Debug',
    href: '/dashboard/debug',
    icon: Bug,
    description: 'System health',
    color: 'text-red-500',
  },
];

const tools = [
  {
    name: 'Teletraan9',
    href: '/dashboard/assistant',
    icon: Bot,
    badge: 'AI',
  },
  {
    name: 'Support',
    href: '/dashboard/support',
    icon: Wrench,
    description: 'Ref # decoder',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">OS</span>
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
                    ? 'bg-blue-500/10 text-blue-600 font-medium'
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
            Tools
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
                    ? 'bg-blue-500/10 text-blue-600 font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <div className="flex-1">
                  <span>{item.name}</span>
                  {'description' in item && item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
                {'badge' in item && item.badge && (
                  <span className="text-[10px] font-medium bg-blue-600 text-white px-1.5 py-0.5 rounded">
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
          <span>System operational</span>
        </div>
      </div>
    </div>
  );
}
