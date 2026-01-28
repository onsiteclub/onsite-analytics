'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { SAIDA_COLORS } from '@/components/charts/chart-colors';
import {
  TrendingUp,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function MarketPage() {
  const [loading, setLoading] = useState(true);
  const [revenueByProvince, setRevenueByProvince] = useState<any[]>([]);
  const [subscriptionFunnel, setSubscriptionFunnel] = useState<any>(null);
  const [usersByProvince, setUsersByProvince] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const [revenue, funnel, profiles] = await Promise.all([
        supabase.from('v_revenue_by_province').select('*'),
        supabase.from('v_subscription_funnel').select('*').single(),
        supabase.from('core_profiles').select('province'),
      ]);

      if (revenue.data) setRevenueByProvince(revenue.data);
      if (funnel.data) setSubscriptionFunnel(funnel.data);

      // Group users by province
      if (profiles.data) {
        const grouped: Record<string, number> = {};
        profiles.data.forEach((p: any) => {
          const prov = p.province || 'Unknown';
          grouped[prov] = (grouped[prov] || 0) + 1;
        });
        setUsersByProvince(
          Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
        );
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Header
        title="Market Intelligence"
        description="Trends, demand forecasting, and geographic analysis"
      />

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={loading ? '--' : usersByProvince.reduce((sum, p) => sum + p.value, 0)}
          icon={Users}
          color="amber"
          subtitle="Across all provinces"
          delay={0}
        />
        <MetricCard
          title="Active Provinces"
          value={loading ? '--' : usersByProvince.filter(p => p.name !== 'Unknown').length}
          icon={MapPin}
          color="amber"
          subtitle="With registered users"
          delay={1}
        />
        <MetricCard
          title="Revenue Sources"
          value={loading ? '--' : revenueByProvince.length}
          icon={DollarSign}
          color="amber"
          subtitle="Revenue-generating regions"
          delay={2}
        />
        <MetricCard
          title="Conversion"
          value={subscriptionFunnel ? `${Math.round((subscriptionFunnel.paid_users / Math.max(subscriptionFunnel.total_users, 1)) * 100)}%` : '--'}
          icon={TrendingUp}
          color="amber"
          subtitle="Free to paid"
          delay={3}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Users by Province */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              Users by Province
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersByProvince.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={usersByProvince}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={SAIDA_COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                No province data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              Revenue by Province
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByProvince.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={revenueByProvince}
                    dataKey="total_revenue"
                    nameKey="province"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {revenueByProvince.map((_, i) => (
                      <Cell key={i} fill={SAIDA_COLORS[i % SAIDA_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                No revenue data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Market Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <Calendar className="h-4 w-4 text-amber-500 mb-2" />
              <p className="text-sm font-medium">Seasonal Patterns</p>
              <p className="text-xs text-muted-foreground mt-1">
                Identify peak work seasons by trade and province. Requires agg_trade_weekly data.
              </p>
              <Badge variant="outline" className="mt-2 bg-muted text-muted-foreground">Needs data</Badge>
            </div>
            <div className="rounded-lg border p-4">
              <TrendingUp className="h-4 w-4 text-amber-500 mb-2" />
              <p className="text-sm font-medium">Growth Forecast</p>
              <p className="text-xs text-muted-foreground mt-1">
                User growth trajectory and projected MRR. Requires 3+ months of agg_platform_daily.
              </p>
              <Badge variant="outline" className="mt-2 bg-muted text-muted-foreground">Needs data</Badge>
            </div>
            <div className="rounded-lg border p-4">
              <Users className="h-4 w-4 text-amber-500 mb-2" />
              <p className="text-sm font-medium">Trade Demand</p>
              <p className="text-xs text-muted-foreground mt-1">
                Which trades are growing fastest. Requires ref_trades + core_profiles.trade_id.
              </p>
              <Badge variant="outline" className="mt-2 bg-muted text-muted-foreground">Needs ref_trades</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
