// ============================================
// ARGUS - SUPABASE SCHEMA TYPES
// Complete 38-table schema for OnSite Analytics
// Generated from ARGUS.md specification
// ============================================

// ============================================
// 1. REFERENCE (3 tables)
// ============================================

export interface RefTrade {
  id: string;
  code: string;
  name_en: string;
  name_fr: string | null;
  name_pt: string | null;
  name_es: string | null;
  category: string;
  subcategory: string | null;
  description_en: string | null;
  common_tools: string[] | null;
  common_materials: string[] | null;
  common_calculations: string[] | null;
  common_slang: Record<string, string> | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RefProvince {
  id: string;
  code: string;
  country: string;
  name_en: string;
  name_fr: string | null;
  timezone: string;
  has_red_seal: boolean;
  min_wage: number | null;
  overtime_threshold: number;
  is_active: boolean;
  created_at: string;
}

export interface RefUnit {
  id: string;
  code: string;
  symbol: string;
  name_en: string;
  name_pt: string | null;
  unit_type: string;
  system: 'imperial' | 'metric';
  base_unit_code: string | null;
  conversion_factor: number | null;
  spoken_variations: string[] | null;
  is_active: boolean;
  created_at: string;
}

// ============================================
// 2. IDENTITY (3 tables)
// ============================================

export interface CoreProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;

  // Professional
  trade: string | null;
  trade_other: string | null;
  experience_years: number | null;
  experience_level: 'apprentice' | 'journeyman' | 'master' | 'foreman' | null;
  certifications: string[] | null;

  // Employment
  employment_type: 'employee' | 'contractor' | 'self_employed' | 'business_owner' | null;
  company_name: string | null;
  company_size: 'solo' | '2-10' | '11-50' | '51-200' | '200+' | null;

  // Location
  country: string;
  province: string | null;
  city: string | null;
  postal_prefix: string | null;
  timezone: string;

  // Language
  language_primary: string;
  language_secondary: string | null;
  language_origin: string | null;

  // Preferences
  units_system: 'imperial' | 'metric';
  date_format: string;
  time_format: '12h' | '24h';

  // Onboarding
  onboarding_completed_at: string | null;
  onboarding_source: string | null;
  referral_code: string | null;
  referred_by: string | null;

  // Engagement
  first_active_at: string | null;
  last_active_at: string | null;
  total_sessions: number;
  profile_completeness: number;

  created_at: string;
  updated_at: string;
}

export interface CoreDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string | null;
  platform: 'ios' | 'android' | 'web';
  manufacturer: string | null;
  model: string | null;
  os_version: string | null;
  app_name: string | null;
  app_version: string | null;
  has_gps: boolean;
  has_microphone: boolean;
  push_token: string | null;
  push_enabled: boolean;
  is_primary: boolean;
  is_active: boolean;
  first_seen_at: string;
  last_active_at: string | null;
  session_count: number;
  created_at: string;
  updated_at: string;
}

export interface CoreConsent {
  id: string;
  user_id: string;
  consent_type: string;
  document_version: string;
  document_hash: string | null;
  granted: boolean;
  granted_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  app_name: string | null;
  app_version: string | null;
  collection_method: 'checkbox' | 'popup' | 'signup_flow' | 'settings' | null;
  created_at: string;
}

// ============================================
// 3. TIMEKEEPER (3 tables) - KRONOS Domain
// ============================================

export interface TimekeeperProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'archived';
  color: string;
  start_date: string | null;
  end_date: string | null;
  budget_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface TimekeeperGeofence {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  color: string;
  address_street: string | null;
  address_city: string | null;
  address_province: string | null;
  address_postal: string | null;
  location_type: 'residential' | 'commercial' | 'industrial' | null;
  project_type: 'new_construction' | 'renovation' | 'maintenance' | null;
  status: 'active' | 'paused' | 'archived';
  is_favorite: boolean;
  total_entries: number;
  total_hours: number;
  last_entry_at: string | null;
  deleted_at: string | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimekeeperEntry {
  id: string;
  user_id: string;
  geofence_id: string | null;
  location_name: string | null;
  entry_at: string;
  exit_at: string | null;
  type: 'manual' | 'automatic' | 'voice';
  entry_method: 'manual' | 'geofence' | 'qrcode' | 'nfc' | 'voice' | null;
  exit_method: 'manual' | 'geofence' | 'qrcode' | 'nfc' | 'voice' | 'auto_timeout' | null;
  manually_edited: boolean;
  edit_reason: string | null;
  original_entry_at: string | null;
  original_exit_at: string | null;
  duration_minutes: number | null;
  pause_minutes: number;
  notes: string | null;
  tags: string[] | null;
  device_id: string | null;
  synced_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// 4. CALCULATOR (3 tables) - CEULEN Domain
// ============================================

export interface CalculatorConsent {
  id: string;
  user_id: string;
  consent_type: string;
  granted: boolean;
  granted_at: string | null;
  revoked_at: string | null;
  document_version: string | null;
  ip_address: string | null;
  user_agent: string | null;
  app_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface VoiceLog {
  id: string;
  user_id: string | null;
  app_name: string;
  feature_context: string | null;
  session_id: string | null;

  // Audio
  audio_storage_path: string | null;
  audio_duration_ms: number | null;
  audio_sample_rate: number | null;
  audio_format: string | null;

  // Transcription
  transcription_raw: string | null;
  transcription_normalized: string | null;
  transcription_engine: string | null;
  transcription_confidence: number | null;

  // Language
  language_detected: string | null;
  language_confidence: number | null;
  dialect_region: string | null;

  // Intent
  intent_detected: string | null;
  intent_confidence: number | null;
  intent_fulfilled: boolean | null;

  // Entities
  entities: Record<string, unknown> | null;
  informal_terms: string[] | null;

  // Quality
  background_noise_level: 'low' | 'medium' | 'high' | null;
  background_noise_type: string | null;
  speech_clarity: 'clear' | 'muffled' | 'accented' | null;

  // Result
  was_successful: boolean | null;
  error_type: string | null;
  error_message: string | null;

  // User correction
  user_corrected: boolean;
  user_correction: string | null;
  correction_applied_at: string | null;

  // Retry
  retry_count: number;
  retry_of_id: string | null;

  // Device
  device_model: string | null;
  os: string | null;
  app_version: string | null;
  microphone_type: string | null;

  // Location
  latitude: number | null;
  longitude: number | null;

  client_timestamp: string | null;
  created_at: string;
}

export interface Calculation {
  id: string;
  user_id: string | null;
  calc_type: string;
  calc_subtype: string | null;
  input_expression: string;
  input_values: Record<string, unknown> | null;
  result_value: number | null;
  result_unit: string | null;
  result_formatted: string | null;
  input_method: 'keypad' | 'voice' | 'camera';
  voice_log_id: string | null;
  template_id: string | null;
  trade_context: string | null;
  was_successful: boolean;
  was_saved: boolean;
  was_shared: boolean;
  device_id: string | null;
  app_version: string | null;
  created_at: string;
}

// ============================================
// 5. SHOP (6 tables) - MERCATOR Domain
// ============================================

export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopProduct {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  images: string[] | null;
  sizes: string[] | null;
  colors: string[] | null;
  target_trades: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  total_sold: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
}

export interface ShopProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  price_override: number | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopOrder {
  id: string;
  user_id: string | null;
  order_number: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  shipping_address: Record<string, unknown> | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_image: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface ShopCart {
  id: string;
  user_id: string | null;
  items: Record<string, unknown>[];
  subtotal: number;
  shipping: number;
  total: number;
  created_at: string;
  expires_at: string;
}

// ============================================
// 6. BILLING (4 tables)
// ============================================

export interface BillingProduct {
  id: string;
  app: 'calculator' | 'timekeeper' | 'shop';
  name: string;
  description: string | null;
  stripe_price_id: string;
  stripe_product_id: string | null;
  price_amount: number | null;
  price_currency: string;
  billing_interval: 'month' | 'year' | null;
  features: string[];
  limits: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingSubscription {
  id: string;
  user_id: string;
  app_name: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled';
  current_period_start: string | null;
  current_period_end: string | null;
  trial_start: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  cancellation_reason: string | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  has_payment_method: boolean;
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  billing_address_city: string | null;
  billing_address_state: string | null;
  billing_address_postal_code: string | null;
  billing_address_country: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistory {
  id: string;
  user_id: string;
  app_name: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  billing_address_city: string | null;
  billing_address_state: string | null;
  billing_address_postal_code: string | null;
  billing_address_country: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface CheckoutCode {
  code: string;
  user_id: string;
  email: string;
  app: string;
  redirect_url: string | null;
  expires_at: string;
  used: boolean;
  created_at: string;
}

// ============================================
// 7. DEBUG (5 tables)
// ============================================

export interface LogError {
  id: string;
  user_id: string | null;
  error_type: string;
  error_message: string;
  error_stack: string | null;
  error_context: Record<string, unknown> | null;
  app_name: string | null;
  screen_name: string | null;
  action_attempted: string | null;
  app_version: string | null;
  os: string | null;
  os_version: string | null;
  device_model: string | null;
  network_type: 'wifi' | 'cellular' | 'offline' | null;
  occurred_at: string;
  synced_at: string | null;
  created_at: string;
}

export interface LogEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  event_data: Record<string, unknown> | null;
  app_name: string | null;
  app_version: string | null;
  created_at: string;
}

export interface LogLocation {
  id: string;
  user_id: string;
  session_id: string | null;
  event_type: 'entry' | 'exit' | 'heartbeat' | 'dispute' | 'correction';
  location_id: string | null;
  location_name: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  distance_from_center: number | null;
  occurred_at: string;
  synced_at: string | null;
  created_at: string;
}

export interface LogVoice {
  id: string;
  user_id: string | null;
  session_id: string | null;
  audio_duration_ms: number | null;
  was_successful: boolean | null;
  error_type: string | null;
  language_detected: string | null;
  created_at: string;
}

export interface AppLog {
  id: string;
  user_id: string | null;
  level: 'debug' | 'info' | 'warn' | 'error';
  module: string;
  action: string;
  message: string | null;
  context: Record<string, unknown> | null;
  device_info: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  duration_ms: number | null;
  success: boolean | null;
  app_name: string | null;
  app_version: string | null;
  created_at: string;
}

// ============================================
// 8. ANALYTICS (3 tables)
// ============================================

export interface AggUserDaily {
  date: string;
  user_id: string;

  // Timekeeper sessions
  sessions_count: number;
  total_minutes: number;
  manual_entries: number;
  auto_entries: number;
  locations_created: number;
  locations_deleted: number;

  // App usage
  app_opens: number;
  app_foreground_seconds: number;
  notifications_shown: number;
  notifications_actioned: number;
  features_used: string[];

  // Calculator
  calculations_count: number;
  calculations_voice: number;
  voice_success_rate: number | null;

  // Debug
  errors_count: number;
  sync_attempts: number;
  sync_failures: number;
  geofence_triggers: number;
  geofence_accuracy_avg: number | null;

  // Device
  app_version: string | null;
  os: string | null;
  device_model: string | null;

  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AggPlatformDaily {
  date: string;
  total_users: number;
  active_users: number;
  new_signups: number;
  total_sessions: number;
  total_hours: number;
  total_calculations: number;
  voice_calculations: number;
  errors_count: number;
  revenue_cents: number;
  created_at: string;
}

export interface AggTradeWeekly {
  week_start: string;
  trade: string;
  active_users: number;
  total_hours: number;
  avg_hours_per_user: number;
  calculations_count: number;
  voice_adoption_rate: number | null;
  created_at: string;
}

// ============================================
// 9. INTELLIGENCE (2 tables)
// ============================================

export interface IntVoicePattern {
  id: string;
  pattern_type: 'term' | 'phrase' | 'pronunciation' | 'intent' | 'slang';
  raw_form: string;
  normalized_form: string | null;
  language: string;
  dialect_region: string | null;
  trade_context: string | null;
  occurrence_count: number;
  unique_users_count: number;
  confidence_avg: number | null;
  variations: string[];
  example_contexts: string[];
  is_validated: boolean;
  validated_by: string | null;
  validated_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface IntBehaviorPattern {
  id: string;
  user_id: string | null;
  pattern_type: 'work_schedule' | 'app_usage' | 'churn_risk';
  pattern_data: Record<string, unknown> | null;
  confidence: number | null;
  detected_at: string;
  expires_at: string | null;
  created_at: string;
}

// ============================================
// 10. ADMIN (2 tables)
// ============================================

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'support' | 'analyst';
  permissions: string[];
  is_active: boolean;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================
// 11. REWARDS (1 table)
// ============================================

export interface BladesTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'earn' | 'redeem' | 'bonus' | 'adjustment' | 'referral';
  reason: string | null;
  order_id: string | null;
  product_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================
// 12. ARGUS (1 table)
// ============================================

export interface ArgusMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  visualization?: ArgusVisualization | null;
  sql?: string | null;
}

export interface ArgusVisualization {
  type: 'chart' | 'table' | 'metric' | 'alert' | 'user_card';
  chartType?: 'line' | 'bar' | 'pie';
  title?: string;
  data?: unknown[];
  columns?: string[];
  value?: string | number;
  items?: string[];
  downloadable?: boolean;
}

export interface ArgusConversation {
  id: string;
  user_id: string;
  title: string | null;
  messages: ArgusMessage[];
  starred: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// VIEWS (4 views)
// ============================================

export interface VChurnRisk {
  id: string;
  email: string;
  full_name: string | null;
  trade: string | null;
  province: string | null;
  days_inactive: number | null;
  subscription_status: string | null;
  trial_end: string | null;
  has_payment_method: boolean | null;
  churn_risk: 'high' | 'medium' | 'low';
  trial_expiring_soon: boolean;
}

export interface VUserHealth {
  id: string;
  email: string;
  full_name: string | null;
  trade: string | null;
  calculations_30d: number;
  voice_uses_30d: number;
  timekeeper_entries_30d: number;
  health_score: number;
}

export interface VRevenueByProvince {
  province: string | null;
  province_name: string | null;
  paying_users: number;
  total_revenue_cad: number;
  avg_payment_cad: number;
}

export interface VVoiceAdoptionByTrade {
  trade: string;
  trade_name: string | null;
  total_users: number;
  voice_users: number;
  total_voice_logs: number;
  adoption_rate_pct: number;
}

// ============================================
// TABLE NAME MAPPING
// ============================================

export const TABLE_NAMES = {
  // Reference
  ref_trades: 'ref_trades',
  ref_provinces: 'ref_provinces',
  ref_units: 'ref_units',

  // Identity
  core_profiles: 'core_profiles',
  core_devices: 'core_devices',
  core_consents: 'core_consents',

  // Timekeeper
  app_timekeeper_projects: 'app_timekeeper_projects',
  app_timekeeper_geofences: 'app_timekeeper_geofences',
  app_timekeeper_entries: 'app_timekeeper_entries',

  // Calculator
  consents: 'consents',
  voice_logs: 'voice_logs',
  calculations: 'calculations',

  // Shop
  categories: 'categories',
  app_shop_products: 'app_shop_products',
  app_shop_product_variants: 'app_shop_product_variants',
  app_shop_orders: 'app_shop_orders',
  app_shop_order_items: 'app_shop_order_items',
  app_shop_carts: 'app_shop_carts',

  // Billing
  billing_products: 'billing_products',
  billing_subscriptions: 'billing_subscriptions',
  payment_history: 'payment_history',
  checkout_codes: 'checkout_codes',

  // Debug
  log_errors: 'log_errors',
  log_events: 'log_events',
  log_locations: 'log_locations',
  log_voice: 'log_voice',
  app_logs: 'app_logs',

  // Analytics
  agg_user_daily: 'agg_user_daily',
  agg_platform_daily: 'agg_platform_daily',
  agg_trade_weekly: 'agg_trade_weekly',

  // Intelligence
  int_voice_patterns: 'int_voice_patterns',
  int_behavior_patterns: 'int_behavior_patterns',

  // Admin
  admin_users: 'admin_users',
  admin_logs: 'admin_logs',

  // Rewards
  blades_transactions: 'blades_transactions',

  // ARGUS
  argus_conversations: 'argus_conversations',

  // Views
  v_churn_risk: 'v_churn_risk',
  v_user_health: 'v_user_health',
  v_revenue_by_province: 'v_revenue_by_province',
  v_voice_adoption_by_trade: 'v_voice_adoption_by_trade',
} as const;

// Legacy aliases for backwards compatibility
export type Profile = CoreProfile;
export type Location = TimekeeperGeofence;
export type TimeEntry = TimekeeperEntry;
export type ErrorLog = LogError;
export type LocationAudit = LogLocation;
export type AnalyticsDaily = AggUserDaily;
