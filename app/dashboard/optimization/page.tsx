'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { SAIDA_COLORS } from '@/components/charts/chart-colors';
import {
  Smartphone,
  Mic,
  Clock,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
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

export default function OptimizationPage() {
  const [loading, setLoading] = useState(true);
  const [entryMethods, setEntryMethods] = useState<any[]>([]);
  const [voiceStats, setVoiceStats] = useState({ total: 0, successful: 0 });
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Entry methods breakdown
      const { data: entries } = await supabase
        .from('app_timekeeper_entries')
        .select('entry_method');

      if (entries) {
        const methods: Record<string, number> = {};
        entries.forEach((e: any) => {
          const method = e.entry_method || 'unknown';
          methods[method] = (methods[method] || 0) + 1;
        });
        setEntryMethods(
          Object.entries(methods).map(([name, value]) => ({ name, value }))
        );
      }

      // Voice success rate
      const { data: voiceLogs } = await supabase
        .from('voice_logs')
        .select('was_successful');

      if (voiceLogs) {
        setVoiceStats({
          total: voiceLogs.length,
          successful: voiceLogs.filter((v: any) => v.was_successful).length,
        });
      }

      // Profile completeness
      const { data: profiles } = await supabase
        .from('core_profiles')
        .select('profile_completeness');

      if (profiles && profiles.length > 0) {
        const avg = profiles.reduce((sum: number, p: any) => sum + (p.profile_completeness || 0), 0) / profiles.length;
        setProfileCompleteness(Math.round(avg));
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  const voiceRate = voiceStats.total > 0
    ? Math.round((voiceStats.successful / voiceStats.total) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <Header
        title="App Optimization"
        description="Feature insights and UX recommendations to feed back into apps"
      />

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Voice Success"
          value={loading ? '--' : `${voiceRate}%`}
          icon={Mic}
          color="amber"
          subtitle={`${voiceStats.successful}/${voiceStats.total} successful`}
          delay={0}
        />
        <MetricCard
          title="Profile Complete"
          value={loading ? '--' : `${profileCompleteness}%`}
          icon={Target}
          color="amber"
          subtitle="Average completeness"
          delay={1}
        />
        <MetricCard
          title="Auto vs Manual"
          value={loading ? '--' : entryMethods.length > 0 ? `${entryMethods.length} methods` : '0'}
          icon={Zap}
          color="amber"
          subtitle="Entry method types"
          delay={2}
        />
        <MetricCard
          title="Voice Logs"
          value={loading ? '--' : voiceStats.total}
          icon={Smartphone}
          color="amber"
          subtitle="Total voice interactions"
          delay={3}
        />
      </div>

      {/* Entry Methods Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Entry Methods Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entryMethods.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={entryMethods}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill={SAIDA_COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              No entry data yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                title: 'Increase voice adoption',
                description: voiceRate < 70
                  ? 'Voice success rate below 70%. Improve prompts and error handling.'
                  : 'Voice success rate healthy. Monitor for regressions.',
                impact: voiceRate < 70 ? 'high' : 'low',
                direction: voiceRate < 70 ? 'down' : 'up',
              },
              {
                title: 'Complete user profiles',
                description: profileCompleteness < 50
                  ? 'Average profile completeness below 50%. Add onboarding prompts.'
                  : 'Profile completeness acceptable. Consider optional fields.',
                impact: profileCompleteness < 50 ? 'high' : 'medium',
                direction: profileCompleteness < 50 ? 'down' : 'up',
              },
              {
                title: 'Push auto entry adoption',
                description: 'Encourage geofence setup to increase automatic clock-in usage.',
                impact: 'medium',
                direction: 'up',
              },
            ].map((rec) => (
              <div key={rec.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                {rec.direction === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mt-0.5" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{rec.title}</p>
                    <Badge variant="outline" className={
                      rec.impact === 'high' ? 'bg-red-500/10 text-red-400' :
                      rec.impact === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-green-500/10 text-green-400'
                    }>
                      {rec.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
