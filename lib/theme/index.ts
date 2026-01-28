'use client';

import { usePathname } from 'next/navigation';

export type HourglassTheme = 'entrada' | 'saida' | 'gargalo';

const ROUTE_THEME_MAP: Record<string, HourglassTheme> = {
  '/dashboard/overview': 'gargalo',
  '/dashboard/identity': 'entrada',
  '/dashboard/business': 'entrada',
  '/dashboard/product': 'entrada',
  '/dashboard/debug': 'entrada',
  '/dashboard/visual': 'entrada',
  '/dashboard/events': 'entrada',
  '/dashboard/sessions': 'entrada',
  '/dashboard/ai-training': 'saida',
  '/dashboard/market': 'saida',
  '/dashboard/optimization': 'saida',
  '/dashboard/commerce': 'saida',
  '/dashboard/reports': 'saida',
  '/dashboard/assistant': 'gargalo',
  '/dashboard/support': 'gargalo',
  '/dashboard/queries': 'gargalo',
};

const THEME_META: Record<HourglassTheme, { label: string; labelPt: string; accentColor: string; accentClass: string }> = {
  entrada: {
    label: 'Input',
    labelPt: 'Entrada',
    accentColor: '#06b6d4',
    accentClass: 'text-cyan-500',
  },
  saida: {
    label: 'Output',
    labelPt: 'Saida',
    accentColor: '#f59e0b',
    accentClass: 'text-amber-500',
  },
  gargalo: {
    label: 'Overview',
    labelPt: 'Gargalo',
    accentColor: '#3b82f6',
    accentClass: 'text-blue-500',
  },
};

export function getThemeForRoute(pathname: string): HourglassTheme {
  return ROUTE_THEME_MAP[pathname] || 'gargalo';
}

export function getThemeMeta(theme: HourglassTheme) {
  return THEME_META[theme];
}

export function useHourglassTheme() {
  const pathname = usePathname();
  const theme = getThemeForRoute(pathname);
  const meta = getThemeMeta(theme);

  return {
    theme,
    ...meta,
  };
}
