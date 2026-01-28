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
  Clock,
  MapPin,
  Zap,
  Calendar,
  Download,
  RefreshCw,
  Play,
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

const T = {
  ENTRIES: 'app_timekeeper_entries',
  GEOFENCES: 'app_timekeeper_geofences',
} as const;

interface BusinessMetrics {
  totalSessions: number;
  totalHours: number;
  totalLocations: number;
  automationRate: number;
  avgDuration: number;
  sessionsToday: number;
  sessionsWeek: number;
  manualVsAuto: { name: string; value: number }[];
  sessionsTrend: { name: string; value: number }[];
  topLocations: { name: string; sessions: number; hours: number }[];
  recentSessions: any[];
}

export default function BusinessPage() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Counts
    const { count: totalSessions } = await supabase.from(T.ENTRIES).select('*', { count: 'exact', head: true });
    const { count: totalLocations } = await supabase.from(T.GEOFENCES).select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: sessionsToday } = await supabase.from(T.ENTRIES).select('*', { count: 'exact', head: true }).gte('created_at', today);
    const { count: sessionsWeek } = await supabase.from(T.ENTRIES).select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);

    // Sessions with duration
    const { data: sessionsData } = await supabase
      .from(T.ENTRIES)
      .select('entry_at, exit_at, type, location_name, created_at')
      .not('exit_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000);

    let totalMinutes = 0;
    let autoCount = 0;
    const locationStats: { [key: string]: { sessions: number; minutes: number } } = {};

    sessionsData?.forEach(s => {
      if (s.entry_at && s.exit_at) {
        const mins = (new Date(s.exit_at).getTime() - new Date(s.entry_at).getTime()) / 60000;
        totalMinutes += mins;

        const loc = s.location_name || 'No location';
        if (!locationStats[loc]) locationStats[loc] = { sessions: 0, minutes: 0 };
        locationStats[loc].sessions++;
        locationStats[loc].minutes += mins;
      }
      if (s.type === 'automatic') autoCount++;
    });

    const total = sessionsData?.length || 1;
    const automationRate = Math.round((autoCount / total) * 100);
    const avgDuration = Math.round(totalMinutes / total);

    // Manual vs Auto
    const manualVsAuto = [
      { name: 'Automatic (Geofence)', value: autoCount },
      { name: 'Manual', value: total - autoCount },
    ];

    // Sessions trend (14 days)
    const { data: trendData } = await supabase
      .from(T.ENTRIES)
      .select('created_at, entry_at, exit_at')
      .gte('created_at', twoWeeksAgo);

    const trendByDay: { [key: string]: { sessions: number; minutes: number } } = {};
    trendData?.forEach(r => {
      const day = r.created_at.split('T')[0].slice(5);
      if (!trendByDay[day]) trendByDay[day] = { sessions: 0, minutes: 0 };
      trendByDay[day].sessions++;
      if (r.entry_at && r.exit_at) {
        trendByDay[day].minutes += (new Date(r.exit_at).getTime() - new Date(r.entry_at).getTime()) / 60000;
      }
    });

    // Top locations
    const topLocations = Object.entries(locationStats)
      .sort((a, b) => b[1].sessions - a[1].sessions)
      .slice(0, 10)
      .map(([name, stats]) => ({
        name,
        sessions: stats.sessions,
        hours: Math.round(stats.minutes / 60),
      }));

    // Recent sessions
    const { data: recentSessions } = await supabase
      .from(T.ENTRIES)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    setMetrics({
      totalSessions: totalSessions || 0,
      totalHours: Math.round(totalMinutes / 60),
      totalLocations: totalLocations || 0,
      automationRate,
      avgDuration,
      sessionsToday: sessionsToday || 0,
      sessionsWeek: sessionsWeek || 0,
      manualVsAuto,
      sessionsTrend: Object.entries(trendByDay).map(([name, v]) => ({ name, value: v.sessions })),
      topLocations,
      recentSessions: recentSessions || [],
    });

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Business" description="Loading..." />
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header title="Business" description="Value generated - Sessions, Hours, Locations" />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <MetricCard title="Total Sessions" value={metrics?.totalSessions || 0} icon={Clock} color="cyan" delay={0} />
          <MetricCard title="Hours Tracked" value={metrics?.totalHours || 0} icon={Clock} color="cyan" suffix="h" delay={1} />
          <MetricCard title="Active Locations" value={metrics?.totalLocations || 0} icon={MapPin} color="blue" delay={2} />
          <MetricCard title="Automation Rate" value={metrics?.automationRate || 0} icon={Zap} suffix="%" color={(metrics?.automationRate ?? 0) >= 60 ? 'green' : 'orange'} delay={3} />
          <MetricCard title="Avg Duration" value={metrics?.avgDuration || 0} icon={Clock} color="cyan" suffix="min" delay={4} />
          <MetricCard title="Sessions Today" value={metrics?.sessionsToday || 0} icon={Play} color="green" delay={5} />
          <MetricCard title="Sessions Week" value={metrics?.sessionsWeek || 0} icon={Calendar} color="cyan" delay={6} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Manual vs Automatic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metrics?.manualVsAuto} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                      {metrics?.manualVsAuto.map((_, i) => <Cell key={i} fill={ENTRADA_COLORS[i % ENTRADA_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sessions per Day (14 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.sessionsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke={ENTRADA_COLORS[0]} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Locations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Locations by Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.topLocations} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sessions" fill={ENTRADA_COLORS[0]} name="Sessions" />
                  <Bar dataKey="hours" fill={ENTRADA_COLORS[4]} name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Location</th>
                    <th className="text-left p-2">Entry</th>
                    <th className="text-left p-2">Exit</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics?.recentSessions.map((s, i) => {
                    const duration = s.entry_at && s.exit_at
                      ? Math.round((new Date(s.exit_at).getTime() - new Date(s.entry_at).getTime()) / 60000)
                      : null;
                    return (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        <td className="p-2">{s.location_name || '-'}</td>
                        <td className="p-2">{s.entry_at ? new Date(s.entry_at).toLocaleString('en-US') : '-'}</td>
                        <td className="p-2">{s.exit_at ? new Date(s.exit_at).toLocaleString('en-US') : <Badge>In progress</Badge>}</td>
                        <td className="p-2">
                          <Badge variant={s.type === 'automatic' ? 'default' : 'secondary'}>
                            {s.type === 'automatic' ? 'Auto' : 'Manual'}
                          </Badge>
                        </td>
                        <td className="p-2">{duration ? `${duration} min` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
