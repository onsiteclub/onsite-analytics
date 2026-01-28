'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatRelative, truncate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const T = {
  EVENTS: 'log_events',
} as const;

interface AppEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  event_data: Record<string, any> | null;
  app_version: string | null;
  os_version: string | null;
  created_at: string;
}

const eventTypeBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  login: 'default',
  logout: 'secondary',
  signup: 'default',
  login_failed: 'destructive',
  session_restored: 'secondary',
};

export default function EventsPage() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [countByType, setCountByType] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const supabase = createClient();

      const { data } = await supabase
        .from(T.EVENTS)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      const events = data || [];
      setEvents(events);

      // Count by type
      const counts = events.reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      setCountByType(counts);

      setLoading(false);
    }

    loadEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Events" description="Loading..." />
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
        title="Events"
        description="Authentication & activity audit log"
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Quick stats */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(countByType).map(([type, count]) => (
            <div key={type} className="bg-card border rounded-lg px-3 py-2 text-sm">
              <span className="text-muted-foreground">{type}:</span>{' '}
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left font-medium text-muted-foreground p-3 border-b">Type</th>
                <th className="text-left font-medium text-muted-foreground p-3 border-b">Data</th>
                <th className="text-left font-medium text-muted-foreground p-3 border-b">App</th>
                <th className="text-left font-medium text-muted-foreground p-3 border-b">Date</th>
                <th className="text-left font-medium text-muted-foreground p-3 border-b">User ID</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-muted/50">
                  <td className="p-3 border-b">
                    <Badge variant={eventTypeBadgeVariant[event.event_type] || 'outline'}>
                      {event.event_type}
                    </Badge>
                  </td>
                  <td className="p-3 border-b">
                    <div className="text-sm">
                      {event.event_data?.email && <p>{event.event_data.email}</p>}
                      {event.event_data?.error && (
                        <p className="text-destructive text-xs">{truncate(event.event_data.error, 40)}</p>
                      )}
                      {!event.event_data?.email && !event.event_data?.error && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 border-b">
                    <div className="text-sm">
                      <p>{event.app_version || '-'}</p>
                      <p className="text-xs text-muted-foreground">{event.os_version || ''}</p>
                    </div>
                  </td>
                  <td className="p-3 border-b">
                    <div className="text-sm">
                      <p>{formatDate(event.created_at, 'dd/MM HH:mm')}</p>
                      <p className="text-xs text-muted-foreground">{formatRelative(event.created_at)}</p>
                    </div>
                  </td>
                  <td className="p-3 border-b">
                    <span className="font-mono text-xs">
                      {event.user_id ? truncate(event.user_id, 12) : '-'}
                    </span>
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
