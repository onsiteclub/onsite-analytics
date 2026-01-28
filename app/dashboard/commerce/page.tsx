'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { SAIDA_COLORS } from '@/components/charts/chart-colors';
import {
  ShoppingCart,
  DollarSign,
  Package,
  CreditCard,
  Users,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function CommercePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0, activeProducts: 0,
    totalSubs: 0, activeSubs: 0,
    totalPayments: 0, totalRevenue: 0, mrr: 0,
  });
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const [products, subs, payments, mrr] = await Promise.all([
        supabase.from('app_shop_products').select('is_active'),
        supabase.from('billing_subscriptions').select('status'),
        supabase.from('payment_history').select('amount, status, paid_at'),
        supabase.from('v_mrr').select('*').single(),
      ]);

      const prodData = products.data || [];
      const subsData = subs.data || [];
      const payData = payments.data || [];

      setStats({
        totalProducts: prodData.length,
        activeProducts: prodData.filter((p: any) => p.is_active).length,
        totalSubs: subsData.length,
        activeSubs: subsData.filter((s: any) => s.status === 'active').length,
        totalPayments: payData.length,
        totalRevenue: payData
          .filter((p: any) => p.status === 'succeeded' || p.status === 'paid')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
        mrr: mrr.data?.mrr || 0,
      });

      const byMonth: Record<string, number> = {};
      payData.forEach((p: any) => {
        if (p.paid_at) {
          const month = new Date(p.paid_at).toISOString().slice(0, 7);
          byMonth[month] = (byMonth[month] || 0) + (p.amount || 0);
        }
      });
      setRevenueByMonth(
        Object.entries(byMonth)
          .map(([month, amount]) => ({ month, amount: amount / 100 }))
          .sort((a, b) => a.month.localeCompare(b.month))
      );

      setLoading(false);
    }
    fetchData();
  }, []);

  const fmt = (cents: number) => `CA$${(cents / 100).toFixed(2)}`;

  return (
    <div className="p-6 space-y-6">
      <Header
        title="Commerce"
        description="Sales performance, pricing insights, and subscription analytics"
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="MRR"
          value={loading ? '--' : fmt(stats.mrr)}
          icon={DollarSign}
          color="amber"
          subtitle="Monthly recurring revenue"
          delay={0}
        />
        <MetricCard
          title="Total Revenue"
          value={loading ? '--' : fmt(stats.totalRevenue)}
          icon={CreditCard}
          color="amber"
          subtitle={`${stats.totalPayments} payments`}
          delay={1}
        />
        <MetricCard
          title="Subscriptions"
          value={loading ? '--' : stats.activeSubs}
          icon={Users}
          color="amber"
          subtitle={`${stats.activeSubs}/${stats.totalSubs} active`}
          delay={2}
        />
        <MetricCard
          title="Products"
          value={loading ? '--' : stats.activeProducts}
          icon={Package}
          color="amber"
          subtitle={`${stats.activeProducts}/${stats.totalProducts} active`}
          delay={3}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            Revenue by Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => [`CA$${v.toFixed(2)}`, 'Revenue']} />
                <Bar dataKey="amount" fill={SAIDA_COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No payment data yet
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border p-4">
              <ShoppingCart className="h-4 w-4 text-amber-500 mb-2" />
              <p className="text-sm font-medium">{stats.activeProducts} active products</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalProducts > stats.activeProducts
                  ? `${stats.totalProducts - stats.activeProducts} inactive products in catalog.`
                  : 'All products are active.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subscription Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border p-4">
              <Users className="h-4 w-4 text-amber-500 mb-2" />
              <p className="text-sm font-medium">
                {stats.totalSubs > 0
                  ? `${Math.round((stats.activeSubs / stats.totalSubs) * 100)}% retention`
                  : 'No subscriptions yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeSubs} active out of {stats.totalSubs} total subscriptions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
