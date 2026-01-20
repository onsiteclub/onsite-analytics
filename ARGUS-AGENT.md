# ARGUS Agent Documentation

## Overview

ARGUS (Analytics & Reporting Guided User System) is an AI-powered analytics assistant for OnSite Club. It provides natural language access to business intelligence through the Teletraan9 AI engine.

## Architecture

### Components

```
app/
├── chat/
│   ├── layout.tsx          # Chat layout with sidebar
│   ├── page.tsx             # New conversation page
│   └── [id]/page.tsx        # Existing conversation page
├── api/
│   └── ai/
│       └── chat/route.ts    # AI API endpoint with Teletraan9

components/
└── chat/
    ├── index.ts             # Component exports
    ├── chat-sidebar.tsx     # Navigation & history
    ├── chat-input.tsx       # Message input with commands
    ├── message-list.tsx     # Message display
    └── response-card.tsx    # Visualization cards

lib/
├── supabase/
│   ├── schema.ts            # 38 table TypeScript types
│   └── conversations.ts     # Conversation CRUD operations
└── export/
    └── index.ts             # PDF & Excel export functions
```

### Intelligence Layers

1. **VISION (NOW)** - Real-time metrics and current state
2. **ANALYSIS (WHY)** - Patterns and trend analysis
3. **PRE-COGNITION (WHAT'S NEXT)** - Predictive insights

## Database Schema

### 12 Domains, 38 Tables

| Domain | Tables |
|--------|--------|
| **Reference** | core_trades, core_provinces, core_plan_features |
| **Identity** | core_profiles, core_organizations, core_workplaces, core_team_members |
| **Timekeeper** | app_timekeeper_entries, app_timekeeper_geofences, app_timekeeper_settings |
| **Calculator** | app_calculator_estimates, app_calculator_items, app_calculator_labor_rates, app_calculator_materials, app_calculator_templates |
| **Shop** | app_shop_products, app_shop_orders, app_shop_order_items, app_shop_carts |
| **Billing** | billing_subscriptions, billing_transactions, billing_credits, billing_invoices |
| **Debug** | debug_logs, debug_errors, debug_sessions |
| **Analytics** | analytics_events, analytics_feature_usage, analytics_kpis |
| **Intelligence** | ml_churn_predictions, ml_recommendations, ml_segments, ml_experiments |
| **Admin** | admin_settings, admin_api_keys, admin_audit_logs |
| **Rewards** | gamification_achievements, gamification_points, gamification_badges |
| **ARGUS** | argus_conversations |

### Key Views

- `v_churn_risk` - Users at risk of churning
- `v_user_health` - User health scores
- `v_revenue_by_province` - Revenue breakdown by province
- `v_voice_adoption_by_trade` - Voice feature usage by trade

## Quick Commands

| Command | Description |
|---------|-------------|
| `/report weekly` | Generate weekly report |
| `/report monthly` | Generate monthly report |
| `/churn` | Show users at risk of churning |
| `/revenue` | Show MRR and revenue metrics |
| `/errors today` | Show errors from last 24h |
| `/sql` | Show last SQL query used |
| `/export pdf` | Export conversation as PDF |

## Visualization Types

### 1. Metric
Single value with optional trend indicator.

```typescript
{
  type: 'metric',
  title: 'Monthly Recurring Revenue',
  value: 'R$ 45,230',
  data: { change: 12.5, changeLabel: 'vs last month' }
}
```

### 2. Table
Tabular data with columns and rows.

```typescript
{
  type: 'table',
  title: 'Active Users by Province',
  columns: ['Province', 'Users', 'MRR'],
  data: [
    { Province: 'ON', Users: 150, MRR: 15000 },
    { Province: 'BC', Users: 89, MRR: 8900 }
  ],
  downloadable: true
}
```

### 3. Chart
Line, bar, or pie charts.

```typescript
{
  type: 'chart',
  title: 'Sessions Over Time',
  chartType: 'line',
  data: [
    { name: 'Mon', value: 120 },
    { name: 'Tue', value: 145 }
  ]
}
```

### 4. Alert
Warning or important notices.

```typescript
{
  type: 'alert',
  title: 'Churn Risk Detected',
  items: [
    'User john@example.com has not logged in for 14 days',
    'Subscription expires in 3 days with no renewal'
  ]
}
```

### 5. User Card
User profile display.

```typescript
{
  type: 'user_card',
  title: 'User Profile',
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    plan: 'Pro',
    region: 'Ontario',
    sessions: 45
  }
}
```

## Ref # System

Users can look up members using Ref # codes. The format is: `REF-XXXXX` (5 alphanumeric characters).

Example queries:
- "Lookup REF-A1B2C"
- "Who is REF-X9Y8Z?"
- "Show me the user with ref code A1B2C"

## API Endpoint

### POST /api/ai/chat

**Request:**
```typescript
{
  message: string;
  history?: ArgusMessage[];
  conversationId?: string;
}
```

**Response:**
```typescript
{
  message: string;
  visualization?: ArgusVisualization;
  sql?: string;
  conversationId: string;
}
```

## Export Functions

### PDF Export
```typescript
import { exportConversationToPDF } from '@/lib/export';

await exportConversationToPDF('Report Title', messages);
```

### Excel Export
```typescript
import { exportTableToExcel } from '@/lib/export';

await exportTableToExcel('Data Export', tableData);
```

### CSV Export
```typescript
import { exportToCSV } from '@/lib/export';

await exportToCSV('Data Export', tableData);
```

## Conversation Persistence

Conversations are stored in `argus_conversations` table with RLS (Row Level Security).

```typescript
interface ArgusConversation {
  id: string;
  user_id: string;
  title: string | null;
  messages: ArgusMessage[];
  starred: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}
```

## Teletraan9 Persona

Teletraan9 is the AI personality powering ARGUS:

- **Style**: Professional yet approachable
- **Capabilities**: SQL generation, data analysis, trend detection
- **Transparency**: Always shows SQL queries used
- **Language**: Supports English and Portuguese (Brazilian)

## Security Considerations

1. **RLS**: All queries filtered by user_id
2. **Input Validation**: Message content sanitized
3. **Rate Limiting**: Implemented at API level
4. **Audit Logs**: All queries logged in admin_audit_logs

## Development

### Running Locally
```bash
npm run dev
```

### Type Checking
```bash
npm run typecheck
```

### Building
```bash
npm run build
```

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

---

Built with Next.js 14, TypeScript, Supabase, and OpenAI GPT-4o.
