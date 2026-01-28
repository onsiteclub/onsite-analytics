'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { SAIDA_COLORS } from '@/components/charts/chart-colors';
import {
  BrainCircuit,
  Database,
  Download,
  FileJson,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface DatasetStats {
  profiles: number;
  entries: number;
  voiceLogs: number;
  calculations: number;
}

export default function AITrainingPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DatasetStats>({ profiles: 0, entries: 0, voiceLogs: 0, calculations: 0 });

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      const [profiles, entries, voice, calcs] = await Promise.all([
        supabase.from('core_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('app_timekeeper_entries').select('*', { count: 'exact', head: true }),
        supabase.from('voice_logs').select('*', { count: 'exact', head: true }),
        supabase.from('app_calculator_calculations').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        profiles: profiles.count || 0,
        entries: entries.count || 0,
        voiceLogs: voice.count || 0,
        calculations: calcs.count || 0,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const datasets = [
    {
      name: 'Work Patterns',
      description: 'Hours, locations, entry methods, seasonal trends',
      source: 'app_timekeeper_entries + app_timekeeper_geofences',
      records: stats.entries,
      format: 'CSV / Parquet',
      status: stats.entries > 100 ? 'ready' : 'collecting',
      icon: Clock,
    },
    {
      name: 'Voice & Language',
      description: 'Transcriptions, intents, informal terms, dialect patterns',
      source: 'voice_logs + log_voice',
      records: stats.voiceLogs,
      format: 'JSONL',
      status: stats.voiceLogs > 50 ? 'ready' : 'collecting',
      icon: Database,
    },
    {
      name: 'User Behavior',
      description: 'Sessions, feature adoption, engagement patterns',
      source: 'core_profiles + agg_user_daily + log_events',
      records: stats.profiles,
      format: 'CSV',
      status: 'collecting',
      icon: Layers,
    },
    {
      name: 'Visual Defects',
      description: 'Annotated construction photos in COCO format',
      source: 'visual_events + image_annotations',
      records: 0,
      format: 'COCO JSON + Images',
      status: 'planned',
      icon: FileJson,
    },
  ];

  const statusConfig = {
    ready: { label: 'Export Ready', color: 'bg-green-500/10 text-green-400', icon: CheckCircle2 },
    collecting: { label: 'Collecting', color: 'bg-amber-500/10 text-amber-400', icon: Clock },
    planned: { label: 'Planned', color: 'bg-muted text-muted-foreground', icon: AlertCircle },
  };

  return (
    <div className="p-6 space-y-6">
      <Header
        title="AI Training"
        description="Export datasets formatted for Prumo AI training — COCO, CSV, JSONL"
      />

      {/* Prumo Status */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium">Prumo AI — Target 2027</p>
              <p className="text-xs text-muted-foreground">
                {stats.profiles} profiles, {stats.entries} work entries, {stats.voiceLogs} voice logs available for training.
                Collecting data across all apps.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dataset Cards */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {datasets.map((ds) => {
          const status = statusConfig[ds.status as keyof typeof statusConfig];
          return (
            <Card key={ds.name}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <ds.icon className="h-5 w-5 text-amber-500" />
                  <div>
                    <CardTitle className="text-base">{ds.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{ds.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className={status.color}>
                  <status.icon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-mono text-xs">{ds.source}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Records</span>
                    <span className="font-medium">{ds.records.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Format</span>
                    <span>{ds.format}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    disabled={ds.status !== 'ready'}
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Export Dataset
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Data Quality */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training Data Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: 'Profiles with trade_id', value: 'Required for trade-specific models', check: false },
              { label: 'Voice logs with transcription', value: 'Required for NLP training', check: stats.voiceLogs > 0 },
              { label: 'Entries with geofence', value: 'Required for location pattern training', check: stats.entries > 0 },
              { label: 'Visual annotations (COCO)', value: 'Required for defect detection model', check: false },
              { label: 'ref_trades populated', value: 'Required for trade segmentation', check: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.value}</p>
                </div>
                {item.check ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
