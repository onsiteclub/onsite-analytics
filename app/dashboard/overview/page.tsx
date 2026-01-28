'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { MetricCard } from '@/components/dashboard/metric-card';
import { SectionHeader } from '@/components/dashboard/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { GARGALO_COLORS } from '@/components/charts/chart-colors';
import {
  Users,
  Briefcase,
  Lightbulb,
  Bug,
  Clock,
  MapPin,
  Zap,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Target
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Canonical table names
const T = {
  PROFILES: 'core_profiles',
  ENTRIES: 'app_timekeeper_entries',
  GEOFENCES: 'app_timekeeper_geofences',
  ANALYTICS: 'agg_user_daily',
  ERRORS: 'log_errors',
} as const;

interface Metrics {
  identity: {
    totalUsers: number;
    activeToday: number;
    activeWeek: number;
    newThisMonth: number;
    byPlan: { name: string; value: number }[];
    byPlatform: { name: string; value: number }[];
  };
  business: {
    totalSessions: number;
    totalHours: number;
    totalLocations: number;
    automationRate: number;
    avgDuration: number;
    sessionsTrend: { name: string; value: number }[];
  };
  product: {
    avgOpens: number;
    avgTimeInApp: number;
    topFeatures: { name: string; value: number }[];
  };
  debug: {
    totalErrors: number;
    syncRate: number;
    avgAccuracy: number;
    errorsByType: { name: string; value: number }[];
    errorsTrend: { name: string; value: number }[];
  };
}

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      const supabase = createClient();

      // ========== IDENTITY ==========
      const { count: totalUsers } = await supabase
        .from(T.PROFILES)
        .select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const { count: activeToday } = await supabase
        .from(T.PROFILES)
        .select('*', { count: 'exact', head: true })
        .gte('last_active_at', today);

      const { count: activeWeek } = await supabase
        .from(T.PROFILES)
        .select('*', { count: 'exact', head: true })
        .gte('last_active_at', weekAgo);

      const { count: newThisMonth } = await supabase
        .from(T.PROFILES)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart);

      // By plan
      const { data: planData } = await supabase
        .from(T.PROFILES)
        .select('plan_type');

      const planCounts: { [key: string]: number } = {};
      planData?.forEach(p => {
        const plan = p.plan_type || 'free';
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      });

      // By platform
      const { data: platformData } = await supabase
        .from(T.PROFILES)
        .select('device_platform');

      const platformCounts: { [key: string]: number } = {};
      platformData?.forEach(p => {
        const platform = p.device_platform || 'Unknown';
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });

      // ========== BUSINESS ==========
      const { count: totalSessions } = await supabase
        .from(T.ENTRIES)
        .select('*', { count: 'exact', head: true });

      const { count: totalLocations } = await supabase
        .from(T.GEOFENCES)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { data: sessionsData } = await supabase
        .from(T.ENTRIES)
        .select('entry_at, exit_at, type')
        .not('exit_at', 'is', null)
        .limit(1000);

      let totalMinutes = 0;
      let autoCount = 0;
      sessionsData?.forEach(s => {
        if (s.entry_at && s.exit_at) {
          totalMinutes += (new Date(s.exit_at).getTime() - new Date(s.entry_at).getTime()) / 60000;
        }
        if (s.type === 'automatic') autoCount++;
      });

      const automationRate = sessionsData?.length ? Math.round((autoCount / sessionsData.length) * 100) : 0;
      const avgDuration = sessionsData?.length ? Math.round(totalMinutes / sessionsData.length) : 0;

      // Sessions trend (last 14 days)
      const { data: trendData } = await supabase
        .from(T.ENTRIES)
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

      const trendByDay: { [key: string]: number } = {};
      trendData?.forEach(r => {
        const day = r.created_at.split('T')[0].slice(5);
        trendByDay[day] = (trendByDay[day] || 0) + 1;
      });

      // ========== PRODUCT ==========
      const { data: analyticsData } = await supabase
        .from(T.ANALYTICS)
        .select('app_opens, app_foreground_seconds, features_used')
        .gte('date', weekAgo.split('T')[0])
        .limit(100);

      let totalOpens = 0;
      let totalTimeInApp = 0;
      const featureCounts: { [key: string]: number } = {};

      analyticsData?.forEach(a => {
        totalOpens += a.app_opens || 0;
        totalTimeInApp += a.app_foreground_seconds || 0;
        try {
          const features = JSON.parse(a.features_used || '[]');
          features.forEach((f: string) => {
            featureCounts[f] = (featureCounts[f] || 0) + 1;
          });
        } catch (e) {}
      });

      const avgOpens = analyticsData?.length ? Math.round(totalOpens / analyticsData.length) : 0;
      const avgTimeInApp = analyticsData?.length ? Math.round(totalTimeInApp / analyticsData.length / 60) : 0;

      // ========== DEBUG ==========
      const { count: totalErrors } = await supabase
        .from(T.ERRORS)
        .select('*', { count: 'exact', head: true })
        .gte('occurred_at', weekAgo);

      const { data: syncData } = await supabase
        .from(T.ANALYTICS)
        .select('sync_attempts, sync_failures, geofence_accuracy_sum, geofence_accuracy_count')
        .gte('date', weekAgo.split('T')[0]);

      let syncAttempts = 0;
      let syncFailures = 0;
      let accuracySum = 0;
      let accuracyCount = 0;

      syncData?.forEach(s => {
        syncAttempts += s.sync_attempts || 0;
        syncFailures += s.sync_failures || 0;
        accuracySum += s.geofence_accuracy_sum || 0;
        accuracyCount += s.geofence_accuracy_count || 0;
      });

      const syncRate = syncAttempts ? Math.round((1 - syncFailures / syncAttempts) * 100) : 100;
      const avgAccuracy = accuracyCount ? Math.round(accuracySum / accuracyCount) : 0;

      // Errors by type
      const { data: errorsData } = await supabase
        .from(T.ERRORS)
        .select('error_type')
        .gte('occurred_at', weekAgo);

      const errorCounts: { [key: string]: number } = {};
      errorsData?.forEach(e => {
        const type = e.error_type || 'other';
        errorCounts[type] = (errorCounts[type] || 0) + 1;
      });

      // Errors trend
      const { data: errorTrendData } = await supabase
        .from(T.ERRORS)
        .select('occurred_at')
        .gte('occurred_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const errorTrendByDay: { [key: string]: number } = {};
      errorTrendData?.forEach(e => {
        const day = e.occurred_at.split('T')[0].slice(5);
        errorTrendByDay[day] = (errorTrendByDay[day] || 0) + 1;
      });

      setMetrics({
        identity: {
          totalUsers: totalUsers || 0,
          activeToday: activeToday || 0,
          activeWeek: activeWeek || 0,
          newThisMonth: newThisMonth || 0,
          byPlan: Object.entries(planCounts).map(([name, value]) => ({ name, value })),
          byPlatform: Object.entries(platformCounts).map(([name, value]) => ({ name, value })),
        },
        business: {
          totalSessions: totalSessions || 0,
          totalHours: Math.round(totalMinutes / 60),
          totalLocations: totalLocations || 0,
          automationRate,
          avgDuration,
          sessionsTrend: Object.entries(trendByDay).map(([name, value]) => ({ name, value })),
        },
        product: {
          avgOpens,
          avgTimeInApp,
          topFeatures: Object.entries(featureCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value })),
        },
        debug: {
          totalErrors: totalErrors || 0,
          syncRate,
          avgAccuracy,
          errorsByType: Object.entries(errorCounts).map(([name, value]) => ({ name, value })),
          errorsTrend: Object.entries(errorTrendByDay).map(([name, value]) => ({ name, value })),
        },
      });

      setLoading(false);
    }

    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Dashboard" description="Loading metrics..." />
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header
        title="Dashboard"
        description="5 Data Spheres Overview"
      />

      <div className="flex-1 p-6 space-y-8">

        {/* 1. IDENTITY */}
        <section>
          <SectionHeader title="Identity" subtitle="Who are the users" icon={Users} iconColor="text-blue-500" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Total Users" value={metrics?.identity.totalUsers || 0} icon={Users} color="blue" delay={0} />
            <MetricCard title="Active Today" value={metrics?.identity.activeToday || 0} icon={Activity} color="green" subtitle={`${metrics?.identity.activeWeek || 0} this week`} delay={1} />
            <MetricCard title="New This Month" value={metrics?.identity.newThisMonth || 0} icon={TrendingUp} color="purple" delay={2} />
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium mb-2">By Platform</p>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={metrics?.identity.byPlatform || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={20} outerRadius={35}>
                        {metrics?.identity.byPlatform.map((_, i) => (
                          <Cell key={i} fill={GARGALO_COLORS[i % GARGALO_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 2. BUSINESS */}
        <section>
          <SectionHeader title="Business" subtitle="Value generated" icon={Briefcase} iconColor="text-orange-500" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <MetricCard title="Total Sessions" value={metrics?.business.totalSessions || 0} icon={Clock} color="orange" delay={0} />
            <MetricCard title="Hours Tracked" value={metrics?.business.totalHours || 0} icon={Clock} color="orange" suffix="h" delay={1} />
            <MetricCard title="Active Locations" value={metrics?.business.totalLocations || 0} icon={MapPin} color="orange" delay={2} />
            <MetricCard title="Automation Rate" value={metrics?.business.automationRate || 0} icon={Zap} color={(metrics?.business.automationRate ?? 0) >= 60 ? 'green' : 'orange'} suffix="%" subtitle={`Avg: ${metrics?.business.avgDuration || 0}min/session`} delay={3} />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sessions per Day (14 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.business.sessionsTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke={GARGALO_COLORS[0]} strokeWidth={2} dot={{ fill: GARGALO_COLORS[0] }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 3. PRODUCT */}
        <section>
          <SectionHeader title="Product" subtitle="UX & Engagement" icon={Lightbulb} iconColor="text-yellow-500" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Avg Opens/Day" value={metrics?.product.avgOpens || 0} icon={Smartphone} color="yellow" delay={0} />
            <MetricCard title="Avg Time in App" value={metrics?.product.avgTimeInApp || 0} icon={Clock} color="yellow" suffix="min" delay={1} />
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium mb-2">Top Features</p>
                <div className="space-y-2">
                  {(metrics?.product.topFeatures || []).length > 0 ? (
                    metrics?.product.topFeatures.map((f, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{f.name}</span>
                        <span className="font-medium">{f.value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 4. DEBUG */}
        <section>
          <SectionHeader title="Debug" subtitle="System health" icon={Bug} iconColor="text-red-500" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <MetricCard title="Errors (7 days)" value={metrics?.debug.totalErrors || 0} icon={AlertTriangle} color={(metrics?.debug.totalErrors ?? 0) > 10 ? 'red' : 'green'} delay={0} />
            <MetricCard title="Sync Rate" value={metrics?.debug.syncRate || 0} icon={CheckCircle} color={(metrics?.debug.syncRate ?? 100) >= 95 ? 'green' : 'red'} suffix="%" delay={1} />
            <MetricCard title="GPS Accuracy" value={metrics?.debug.avgAccuracy || 0} icon={Target} color={(metrics?.debug.avgAccuracy ?? 0) <= 20 ? 'green' : 'orange'} suffix="m" delay={2} />
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium mb-2">Errors by Type</p>
                <div className="space-y-1">
                  {(metrics?.debug.errorsByType || []).length > 0 ? (
                    metrics?.debug.errorsByType.map((e, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="capitalize">{e.name}</span>
                        <Badge variant={e.value > 5 ? 'destructive' : 'secondary'}>{e.value}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> No errors
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {(metrics?.debug.errorsTrend?.length || 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Error Trend (7 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics?.debug.errorsTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill={GARGALO_COLORS[4]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
