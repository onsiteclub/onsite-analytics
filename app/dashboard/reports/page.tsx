'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { SAIDA_COLORS } from '@/components/charts/chart-colors';
import {
  FileBarChart,
  Download,
  Calendar,
  Users,
  Clock,
  DollarSign,
  Activity,
  FileText,
} from 'lucide-react';

interface Snapshot {
  totalUsers: number;
  totalEntries: number;
  totalVoice: number;
  totalPayments: number;
  activeSubscriptions: number;
  totalLogs: number;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<Snapshot>({
    totalUsers: 0, totalEntries: 0, totalVoice: 0,
    totalPayments: 0, activeSubscriptions: 0, totalLogs: 0,
  });

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const [users, entries, voice, payments, subs, logs] = await Promise.all([
        supabase.from('core_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('app_timekeeper_entries').select('*', { count: 'exact', head: true }),
        supabase.from('voice_logs').select('*', { count: 'exact', head: true }),
        supabase.from('payment_history').select('*', { count: 'exact', head: true }),
        supabase.from('billing_subscriptions').select('status').eq('status', 'active'),
        supabase.from('app_logs').select('*', { count: 'exact', head: true }),
      ]);

      setSnapshot({
        totalUsers: users.count || 0,
        totalEntries: entries.count || 0,
        totalVoice: voice.count || 0,
        totalPayments: payments.count || 0,
        activeSubscriptions: subs.data?.length || 0,
        totalLogs: logs.count || 0,
      });
      setLoading(false);
    }
    fetchData();
  }, []);

  const reports = [
    {
      name: 'Platform Summary',
      description: 'Users, sessions, revenue, and health KPIs across all apps',
      icon: Activity,
      metrics: [
        { label: 'Users', value: snapshot.totalUsers },
        { label: 'Entries', value: snapshot.totalEntries },
        { label: 'Voice Logs', value: snapshot.totalVoice },
      ],
      format: 'PDF / CSV',
      available: true,
    },
    {
      name: 'Financial Report',
      description: 'MRR, revenue by province, subscription funnel, payment history',
      icon: DollarSign,
      metrics: [
        { label: 'Payments', value: snapshot.totalPayments },
        { label: 'Active Subs', value: snapshot.activeSubscriptions },
      ],
      format: 'CSV / Excel',
      available: snapshot.totalPayments > 0,
    },
    {
      name: 'User Cohort Analysis',
      description: 'Signup cohorts, retention, churn risk, engagement by month',
      icon: Users,
      metrics: [
        { label: 'Total Users', value: snapshot.totalUsers },
      ],
      format: 'CSV',
      available: snapshot.totalUsers > 10,
    },
    {
      name: 'Work Hours Report',
      description: 'Total hours, entry methods, geofence usage, project breakdown',
      icon: Clock,
      metrics: [
        { label: 'Entries', value: snapshot.totalEntries },
      ],
      format: 'CSV / PDF',
      available: snapshot.totalEntries > 0,
    },
    {
      name: 'Voice Analytics',
      description: 'Transcription success, language distribution, intent patterns',
      icon: FileText,
      metrics: [
        { label: 'Voice Logs', value: snapshot.totalVoice },
      ],
      format: 'JSONL / CSV',
      available: snapshot.totalVoice > 0,
    },
    {
      name: 'System Health',
      description: 'Error frequency, sync rates, GPS accuracy, app versions',
      icon: Activity,
      metrics: [
        { label: 'Log Entries', value: snapshot.totalLogs },
      ],
      format: 'CSV',
      available: snapshot.totalLogs > 0,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <Header
        title="Reports"
        description="Export data snapshots and scheduled digests"
      />

      {/* Current Snapshot */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <FileBarChart className="h-5 w-5 text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Current Data Snapshot</p>
              <p className="text-xs text-muted-foreground">
                {snapshot.totalUsers} users | {snapshot.totalEntries} entries | {snapshot.totalVoice} voice logs | {snapshot.totalPayments} payments | {snapshot.totalLogs} app logs
              </p>
            </div>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date().toLocaleDateString('en-CA')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.name}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <report.icon className="h-5 w-5 text-amber-500" />
                <div>
                  <CardTitle className="text-base">{report.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-4">
                  {report.metrics.map((m) => (
                    <div key={m.label} className="text-center">
                      <p className="text-lg font-bold">{loading ? '--' : m.value.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Format: {report.format}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!report.available}
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scheduled Digests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Weekly Platform Summary', schedule: 'Every Monday 8:00 AM', status: 'planned' },
              { name: 'Monthly Financial Report', schedule: '1st of each month', status: 'planned' },
              { name: 'Daily Error Alert', schedule: 'When errors > threshold', status: 'planned' },
            ].map((digest) => (
              <div key={digest.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{digest.name}</p>
                  <p className="text-xs text-muted-foreground">{digest.schedule}</p>
                </div>
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                  {digest.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
