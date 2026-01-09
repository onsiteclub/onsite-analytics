'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import {
  Users,
  UserPlus,
  UserX,
  Activity,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
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

const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

interface IdentityMetrics {
  total: number;
  activeToday: number;
  activeWeek: number;
  activeMonth: number;
  newThisWeek: number;
  newThisMonth: number;
  churnedThisMonth: number;
  byPlan: { name: string; value: number }[];
  byPlatform: { name: string; value: number }[];
  cohorts: { name: string; value: number }[];
  users: any[];
}

export default function IdentityPage() {
  const [metrics, setMetrics] = useState<IdentityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: activeToday } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active_at', today);
    const { count: activeWeek } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active_at', weekAgo);
    const { count: activeMonth } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active_at', monthAgo);
    const { count: newThisWeek } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);
    const { count: newThisMonth } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart);

    const { count: churnedThisMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('last_active_at', monthAgo)
      .gte('last_active_at', new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString());

    const { data: planData } = await supabase.from('profiles').select('plan_type');
    const planCounts: { [key: string]: number } = { free: 0, pro: 0, enterprise: 0 };
    planData?.forEach(p => {
      const plan = p.plan_type || 'free';
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });

    const { data: platformData } = await supabase.from('profiles').select('device_platform');
    const platformCounts: { [key: string]: number } = {};
    platformData?.forEach(p => {
      const platform = p.device_platform || 'Unknown';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    const { data: cohortData } = await supabase.from('profiles').select('created_at').order('created_at', { ascending: true });
    const cohortCounts: { [key: string]: number } = {};
    cohortData?.forEach(u => {
      const month = u.created_at.slice(0, 7);
      cohortCounts[month] = (cohortCounts[month] || 0) + 1;
    });

    const { data: users } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    setMetrics({
      total: total || 0,
      activeToday: activeToday || 0,
      activeWeek: activeWeek || 0,
      activeMonth: activeMonth || 0,
      newThisWeek: newThisWeek || 0,
      newThisMonth: newThisMonth || 0,
      churnedThisMonth: churnedThisMonth || 0,
      byPlan: Object.entries(planCounts).map(([name, value]) => ({ name, value })),
      byPlatform: Object.entries(platformCounts).map(([name, value]) => ({ name, value })),
      cohorts: Object.entries(cohortCounts).map(([name, value]) => ({ name, value })),
      users: users || [],
    });

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Identity" description="Loading..." />
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
      <Header title="Identity" description="Who are the users - Cohorts, Plans, Churn" />

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
          <MetricCard title="Total" value={metrics?.total || 0} icon={Users} />
          <MetricCard title="Active Today" value={metrics?.activeToday || 0} icon={Activity} color="green" />
          <MetricCard title="Active Week" value={metrics?.activeWeek || 0} icon={Activity} />
          <MetricCard title="Active Month" value={metrics?.activeMonth || 0} icon={Activity} />
          <MetricCard title="New (Week)" value={metrics?.newThisWeek || 0} icon={UserPlus} color="blue" />
          <MetricCard title="New (Month)" value={metrics?.newThisMonth || 0} icon={UserPlus} color="blue" />
          <MetricCard title="Churned" value={metrics?.churnedThisMonth || 0} icon={UserX} color="red" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">By Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metrics?.byPlan} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                      {metrics?.byPlan.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">By Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metrics?.byPlatform} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                      {metrics?.byPlatform.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cohort (Users/Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.cohorts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Plan</th>
                    <th className="text-left p-2">Platform</th>
                    <th className="text-left p-2">Created</th>
                    <th className="text-left p-2">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics?.users.map((user, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">{user.name || '-'}</td>
                      <td className="p-2">
                        <Badge variant={user.plan_type === 'pro' ? 'default' : 'secondary'}>
                          {user.plan_type || 'free'}
                        </Badge>
                      </td>
                      <td className="p-2">{user.device_platform || '-'}</td>
                      <td className="p-2">{new Date(user.created_at).toLocaleDateString('en-US')}</td>
                      <td className="p-2">{user.last_active_at ? new Date(user.last_active_at).toLocaleDateString('en-US') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type MetricColor = 'default' | 'green' | 'blue' | 'red';

function MetricCard({ title, value, icon: Icon, color = 'default' }: {
  title: string;
  value: number;
  icon: any;
  color?: MetricColor;
}) {
  const colorClasses: { [key in MetricColor]: string } = {
    default: 'text-muted-foreground',
    green: 'text-green-500',
    blue: 'text-blue-500',
    red: 'text-red-500',
  };
  const colorClass = colorClasses[color];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-xl font-bold">{value.toLocaleString('en-US')}</p>
          </div>
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </div>
      </CardContent>
    </Card>
  );
}
