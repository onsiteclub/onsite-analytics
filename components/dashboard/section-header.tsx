'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
}

export function SectionHeader({ title, subtitle, icon: Icon, iconColor = 'text-primary' }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className={cn('h-5 w-5', iconColor)} />
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <Badge variant="outline">{subtitle}</Badge>}
    </div>
  );
}
