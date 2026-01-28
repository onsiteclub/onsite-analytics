'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { ENTRADA_COLORS } from '@/components/charts/chart-colors';
import {
  Smartphone,
  Clock,
  Bell,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const T = {
  ANALYTICS: 'agg_user_daily',
} as const;

const FUNNEL_COLORS = ['#22c55e', '#84cc16', '#eab308', '#3b82f6', '#ef4444'];

interface ProductMetrics {
  avgAppOpens: number;
  avgTimeInApp: number;
  notificationRate: number;
  topFeatures: { name: string; value: number }[];
  onboardingFunnel: { name: string; value: number; fill: string }[];
  abandonmentPoints: { name: string; value: number }[];
}

export default function ProductPage() {
  const [metrics, setMetrics] = useState<ProductMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: analyticsData } = await supabase
      .from(T.ANALYTICS)
      .select('app_opens, app_foreground_seconds, notifications_shown, notifications_actioned, features_used')
      .gte('date', weekAgo.split('T')[0]);

    let totalOpens = 0;
    let totalTime = 0;
    let totalNotifShown = 0;
    let totalNotifActioned = 0;
    const featureCounts: { [key: string]: number } = {};

    analyticsData?.forEach(a => {
      totalOpens += a.app_opens || 0;
      totalTime += a.app_foreground_seconds || 0;
      totalNotifShown += a.notifications_shown || 0;
      totalNotifActioned += a.notifications_actioned || 0;

      try {
        const features = JSON.parse(a.features_used || '[]');
        features.forEach((f: string) => {
          featureCounts[f] = (featureCounts[f] || 0) + 1;
        });
      } catch (e) {}
    });

    const days = analyticsData?.length || 1;
    const avgAppOpens = Math.round(totalOpens / days);
    const avgTimeInApp = Math.round(totalTime / days / 60);
    const notificationRate = totalNotifShown ? Math.round((totalNotifActioned / totalNotifShown) * 100) : 0;

    const topFeatures = Object.entries(featureCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    // Onboarding funnel
    const funnelSteps = ['signup', 'email_verified', 'first_location', 'first_session', 'first_export'];
    const funnel: { name: string; value: number; fill: string }[] = [];

    try {
      for (let i = 0; i < funnelSteps.length; i++) {
        const { count } = await supabase
          .from('onboarding_events')
          .select('*', { count: 'exact', head: true })
          .eq('step', funnelSteps[i]);

        funnel.push({
          name: funnelSteps[i].replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: count || 0,
          fill: FUNNEL_COLORS[i],
        });
      }
    } catch (e) {
      // Table doesn't exist yet
    }

    setMetrics({
      avgAppOpens,
      avgTimeInApp,
      notificationRate,
      topFeatures,
      onboardingFunnel: funnel,
      abandonmentPoints: [],
    });

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Product" description="Loading..." />
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header title="Product" description="UX & Engagement - Features, Onboarding, Retention" />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard title="Avg Opens/Day" value={metrics?.avgAppOpens || 0} icon={Smartphone} color="cyan" delay={0} />
          <MetricCard title="Avg Time in App" value={metrics?.avgTimeInApp || 0} icon={Clock} color="cyan" suffix=" min" delay={1} />
          <MetricCard title="Notification Response Rate" value={metrics?.notificationRate || 0} icon={Bell} suffix="%" color={(metrics?.notificationRate ?? 0) >= 30 ? 'green' : 'orange'} delay={2} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" /> Onboarding Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {metrics?.onboardingFunnel && metrics.onboardingFunnel.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.onboardingFunnel} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {metrics.onboardingFunnel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No onboarding data yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" /> Top Features Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {metrics?.topFeatures && metrics.topFeatures.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.topFeatures}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill={ENTRADA_COLORS[0]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No feature data yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abandonment Points */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" /> Main Abandonment Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.abandonmentPoints && metrics.abandonmentPoints.length > 0 ? (
              <div className="space-y-3">
                {metrics.abandonmentPoints.map((point, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">{point.name}</span>
                    <Badge variant="destructive">{point.value} abandonments</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                No abandonment points identified
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
