// ============================================
// ONSITE ANALYTICS - DATABASE TYPES
// 5 Spheres: Identity, Business, Product, Debug, Metadata
// Matches mobile app schema (DATA_ARCHITECTURE.md)
// ============================================

// ============================================
// 1️⃣ IDENTITY (Who is the user)
// ============================================

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  trade: string | null;
  
  plan_type: 'free' | 'pro' | 'enterprise';
  device_platform: string | null;
  device_model: string | null;
  timezone: string | null;
  locale: string;
  
  total_hours_tracked: number;
  total_locations_created: number;
  total_sessions_count: number;
  subscription_status: string | null;
  
  created_at: string;
  last_active_at: string | null;
  
  is_admin: boolean | null;
  is_suspended: boolean | null;
}

// ============================================
// 2️⃣ BUSINESS (Value generated)
// ============================================

export interface Location {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  color: string | null;
  status: 'active' | 'deleted' | 'pending_delete';
  deleted_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string | null;
  synced_at: string | null;
}

export interface Record {
  id: string;
  user_id: string;
  location_id: string;
  location_name: string | null;
  entry_at: string;
  exit_at: string | null;
  type: 'automatic' | 'manual';
  manually_edited: boolean;
  edit_reason: string | null;
  integrity_hash: string | null;
  color: string | null;
  device_id: string | null;
  pause_minutes: number;
  created_at: string;
  synced_at: string | null;
}

// Legacy aliases for backwards compatibility
export type Local = Location;
export type Registro = Record;

// ============================================
// 3️⃣ PRODUCT (UX Metrics)
// ============================================

export interface FeatureUsage {
  id: string;
  user_id: string;
  feature_name: string;
  action: 'opened' | 'completed' | 'abandoned';
  flow_started_at: string | null;
  flow_completed_at: string | null;
  abandoned_at_step: string | null;
  session_context: { [key: string]: any } | null;
  timestamp: string;
  app_version: string | null;
}

export interface OnboardingEvent {
  id: string;
  user_id: string;
  step: 'signup' | 'email_verified' | 'first_location' | 'first_session' | 'first_export';
  completed_at: string;
  time_from_signup_seconds: number | null;
  app_version: string | null;
  os: string | null;
}

// ============================================
// 4️⃣ DEBUG (Bug control)
// ============================================

export interface ErrorLog {
  id: string;
  user_id: string | null;
  error_type: string;
  error_message: string;
  error_stack: string | null;
  error_context: string | null; // JSON string
  app_version: string | null;
  os: string | null;
  os_version: string | null;
  device_model: string | null;
  occurred_at: string;
  created_at: string;
  synced_at: string | null;
}

export interface LocationAudit {
  id: string;
  user_id: string;
  session_id: string | null;
  event_type: 'entry' | 'exit' | 'dispute' | 'correction';
  location_id: string | null;
  location_name: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  occurred_at: string;
  created_at: string;
  synced_at: string | null;
}

// ============================================
// 5️⃣ AGGREGATED ANALYTICS
// ============================================

export interface AnalyticsDaily {
  date: string;
  user_id: string;
  
  // Business
  sessions_count: number;
  total_minutes: number;
  manual_entries: number;
  auto_entries: number;
  locations_created: number;
  locations_deleted: number;
  
  // Product
  app_opens: number;
  app_foreground_seconds: number;
  notifications_shown: number;
  notifications_actioned: number;
  features_used: string; // JSON array string
  
  // Debug
  errors_count: number;
  sync_attempts: number;
  sync_failures: number;
  geofence_triggers: number;
  geofence_accuracy_sum: number;
  geofence_accuracy_count: number;
  
  // Metadata
  app_version: string | null;
  os: string | null;
  device_model: string | null;
  
  created_at: string;
  synced_at: string | null;
}

// Legacy alias
export type TelemetryDaily = AnalyticsDaily;

// ============================================
// APP EVENTS (Legacy support)
// ============================================

export interface AppEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: { [key: string]: any } | null;
  app_version: string | null;
  created_at: string;
}

// ============================================
// DASHBOARD AGGREGATED TYPES
// ============================================

export interface DashboardStats {
  totalUsers: number;
  totalSessions: number;
  totalLocations: number;
  totalEvents: number;
  automationRate: number;
  avgSessionMinutes: number;
}

export interface UserActivitySummary {
  user_id: string;
  email: string;
  name: string | null;
  total_sessions: number;
  total_hours: number;
  last_active: string | null;
}

export interface DailyMetrics {
  date: string;
  sessions: number;
  hours: number;
  users: number;
  errors: number;
}

export interface QueryFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// CHART DATA TYPES
// ============================================

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  [key: string]: string | number;
}
