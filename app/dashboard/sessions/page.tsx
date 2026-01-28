'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatDuration } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

const T = {
  ENTRIES: 'app_timekeeper_entries',
} as const;

interface Entry {
  id: string;
  location_name: string | null;
  entry_at: string;
  exit_at: string | null;
  type: string | null;
  manually_edited: boolean | null;
  break_minutes: number | null;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<(Entry & { duration: number })[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      const supabase = createClient();

      const { data } = await supabase
        .from(T.ENTRIES)
        .select('*')
        .order('entry_at', { ascending: false })
        .limit(100);

      const withDuration = (data || []).map(s => {
        let duration = 0;
        if (s.entry_at && s.exit_at) {
          duration = Math.round((new Date(s.exit_at).getTime() - new Date(s.entry_at).getTime()) / 60000);
        } else if (s.entry_at) {
          duration = Math.round((Date.now() - new Date(s.entry_at).getTime()) / 60000);
        }
        return { ...s, duration };
      });

      setSessions(withDuration);
      setOpenCount(withDuration.filter(s => !s.exit_at).length);
      setLoading(false);
    }

    loadSessions();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Sessions" description="Loading..." />
        <div className="flex-1 p-6">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Sessions"
        description={`${sessions.length} work sessions`}
      />

      <div className="flex-1 p-6 space-y-6">
        {openCount > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-600">
                {openCount} session(s) still open
              </p>
              <p className="text-sm text-muted-foreground">
                Sessions without clock-out may indicate geofence or heartbeat issues.
              </p>
            </div>
          </div>
        )}

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left font-medium text-muted-foreground p-3 border-b">Location</th>
                <th className="text-left font-medium text-muted-foreground p-3 border-b">Entry</th>
                <th className="text-left font-medium text-muted-foreground p-3 border-b">Exit</th>
                <th className="text-left font-medium text-muted-foreground p-3 border-b">Duration</th>
                <th className="text-left font-medium text-muted-foreground p-3 border-b">Type</th>
                <th className="text-left font-medium text-muted-foreground p-3 border-b">Edited</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-muted/50">
                  <td className="p-3 border-b">
                    <div>
                      <p className="font-medium">{session.location_name || 'Unknown location'}</p>
                      <p className="text-xs text-muted-foreground font-mono">{session.id.slice(0, 8)}...</p>
                    </div>
                  </td>
                  <td className="p-3 border-b">{formatDate(session.entry_at, 'dd/MM HH:mm')}</td>
                  <td className="p-3 border-b">
                    {session.exit_at ? (
                      formatDate(session.exit_at, 'dd/MM HH:mm')
                    ) : (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/50">
                        In progress
                      </Badge>
                    )}
                  </td>
                  <td className="p-3 border-b">
                    {formatDuration(session.duration - (session.break_minutes || 0))}
                  </td>
                  <td className="p-3 border-b">
                    <Badge variant={session.type === 'automatic' ? 'default' : 'secondary'}>
                      {session.type || 'manual'}
                    </Badge>
                  </td>
                  <td className="p-3 border-b">
                    {session.manually_edited ? (
                      <Badge variant="outline">Yes</Badge>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
