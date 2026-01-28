'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { ENTRADA_COLORS } from '@/components/charts/chart-colors';
import { Eye, Camera, CheckCircle, AlertTriangle, ImageIcon } from 'lucide-react';

export default function VisualPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Visual intelligence tables are planned but not yet created
    // This page will connect to: visual_events, image_annotations, error_taxonomy
    setLoading(false);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Header
        title="Visual Intelligence"
        description="Photo analysis, defect detection, and training data for Prumo AI"
      />

      {/* Status Banner */}
      <Card className="border-cyan-500/20 bg-cyan-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-cyan-500" />
            <div>
              <p className="text-sm font-medium">Pipeline em desenvolvimento</p>
              <p className="text-xs text-muted-foreground">
                Tabelas visual_events, image_annotations e error_taxonomy serao criadas para processar 100GB+ de fotos de obra.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Photos"
          value="--"
          icon={ImageIcon}
          color="cyan"
          subtitle="Awaiting visual_events table"
          delay={0}
        />
        <MetricCard
          title="Annotated"
          value="--"
          icon={CheckCircle}
          color="cyan"
          subtitle="Human verified annotations"
          delay={1}
        />
        <MetricCard
          title="Defects Found"
          value="--"
          icon={AlertTriangle}
          color="cyan"
          subtitle="Across all categories"
          delay={2}
        />
        <MetricCard
          title="AI Accuracy"
          value="--"
          icon={Camera}
          color="cyan"
          subtitle="Pre-annotation confidence"
          delay={3}
        />
      </div>

      {/* Taxonomy Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Error Taxonomy (Planned)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[
              { category: 'Structural', items: ['out_of_plumb', 'load_point', 'foundation_crack'], color: 'bg-red-500/10 text-red-400' },
              { category: 'Finishing', items: ['paint_bubbles', 'surface_defect', 'uneven_drywall'], color: 'bg-yellow-500/10 text-yellow-400' },
              { category: 'Material', items: ['wood_useful', 'wood_scrap', 'damaged_material'], color: 'bg-cyan-500/10 text-cyan-400' },
              { category: 'Electrical', items: ['outlet_misaligned', 'exposed_wiring', 'box_damage'], color: 'bg-purple-500/10 text-purple-400' },
              { category: 'Safety', items: ['safety_hazard', 'missing_guard', 'trip_hazard'], color: 'bg-orange-500/10 text-orange-400' },
              { category: 'Plumbing', items: ['leak_detected', 'pipe_misaligned', 'valve_issue'], color: 'bg-blue-500/10 text-blue-400' },
            ].map((group) => (
              <div key={group.category} className="rounded-lg border p-3">
                <p className="text-sm font-medium mb-2">{group.category}</p>
                <div className="flex flex-wrap gap-1">
                  {group.items.map((item) => (
                    <Badge key={item} variant="outline" className={group.color}>
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Annotation Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <span className="text-cyan-500 font-mono text-xs">1</span>
              <span>Upload photo</span>
            </div>
            <span className="text-muted-foreground">&rarr;</span>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <span className="text-cyan-500 font-mono text-xs">2</span>
              <span>Claude Vision pre-annotates</span>
            </div>
            <span className="text-muted-foreground">&rarr;</span>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <span className="text-cyan-500 font-mono text-xs">3</span>
              <span>Human validates</span>
            </div>
            <span className="text-muted-foreground">&rarr;</span>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <span className="text-cyan-500 font-mono text-xs">4</span>
              <span>Training dataset</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
