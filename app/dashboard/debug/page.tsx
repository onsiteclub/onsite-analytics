'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import {
  Bug,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Smartphone,
  Activity,
  Target,
} from 'lucide-react';
import {
  LineChart,
  Line,
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

const ERROR_COLORS: { [key: string]: string } = {
  crash: '#ef4444',
  api: '#f97316',
  sync: '#eab308',
  geofence: '#8b5cf6',
  auth: '#3b82f6',
  other: '#6b7280',
};

interface DebugMetrics {
  totalErrors: number;
  errorsToday: number;
  syncSuccessRate: number;
  avgGeofenceAccuracy: number;
  errorsByType: { name: string; value: number; fill: string }[];
  errorsTrend: { name: string; value: number }[];
  errorsByDevice: { name: string; value: number }[];
  errorsByVersion: { name: string; value: number }[];
  recentErrors: any[];
}

export default function DebugPage() {
  const [metrics, setMetrics] = useState<DebugMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { count: totalErrors } = await supabase
      .from('error_log')
      .select('*', { count: 'exact', head: true })
      .gte('occurred_at', weekAgo);

    const { count: errorsToday } = await supabase
      .from('error_log')
      .select('*', { count: 'exact', head: true })
      .gte('occurred_at', today);

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

    const syncSuccessRate = syncAttempts ? Math.round((1 - syncFailures / syncAttempts) * 100) : 100;
    const avgGeofenceAccuracy = accuracyCount ? Math.round(accuracySum / accuracyCount) : 0;

    const { data: typeData } = await supabase
      .from('error_log')
      .select('error_type')
      .gte('occurred_at', weekAgo);

    const typeCounts: { [key: string]: number } = {};
    typeData?.forEach(e => {
      const type = e.error_type || 'other';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const errorsByType = Object.entries(typeCounts).map(([name, value]) => ({ 
      name, 
      value,
      fill: ERROR_COLORS[name] || ERROR_COLORS.other,
    }));

    const { data: trendData } = await supabase
      .from('error_log')
      .select('occurred_at')
      .gte('occurred_at', weekAgo);

    const trendByDay: { [key: string]: number } = {};
    trendData?.forEach(e => {
      const day = e.occurred_at.split('T')[0].slice(5);
      trendByDay[day] = (trendByDay[day] || 0) + 1;
    });

    const { data: deviceData } = await supabase
      .from('error_log')
      .select('device_model')
      .gte('occurred_at', weekAgo);

    const deviceCounts: { [key: string]: number } = {};
    deviceData?.forEach(e => {
      const device = e.device_model || 'Unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    const { data: versionData } = await supabase
      .from('error_log')
      .select('app_version')
      .gte('occurred_at', weekAgo);

    const versionCounts: { [key: string]: number } = {};
    versionData?.forEach(e => {
      const version = e.app_version || 'Unknown';
      versionCounts[version] = (versionCounts[version] || 0) + 1;
    });

    const { data: recentErrors } = await supabase
      .from('error_log')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(50);

    setMetrics({
      totalErrors: totalErrors || 0,
      errorsToday: errorsToday || 0,
      syncSuccessRate,
      avgGeofenceAccuracy,
      errorsByType,
      errorsTrend: Object.entries(trendByDay).map(([name, value]) => ({ name, value })),
      errorsByDevice: Object.entries(deviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value })),
      errorsByVersion: Object.entries(versionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value })),
      recentErrors: recentErrors || [],
    });

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Debug" description="Loading..." />
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </div>
    );
  }

  const isHealthy = metrics && metrics.totalErrors < 10 && metrics.syncSuccessRate >= 95;

  return (
    <div className="flex flex-col h-full overflow-auto">
      <Header title="Debug" description="System Health - Errors, Sync, Geofence" />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant={isHealthy ? 'default' : 'destructive'} className="text-sm py-1 px-3">
            {isHealthy ? (
              <><CheckCircle className="h-4 w-4 mr-1" /> System Healthy</>
            ) : (
              <><AlertTriangle className="h-4 w-4 mr-1" /> Attention Needed</>
            )}
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" /> Export Log
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Errors (7 days)" value={metrics?.totalErrors || 0} icon={Bug} color={(metrics?.totalErrors ?? 0) > 10 ? 'red' : 'green'} />
          <MetricCard title="Errors Today" value={metrics?.errorsToday || 0} icon={AlertTriangle} color={(metrics?.errorsToday ?? 0) > 0 ? 'orange' : 'green'} />
          <MetricCard title="Sync Rate" value={metrics?.syncSuccessRate || 0} icon={RefreshCw} suffix="%" color={(metrics?.syncSuccessRate ?? 100) >= 95 ? 'green' : 'red'} />
          <MetricCard title="Avg GPS Accuracy" value={metrics?.avgGeofenceAccuracy || 0} icon={Target} suffix="m" color={(metrics?.avgGeofenceAccuracy ?? 0) <= 20 ? 'green' : 'orange'} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Errors by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                {metrics?.errorsByType && metrics.errorsByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={metrics.errorsByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                        {metrics.errorsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-green-500">
                    <CheckCircle className="h-8 w-8 mr-2" /> No errors logged
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Error Trend (7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.errorsTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* By Device/Version */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> Top Devices with Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.errorsByDevice && metrics.errorsByDevice.length > 0 ? (
                <div className="space-y-2">
                  {metrics.errorsByDevice.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">{d.name}</span>
                      <Badge variant="secondary">{d.value}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" /> Top Versions with Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.errorsByVersion && metrics.errorsByVersion.length > 0 ? (
                <div className="space-y-2">
                  {metrics.errorsByVersion.map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">v{v.name}</span>
                      <Badge variant={i === 0 ? 'destructive' : 'secondary'}>{v.value}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No data</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Errors Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-80">
              {metrics?.recentErrors && metrics.recentErrors.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Message</th>
                      <th className="text-left p-2">Version</th>
                      <th className="text-left p-2">Device</th>
                      <th className="text-left p-2">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recentErrors.map((error, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        <td className="p-2">
                          <Badge style={{ backgroundColor: ERROR_COLORS[error.error_type] || ERROR_COLORS.other }} className="text-white">
                            {error.error_type}
                          </Badge>
                        </td>
                        <td className="p-2 max-w-xs truncate" title={error.error_message}>{error.error_message || '-'}</td>
                        <td className="p-2">{error.app_version || '-'}</td>
                        <td className="p-2">{error.device_model || '-'}</td>
                        <td className="p-2">{new Date(error.occurred_at).toLocaleString('en-US')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-green-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" /> No errors logged
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type MetricColor = 'default' | 'green' | 'orange' | 'red';

function MetricCard({ title, value, icon: Icon, suffix = '', color = 'default' }: {
  title: string;
  value: number;
  icon: any;
  suffix?: string;
  color?: MetricColor;
}) {
  const colorClasses: { [key in MetricColor]: string } = {
    default: 'text-muted-foreground bg-muted',
    green: 'text-green-500 bg-green-500/10',
    orange: 'text-orange-500 bg-orange-500/10',
    red: 'text-red-500 bg-red-500/10',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString('en-US')}{suffix}</p>
          </div>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
