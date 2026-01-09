import { createClient } from './client';
import {
  Profile,
  AppEvent,
  Location,
  Record,
  AnalyticsDaily,
  DashboardStats,
  UserActivitySummary,
  DailyMetrics,
  QueryFilters,
  PaginatedResult,
} from '@/types/database';

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();

  const [
    { count: totalUsers },
    { count: totalSessions },
    { count: totalLocations },
    { count: totalEvents },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('records').select('*', { count: 'exact', head: true }),
    supabase.from('locations').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('app_events').select('*', { count: 'exact', head: true }),
  ]);

  // Calculate automation rate
  const { data: sessions } = await supabase
    .from('records')
    .select('type')
    .limit(1000);

  const autoCount = sessions?.filter(s => s.type === 'automatic').length || 0;
  const total = sessions?.length || 1;
  const automationRate = Math.round((autoCount / total) * 100);

  // Calculate avg session duration
  const { data: completedSessions } = await supabase
    .from('records')
    .select('entry_at, exit_at')
    .not('exit_at', 'is', null)
    .limit(500);

  let totalMinutes = 0;
  completedSessions?.forEach(s => {
    if (s.entry_at && s.exit_at) {
      totalMinutes += (new Date(s.exit_at).getTime() - new Date(s.entry_at).getTime()) / 60000;
    }
  });
  const avgSessionMinutes = completedSessions?.length 
    ? Math.round(totalMinutes / completedSessions.length) 
    : 0;

  return {
    totalUsers: totalUsers || 0,
    totalSessions: totalSessions || 0,
    totalLocations: totalLocations || 0,
    totalEvents: totalEvents || 0,
    automationRate,
    avgSessionMinutes,
  };
}

// ============================================
// USERS / PROFILES
// ============================================

export async function getUsers(
  page = 1,
  pageSize = 20,
  filters?: QueryFilters
): Promise<PaginatedResult<Profile>> {
  const supabase = createClient();
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (filters?.userId) {
    query = query.eq('id', filters.userId);
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > offset + pageSize,
  };
}

export async function getUserActivity(userId: string): Promise<UserActivitySummary | null> {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) return null;

  const { count: sessionCount } = await supabase
    .from('records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { data: sessions } = await supabase
    .from('records')
    .select('entry_at, exit_at')
    .eq('user_id', userId)
    .not('exit_at', 'is', null);

  let totalMinutes = 0;
  sessions?.forEach(s => {
    if (s.entry_at && s.exit_at) {
      totalMinutes += (new Date(s.exit_at).getTime() - new Date(s.entry_at).getTime()) / 60000;
    }
  });

  return {
    user_id: profile.id,
    email: profile.email,
    name: profile.name,
    total_sessions: sessionCount || 0,
    total_hours: Math.round(totalMinutes / 60 * 10) / 10,
    last_active: profile.last_active_at,
  };
}

// ============================================
// SESSIONS / RECORDS
// ============================================

export async function getSessions(
  page = 1,
  pageSize = 20,
  filters?: QueryFilters
): Promise<PaginatedResult<Record>> {
  const supabase = createClient();
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('records')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters?.startDate) {
    query = query.gte('entry_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('entry_at', filters.endDate);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > offset + pageSize,
  };
}

// ============================================
// EVENTS
// ============================================

export async function getEvents(
  page = 1,
  pageSize = 20,
  filters?: QueryFilters
): Promise<PaginatedResult<AppEvent>> {
  const supabase = createClient();
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('app_events')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > offset + pageSize,
  };
}

// ============================================
// ANALYTICS
// ============================================

export async function getDailyMetrics(
  filters?: QueryFilters
): Promise<DailyMetrics[]> {
  const supabase = createClient();

  let query = supabase
    .from('analytics_daily')
    .select('*')
    .order('date', { ascending: false })
    .limit(filters?.limit || 30);

  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Aggregate by date
  const byDate: { [key: string]: DailyMetrics } = {};

  data?.forEach(row => {
    const date = row.date;
    if (!byDate[date]) {
      byDate[date] = {
        date,
        sessions: 0,
        hours: 0,
        users: 0,
        errors: 0,
      };
    }
    byDate[date].sessions += row.sessions_count || 0;
    byDate[date].hours += Math.round((row.total_minutes || 0) / 60);
    byDate[date].users += 1;
    byDate[date].errors += row.errors_count || 0;
  });

  return Object.values(byDate).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// ============================================
// LOCATIONS
// ============================================

export async function getLocations(
  page = 1,
  pageSize = 20,
  filters?: QueryFilters
): Promise<PaginatedResult<Location>> {
  const supabase = createClient();
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('locations')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > offset + pageSize,
  };
}

// ============================================
// SEARCH
// ============================================

export async function searchUsers(term: string): Promise<Profile[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`email.ilike.%${term}%,name.ilike.%${term}%`)
    .limit(10);

  if (error) throw error;
  return data || [];
}
