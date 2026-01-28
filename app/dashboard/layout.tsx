'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { FloatingAssistant } from '@/components/assistant';
import { getThemeForRoute } from '@/lib/theme';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const theme = getThemeForRoute(pathname);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main
        data-theme={theme}
        className="flex-1 overflow-auto bg-background text-foreground transition-colors duration-300"
      >
        {children}
      </main>
      <FloatingAssistant />
    </div>
  );
}
