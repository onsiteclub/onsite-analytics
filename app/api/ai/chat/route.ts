import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// TELETRAAN9 - AI DATA ANALYST
// With Ref # Code Support
// ============================================

const ANALYST_PERSONA = `
# Who you are

You are Teletraan9, an advanced AI data analyst specialized in workforce analytics.
You are the analytics engine for OnSite Club, a time tracking app for construction workers.

# How you communicate

- Natural and direct, like a colleague
- Explain data simply and actionably
- Ask questions to understand context better
- Give opinions based on data
- Speak in the user's preferred language

# What you DON'T do (unless asked)

- DON'T use markdown headers in normal conversations
- DON'T list frameworks unnecessarily
- DON'T be overly formal
- DON'T repeat "as a data scientist" constantly

# Your knowledge of the 5 Data Spheres

You deeply understand the 5-sphere data structure:

1️⃣ **IDENTITY** - Who is the user
   - Segmentation by plan (free/pro/enterprise)
   - Cohort analysis, churn prediction
   - Multi-device tracking

2️⃣ **BUSINESS** - Value generated
   - KPIs: hours tracked, sessions, locations
   - Automation rate (geofence vs manual)
   - Revenue decisions

3️⃣ **PRODUCT** - Improve UX
   - Feature usage, onboarding funnel
   - Time to value, abandonment points
   - Notification effectiveness

4️⃣ **DEBUG** - Bug control
   - Errors by type, sync failures
   - Geofence accuracy, device issues
   - App stability metrics

5️⃣ **METADATA** - Technical context
   - App version, OS, device model

# Ref # Code System

You can decode and lookup users by their PDF report reference code.

**Format:** XX-YYYY-MMDD-NN
- XX = Region code (QC, ON, BC, etc.)
- YYYY = Last 4 chars of user_id (hex)
- MMDD = Export date (month/day)
- NN = Number of sessions in report

**Example:** QC-A3F8-0106-03
- Region: Quebec
- User ID ends in: a3f8
- Export date: January 6th
- Sessions: 3

When someone gives you a Ref #, decode it and search for the user.
`;

const DATABASE_SCHEMA = `
# Database Schema - 5 Spheres (English)

## IDENTITY
**profiles** - User data
- id, email, name, trade
- plan_type: 'free' | 'pro' | 'enterprise'
- device_platform, device_model, timezone, locale
- total_hours_tracked, total_locations_created, total_sessions_count
- created_at, last_active_at

## BUSINESS
**locations** - Job sites
- id, user_id, name, latitude, longitude, radius, status

**records** - Work sessions
- id, user_id, location_name, entry_at, exit_at
- type: 'automatic' | 'manual'
- manually_edited, pause_minutes

## PRODUCT
**analytics_daily** - Daily aggregated metrics
- app_opens, app_foreground_seconds
- notifications_shown, notifications_actioned
- features_used (JSON array)

## DEBUG
**error_log** - Error log
- error_type, error_message, error_stack
- app_version, os, device_model
- occurred_at

**location_audit** - GPS audit (reduced)
- event_type: 'entry'|'exit'|'dispute'|'correction'
- latitude, longitude, accuracy

## AGGREGATED
**analytics_daily** - Metrics per day/user
- Business: sessions_count, total_minutes, manual_entries, auto_entries
- Product: app_opens, app_foreground_seconds, features_used
- Debug: errors_count, sync_attempts/failures, geofence_accuracy_sum/count
- Meta: app_version, os, device_model
`;

// ============================================
// REF CODE DECODER
// ============================================

const REGION_NAMES: { [key: string]: string } = {
  QC: 'Quebec', ON: 'Ontario', BC: 'British Columbia', AB: 'Alberta',
  MB: 'Manitoba', SK: 'Saskatchewan', NS: 'Nova Scotia', NB: 'New Brunswick',
  NL: 'Newfoundland', PE: 'Prince Edward Island', YT: 'Yukon',
  NT: 'Northwest Territories', NU: 'Nunavut',
  NE: 'Northeast US', SE: 'Southeast US', MW: 'Midwest US',
  SW: 'Southwest US', WE: 'West US', AK: 'Alaska', HI: 'Hawaii',
  EU: 'Europe', NA: 'North America', AF: 'Africa', SA: 'South America',
};

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
  // Pattern to find Ref # in message
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
  
  const [users, sessions, locations, errors] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('records').select('*', { count: 'exact', head: true }),
    supabase.from('locations').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('error_log').select('*', { count: 'exact', head: true })
      .gte('occurred_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const { data: sessionsData } = await supabase.from('records').select('type').limit(1000);
  const auto = sessionsData?.filter(s => s.type === 'automatic').length || 0;
  const total = sessionsData?.length || 1;
  const automationRate = Math.round((auto / total) * 100);

  const { data: syncData } = await supabase
    .from('analytics_daily')
    .select('sync_attempts, sync_failures')
    .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  let syncAttempts = 0, syncFailures = 0;
  syncData?.forEach(s => { syncAttempts += s.sync_attempts || 0; syncFailures += s.sync_failures || 0; });
  const syncRate = syncAttempts ? Math.round((1 - syncFailures / syncAttempts) * 100) : 100;

  return { users: users.count || 0, sessions: sessions.count || 0, locations: locations.count || 0, errors7d: errors.count || 0, automationRate, syncRate };
}

async function lookupUserByRefCode(decoded: DecodedRef) {
  if (!decoded.isValid || !decoded.userSuffix) return null;
  
  const supabase = createAdminClient();
  
  // Search for user by ID suffix
  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, name, plan_type, created_at, last_active_at')
    .ilike('id', `%${decoded.userSuffix}`);
  
  if (!users || users.length === 0) return null;
  
  const user = users[0];
  
  // Get their records for the export date
  const currentYear = new Date().getFullYear();
  const dateStr = `${currentYear}-${String(decoded.exportMonth).padStart(2, '0')}-${String(decoded.exportDay).padStart(2, '0')}`;
  
  const { data: records, count } = await supabase
    .from('records')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .gte('entry_at', `${dateStr}T00:00:00`)
    .lte('entry_at', `${dateStr}T23:59:59`);
  
  return {
    user,
    records: records || [],
    recordCount: count || 0,
    expectedCount: decoded.sessionCount,
    dateSearched: dateStr,
  };
}

async function getSessionsTrend(days: number = 14) {
  const supabase = createAdminClient();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  const { data } = await supabase.from('records').select('created_at').gte('created_at', startDate);
  
  const byDay: { [key: string]: number } = {};
  data?.forEach(r => {
    const day = r.created_at.split('T')[0].slice(5);
    byDay[day] = (byDay[day] || 0) + 1;
  });
  
  return Object.entries(byDay).map(([name, value]) => ({ name, value }));
}

async function getErrorsByType() {
  const supabase = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data } = await supabase.from('error_log').select('error_type').gte('occurred_at', weekAgo);
  
  const counts: { [key: string]: number } = {};
  data?.forEach(e => { counts[e.error_type || 'other'] = (counts[e.error_type || 'other'] || 0) + 1; });
  
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

async function getCohortAnalysis() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('profiles').select('created_at').order('created_at', { ascending: true });
  
  const cohorts: { [key: string]: number } = {};
  data?.forEach(u => { const month = u.created_at.slice(0, 7); cohorts[month] = (cohorts[month] || 0) + 1; });
  
  return Object.entries(cohorts).map(([name, value]) => ({ name, value }));
}

async function getAutomationComparison() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('records').select('type');
  
  const auto = data?.filter(r => r.type === 'automatic').length || 0;
  const manual = data?.filter(r => r.type === 'manual').length || 0;
  
  return [{ name: 'Automatic', value: auto }, { name: 'Manual', value: manual }];
}

// ============================================
// INTENT DETECTION
// ============================================

function detectIntent(message: string): {
  wants: 'chart' | 'table' | 'number' | 'refcode' | 'none';
  sphere: 'identity' | 'business' | 'product' | 'debug' | 'all' | null;
  topic: string | null;
} {
  // Check for Ref # code first
  if (detectRefCode(message)) {
    return { wants: 'refcode', sphere: 'identity', topic: 'user_lookup' };
  }
  
  const wantsChart = /(chart|graph|visualiz|trend|plot|gráfico)/i.test(message);
  const wantsTable = /(table|list|spreadsheet|excel|csv|export|tabela|lista)/i.test(message);
  const wantsNumber = /(how many|total|number|rate|%|count|quantos|total)/i.test(message);
  
  let sphere: any = null;
  if (/(user|cohort|plan|signup|churn|usuário)/i.test(message)) sphere = 'identity';
  else if (/(session|hour|location|automation|manual|sessão|hora)/i.test(message)) sphere = 'business';
  else if (/(feature|onboarding|funnel|notification|ux|product)/i.test(message)) sphere = 'product';
  else if (/(error|bug|sync|crash|debug|accuracy|erro)/i.test(message)) sphere = 'debug';
  
  let topic = null;
  if (/(session|sessão)/i.test(message)) topic = 'sessions';
  else if (/(error|bug|erro)/i.test(message)) topic = 'errors';
  else if (/(user|usuário)/i.test(message)) topic = 'users';
  else if (/(automation|manual|geofence|automação)/i.test(message)) topic = 'automation';
  else if (/(cohort|growth)/i.test(message)) topic = 'cohort';
  
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
  console.log('\n=== TELETRAAN9 (5 Spheres + Ref #) ===');
  
  try {
    const { message, history } = await request.json();
    console.log('User:', message);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ message: 'Configure OPENAI_API_KEY in .env.local', visualization: null });
    }

    const metrics = await getMetrics();
    const intent = detectIntent(message);
    
    let visualization = null;
    let dataContext = '';
    let refLookupResult = null;

    // Handle Ref # lookup
    const refCode = detectRefCode(message);
    if (refCode) {
      console.log('Ref # detected:', refCode);
      refLookupResult = await lookupUserByRefCode(refCode);
      
      if (refLookupResult?.user) {
        dataContext = `
[REF # LOOKUP RESULT]
- Ref Code: ${refCode.regionCode}-${refCode.userSuffix?.toUpperCase()}-${String(refCode.exportMonth).padStart(2,'0')}${String(refCode.exportDay).padStart(2,'0')}-${String(refCode.sessionCount).padStart(2,'0')}
- Region: ${refCode.regionName}
- User Found: ${refLookupResult.user.email} (${refLookupResult.user.name || 'No name'})
- Plan: ${refLookupResult.user.plan_type || 'free'}
- Created: ${refLookupResult.user.created_at}
- Last Active: ${refLookupResult.user.last_active_at || 'Never'}
- Records on ${refLookupResult.dateSearched}: ${refLookupResult.recordCount} (expected: ${refLookupResult.expectedCount})
- Match: ${refLookupResult.recordCount === refLookupResult.expectedCount ? '✅ YES' : '⚠️ MISMATCH'}
`;
        visualization = {
          type: 'user_card',
          title: 'User Found',
          data: {
            email: refLookupResult.user.email,
            name: refLookupResult.user.name,
            plan: refLookupResult.user.plan_type,
            region: refCode.regionName,
            sessions: refLookupResult.recordCount,
            expected: refLookupResult.expectedCount,
          },
        };
      } else {
        dataContext = `
[REF # LOOKUP RESULT]
- Ref Code: ${refCode.regionCode}-${refCode.userSuffix?.toUpperCase()}-${String(refCode.exportMonth).padStart(2,'0')}${String(refCode.exportDay).padStart(2,'0')}-${String(refCode.sessionCount).padStart(2,'0')}
- Region: ${refCode.regionName}
- User Found: ❌ NO USER FOUND with ID ending in "${refCode.userSuffix}"
`;
      }
    }
    // Handle other intents
    else if (intent.wants !== 'none') {
      console.log('Intent:', intent);

      if (intent.topic === 'sessions' || (intent.sphere === 'business' && intent.wants === 'chart')) {
        const data = await getSessionsTrend(14);
        visualization = { type: 'chart', chartType: 'line', title: 'Sessions per Day', data, downloadable: true };
        dataContext = `\n[Sessions chart: ${JSON.stringify(data)}]`;
      }
      else if (intent.topic === 'errors' || intent.sphere === 'debug') {
        const data = await getErrorsByType();
        visualization = { type: 'chart', chartType: 'bar', title: 'Errors by Type', data, downloadable: true };
        dataContext = `\n[Errors by type: ${JSON.stringify(data)}]`;
      }
      else if (intent.topic === 'users' || intent.sphere === 'identity') {
        if (intent.topic === 'cohort' || intent.wants === 'chart') {
          const data = await getCohortAnalysis();
          visualization = { type: 'chart', chartType: 'bar', title: 'Users by Month', data, downloadable: true };
          dataContext = `\n[Cohort: ${JSON.stringify(data)}]`;
        } else {
          visualization = { type: 'number', value: metrics.users.toString(), title: 'Total Users' };
        }
      }
      else if (intent.topic === 'automation') {
        const data = await getAutomationComparison();
        visualization = { type: 'chart', chartType: 'pie', title: 'Automatic vs Manual', data, downloadable: true };
        dataContext = `\n[Automation: ${JSON.stringify(data)}]`;
      }
    }

    const systemPrompt = `${ANALYST_PERSONA}

${DATABASE_SCHEMA}

# Current Metrics
- **Identity:** ${metrics.users} users
- **Business:** ${metrics.sessions} sessions, ${metrics.locations} locations, ${metrics.automationRate}% automation
- **Debug:** ${metrics.errors7d} errors (7 days), ${metrics.syncRate}% sync success
${dataContext}

${visualization ? `\nA visualization was generated (${visualization.type}: ${visualization.title}). Comment on the data.` : ''}
${refLookupResult ? '\nYou just looked up a user by Ref # code. Provide a helpful summary of what you found.' : ''}

Respond naturally and conversationally. Only structure as a report if explicitly asked.`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message },
    ];

    console.log('Calling GPT-4o...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.8,
      max_tokens: 1500,
    });

    const aiMessage = response.choices[0].message.content || 'Hmm, I could not process that.';
    console.log('=== END ===\n');

    return NextResponse.json({ message: aiMessage, visualization });

  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json({ message: `Oops, there was an error: ${error.message}`, visualization: null }, { status: 500 });
  }
}
