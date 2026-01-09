'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
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
  Legend,
} from 'recharts';

const COLORS = {
  primary: '#f97316',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
};

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.info, COLORS.purple, COLORS.warning];

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
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const { count: activeToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active_at', today);

      const { count: activeWeek } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active_at', weekAgo);

      const { count: newThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart);

      // By plan
      const { data: planData } = await supabase
        .from('profiles')
        .select('plan_type');
      
      const planCounts: { [key: string]: number } = {};
      planData?.forEach(p => {
        const plan = p.plan_type || 'free';
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      });

      // By platform
      const { data: platformData } = await supabase
        .from('profiles')
        .select('device_platform');
      
      const platformCounts: { [key: string]: number } = {};
      platformData?.forEach(p => {
        const platform = p.device_platform || 'Unknown';
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });

      // ========== BUSINESS ==========
      const { count: totalSessions } = await supabase
        .from('records')
        .select('*', { count: 'exact', head: true });

      const { count: totalLocations } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { data: sessionsData } = await supabase
        .from('records')
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
        .from('records')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

      const trendByDay: { [key: string]: number } = {};
      trendData?.forEach(r => {
        const day = r.created_at.split('T')[0].slice(5);
        trendByDay[day] = (trendByDay[day] || 0) + 1;
      });

      // ========== PRODUCT ==========
      const { data: analyticsData } = await supabase
        .from('analytics_daily')
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
        .from('error_log')
        .select('*', { count: 'exact', head: true })
        .gte('occurred_at', weekAgo);

      const { data: syncData } = await supabase
        .from('analytics_daily')
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
        .from('error_log')
        .select('error_type')
        .gte('occurred_at', weekAgo);

      const errorCounts: { [key: string]: number } = {};
      errorsData?.forEach(e => {
        const type = e.error_type || 'other';
        errorCounts[type] = (errorCounts[type] || 0) + 1;
      });

      // Errors trend
      const { data: errorTrendData } = await supabase
        .from('error_log')
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
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Identity</h2>
            <Badge variant="outline">Who are the users</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Total Users" value={metrics?.identity.totalUsers || 0} icon={Users} color="blue" />
            <MetricCard title="Active Today" value={metrics?.identity.activeToday || 0} icon={Activity} color="green" subtitle={`${metrics?.identity.activeWeek || 0} this week`} />
            <MetricCard title="New This Month" value={metrics?.identity.newThisMonth || 0} icon={TrendingUp} color="purple" />
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">By Platform</p>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={metrics?.identity.byPlatform || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={20} outerRadius={35}>
                        {metrics?.identity.byPlatform.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Business</h2>
            <Badge variant="outline">Value generated</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <MetricCard title="Total Sessions" value={metrics?.business.totalSessions || 0} icon={Clock} color="orange" />
            <MetricCard title="Hours Tracked" value={metrics?.business.totalHours || 0} icon={Clock} color="orange" suffix="h" />
            <MetricCard title="Active Locations" value={metrics?.business.totalLocations || 0} icon={MapPin} color="orange" />
            <MetricCard title="Automation Rate" value={metrics?.business.automationRate || 0} icon={Zap} color={(metrics?.business.automationRate ?? 0) >= 60 ? 'green' : 'orange'} suffix="%" subtitle={`Avg: ${metrics?.business.avgDuration || 0}min/session`} />
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
                    <Line type="monotone" dataKey="value" stroke={COLORS.primary} strokeWidth={2} dot={{ fill: COLORS.primary }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 3. PRODUCT */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Product</h2>
            <Badge variant="outline">UX & Engagement</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Avg Opens/Day" value={metrics?.product.avgOpens || 0} icon={Smartphone} color="yellow" />
            <MetricCard title="Avg Time in App" value={metrics?.product.avgTimeInApp || 0} icon={Clock} color="yellow" suffix="min" />
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Top Features</p>
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
          <div className="flex items-center gap-2 mb-4">
            <Bug className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">Debug</h2>
            <Badge variant="outline">System health</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <MetricCard title="Errors (7 days)" value={metrics?.debug.totalErrors || 0} icon={AlertTriangle} color={(metrics?.debug.totalErrors ?? 0) > 10 ? 'red' : 'green'} />
            <MetricCard title="Sync Rate" value={metrics?.debug.syncRate || 0} icon={CheckCircle} color={(metrics?.debug.syncRate ?? 100) >= 95 ? 'green' : 'red'} suffix="%" />
            <MetricCard title="GPS Accuracy" value={metrics?.debug.avgAccuracy || 0} icon={Target} color={(metrics?.debug.avgAccuracy ?? 0) <= 20 ? 'green' : 'orange'} suffix="m" />
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Errors by Type</p>
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
                      <Bar dataKey="value" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
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

// ========== METRIC CARD COMPONENT ==========

type MetricColor = 'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'purple';

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  suffix = '',
  subtitle 
}: { 
  title: string;
  value: number;
  icon: any;
  color?: MetricColor;
  suffix?: string;
  subtitle?: string;
}) {
  const colorClasses: { [key in MetricColor]: string } = {
    blue: 'text-blue-500 bg-blue-500/10',
    green: 'text-green-500 bg-green-500/10',
    orange: 'text-orange-500 bg-orange-500/10',
    red: 'text-red-500 bg-red-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {value.toLocaleString('en-US')}{suffix}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
