-- ============================================
-- ONSITE ANALYTICS - NOVA ESTRUTURA 5 ESFERAS
-- ============================================

-- 1️⃣ ANALYTICS DAILY (agregado por dia)
-- Combina Business + Product + Debug metrics
CREATE TABLE IF NOT EXISTS public.analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business Metrics
  sessions_count INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  manual_entries INTEGER DEFAULT 0,
  auto_entries INTEGER DEFAULT 0,
  
  -- Product Metrics
  app_opens INTEGER DEFAULT 0,
  notifications_shown INTEGER DEFAULT 0,
  notifications_actioned INTEGER DEFAULT 0,
  features_used JSONB DEFAULT '[]',
  time_in_app_seconds INTEGER DEFAULT 0,
  
  -- Debug Metrics
  errors_count INTEGER DEFAULT 0,
  sync_attempts INTEGER DEFAULT 0,
  sync_failures INTEGER DEFAULT 0,
  avg_geofence_accuracy REAL,
  avg_battery_level REAL,
  
  -- Metadata
  app_version TEXT,
  os TEXT,
  device_model TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(date, user_id)
);

-- 2️⃣ ERROR LOG (só erros, não tudo)
CREATE TABLE IF NOT EXISTS public.error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Debug Info
  error_type TEXT NOT NULL, -- 'crash', 'api', 'sync', 'geofence', 'auth'
  error_message TEXT,
  error_stack TEXT,
  error_context JSONB,
  
  -- Metadata
  app_version TEXT,
  os TEXT,
  os_version TEXT,
  device_model TEXT,
  connection_type TEXT, -- 'wifi', '4g', 'offline'
  battery_level REAL,
  
  synced_at TIMESTAMPTZ
);

-- 3️⃣ LOCATION AUDIT (GPS reduzido - só pontos importantes)
CREATE TABLE IF NOT EXISTS public.location_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  location_id UUID,
  
  event_type TEXT NOT NULL, -- 'entry', 'exit', 'dispute', 'manual_override'
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL,
  
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  app_version TEXT,
  device_model TEXT
);

-- 4️⃣ FEATURE USAGE (tracking de features)
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  feature_name TEXT NOT NULL, -- 'calculator', 'export', 'edit_session', 'add_location', etc
  action TEXT, -- 'opened', 'completed', 'abandoned'
  
  -- Funnel tracking
  flow_started_at TIMESTAMPTZ,
  flow_completed_at TIMESTAMPTZ,
  abandoned_at_step TEXT,
  
  -- Context
  session_context JSONB,
  
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  app_version TEXT
);

-- 5️⃣ ONBOARDING FUNNEL (time to value)
CREATE TABLE IF NOT EXISTS public.onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  step TEXT NOT NULL, -- 'signup', 'email_verified', 'first_location', 'first_session', 'first_export'
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  
  time_from_signup_seconds INTEGER,
  
  -- Metadata
  app_version TEXT,
  os TEXT
);

-- 6️⃣ Atualizar PROFILES com campos de Identity
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS total_hours_tracked REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_locations_created INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sessions_count INTEGER DEFAULT 0;

-- ============================================
-- INDEXES para performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON public.analytics_daily(date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_user ON public.analytics_daily(user_id);
CREATE INDEX IF NOT EXISTS idx_error_log_type ON public.error_log(error_type);
CREATE INDEX IF NOT EXISTS idx_error_log_timestamp ON public.error_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON public.feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_location_audit_session ON public.location_audit(session_id);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;

-- Admins podem ver tudo (via service role)
-- Users podem ver só os próprios dados
CREATE POLICY "Users can view own analytics" ON public.analytics_daily
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own errors" ON public.error_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own location audit" ON public.location_audit
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own feature usage" ON public.feature_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own onboarding" ON public.onboarding_events
  FOR SELECT USING (auth.uid() = user_id);

-- Insert policies (app pode inserir)
CREATE POLICY "Users can insert own analytics" ON public.analytics_daily
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own errors" ON public.error_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own location audit" ON public.location_audit
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own feature usage" ON public.feature_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding" ON public.onboarding_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VIEWS para métricas agregadas
-- ============================================

-- Business KPIs
CREATE OR REPLACE VIEW public.v_business_kpis AS
SELECT 
  COUNT(DISTINCT user_id) as total_users,
  SUM(sessions_count) as total_sessions,
  SUM(total_minutes) / 60.0 as total_hours,
  ROUND(AVG(CASE WHEN auto_entries + manual_entries > 0 
    THEN auto_entries::numeric / (auto_entries + manual_entries) * 100 
    ELSE 0 END), 1) as automation_rate,
  ROUND(AVG(total_minutes)::numeric / NULLIF(AVG(sessions_count), 0), 1) as avg_session_minutes
FROM public.analytics_daily
WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- Product Health
CREATE OR REPLACE VIEW public.v_product_health AS
SELECT
  ROUND(AVG(app_opens), 1) as avg_daily_opens,
  ROUND(AVG(time_in_app_seconds) / 60.0, 1) as avg_time_in_app_minutes,
  ROUND(AVG(CASE WHEN notifications_shown > 0 
    THEN notifications_actioned::numeric / notifications_shown * 100 
    ELSE 0 END), 1) as notification_response_rate
FROM public.analytics_daily
WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- Debug Health
CREATE OR REPLACE VIEW public.v_debug_health AS
SELECT
  SUM(errors_count) as total_errors,
  ROUND(AVG(CASE WHEN sync_attempts > 0 
    THEN (1 - sync_failures::numeric / sync_attempts) * 100 
    ELSE 100 END), 1) as sync_success_rate,
  ROUND(AVG(avg_geofence_accuracy), 1) as avg_geofence_accuracy,
  COUNT(DISTINCT CASE WHEN errors_count > 0 THEN user_id END) as users_with_errors
FROM public.analytics_daily
WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE public.analytics_daily IS 'Métricas agregadas por usuário/dia - Business, Product, Debug';
COMMENT ON TABLE public.error_log IS 'Log de erros para debugging - substitui logs granulares';
COMMENT ON TABLE public.location_audit IS 'GPS reduzido - só entry/exit, não rastro completo';
COMMENT ON TABLE public.feature_usage IS 'Tracking de uso de features para decisões de produto';
COMMENT ON TABLE public.onboarding_events IS 'Funnel de onboarding - time to value';
