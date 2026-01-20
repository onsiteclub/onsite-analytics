import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// ARGUS - TELETRAAN9 AI ENGINE
// All-seeing Realtime Guardian & Unified Statistics
// ============================================

const ARGUS_IDENTITY = `
# IDENTITY

You are Teletraan9, the AI engine powering ARGUS - OnSite Analytics Intelligence System.
You are the "eyes" of Blue (the orchestrator) on the Supabase database.
You help Cristony and the team understand data through natural language queries.

# CAPABILITIES

You have three layers of intelligence:

1. **VISION** (NOW): Real-time metrics, active sessions, recent errors
2. **ANALYSIS** (WHY): Cross-domain queries, cohort analysis, feature adoption
3. **PRE-COGNITION** (WHAT'S NEXT): Churn prediction, growth forecast, anomaly detection
`;

const DATABASE_SCHEMA = `
# DATABASE SCHEMA (38 Tables, 12 Domains)

## REFERENCE (3)
- **ref_trades**: code, name_en, name_fr, category, subcategory, common_tools[], common_materials[], common_slang{}
- **ref_provinces**: code, name_en, timezone, min_wage, overtime_threshold, has_red_seal
- **ref_units**: code, symbol, name_en, unit_type (length/area/volume), system (imperial/metric), spoken_variations[]

## IDENTITY (3)
- **core_profiles**: id, email, full_name, trade, province, language_primary, experience_level, employment_type, company_size, units_system, onboarding_completed_at, last_active_at, total_sessions, profile_completeness
- **core_devices**: user_id, device_id, platform (ios/android/web), model, os_version, app_name, app_version, is_primary, push_enabled
- **core_consents**: user_id, consent_type, granted, granted_at, document_version

## TIMEKEEPER (3) - KRONOS Domain
- **app_timekeeper_projects**: user_id, name, status (active/completed/archived), budget_hours
- **app_timekeeper_geofences**: user_id, name, latitude, longitude, radius, total_hours, total_entries, status
- **app_timekeeper_entries**: user_id, geofence_id, entry_at, exit_at, type (manual/automatic/voice), duration_minutes, pause_minutes

## CALCULATOR (3) - CEULEN Domain
- **consents**: user_id, consent_type (voice_training/data_analytics/marketing), granted
- **voice_logs**: user_id, transcription_raw, transcription_normalized, language_detected, intent_detected, entities{}, informal_terms[], was_successful, user_corrected
- **calculations**: user_id, calc_type, calc_subtype, input_expression, result_value, result_unit, input_method (keypad/voice/camera), trade_context

## SHOP (6) - MERCATOR Domain
- **categories**: name, slug, is_active
- **app_shop_products**: category_id, name, base_price, compare_at_price, sizes[], colors[], target_trades[], is_featured, total_sold, total_revenue
- **app_shop_product_variants**: product_id, sku, size, color, price_override, stock_quantity
- **app_shop_orders**: user_id, order_number, status (pending/paid/processing/shipped/delivered/cancelled/refunded), total, paid_at
- **app_shop_order_items**: order_id, product_id, variant_id, quantity, unit_price, total_price
- **app_shop_carts**: user_id, items[], total, expires_at

## BILLING (4)
- **billing_products**: app (calculator/timekeeper/shop), name, stripe_price_id, price_amount, billing_interval
- **billing_subscriptions**: user_id, app_name, status (inactive/trialing/active/past_due/canceled), trial_end, has_payment_method, cancel_at_period_end
- **payment_history**: user_id, app_name, amount, status (succeeded/pending/failed), paid_at
- **checkout_codes**: code, user_id, app, expires_at, used

## DEBUG (5)
- **log_errors**: user_id, error_type (crash/network/sync/auth/validation), error_message, error_stack, app_name, screen_name, app_version, os, device_model, occurred_at
- **log_events**: user_id, event_type (login/logout/signup/feature_used), event_data{}, app_name
- **log_locations**: user_id, event_type (entry/exit/heartbeat/dispute), latitude, longitude, accuracy, distance_from_center
- **log_voice**: user_id, audio_duration_ms, was_successful, error_type, language_detected
- **app_logs**: user_id, level (debug/info/warn/error), module, action, message, duration_ms, success

## ANALYTICS (3)
- **agg_user_daily**: date, user_id, sessions_count, total_minutes, app_opens, calculations_count, calculations_voice, errors_count
- **agg_platform_daily**: date, active_users, new_signups, total_sessions, total_hours, revenue_cents
- **agg_trade_weekly**: week_start, trade, active_users, avg_hours_per_user, voice_adoption_rate

## INTELLIGENCE (2)
- **int_voice_patterns**: pattern_type (term/phrase/pronunciation/slang), raw_form, normalized_form, language, trade_context, occurrence_count, is_validated
- **int_behavior_patterns**: user_id, pattern_type (work_schedule/app_usage/churn_risk), pattern_data{}, confidence

## ADMIN (2)
- **admin_users**: user_id, email, name, role (super_admin/admin/support/analyst), is_active, approved
- **admin_logs**: admin_id, action, entity_type, entity_id, details{}

## REWARDS (1)
- **blades_transactions**: user_id, amount (positive=earn, negative=redeem), type (earn/redeem/bonus/referral), reason

## ARGUS (1)
- **argus_conversations**: user_id, title, messages[], starred, archived

## VIEWS
- **v_churn_risk**: id, email, days_inactive, subscription_status, churn_risk (high/medium/low), trial_expiring_soon
- **v_user_health**: id, email, calculations_30d, voice_uses_30d, timekeeper_entries_30d, health_score
- **v_revenue_by_province**: province, province_name, paying_users, total_revenue_cad
- **v_voice_adoption_by_trade**: trade, trade_name, total_users, voice_users, adoption_rate_pct
`;

const RESPONSE_GUIDELINES = `
# HOW TO RESPOND

1. **Always show your work**: Include the SQL query you would use
2. **Visualize when possible**: Suggest charts, tables, or metrics
3. **Be actionable**: Don't just show data, give insights
4. **Cross-reference**: Connect data from multiple domains when relevant
5. **Predict**: When asked about trends, project forward

# QUICK COMMANDS

Recognize these commands:
- /report weekly → Generate weekly metrics report
- /report monthly → Generate monthly metrics report
- /churn → Show users at risk (v_churn_risk view)
- /revenue → Show MRR and revenue by province
- /errors today → Show errors from last 24h
- /sql → Show the last SQL query used

# RESPONSE FORMAT

Structure responses with:
1. **Answer** - Direct answer to the question
2. **Data** - Table/chart/metric if applicable (set visualization object)
3. **Query** - SQL used (for transparency)
4. **Insight** - What this means for the business
5. **Action** - What should be done about it

# VISUALIZATION TYPES

Return visualization object when data visualization helps:
- type: 'chart' | 'table' | 'metric' | 'alert' | 'user_card'
- chartType: 'line' | 'bar' | 'pie' (for charts)
- title: string
- data: array of data points
- columns: array of column names (for tables)
- downloadable: true (to enable export buttons)
`;

// ============================================
// REGION MAPPING
// ============================================

const REGION_NAMES: { [key: string]: string } = {
  QC: 'Quebec', ON: 'Ontario', BC: 'British Columbia', AB: 'Alberta',
  MB: 'Manitoba', SK: 'Saskatchewan', NS: 'Nova Scotia', NB: 'New Brunswick',
  NL: 'Newfoundland', PE: 'Prince Edward Island', YT: 'Yukon',
  NT: 'Northwest Territories', NU: 'Nunavut',
};

// ============================================
// REF CODE DECODER
// ============================================

interface DecodedRef {
  isValid: boolean;
  regionCode: string | null;
  regionName: string | null;
  userSuffix: string | null;
  exportMonth: number | null;
  exportDay: number | null;
  sessionCount: number | null;
}

function decodeRefCode(refCode: string): DecodedRef {
  const clean = refCode.replace(/^Ref\s*#?\s*/i, '').trim().toUpperCase();
  const pattern = /^([A-Z]{2})-([A-F0-9]{4})-(\d{4})-(\d{2})$/;
  const match = clean.match(pattern);

  if (!match) {
    return { isValid: false, regionCode: null, regionName: null, userSuffix: null, exportMonth: null, exportDay: null, sessionCount: null };
  }

  const [, regionCode, userSuffix, dateStr, sessionsStr] = match;

  return {
    isValid: true,
    regionCode,
    regionName: REGION_NAMES[regionCode] || 'Unknown',
    userSuffix: userSuffix.toLowerCase(),
    exportMonth: parseInt(dateStr.slice(0, 2), 10),
    exportDay: parseInt(dateStr.slice(2, 4), 10),
    sessionCount: parseInt(sessionsStr, 10),
  };
}

function detectRefCode(message: string): DecodedRef | null {
  const patterns = [
    /Ref\s*#?\s*([A-Z]{2}-[A-F0-9]{4}-\d{4}-\d{2})/i,
    /([A-Z]{2}-[A-F0-9]{4}-\d{4}-\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const decoded = decodeRefCode(match[1]);
      if (decoded.isValid) return decoded;
    }
  }

  return null;
}

// ============================================
// DATABASE HELPERS
// ============================================

async function getMetrics() {
  const supabase = createAdminClient();

  const [profiles, entries, geofences, errors, subscriptions] = await Promise.all([
    supabase.from('core_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('app_timekeeper_entries').select('*', { count: 'exact', head: true }),
    supabase.from('app_timekeeper_geofences').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('log_errors').select('*', { count: 'exact', head: true })
      .gte('occurred_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('billing_subscriptions').select('status'),
  ]);

  const { data: entriesData } = await supabase.from('app_timekeeper_entries').select('type').limit(1000);
  const auto = entriesData?.filter(s => s.type === 'automatic').length || 0;
  const total = entriesData?.length || 1;
  const automationRate = Math.round((auto / total) * 100);

  const activeSubscriptions = subscriptions.data?.filter(s => s.status === 'active').length || 0;
  const trialingSubscriptions = subscriptions.data?.filter(s => s.status === 'trialing').length || 0;

  return {
    users: profiles.count || 0,
    entries: entries.count || 0,
    geofences: geofences.count || 0,
    errors7d: errors.count || 0,
    automationRate,
    activeSubscriptions,
    trialingSubscriptions,
  };
}

async function lookupUserByRefCode(decoded: DecodedRef) {
  if (!decoded.isValid || !decoded.userSuffix) return null;

  const supabase = createAdminClient();

  const { data: users } = await supabase
    .from('core_profiles')
    .select('id, email, full_name, trade, province, created_at, last_active_at')
    .ilike('id', `%${decoded.userSuffix}`);

  if (!users || users.length === 0) return null;

  const user = users[0];
  const currentYear = new Date().getFullYear();
  const dateStr = `${currentYear}-${String(decoded.exportMonth).padStart(2, '0')}-${String(decoded.exportDay).padStart(2, '0')}`;

  const { data: entries, count } = await supabase
    .from('app_timekeeper_entries')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .gte('entry_at', `${dateStr}T00:00:00`)
    .lte('entry_at', `${dateStr}T23:59:59`);

  return {
    user,
    entries: entries || [],
    entryCount: count || 0,
    expectedCount: decoded.sessionCount,
    dateSearched: dateStr,
  };
}

async function getChurnRisk() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('v_churn_risk')
    .select('*')
    .or('churn_risk.eq.high,trial_expiring_soon.eq.true')
    .order('days_inactive', { ascending: false })
    .limit(20);

  return data || [];
}

async function getRevenueByProvince() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('v_revenue_by_province')
    .select('*')
    .order('total_revenue_cad', { ascending: false });

  return data || [];
}

async function getRecentErrors(hours: number = 24) {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('log_errors')
    .select('error_type, error_message, app_name, app_version, occurred_at')
    .gte('occurred_at', since)
    .order('occurred_at', { ascending: false })
    .limit(50);

  return data || [];
}

async function getErrorsByType(days: number = 7) {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('log_errors')
    .select('error_type')
    .gte('occurred_at', since);

  const counts: { [key: string]: number } = {};
  data?.forEach(e => {
    counts[e.error_type || 'other'] = (counts[e.error_type || 'other'] || 0) + 1;
  });

  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

async function getSessionsTrend(days: number = 14) {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('app_timekeeper_entries')
    .select('created_at')
    .gte('created_at', since);

  const byDay: { [key: string]: number } = {};
  data?.forEach(r => {
    const day = r.created_at.split('T')[0].slice(5);
    byDay[day] = (byDay[day] || 0) + 1;
  });

  return Object.entries(byDay).map(([name, value]) => ({ name, value }));
}

async function getCohortAnalysis() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('core_profiles').select('created_at').order('created_at', { ascending: true });

  const cohorts: { [key: string]: number } = {};
  data?.forEach(u => {
    const month = u.created_at.slice(0, 7);
    cohorts[month] = (cohorts[month] || 0) + 1;
  });

  return Object.entries(cohorts).map(([name, value]) => ({ name, value }));
}

async function getVoiceAdoption() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('v_voice_adoption_by_trade')
    .select('*')
    .order('adoption_rate_pct', { ascending: false });

  return data || [];
}

// ============================================
// COMMAND DETECTION
// ============================================

interface ParsedCommand {
  command: string | null;
  args: string[];
}

function parseCommand(message: string): ParsedCommand {
  const trimmed = message.trim();
  if (!trimmed.startsWith('/')) {
    return { command: null, args: [] };
  }

  const parts = trimmed.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  return { command, args };
}

// ============================================
// INTENT DETECTION
// ============================================

function detectIntent(message: string): {
  wants: 'chart' | 'table' | 'number' | 'refcode' | 'none';
  sphere: 'identity' | 'business' | 'product' | 'debug' | 'billing' | 'all' | null;
  topic: string | null;
} {
  if (detectRefCode(message)) {
    return { wants: 'refcode', sphere: 'identity', topic: 'user_lookup' };
  }

  const wantsChart = /(chart|graph|visualiz|trend|plot|gráfico)/i.test(message);
  const wantsTable = /(table|list|spreadsheet|excel|csv|export|tabela|lista)/i.test(message);
  const wantsNumber = /(how many|total|number|rate|%|count|quantos|total|mrr|revenue)/i.test(message);

  let sphere: any = null;
  if (/(user|cohort|plan|signup|churn|profile)/i.test(message)) sphere = 'identity';
  else if (/(session|hour|location|geofence|automation|manual|timekeeper|entry)/i.test(message)) sphere = 'business';
  else if (/(feature|onboarding|funnel|notification|voice|calculation|calculator)/i.test(message)) sphere = 'product';
  else if (/(error|bug|sync|crash|debug|accuracy|log)/i.test(message)) sphere = 'debug';
  else if (/(revenue|payment|subscription|billing|mrr|churn|trial)/i.test(message)) sphere = 'billing';

  let topic = null;
  if (/(session|entry)/i.test(message)) topic = 'sessions';
  else if (/(error|bug)/i.test(message)) topic = 'errors';
  else if (/(user|profile)/i.test(message)) topic = 'users';
  else if (/(automation|manual|geofence)/i.test(message)) topic = 'automation';
  else if (/(cohort|growth)/i.test(message)) topic = 'cohort';
  else if (/(churn|risk)/i.test(message)) topic = 'churn';
  else if (/(revenue|mrr|payment)/i.test(message)) topic = 'revenue';
  else if (/(voice|speech)/i.test(message)) topic = 'voice';

  return {
    wants: wantsChart ? 'chart' : wantsTable ? 'table' : wantsNumber ? 'number' : 'none',
    sphere,
    topic,
  };
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(request: Request) {
  console.log('\n=== ARGUS (Teletraan9) ===');

  try {
    const { message, history, conversationId } = await request.json();
    console.log('User:', message);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        message: 'Configure OPENAI_API_KEY in .env.local',
        visualization: null,
        sql: null,
      });
    }

    const metrics = await getMetrics();
    const { command, args } = parseCommand(message);
    const intent = detectIntent(message);

    let visualization: any = null;
    let dataContext = '';
    let sqlQuery = '';

    // Handle commands
    if (command) {
      console.log('Command detected:', command, args);

      switch (command) {
        case '/churn':
          const churnData = await getChurnRisk();
          sqlQuery = `SELECT * FROM v_churn_risk WHERE churn_risk = 'high' OR trial_expiring_soon = true ORDER BY days_inactive DESC LIMIT 20`;
          visualization = {
            type: 'table',
            title: 'Users at Churn Risk',
            data: churnData,
            columns: ['email', 'full_name', 'trade', 'days_inactive', 'churn_risk', 'trial_expiring_soon'],
            downloadable: true,
          };
          dataContext = `\n[Churn risk data: ${churnData.length} users at risk]\n${JSON.stringify(churnData.slice(0, 5))}`;
          break;

        case '/revenue':
          const revenueData = await getRevenueByProvince();
          sqlQuery = `SELECT * FROM v_revenue_by_province ORDER BY total_revenue_cad DESC`;
          visualization = {
            type: 'table',
            title: 'Revenue by Province',
            data: revenueData,
            columns: ['province', 'province_name', 'paying_users', 'total_revenue_cad', 'avg_payment_cad'],
            downloadable: true,
          };
          dataContext = `\n[Revenue data]\n${JSON.stringify(revenueData)}`;
          break;

        case '/errors':
          const hours = args[0] === 'today' ? 24 : parseInt(args[0]) || 24;
          const errorsData = await getRecentErrors(hours);
          sqlQuery = `SELECT error_type, error_message, app_name, occurred_at FROM log_errors WHERE occurred_at >= now() - interval '${hours} hours' ORDER BY occurred_at DESC LIMIT 50`;
          visualization = {
            type: 'table',
            title: `Errors (Last ${hours}h)`,
            data: errorsData,
            columns: ['error_type', 'error_message', 'app_name', 'app_version', 'occurred_at'],
            downloadable: true,
          };
          dataContext = `\n[Errors data: ${errorsData.length} errors in last ${hours}h]\n${JSON.stringify(errorsData.slice(0, 5))}`;
          break;

        case '/report':
          const period = args[0] || 'weekly';
          const days = period === 'monthly' ? 30 : 7;
          const [trendsData, errorsChart] = await Promise.all([
            getSessionsTrend(days),
            getErrorsByType(days),
          ]);
          visualization = {
            type: 'chart',
            chartType: 'line',
            title: `${period.charAt(0).toUpperCase() + period.slice(1)} Sessions Trend`,
            data: trendsData,
            downloadable: true,
          };
          sqlQuery = `SELECT DATE(created_at), COUNT(*) FROM app_timekeeper_entries WHERE created_at >= now() - interval '${days} days' GROUP BY DATE(created_at) ORDER BY date`;
          dataContext = `\n[${period} report data]\nSessions trend: ${JSON.stringify(trendsData)}\nErrors: ${JSON.stringify(errorsChart)}`;
          break;
      }
    }
    // Handle Ref # lookup
    else if (intent.wants === 'refcode') {
      const refCode = detectRefCode(message);
      if (refCode) {
        console.log('Ref # detected:', refCode);
        const refLookup = await lookupUserByRefCode(refCode);

        if (refLookup?.user) {
          sqlQuery = `SELECT * FROM core_profiles WHERE id ILIKE '%${refCode.userSuffix}%'`;
          visualization = {
            type: 'user_card',
            title: 'User Found',
            data: {
              email: refLookup.user.email,
              name: refLookup.user.full_name,
              plan: 'User',
              region: refCode.regionName,
              sessions: refLookup.entryCount,
              expected: refLookup.expectedCount,
            },
          };
          dataContext = `
[REF # LOOKUP RESULT]
- Ref Code: ${refCode.regionCode}-${refCode.userSuffix?.toUpperCase()}-${String(refCode.exportMonth).padStart(2,'0')}${String(refCode.exportDay).padStart(2,'0')}-${String(refCode.sessionCount).padStart(2,'0')}
- Region: ${refCode.regionName}
- User Found: ${refLookup.user.email} (${refLookup.user.full_name || 'No name'})
- Trade: ${refLookup.user.trade || 'Not set'}
- Province: ${refLookup.user.province || 'Not set'}
- Created: ${refLookup.user.created_at}
- Last Active: ${refLookup.user.last_active_at || 'Never'}
- Entries on ${refLookup.dateSearched}: ${refLookup.entryCount} (expected: ${refLookup.expectedCount})
- Match: ${refLookup.entryCount === refLookup.expectedCount ? '✅ YES' : '⚠️ MISMATCH'}
`;
        } else {
          dataContext = `
[REF # LOOKUP RESULT]
- Ref Code: ${refCode.regionCode}-${refCode.userSuffix?.toUpperCase()}-${String(refCode.exportMonth).padStart(2,'0')}${String(refCode.exportDay).padStart(2,'0')}-${String(refCode.sessionCount).padStart(2,'0')}
- User Found: ❌ NO USER FOUND with ID ending in "${refCode.userSuffix}"
`;
        }
      }
    }
    // Handle other intents
    else if (intent.wants !== 'none') {
      console.log('Intent:', intent);

      if (intent.topic === 'churn') {
        const data = await getChurnRisk();
        sqlQuery = `SELECT * FROM v_churn_risk WHERE churn_risk = 'high' ORDER BY days_inactive DESC`;
        visualization = { type: 'table', title: 'Churn Risk', data, columns: ['email', 'days_inactive', 'churn_risk'], downloadable: true };
        dataContext = `\n[Churn risk: ${JSON.stringify(data.slice(0, 5))}]`;
      }
      else if (intent.topic === 'revenue') {
        const data = await getRevenueByProvince();
        sqlQuery = `SELECT * FROM v_revenue_by_province`;
        visualization = { type: 'chart', chartType: 'bar', title: 'Revenue by Province', data: data.map(d => ({ name: d.province || 'Unknown', value: d.total_revenue_cad })), downloadable: true };
        dataContext = `\n[Revenue: ${JSON.stringify(data)}]`;
      }
      else if (intent.topic === 'sessions' || (intent.sphere === 'business' && intent.wants === 'chart')) {
        const data = await getSessionsTrend(14);
        sqlQuery = `SELECT DATE(created_at) as date, COUNT(*) as sessions FROM app_timekeeper_entries WHERE created_at >= now() - interval '14 days' GROUP BY date ORDER BY date`;
        visualization = { type: 'chart', chartType: 'line', title: 'Sessions per Day', data, downloadable: true };
        dataContext = `\n[Sessions trend: ${JSON.stringify(data)}]`;
      }
      else if (intent.topic === 'errors' || intent.sphere === 'debug') {
        const data = await getErrorsByType();
        sqlQuery = `SELECT error_type, COUNT(*) FROM log_errors WHERE occurred_at >= now() - interval '7 days' GROUP BY error_type`;
        visualization = { type: 'chart', chartType: 'bar', title: 'Errors by Type (7d)', data, downloadable: true };
        dataContext = `\n[Errors by type: ${JSON.stringify(data)}]`;
      }
      else if (intent.topic === 'users' || intent.sphere === 'identity') {
        if (intent.topic === 'cohort' || intent.wants === 'chart') {
          const data = await getCohortAnalysis();
          sqlQuery = `SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) FROM core_profiles GROUP BY month ORDER BY month`;
          visualization = { type: 'chart', chartType: 'bar', title: 'User Cohorts', data, downloadable: true };
          dataContext = `\n[Cohorts: ${JSON.stringify(data)}]`;
        } else {
          visualization = { type: 'metric', title: 'Total Users', value: metrics.users.toString() };
        }
      }
      else if (intent.topic === 'voice') {
        const data = await getVoiceAdoption();
        sqlQuery = `SELECT * FROM v_voice_adoption_by_trade ORDER BY adoption_rate_pct DESC`;
        visualization = { type: 'table', title: 'Voice Adoption by Trade', data, columns: ['trade', 'trade_name', 'total_users', 'voice_users', 'adoption_rate_pct'], downloadable: true };
        dataContext = `\n[Voice adoption: ${JSON.stringify(data)}]`;
      }
    }

    const systemPrompt = `${ARGUS_IDENTITY}
${DATABASE_SCHEMA}
${RESPONSE_GUIDELINES}

# Current Platform Metrics
- **Users:** ${metrics.users} total
- **Timekeeper Entries:** ${metrics.entries} total
- **Active Geofences:** ${metrics.geofences}
- **Automation Rate:** ${metrics.automationRate}%
- **Active Subscriptions:** ${metrics.activeSubscriptions}
- **Trialing Users:** ${metrics.trialingSubscriptions}
- **Errors (7d):** ${metrics.errors7d}
${dataContext}

${visualization ? `\nA visualization was generated (${visualization.type}: ${visualization.title}). Comment on the data.` : ''}
${sqlQuery ? `\nSQL Query used: ${sqlQuery}` : ''}

Respond naturally and conversationally. Include insights and recommended actions when appropriate.`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    console.log('Calling GPT-4o...');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiMessage = response.choices[0].message.content || 'I could not process that request.';
    console.log('=== END ===\n');

    return NextResponse.json({
      message: aiMessage,
      visualization,
      sql: sqlQuery || null,
    });

  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json({
      message: `Sorry, there was an error: ${error.message}`,
      visualization: null,
      sql: null,
    }, { status: 500 });
  }
}
