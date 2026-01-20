# OnSite Analytics - Documentacao de Arquitetura

Este documento descreve a arquitetura completa do sistema OnSite Analytics, incluindo estrutura de arquivos, fluxos de dados, integracao com Supabase, tipos, funcoes e como cada parte se conecta.

**Ultima atualizacao:** Janeiro 2026

---

## Indice

1. [Visao Geral do Sistema](#visao-geral-do-sistema)
2. [Stack Tecnologico](#stack-tecnologico)
3. [Estrutura de Diretorios](#estrutura-de-diretorios)
4. [Modelo de Dados - 5 Esferas](#modelo-de-dados---5-esferas)
5. [Sistema de Dados Supabase](#sistema-de-dados-supabase)
6. [Arquivos e Suas Funcoes](#arquivos-e-suas-funcoes)
7. [Fluxos do Sistema](#fluxos-do-sistema)
8. [API Routes](#api-routes)
9. [Componentes](#componentes)
10. [Hooks e Utilitarios](#hooks-e-utilitarios)
11. [Sistema de Autenticacao](#sistema-de-autenticacao)
12. [Assistente AI - Teletraan9](#assistente-ai---teletraan9)
13. [Configuracao e Deploy](#configuracao-e-deploy)

---

## Visao Geral do Sistema

**OnSite Analytics** e um dashboard moderno construido com Next.js 14 para analisar dados de workforce e time tracking do aplicativo mobile OnSite Club (para trabalhadores da construcao). O sistema fornece analise de dados abrangente atraves de 5 esferas integradas: Identity, Business, Product, Debug e Metadata, alem de analise assistida por IA.

### Proposito Principal
- Monitorar usuarios e suas atividades
- Analisar sessoes de trabalho e produtividade
- Rastrear uso de features e engajamento
- Debugar erros e problemas do sistema
- Fornecer insights via assistente AI (Teletraan9)

---

## Stack Tecnologico

| Tecnologia | Uso | Versao |
|------------|-----|--------|
| **Next.js** | Framework React (App Router) | 14.1.0 |
| **TypeScript** | Tipagem estatica | 5.3.3 |
| **React** | UI Library | 18.2.0 |
| **Supabase** | Database (PostgreSQL) + Auth | @supabase/ssr 0.1.0, @supabase/supabase-js 2.49.2 |
| **Tailwind CSS** | Estilizacao | 3.4.1 |
| **Radix UI** | Componentes acessiveis | Multiplos pacotes |
| **Recharts** | Graficos e visualizacoes | 2.12.2 |
| **OpenAI** | GPT-4o para Teletraan9 | 6.15.0 |
| **Zustand** | State management (minimo) | 4.5.1 |
| **jsPDF** | Geracao de PDFs | 4.0.0 |
| **date-fns** | Manipulacao de datas | 3.3.1 |
| **Framer Motion** | Animacoes | 11.0.8 |
| **Lucide React** | Icones | 0.344.0 |

---

## Estrutura de Diretorios

```
onsite-analytics/
|
├── app/                              # Next.js App Router
│   ├── layout.tsx                   # Layout raiz (metadata, fontes)
│   ├── page.tsx                     # Pagina inicial (redirecionamento)
│   │
│   ├── api/                         # Rotas de API
│   │   ├── ai/
│   │   │   └── chat/
│   │   │       └── route.ts         # Endpoint do Teletraan9
│   │   └── query/
│   │       └── route.ts             # Execucao de SQL queries
│   │
│   ├── auth/                        # Paginas de autenticacao
│   │   ├── login/
│   │   │   └── page.tsx             # Pagina de login
│   │   └── pending/
│   │       └── page.tsx             # Aguardando aprovacao
│   │
│   └── dashboard/                   # Dashboard principal (rotas protegidas)
│       ├── layout.tsx               # Layout com sidebar
│       ├── overview/
│       │   └── page.tsx             # Dashboard das 5 Esferas
│       ├── identity/
│       │   └── page.tsx             # Cohorts, planos, churn
│       ├── business/
│       │   └── page.tsx             # Sessoes, locais, automacao
│       ├── product/
│       │   └── page.tsx             # Features, onboarding, engajamento
│       ├── debug/
│       │   └── page.tsx             # Erros, sync, geofence
│       ├── assistant/
│       │   └── page.tsx             # Interface Teletraan9
│       ├── sessions/
│       │   └── page.tsx             # Detalhes de sessoes
│       ├── events/
│       │   └── page.tsx             # Rastreamento de eventos
│       ├── queries/
│       │   └── page.tsx             # Queries SQL customizadas
│       └── support/
│           └── page.tsx             # Ferramentas de suporte (Ref# decoder)
│
├── components/                       # Componentes React reutilizaveis
│   ├── layout/
│   │   ├── sidebar.tsx              # Barra de navegacao lateral
│   │   ├── header.tsx               # Cabecalho da pagina
│   │   └── stats-card.tsx           # Card de metricas
│   │
│   ├── charts/
│   │   ├── bar-chart.tsx            # Grafico de barras
│   │   └── line-chart.tsx           # Grafico de linhas
│   │
│   ├── tables/
│   │   └── data-table.tsx           # Tabela de dados generica
│   │
│   └── ui/                          # Componentes Shadcn UI
│       ├── alert.tsx                # Mensagens de alerta
│       ├── badge.tsx                # Tags e status
│       ├── button.tsx               # Botoes interativos
│       ├── card.tsx                 # Containers de conteudo
│       ├── input.tsx                # Campos de texto
│       └── skeleton.tsx             # Loading placeholders
│
├── lib/                              # Bibliotecas e utilitarios
│   ├── utils.ts                     # Utilitarios principais (cn, formatDate, etc)
│   │
│   ├── supabase/
│   │   ├── client.ts                # Cliente browser (chave anonima)
│   │   ├── server.ts                # Cliente server + admin
│   │   ├── middleware.ts            # Middleware de sessao
│   │   └── queries.ts               # Funcoes de query do banco
│   │
│   ├── ai/
│   │   └── index.ts                 # Utilitarios AI + Teletraan9
│   │
│   ├── hooks/
│   │   └── index.ts                 # Hooks React customizados
│   │
│   └── utils/
│       └── index.ts                 # Funcoes utilitarias adicionais (date-fns)
│
├── types/
│   └── database.ts                  # Tipos TypeScript para as 5 Esferas
│
├── styles/
│   └── globals.css                  # Tailwind + variaveis CSS
│
├── supabase-schema.sql              # Schema do banco de dados
├── supabase-admin-users.sql         # Script de usuarios admin
├── middleware.ts                     # Middleware Next.js para auth
├── package.json                      # Dependencias
├── tsconfig.json                     # Config TypeScript
├── next.config.js                    # Config Next.js
├── tailwind.config.js                # Config Tailwind
├── postcss.config.js                 # Config PostCSS
└── components.json                   # Config Shadcn UI
```

---

## Modelo de Dados - 5 Esferas

O sistema organiza todos os dados em **5 Esferas** conceituais:

### 1. IDENTITY (Quem sao os usuarios)

```typescript
interface Profile {
  id: string;                         // UUID do usuario
  email: string;
  name: string | null;                // Nome do usuario
  trade: string | null;               // Profissao/oficio

  plan_type: 'free' | 'pro' | 'enterprise';
  device_platform: string | null;     // ios, android
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
```

**Metricas Identity:**
- Total de usuarios
- Usuarios ativos (7d, 30d)
- Distribuicao por plano
- Distribuicao por plataforma
- Taxa de churn

### 2. BUSINESS (Valor gerado)

```typescript
interface Location {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;                     // Raio do geofence em metros
  color: string | null;
  status: 'active' | 'deleted' | 'pending_delete';
  deleted_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string | null;
  synced_at: string | null;
}

interface Record {
  id: string;
  user_id: string;
  location_id: string;
  location_name: string | null;
  entry_at: string;                   // Timestamp de entrada
  exit_at: string | null;             // Timestamp de saida
  type: 'automatic' | 'manual';       // Metodo de registro
  manually_edited: boolean;
  edit_reason: string | null;
  integrity_hash: string | null;
  color: string | null;
  device_id: string | null;
  pause_minutes: number;              // Minutos em pausa
  created_at: string;
  synced_at: string | null;
}
```

**Metricas Business:**
- Total de sessoes
- Horas rastreadas
- Locais ativos
- Taxa de automacao (automatic vs manual)
- Minutos em pausa

### 3. PRODUCT (UX e Engajamento)

```typescript
interface FeatureUsage {
  id: string;
  user_id: string;
  feature_name: string;               // Ex: 'geofence', 'reports', 'export'
  action: 'opened' | 'completed' | 'abandoned';
  flow_started_at: string | null;
  flow_completed_at: string | null;
  abandoned_at_step: string | null;
  session_context: { [key: string]: any } | null;
  timestamp: string;
  app_version: string | null;
}

interface OnboardingEvent {
  id: string;
  user_id: string;
  step: 'signup' | 'email_verified' | 'first_location' | 'first_session' | 'first_export';
  completed_at: string;
  time_from_signup_seconds: number | null;
  app_version: string | null;
  os: string | null;
}
```

**Metricas Product:**
- Aberturas do app
- Tempo no app
- Features mais usadas
- Funil de onboarding
- Retencao

### 4. DEBUG (Saude do sistema)

```typescript
interface ErrorLog {
  id: string;
  user_id: string | null;
  error_type: string;                 // Ex: 'crash', 'network', 'sync', 'auth'
  error_message: string;
  error_stack: string | null;
  error_context: string | null;       // JSON string com contexto adicional
  app_version: string | null;
  os: string | null;
  os_version: string | null;
  device_model: string | null;
  occurred_at: string;
  created_at: string;
  synced_at: string | null;
}

interface LocationAudit {
  id: string;
  user_id: string;
  session_id: string | null;
  event_type: 'entry' | 'exit' | 'dispute' | 'correction';
  location_id: string | null;
  location_name: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;            // Precisao GPS em metros
  occurred_at: string;
  created_at: string;
  synced_at: string | null;
}
```

**Metricas Debug:**
- Total de erros
- Taxa de sync
- Precisao GPS
- Distribuicao por versao
- Distribuicao por dispositivo

### 5. AGGREGATED (Resumos diarios)

```typescript
interface AnalyticsDaily {
  date: string;                       // YYYY-MM-DD
  user_id: string;

  // Business metrics
  sessions_count: number;
  total_minutes: number;
  manual_entries: number;
  auto_entries: number;
  locations_created: number;
  locations_deleted: number;

  // Product metrics
  app_opens: number;
  app_foreground_seconds: number;
  notifications_shown: number;
  notifications_actioned: number;
  features_used: string;              // JSON array string

  // Debug metrics
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
```

### 6. APP EVENTS (Eventos do App)

```typescript
interface AppEvent {
  id: string;
  user_id: string;
  event_type: string;                 // Ex: 'login', 'logout', 'signup', etc.
  event_data: { [key: string]: any } | null;
  app_version: string | null;
  created_at: string;
}
```

---

## Sistema de Dados Supabase

### Diagrama de Relacionamentos

```
profiles (usuarios)
    │
    ├──→ locations (user_id)
    │        │
    │        └──→ location_audit (location_id)
    │
    ├──→ records (user_id, location_id)
    │
    ├──→ analytics_daily (user_id)
    │
    ├──→ feature_usage (user_id)
    │
    ├──→ onboarding_events (user_id)
    │
    ├──→ error_log (user_id)
    │
    └──→ app_events (user_id)
```

### Tabelas Supabase

| Tabela | Descricao | Chave Primaria | Foreign Keys |
|--------|-----------|----------------|--------------|
| `profiles` | Dados dos usuarios | `id` (uuid) | - |
| `locations` | Locais de trabalho | `id` (uuid) | `user_id → profiles.id` |
| `records` | Sessoes de trabalho | `id` (uuid) | `user_id → profiles.id`, `location_id → locations.id` |
| `analytics_daily` | Metricas agregadas | `id` (uuid) | `user_id → profiles.id` |
| `feature_usage` | Uso de features | `id` (uuid) | `user_id → profiles.id` |
| `onboarding_events` | Eventos de onboarding | `id` (uuid) | `user_id → profiles.id` |
| `error_log` | Log de erros | `id` (uuid) | `user_id → profiles.id` (opcional) |
| `location_audit` | Auditoria GPS | `id` (uuid) | `user_id → profiles.id`, `location_id → locations.id` |
| `app_events` | Eventos do app | `id` (uuid) | `user_id → profiles.id` |

### Clientes Supabase

O sistema usa 3 tipos de cliente:

#### 1. Cliente Browser (`lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```
- Usado em componentes client-side
- Usa chave anonima (segura para browser)
- Respeita RLS policies

#### 2. Cliente Server (`lib/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookies) => cookies.forEach(c => cookieStore.set(c))
    }
  })
}
```
- Usado em Server Components e API routes
- Mantem sessao via cookies
- Respeita RLS policies

#### 3. Cliente Admin (`lib/supabase/server.ts`)
```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```
- Usado apenas server-side (API routes)
- Usa service role key (bypassa RLS)
- Para operacoes administrativas e AI

### Funcoes de Query (`lib/supabase/queries.ts`)

```typescript
// Metricas do dashboard principal
export async function getDashboardStats(): Promise<DashboardStats>

// Busca usuarios com paginacao e filtros
export async function getUsers(
  page: number,
  pageSize: number,
  filters?: QueryFilters
): Promise<PaginatedResult<Profile>>

// Busca atividade de um usuario especifico
export async function getUserActivity(userId: string): Promise<UserActivitySummary | null>

// Busca sessoes com paginacao e filtros
export async function getSessions(
  page: number,
  pageSize: number,
  filters?: QueryFilters
): Promise<PaginatedResult<Record>>

// Busca eventos com paginacao
export async function getEvents(
  page: number,
  pageSize: number,
  filters?: QueryFilters
): Promise<PaginatedResult<AppEvent>>

// Metricas diarias para graficos
export async function getDailyMetrics(filters?: QueryFilters): Promise<DailyMetrics[]>

// Busca locais com paginacao
export async function getLocations(
  page: number,
  pageSize: number,
  filters?: QueryFilters
): Promise<PaginatedResult<Location>>

// Busca de usuarios por texto (email ou nome)
export async function searchUsers(term: string): Promise<Profile[]>
```

### Tipos Auxiliares

```typescript
interface DashboardStats {
  totalUsers: number;
  totalSessions: number;
  totalLocations: number;
  totalEvents: number;
  automationRate: number;
  avgSessionMinutes: number;
}

interface UserActivitySummary {
  user_id: string;
  email: string;
  name: string | null;
  total_sessions: number;
  total_hours: number;
  last_active: string | null;
}

interface DailyMetrics {
  date: string;
  sessions: number;
  hours: number;
  users: number;
  errors: number;
}

interface QueryFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

---

## Arquivos e Suas Funcoes

### Arquivos de Configuracao

| Arquivo | Funcao |
|---------|--------|
| `package.json` | Dependencias, scripts npm, metadados |
| `tsconfig.json` | Config TypeScript, paths (@/*), compilacao |
| `next.config.js` | Config Next.js, dominios de imagem |
| `tailwind.config.js` | Tema, cores, animacoes Tailwind |
| `postcss.config.js` | Config PostCSS para Tailwind |
| `components.json` | Config Shadcn UI |
| `middleware.ts` | Middleware auth para rotas protegidas |

### Arquivos de Banco de Dados

| Arquivo | Funcao |
|---------|--------|
| `supabase-schema.sql` | Schema completo do banco de dados |
| `supabase-admin-users.sql` | Script para criar usuarios admin |

### App Router - Layouts e Paginas

| Arquivo | Funcao |
|---------|--------|
| `app/layout.tsx` | Layout raiz com metadata global e fontes (Inter) |
| `app/page.tsx` | Pagina inicial - redireciona para login/dashboard |
| `app/dashboard/layout.tsx` | Layout do dashboard com sidebar |

### Paginas do Dashboard

| Pagina | Arquivo | Funcao |
|--------|---------|--------|
| Overview | `app/dashboard/overview/page.tsx` | Dashboard principal com metricas das 5 esferas |
| Identity | `app/dashboard/identity/page.tsx` | Analise de usuarios, cohorts, planos, churn |
| Business | `app/dashboard/business/page.tsx` | Sessoes, locais, horas rastreadas, automacao |
| Product | `app/dashboard/product/page.tsx` | Engajamento, features, onboarding, retencao |
| Debug | `app/dashboard/debug/page.tsx` | Erros, sync, precisao GPS, versoes |
| Assistant | `app/dashboard/assistant/page.tsx` | Interface do Teletraan9 AI |
| Sessions | `app/dashboard/sessions/page.tsx` | Lista detalhada de sessoes |
| Events | `app/dashboard/events/page.tsx` | Lista de eventos do app |
| Queries | `app/dashboard/queries/page.tsx` | Interface para SQL customizado |
| Support | `app/dashboard/support/page.tsx` | Ferramentas de suporte (Ref# decoder) |

### API Routes

| Endpoint | Arquivo | Funcao |
|----------|---------|--------|
| `/api/ai/chat` | `app/api/ai/chat/route.ts` | Endpoint do Teletraan9 (GPT-4o) |
| `/api/query` | `app/api/query/route.ts` | Execucao de queries SQL (apenas SELECT) |

---

## Fluxos do Sistema

### 1. Fluxo de Autenticacao

```
┌─────────────────┐
│  Usuario acessa │
│     /           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     NAO      ┌─────────────────┐
│ Sessao valida?  │─────────────→│  /auth/login    │
└────────┬────────┘              └────────┬────────┘
         │ SIM                            │
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│ /dashboard/     │              │ Supabase Auth   │
│ overview        │              │ (Email/Senha)   │
└─────────────────┘              └────────┬────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │ Admin aprovado? │
                                 └────────┬────────┘
                                          │
                              ┌───────────┴───────────┐
                              │                       │
                              ▼ SIM                   ▼ NAO
                     ┌─────────────────┐     ┌─────────────────┐
                     │ /dashboard/     │     │ /auth/pending   │
                     │ overview        │     │ (aguardando)    │
                     └─────────────────┘     └─────────────────┘
```

### 2. Fluxo de Dados - Dashboard

```
┌─────────────────┐
│ Usuario acessa  │
│ pagina dashboard│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ useEffect()     │
│ dispara fetch   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ createClient()  │
│ Supabase browser│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Query Supabase  │
│ .from().select()│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Estado local    │
│ useState()      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Render UI       │
│ Cards, Graficos │
└─────────────────┘
```

### 3. Fluxo do Teletraan9 AI

```
┌─────────────────┐
│ Usuario envia   │
│ mensagem no chat│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /api/ai/   │
│ chat            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deteccao de     │
│ Intent          │
│ (Ref#, metrica) │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────────┐
│Ref #? │ │Precisa de │
│Decode │ │dados?     │
└───┬───┘ └─────┬─────┘
    │           │
    ▼           ▼
┌───────┐ ┌───────────┐
│Busca  │ │Query      │
│usuario│ │Supabase   │
│por ID │ │Admin      │
└───┬───┘ └─────┬─────┘
    │           │
    └─────┬─────┘
          │
          ▼
┌─────────────────┐
│ Monta contexto  │
│ + system prompt │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ OpenAI GPT-4o   │
│ chat completion │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Processa resp.  │
│ Extrai visual.  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Retorna JSON    │
│ message + viz   │
└─────────────────┘
```

### 4. Fluxo de Query Customizada

```
┌─────────────────┐
│ Usuario escreve │
│ SQL na pagina   │
│ /queries        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validacao       │
│ (apenas SELECT) │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────────┐
│Valido │ │Invalido   │
└───┬───┘ │DROP/DELETE│
    │     └─────┬─────┘
    │           │
    ▼           ▼
┌───────┐ ┌───────────┐
│POST   │ │Erro:      │
│/api/  │ │operacao   │
│query  │ │nao permit.│
└───┬───┘ └───────────┘
    │
    ▼
┌─────────────────┐
│ Admin client    │
│ executa query   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Retorna max     │
│ 1000 linhas     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Renderiza       │
│ tabela de dados │
└─────────────────┘
```

---

## API Routes

### POST `/api/ai/chat`

Endpoint principal do assistente Teletraan9.

**Request:**
```typescript
{
  message: string,           // Mensagem do usuario
  conversationHistory?: {    // Historico opcional
    role: 'user' | 'assistant',
    content: string
  }[]
}
```

**Response:**
```typescript
{
  message: string,           // Resposta do AI
  visualization?: {
    type: 'chart' | 'table' | 'number' | 'list',
    chartType?: 'line' | 'bar' | 'pie',
    title?: string,
    data?: any[],
    columns?: string[],
    value?: string | number,
    items?: string[],
    downloadable?: boolean
  }
}
```

**Funcionalidades:**
1. **Ref # Decoder**: Detecta codigos tipo `QC-A3F8-0106-03` e busca usuario
2. **Intent Detection**: Identifica se usuario quer grafico, tabela ou metrica
3. **Database Context**: Conhece o schema completo das 5 esferas
4. **Visualization**: Gera configuracoes para charts/tables

**Sistema de Ref #:**
```
Formato: REGIAO-SUFIXO-DATA-SESSOES
Exemplo: QC-A3F8-0106-03

QC    = Codigo da regiao (Quebec)
A3F8  = Ultimos 4 caracteres do user_id (hex)
0106  = Data de exportacao (01 de junho)
03    = Numero de sessoes no periodo
```

### POST `/api/query`

Executa queries SQL customizadas (apenas SELECT).

**Request:**
```typescript
{
  query: string  // SQL query
}
```

**Response:**
```typescript
{
  data: unknown[],  // Resultados (max 1000 linhas)
  error?: string
}
```

**Seguranca:**
- Bloqueia: `DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `TRUNCATE`, `CREATE`
- Permite: Apenas `SELECT`
- Limite: 1000 linhas por query

---

## Componentes

### Layout Components

#### `components/layout/sidebar.tsx`
Barra de navegacao lateral com:
- Logo OnSite
- Navegacao das 5 Esferas (Overview, Identity, Business, Product, Debug)
- Ferramentas (Teletraan9, Support)
- Status do sistema
- Icones Lucide para cada secao

#### `components/layout/header.tsx`
Cabecalho da pagina com:
- Titulo da pagina atual
- Descricao opcional
- Campo de busca
- Notificacoes
- Menu do usuario (profile)

#### `components/layout/stats-card.tsx`
Card de metricas com:
- Icone
- Titulo
- Valor principal
- Sufixo opcional (%, h, etc)
- Variantes de cor por esfera

### Chart Components

#### `components/charts/line-chart.tsx`
Grafico de linhas usando Recharts:
- Responsivo (ResponsiveContainer)
- Tooltip customizado
- Grid e eixos configurados
- Animacoes

#### `components/charts/bar-chart.tsx`
Grafico de barras usando Recharts:
- Horizontal/Vertical
- Responsivo
- Labels customizados

### Table Components

#### `components/tables/data-table.tsx`
Tabela de dados generica:
- Paginacao
- Configuracao de colunas
- Responsiva

### UI Components (Shadcn/Radix)

| Componente | Arquivo | Uso |
|------------|---------|-----|
| Alert | `ui/alert.tsx` | Mensagens de feedback e alertas |
| Badge | `ui/badge.tsx` | Tags e status |
| Button | `ui/button.tsx` | Botoes interativos com variantes |
| Card | `ui/card.tsx` | Containers de conteudo (CardHeader, CardContent, etc) |
| Input | `ui/input.tsx` | Campos de texto |
| Skeleton | `ui/skeleton.tsx` | Loading placeholders |

---

## Hooks e Utilitarios

### Custom Hooks (`lib/hooks/index.ts`)

```typescript
// Busca usuario autenticado atual
function useUser(): {
  user: User | null
  loading: boolean
}

// Fetch generico com estados
function useFetch<T>(
  fetcher: () => Promise<T>,
  deps?: any[]
): {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

// Valor com debounce
function useDebounce<T>(value: T, delay?: number): T

// Persistencia em localStorage
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void]

// Copiar para clipboard
function useCopyToClipboard(): {
  copied: boolean
  copy: (text: string) => Promise<boolean>
}

// Subscription realtime Supabase
function useRealtimeSubscription<T>(
  table: string,
  callback: (payload: T) => void
): void
```

### Funcoes Utilitarias (`lib/utils.ts`)

#### Merge de Classes CSS
```typescript
// Merge de classes CSS (clsx + tailwind-merge)
cn(...inputs: ClassValue[]): string
```

#### Formatacao de Datas
```typescript
// Formata data (usa Intl ou date-fns conforme arquivo)
formatDate(date: string | Date | null, format?: string): string
// Ex: formatDate(new Date()) → "Jan 17, 2026"

// Formata data e hora
formatDateTime(date: string | Date | null): string
// Ex: formatDateTime(date) → "Jan 17, 2026, 02:30 PM"

// Formata data relativa
formatRelative(date: string | Date | null): string
// Ex: formatRelative(date) → "2h ago"

// Formata duracao em minutos
formatDuration(minutes: number | null): string
// Ex: formatDuration(90) → "1h 30m"
```

#### Formatacao de Numeros
```typescript
// Formata numero com separador de milhares
formatNumber(num: number | null): string
// Ex: formatNumber(1234567) → "1,234,567"

// Formata percentual
formatPercent(num: number | null, decimals?: number): string
// Ex: formatPercent(12.345) → "12%"

// Formata moeda (CAD)
formatCurrency(num: number | null, currency?: string): string
// Ex: formatCurrency(100) → "$100.00"
```

#### Manipulacao de Dados
```typescript
// Converte array para CSV
toCSV(data: any[], headers?: string[]): string

// Download de arquivo no browser
downloadFile(content: string, filename: string, mimeType?: string): void
```

#### Utilitarios de String
```typescript
// Extrai iniciais do nome
getInitials(name: string | null): string
// Ex: getInitials("John Doe") → "JD"

// Trunca string
truncate(str: string | null, length?: number): string
// Ex: truncate("Hello world", 8) → "Hello..."

// Capitaliza string
capitalize(str: string | null): string
// Ex: capitalize("hello") → "Hello"
```

### Funcoes Utilitarias Adicionais (`lib/utils/index.ts`)

Versao alternativa com date-fns e locale pt-BR:

```typescript
// Formata data com date-fns e locale pt-BR
formatDate(date: string | Date, formatStr?: string): string

// Formata data relativa em portugues
formatRelative(date: string | Date): string
// Ex: "há 2 horas"

// Parse JSON seguro
safeJsonParse<T>(json: string | null, fallback: T): T

// Delay baseado em Promise
sleep(ms: number): Promise<void>

// Debounce de funcao
debounce<T>(fn: T, delay: number): T

// String para cor consistente (HSL)
stringToColor(str: string): string
```

---

## Sistema de Autenticacao

### Middleware (`middleware.ts`)

```typescript
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Funcao updateSession (`lib/supabase/middleware.ts`)

```typescript
export async function updateSession(request: NextRequest) {
  // Cria response mutavel
  let supabaseResponse = NextResponse.next({ request })

  // Cria cliente Supabase com cookies
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Atualiza sessao (refresh token se necessario)
  await supabase.auth.getUser()

  return supabaseResponse
}
```

### Fluxo de Protecao de Rotas

1. Usuario acessa rota protegida (`/dashboard/*`)
2. Middleware intercepta request
3. `updateSession()` valida/renova sessao
4. Se sessao invalida → redirect para `/auth/login`
5. Se sessao valida → continua para pagina

### Paginas de Auth

#### `/auth/login/page.tsx`
- Formulario de login com email/senha
- Integracao com Supabase Auth
- Verifica se usuario e admin aprovado
- Redirect para dashboard ou pending

#### `/auth/pending/page.tsx`
- Pagina para usuarios aguardando aprovacao
- Polling automatico para verificar status
- Usado quando ha sistema de aprovacao manual

---

## Assistente AI - Teletraan9

### Visao Geral

Teletraan9 e um assistente AI especializado em analise de dados workforce, alimentado pelo GPT-4o da OpenAI. O nome e uma referencia ao computador Autobot da franquia Transformers.

### Persona e System Prompt

```
# Who you are

You are Teletraan9, an advanced AI data analyst specialized in workforce analytics.
You are the analytics engine for OnSite Club, a time tracking app for construction workers.

# How you communicate

- Natural and direct, like a colleague
- Explain data simply and actionably
- Ask questions to understand context better
- Give opinions based on data
- Speak in the user's preferred language

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
```

### Quick Actions

O assistente oferece acoes rapidas em 4 categorias:

#### Analise
| Acao | Descricao | Tipo |
|------|-----------|------|
| Crescimento Semanal | Analisa crescimento da ultima semana | Instant |
| Deteccao de Anomalias | Identifica padroes incomuns | Instant |
| Comparativo Mensal | Compara mes atual vs anterior | Instant |
| Top Usuarios | Ranking por horas rastreadas | Instant |
| Tendencias | Analisa tendencias de longo prazo | Guided |

#### Relatorios
| Acao | Descricao | Tipo |
|------|-----------|------|
| Relatorio Semanal | Resume atividade da semana | Instant |
| Relatorio Mensal | Resume atividade do mes | Instant |
| Relatorio Customizado | Define periodo e metricas | Guided |
| Export de Dados | Exporta dados para CSV | Guided |

#### Visualizacoes
| Acao | Descricao | Tipo |
|------|-----------|------|
| Dashboard Executivo | Visao geral para gestao | Instant |
| Tabela de Metricas | Dados em formato tabular | Instant |
| Grafico de Tendencias | Visualizacao temporal | Guided |
| Comparativo Visual | Graficos comparativos | Guided |

#### Acoes
| Acao | Descricao | Tipo |
|------|-----------|------|
| Export CSV | Exporta dados selecionados | Guided |
| Health Check | Verifica saude do sistema | Instant |
| Decodificar Ref # | Busca usuario por codigo | Guided |

### Tipos de Acao

**Instant Actions:**
- Executam imediatamente
- Template de prompt pre-definido
- Um clique para resultado

**Guided Actions:**
- Fluxo multi-step
- Coleta parametros do usuario
- Monta prompt final com respostas

### Visualizacoes

O Teletraan9 pode gerar 4 tipos de visualizacao:

#### 1. Chart (Grafico)
```typescript
{
  type: 'chart',
  chartType: 'line' | 'bar' | 'pie',
  title: string,
  data: DataPoint[],
  downloadable: boolean
}
```

#### 2. Table (Tabela)
```typescript
{
  type: 'table',
  title: string,
  columns: string[],
  data: Record<string, unknown>[],
  downloadable: boolean
}
```

#### 3. Number (Metrica)
```typescript
{
  type: 'number',
  title: string,
  value: string | number
}
```

#### 4. List (Lista)
```typescript
{
  type: 'list',
  title: string,
  items: string[]
}
```

### Tabelas Editaveis

O chat suporta tabelas editaveis:
- Clique em celula para editar
- Salva alteracoes localmente
- Export para CSV/Excel/PDF

---

## Configuracao e Deploy

### Variaveis de Ambiente

Crie um arquivo `.env.local` na raiz:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# OpenAI (para Teletraan9)
OPENAI_API_KEY=sk-...
```

### Scripts NPM

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento (localhost:3000)

# Build
npm run build        # Compila para producao
npm start            # Inicia servidor de producao

# Qualidade
npm run lint         # Executa ESLint
npm run typecheck    # Verifica tipos TypeScript
```

### Configuracao Next.js (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,  // Habilita Server Actions
  },
  images: {
    domains: [
      'avatars.githubusercontent.com',  // Avatares GitHub
    ],
  },
}

module.exports = nextConfig
```

### Configuracao Tailwind (`tailwind.config.js`)

```javascript
module.exports = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cores OnSite
        onsite: {
          orange: '#F97316',
          yellow: '#FBBF24',
          dark: '#1C1917',
        },
        // Cores das Esferas
        identity: { /* azul */ },
        business: { /* verde */ },
        product: { /* roxo */ },
        debug: { /* vermelho */ },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

---

## Resumo da Arquitetura

O OnSite Analytics e uma aplicacao **Next.js 14** moderna com as seguintes caracteristicas:

### Pontos Fortes
- **Organizacao em 5 Esferas**: Modelo de dados claro e bem estruturado
- **AI-First**: Teletraan9 torna analises complexas acessiveis
- **Real-Time Ready**: Integracao Supabase com suporte a realtime
- **Type-Safe**: TypeScript em todo o codebase
- **Acessivel**: Componentes Radix UI semanticos

### Fluxo de Dados
```
Mobile App → Supabase → Dashboard → Usuario
                ↓
          Teletraan9 AI
                ↓
         Insights & Visualizacoes
```

### Integracao de Sistemas
```
┌─────────────────────────────────────────────────┐
│                  FRONTEND                        │
│  Next.js 14 + React 18 + Tailwind + Radix UI    │
└─────────────────────┬───────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│    SUPABASE     │     │     OPENAI      │
│  PostgreSQL     │     │     GPT-4o      │
│  Auth           │     │   (Teletraan9)  │
│  Realtime       │     │                 │
└─────────────────┘     └─────────────────┘
```

### Contagem de Arquivos

| Categoria | Quantidade |
|-----------|------------|
| Paginas Dashboard | 10 |
| API Routes | 2 |
| Componentes Layout | 3 |
| Componentes UI | 6 |
| Componentes Charts | 2 |
| Componentes Tables | 1 |
| Lib Files | 8 |
| Config Files | 6 |
| **Total** | ~42 arquivos |

Este documento deve servir como referencia completa para entender, manter e expandir o sistema OnSite Analytics.
