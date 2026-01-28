'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export type MetricColor = 'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'purple' | 'cyan' | 'amber';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color?: MetricColor;
  suffix?: string;
  subtitle?: string;
  trend?: number;
  delay?: number;
}

const colorClasses: Record<MetricColor, { icon: string; bg: string }> = {
  blue: { icon: 'text-blue-500', bg: 'bg-blue-500/10' },
  green: { icon: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  orange: { icon: 'text-orange-500', bg: 'bg-orange-500/10' },
  red: { icon: 'text-red-500', bg: 'bg-red-500/10' },
  yellow: { icon: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  purple: { icon: 'text-purple-500', bg: 'bg-purple-500/10' },
  cyan: { icon: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  amber: { icon: 'text-amber-500', bg: 'bg-amber-500/10' },
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  suffix = '',
  subtitle,
  trend,
  delay = 0,
}: MetricCardProps) {
  const { icon: iconColor, bg: iconBg } = colorClasses[color];
  const displayValue = typeof value === 'number' ? value.toLocaleString('en-US') : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.08 }}
    >
      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">{title}</p>
              <p className="text-2xl font-bold mt-1 leading-tight">
                {displayValue}{suffix}
              </p>
              {subtitle && (
                <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
              )}
              {trend !== undefined && trend !== 0 && (
                <div className={cn(
                  'flex items-center gap-1 mt-1 text-[11px] font-medium',
                  trend > 0 ? 'text-emerald-500' : 'text-red-500'
                )}>
                  {trend > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{Math.abs(trend)}%</span>
                </div>
              )}
            </div>
            <div className={cn('p-2 rounded-lg shrink-0', iconBg)}>
              <Icon className={cn('h-5 w-5', iconColor)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
