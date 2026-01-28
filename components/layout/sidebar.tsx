'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Lightbulb,
  Bug,
  Eye,
  Bot,
  Wrench,
  BrainCircuit,
  TrendingUp,
  SlidersHorizontal,
  ShoppingCart,
  FileBarChart,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  Hourglass,
} from 'lucide-react';

// INPUT spheres — Cyan — "What is happening?"
const inputSpheres = [
  { name: 'Identity', href: '/dashboard/identity', icon: Users, description: 'Who are the users' },
  { name: 'Business', href: '/dashboard/business', icon: Briefcase, description: 'Value generated' },
  { name: 'Product', href: '/dashboard/product', icon: Lightbulb, description: 'UX & Engagement' },
  { name: 'Debug', href: '/dashboard/debug', icon: Bug, description: 'System health' },
  { name: 'Visual', href: '/dashboard/visual', icon: Eye, description: 'Photo intelligence' },
];

// OUTPUT spheres — Amber — "What should we do?"
const outputSpheres = [
  { name: 'AI Training', href: '/dashboard/ai-training', icon: BrainCircuit, description: 'Prumo datasets' },
  { name: 'Market Intel', href: '/dashboard/market', icon: TrendingUp, description: 'Predictions & trends' },
  { name: 'App Optimize', href: '/dashboard/optimization', icon: SlidersHorizontal, description: 'Feature insights' },
  { name: 'Commerce', href: '/dashboard/commerce', icon: ShoppingCart, description: 'Sales & pricing' },
  { name: 'Reports', href: '/dashboard/reports', icon: FileBarChart, description: 'Exports & digests' },
];

const tools = [
  { name: 'Teletraan9', href: '/dashboard/assistant', icon: Bot, badge: 'AI' },
  { name: 'Support', href: '/dashboard/support', icon: Wrench, description: 'Ref # decoder' },
];

type SectionTheme = 'input' | 'output' | 'neutral';

interface NavItemProps {
  item: { name: string; href: string; icon: React.ElementType; description?: string; badge?: string };
  isActive: boolean;
  theme: SectionTheme;
  collapsed: boolean;
}

function NavItem({ item, isActive, theme, collapsed }: NavItemProps) {
  const activeStyles = {
    input: 'bg-cyan-500/10 text-cyan-400 font-medium border-l-2 border-cyan-400',
    output: 'bg-amber-500/10 text-amber-400 font-medium border-l-2 border-amber-400',
    neutral: 'bg-blue-500/10 text-blue-400 font-medium border-l-2 border-blue-400',
  };

  const iconColor = {
    input: 'text-cyan-500',
    output: 'text-amber-500',
    neutral: 'text-slate-400',
  };

  return (
    <Link
      href={item.href}
      title={collapsed ? item.name : undefined}
      className={cn(
        'flex items-center gap-3 py-2 rounded-lg text-sm transition-all duration-200',
        collapsed ? 'px-2 justify-center' : 'px-3',
        isActive
          ? activeStyles[theme]
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      )}
    >
      <item.icon className={cn('h-4 w-4 shrink-0', isActive ? '' : iconColor[theme])} />
      {!collapsed && (
        <>
          <div className="flex-1 min-w-0">
            <span>{item.name}</span>
            {item.description && (
              <p className="text-[11px] text-slate-500 truncate">{item.description}</p>
            )}
          </div>
          {item.badge && (
            <span className="text-[10px] font-medium bg-blue-600 text-white px-1.5 py-0.5 rounded">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load collapsed preference
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  // Save collapsed preference
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={cn('flex h-14 items-center gap-2 border-b border-slate-800', collapsed ? 'px-3 justify-center' : 'px-5')}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-amber-500 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">OS</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-slate-100">OnSite</span>
            <span className="text-slate-500 text-sm ml-1">Analytics</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {/* Overview */}
        <NavItem
          item={{ name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard }}
          isActive={pathname === '/dashboard/overview'}
          theme="neutral"
          collapsed={collapsed}
        />

        {/* INPUT — Entrada */}
        <div className="pt-4">
          {!collapsed ? (
            <div className="flex items-center gap-2 px-3 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <p className="text-[10px] font-semibold text-cyan-500/70 uppercase tracking-widest">
                Entrada
              </p>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <div className="w-6 h-px bg-cyan-500/50" />
            </div>
          )}
          {inputSpheres.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              isActive={pathname === item.href}
              theme="input"
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* Separator — the hourglass neck */}
        <div className={cn('py-3', collapsed ? 'px-1' : 'px-3')}>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed border-slate-700" />
            </div>
            <div className="relative flex justify-center">
              {collapsed ? (
                <Hourglass className="h-3 w-3 text-slate-600 bg-slate-950 px-0.5" />
              ) : (
                <span className="bg-slate-950 px-2 text-[10px] text-slate-600 uppercase tracking-widest flex items-center gap-1">
                  <Hourglass className="h-3 w-3" />
                  gargalo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* OUTPUT — Saida */}
        <div>
          {!collapsed ? (
            <div className="flex items-center gap-2 px-3 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <p className="text-[10px] font-semibold text-amber-500/70 uppercase tracking-widest">
                Saida
              </p>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <div className="w-6 h-px bg-amber-500/50" />
            </div>
          )}
          {outputSpheres.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              isActive={pathname === item.href}
              theme="output"
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* Tools */}
        <div className="pt-4 border-t border-slate-800">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">
              Tools
            </p>
          )}
          {tools.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              isActive={pathname === item.href}
              theme="neutral"
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        <div className={cn('flex items-center gap-2 text-sm text-slate-500', collapsed ? 'justify-center' : 'px-3 py-1')}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          {!collapsed && <span className="text-xs">Operational</span>}
        </div>
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-full mt-2 py-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-950 border-r border-slate-800 w-64 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          'hidden lg:flex h-full flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
