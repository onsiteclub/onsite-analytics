# 📊 OnSite Analytics Dashboard

## Documentação Técnica e Conceitual

> Sistema de analytics para o ecossistema OnSite Club.  
> Versão: 2.0 | Janeiro 2025

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [As 5 Esferas de Dados](#3-as-5-esferas-de-dados)
4. [Fluxo de Dados](#4-fluxo-de-dados)
5. [Páginas do Dashboard](#5-páginas-do-dashboard)
6. [Sistema de IA (Teletraan9)](#6-sistema-de-ia-teletraan9)
7. [Tecnologias Utilizadas](#7-tecnologias-utilizadas)
8. [Estrutura de Arquivos](#8-estrutura-de-arquivos)

---

## 1. Visão Geral

### O que é o OnSite Analytics?

O OnSite Analytics é um dashboard administrativo que transforma dados brutos do aplicativo OnSite Timekeeper em **informações acionáveis** para tomada de decisão. Ele responde perguntas críticas sobre:

- **Quem** são os usuários? (Identity)
- **Quanto valor** está sendo gerado? (Business)
- **Como** os usuários interagem com o app? (Product)
- **O sistema está saudável?** (Debug)

### Por que ele existe?

O aplicativo móvel OnSite Timekeeper coleta dados de ponto eletrônico para trabalhadores da construção civil. Sem um dashboard analítico, esses dados ficariam isolados nos dispositivos e no banco de dados, sem gerar insights.

O Analytics existe para:

1. **Monitorar a saúde do negócio** - Quantos usuários ativos? Quantas horas rastreadas?
2. **Identificar problemas** - Onde os usuários abandonam? Quais dispositivos têm erros?
3. **Guiar decisões de produto** - Quais features são mais usadas? O geofence funciona bem?
4. **Prever churn** - Quais usuários estão inativos? Qual cohort retém melhor?

---

## 2. Arquitetura do Sistema

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USUÁRIO FINAL                                │
│                    (Trabalhador de Obra)                            │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ONSITE TIMEKEEPER APP                           │
│                      (React Native + Expo)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Geofence   │  │   Records   │  │  Analytics  │                 │
│  │  Tracking   │  │   (Ponto)   │  │   Daily     │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│         │                │                │                         │
│         └────────────────┼────────────────┘                         │
│                          ▼                                          │
│                    SQLite Local                                     │
│              (Funciona 100% Offline)                                │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ SYNC (quando online)
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                    │
│                    (PostgreSQL + Auth)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │  profiles   │  │  locations  │  │   records   │  │ analytics │  │
│  │  (users)    │  │  (geofences)│  │  (sessions) │  │   daily   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
│  ┌─────────────┐  ┌─────────────┐                                   │
│  │  error_log  │  │  location   │                                   │
│  │  (bugs)     │  │   audit     │                                   │
│  └─────────────┘  └─────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ QUERIES (real-time)
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ONSITE ANALYTICS DASHBOARD                       │
│                        (Next.js 14)                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │  Overview   │  │  Identity   │  │  Business   │  │  Product  │  │
│  │   (KPIs)    │  │  (Users)    │  │ (Sessions)  │  │   (UX)    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
│  ┌─────────────┐  ┌─────────────────────────────────────────────┐  │
│  │   Debug     │  │              TELETRAAN9                     │  │
│  │  (Errors)   │  │         (AI Data Analyst)                   │  │
│  └─────────────┘  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMINISTRADOR                               │
│                  (Product Manager / Developer)                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Componentes Principais

| Componente | Tecnologia | Função |
|------------|------------|--------|
| App Mobile | React Native + Expo | Coleta dados de ponto |
| SQLite | expo-sqlite | Armazena dados offline |
| Supabase | PostgreSQL | Banco de dados cloud |
| Dashboard | Next.js 14 | Interface de analytics |
| Teletraan9 | GPT-4o | Análise conversacional |
| Recharts | React | Visualização de dados |

---

## 3. As 5 Esferas de Dados

O sistema organiza todos os dados em **5 esferas conceituais**. Cada esfera responde a um tipo diferente de pergunta.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      5 ESFERAS DE DADOS                             │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤
│  IDENTITY   │  BUSINESS   │   PRODUCT   │    DEBUG    │  METADATA   │
│   (Quem)    │   (Valor)   │    (UX)     │   (Bugs)    │ (Contexto)  │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ Segmentação │    KPIs     │  Features   │   Erros     │   Versão    │
│   Cohorts   │   Horas     │  Onboarding │    Sync     │     OS      │
│    Churn    │  Automação  │   Retenção  │    GPS      │   Device    │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

### 3.1 IDENTITY - Quem são os usuários?

**Propósito:** Entender a base de usuários para segmentação e predição de churn.

| Dado Coletado | Fonte | Por que importa |
|---------------|-------|-----------------|
| `user_id` | Supabase Auth | Identificação única |
| `email` | Cadastro | Comunicação |
| `name` | Cadastro | Personalização |
| `plan_type` | Sistema | Segmentação por receita |
| `device_platform` | App | iOS vs Android |
| `created_at` | Auth | Análise de cohort |
| `last_active_at` | Analytics | Detecção de churn |

**Perguntas que responde:**
- Quantos usuários novos este mês?
- Qual plataforma domina (iOS/Android)?
- Quais usuários estão inativos há 30 dias?
- Qual cohort (mês de cadastro) retém melhor?

---

### 3.2 BUSINESS - Quanto valor está sendo gerado?

**Propósito:** Medir o core business - horas de trabalho rastreadas.

| Dado Coletado | Fonte | Por que importa |
|---------------|-------|-----------------|
| `sessions_count` | records | Volume de uso |
| `total_minutes` | records | Valor entregue |
| `locations_count` | locations | Engajamento |
| `auto_entries` | records | Geofence funciona? |
| `manual_entries` | records | Fricção do usuário |

**Perguntas que responde:**
- Quantas horas foram rastreadas esta semana?
- Qual a taxa de automação (geofence vs manual)?
- Qual o tempo médio de sessão?
- Quantos locais de trabalho foram cadastrados?

**Cálculo da Taxa de Automação:**
```typescript
automationRate = (auto_entries / (auto_entries + manual_entries)) * 100
```

Uma taxa alta (>70%) indica que o geofencing está funcionando bem e os usuários confiam no sistema automático.

---

### 3.3 PRODUCT - Como os usuários interagem?

**Propósito:** Guiar decisões de produto e priorização de features.

| Dado Coletado | Fonte | Por que importa |
|---------------|-------|-----------------|
| `app_opens` | analytics_daily | Engajamento diário |
| `app_foreground_seconds` | analytics_daily | Tempo de uso |
| `features_used` | analytics_daily | Quais features usam |
| `notifications_shown` | analytics_daily | Push funciona? |
| `notifications_actioned` | analytics_daily | Push é relevante? |

**Perguntas que responde:**
- Quantas vezes o app é aberto por dia?
- Qual o tempo médio de uso?
- Quais features são mais populares?
- Os usuários respondem às notificações?

**Funil de Onboarding:**
```
Signup → Email Verified → First Location → First Session → First Export
  100%       85%              60%              45%            20%
```

Identificar onde os usuários "caem" do funil ajuda a priorizar melhorias.

---

### 3.4 DEBUG - O sistema está saudável?

**Propósito:** Monitorar estabilidade e identificar problemas antes dos usuários.

| Dado Coletado | Fonte | Por que importa |
|---------------|-------|-----------------|
| `error_type` | error_log | Categorização |
| `error_message` | error_log | Diagnóstico |
| `sync_failures` | analytics_daily | Conectividade |
| `geofence_accuracy` | analytics_daily | Hardware/GPS |
| `app_version` | error_log | Regressões |
| `device_model` | error_log | Device-specific bugs |

**Tipos de Erro:**
| Tipo | Descrição | Severidade |
|------|-----------|------------|
| `crash` | App fechou inesperadamente | 🔴 Crítico |
| `api` | Falha de comunicação com servidor | 🟠 Alto |
| `sync` | Dados não sincronizaram | 🟠 Alto |
| `geofence` | Geofence não disparou corretamente | 🟡 Médio |
| `auth` | Problema de autenticação | 🟡 Médio |

**Perguntas que responde:**
- Quantos erros ocorreram nos últimos 7 dias?
- Qual versão do app tem mais problemas?
- Quais dispositivos apresentam mais erros?
- O sync está funcionando (taxa de sucesso)?

---

### 3.5 METADATA - Contexto técnico

**Propósito:** Permitir reprodução de bugs e decisões de suporte.

| Dado Coletado | Fonte | Por que importa |
|---------------|-------|-----------------|
| `app_version` | App | Qual build |
| `os` | App | iOS ou Android |
| `os_version` | App | Compatibilidade |
| `device_model` | App | Hardware específico |

Metadata não é exibido diretamente, mas é crucial para **correlacionar** problemas. Exemplo: "90% dos erros de geofence ocorrem no Samsung Galaxy A10 com Android 9".

---

## 4. Fluxo de Dados

### 4.1 Coleta (App → SQLite)

O app mobile coleta dados de forma **event-driven** e **agregada**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      EVENTOS DO APP                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐                                                    │
│  │ App Opened  │ ──▶ analytics_daily.app_opens++                    │
│  └─────────────┘                                                    │
│                                                                     │
│  ┌─────────────┐                                                    │
│  │  Geofence   │ ──▶ records.insert({ type: 'automatic' })          │
│  │   Entry     │     location_audit.insert({ event: 'entry' })      │
│  └─────────────┘     analytics_daily.auto_entries++                 │
│                                                                     │
│  ┌─────────────┐                                                    │
│  │  Geofence   │ ──▶ records.update({ exit_at: now })               │
│  │    Exit     │     location_audit.insert({ event: 'exit' })       │
│  └─────────────┘     analytics_daily.total_minutes += duration      │
│                                                                     │
│  ┌─────────────┐                                                    │
│  │   Error     │ ──▶ error_log.insert({ type, message, stack })     │
│  │  Occurred   │     analytics_daily.errors_count++                 │
│  └─────────────┘                                                    │
│                                                                     │
│  ┌─────────────┐                                                    │
│  │  Feature    │ ──▶ analytics_daily.features_used.push('export')   │
│  │   Used      │                                                    │
│  └─────────────┘                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Por que agregado por dia?**

Em vez de enviar cada evento individualmente (o que consumiria bateria e banda), o app agrega métricas na tabela `analytics_daily`:

```sql
-- Uma linha por usuário por dia
PRIMARY KEY (date, user_id)
```

Isso reduz:
- **Tamanho do banco** de milhões de eventos para milhares de linhas
- **Tempo de query** de segundos para milissegundos
- **Custo de storage** significativamente

---

### 4.2 Sincronização (SQLite → Supabase)

O sync ocorre em momentos estratégicos para economizar bateria:

| Trigger | Quando | O que sincroniza |
|---------|--------|------------------|
| App Init | Ao abrir o app | Tudo pendente |
| Midnight | 00:00 local | analytics_daily do dia anterior |
| After Action | Criar location, finalizar sessão | Dado específico |
| Manual | Botão de sync | Tudo pendente |

```typescript
// Fluxo simplificado de sync
async function syncNow() {
  // 1. Upload dados locais pendentes
  await uploadPending('locations');
  await uploadPending('records');
  await uploadPending('analytics_daily');
  await uploadPending('error_log');
  
  // 2. Download dados do servidor (multi-device)
  await downloadFromServer('locations');
  await downloadFromServer('records');
  
  // 3. Cleanup dados antigos já sincronizados
  await cleanupOldData();
}
```

---

### 4.3 Transformação (Supabase → Dashboard)

O Dashboard faz queries em tempo real ao Supabase e transforma dados brutos em métricas visuais:

```typescript
// Exemplo: Calcular taxa de automação
async function getAutomationRate() {
  const { data } = await supabase
    .from('records')
    .select('type');
  
  const auto = data.filter(r => r.type === 'automatic').length;
  const total = data.length;
  
  return Math.round((auto / total) * 100);
}
```

```typescript
// Exemplo: Gerar dados para gráfico de sessões
async function getSessionsTrend(days: number) {
  const { data } = await supabase
    .from('records')
    .select('created_at')
    .gte('created_at', daysAgo(days));
  
  // Agrupar por dia
  const byDay = {};
  data.forEach(r => {
    const day = r.created_at.split('T')[0];
    byDay[day] = (byDay[day] || 0) + 1;
  });
  
  // Formato para Recharts
  return Object.entries(byDay).map(([name, value]) => ({ name, value }));
}
```

---

### 4.4 Visualização (Dashboard → Usuário)

Os dados transformados são renderizados usando **Recharts**:

```tsx
// Gráfico de linha para tendência de sessões
<LineChart data={sessionsTrend}>
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Line 
    type="monotone" 
    dataKey="value" 
    stroke="#3b82f6" 
    strokeWidth={2} 
  />
</LineChart>
```

```tsx
// Gráfico de pizza para automação
<PieChart>
  <Pie data={[
    { name: 'Automatic', value: 75 },
    { name: 'Manual', value: 25 }
  ]} />
</PieChart>
```

---

## 5. Páginas do Dashboard

### 5.1 Overview

**Propósito:** Visão executiva das 5 esferas em uma única tela.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  IDENTITY                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Total    │ │ Active   │ │ New This │ │ Platform │               │
│  │ Users    │ │ Today    │ │ Month    │ │ Pie      │               │
│  │   45     │ │   12     │ │    8     │ │ iOS/And  │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
├─────────────────────────────────────────────────────────────────────┤
│  BUSINESS                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Sessions │ │ Hours    │ │ Locations│ │ Auto %   │               │
│  │  1,234   │ │  5,678h  │ │    89    │ │   72%    │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│  ┌──────────────────────────────────────────────────┐               │
│  │         Sessions per Day (Line Chart)            │               │
│  └──────────────────────────────────────────────────┘               │
├─────────────────────────────────────────────────────────────────────┤
│  PRODUCT                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐                │
│  │ Avg Opens│ │ Time in  │ │    Top Features      │                │
│  │  3.2/day │ │ App 8min │ │ • Export  • Edit     │                │
│  └──────────┘ └──────────┘ └──────────────────────┘                │
├─────────────────────────────────────────────────────────────────────┤
│  DEBUG                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Errors   │ │ Sync     │ │ GPS Acc  │ │ By Type  │               │
│  │ 7 days:3 │ │ Rate 98% │ │  15m     │ │ sync:2   │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

**Métricas calculadas:**
- Total Users: `COUNT(*) FROM profiles`
- Active Today: `COUNT(*) FROM profiles WHERE last_active_at >= today`
- Automation Rate: `SUM(auto_entries) / SUM(auto + manual) * 100`
- Sync Rate: `(1 - sync_failures / sync_attempts) * 100`

---

### 5.2 Identity

**Propósito:** Análise profunda da base de usuários.

**Seções:**
1. **KPIs** - Total, ativos (hoje/semana/mês), novos, churned
2. **Distribuição por Plano** - Pie chart (free/pro/enterprise)
3. **Distribuição por Plataforma** - Pie chart (iOS/Android)
4. **Análise de Cohort** - Bar chart (usuários por mês de cadastro)
5. **Tabela de Usuários** - Lista com email, plano, última atividade

**Query principal:**
```typescript
// Cohort analysis
const { data } = await supabase
  .from('profiles')
  .select('created_at');

// Agrupar por mês
const cohorts = {};
data.forEach(u => {
  const month = u.created_at.slice(0, 7); // "2025-01"
  cohorts[month] = (cohorts[month] || 0) + 1;
});
```

---

### 5.3 Business

**Propósito:** Métricas de valor do negócio.

**Seções:**
1. **KPIs** - Sessões totais, horas rastreadas, locais, automação
2. **Manual vs Automático** - Pie chart
3. **Sessões por Dia** - Line chart (14 dias)
4. **Top Locais** - Bar chart horizontal
5. **Sessões Recentes** - Tabela com local, entrada, saída, tipo

**Cálculo de horas:**
```typescript
// Calcular horas totais
let totalMinutes = 0;
sessions.forEach(s => {
  if (s.entry_at && s.exit_at) {
    const ms = new Date(s.exit_at) - new Date(s.entry_at);
    totalMinutes += ms / 60000;
  }
});
const totalHours = Math.round(totalMinutes / 60);
```

---

### 5.4 Product

**Propósito:** UX, engagement e retenção.

**Seções:**
1. **KPIs** - Aberturas médias, tempo no app, taxa de notificação
2. **Funil de Onboarding** - Bar chart horizontal (signup → export)
3. **Top Features** - Bar chart vertical
4. **Pontos de Abandono** - Lista de onde usuários desistem

**Taxa de resposta a notificações:**
```typescript
const rate = (notifications_actioned / notifications_shown) * 100;
// Benchmark: >30% é bom
```

---

### 5.5 Debug

**Propósito:** Saúde do sistema e debugging.

**Seções:**
1. **Status Badge** - "System Healthy" ou "Attention Needed"
2. **KPIs** - Erros (7d), erros hoje, sync rate, GPS accuracy
3. **Erros por Tipo** - Pie chart (crash/api/sync/geofence/auth)
4. **Tendência de Erros** - Line chart (7 dias)
5. **Top Devices com Erros** - Lista
6. **Top Versions com Erros** - Lista
7. **Tabela de Erros** - Log detalhado

**Critérios de "System Healthy":**
```typescript
const isHealthy = 
  totalErrors < 10 && 
  syncSuccessRate >= 95;
```

---

## 6. Sistema de IA (Teletraan9)

### O que é?

Teletraan9 é um assistente de IA integrado ao dashboard que permite **análise conversacional** dos dados. Em vez de navegar por múltiplas telas, o administrador pode simplesmente perguntar:

> "Quantos usuários novos tivemos essa semana?"  
> "Mostre um gráfico de sessões dos últimos 14 dias"  
> "Qual dispositivo está tendo mais erros?"

### Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TELETRAAN9                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐         ┌──────────────┐         ┌────────────┐ │
│   │    User      │         │   Intent     │         │  Database  │ │
│   │   Message    │────────▶│  Detection   │────────▶│   Query    │ │
│   └──────────────┘         └──────────────┘         └────────────┘ │
│                                   │                        │        │
│                                   │                        │        │
│                                   ▼                        ▼        │
│                            ┌──────────────┐         ┌────────────┐ │
│                            │    GPT-4o    │◀────────│   Context  │ │
│                            │   (OpenAI)   │         │    Data    │ │
│                            └──────────────┘         └────────────┘ │
│                                   │                                 │
│                                   ▼                                 │
│   ┌──────────────┐         ┌──────────────┐                        │
│   │   Response   │◀────────│ Visualization│                        │
│   │    + Chart   │         │   (if any)   │                        │
│   └──────────────┘         └──────────────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Detecção de Intent

O sistema analisa a mensagem do usuário para identificar:

1. **Tipo de output desejado:** chart, table, number, none
2. **Esfera de dados:** identity, business, product, debug
3. **Tópico específico:** sessions, users, errors, automation

```typescript
function detectIntent(message: string) {
  // Quer gráfico?
  const wantsChart = /(chart|graph|visualiz|trend)/i.test(message);
  
  // Qual esfera?
  let sphere = null;
  if (/(user|cohort|churn)/i.test(message)) sphere = 'identity';
  else if (/(session|hour|automation)/i.test(message)) sphere = 'business';
  
  return { wantsChart, sphere };
}
```

### Geração de Visualizações

Se o intent indica que o usuário quer um gráfico, o sistema:

1. Executa a query apropriada
2. Formata os dados para Recharts
3. Retorna junto com a resposta de texto

```typescript
if (intent.topic === 'sessions' && intent.wants === 'chart') {
  const data = await getSessionsTrend(14);
  visualization = {
    type: 'chart',
    chartType: 'line',
    title: 'Sessions per Day',
    data
  };
}
```

### System Prompt

O Teletraan9 recebe um prompt de sistema que inclui:

1. **Persona** - Como deve se comportar
2. **Schema** - Estrutura do banco de dados
3. **Métricas atuais** - Dados em tempo real
4. **Contexto de visualização** - Se gerou gráfico

```typescript
const systemPrompt = `
# Who you are
You are Teletraan9, an advanced AI data analyst...

# Database Schema
- profiles: id, email, name, plan_type...
- records: entry_at, exit_at, type...

# Current Metrics
- Users: 45
- Sessions: 1,234
- Automation Rate: 72%

# Visualization Generated
A line chart was created showing sessions per day.
Comment briefly on the trends.
`;
```

---

## 7. Tecnologias Utilizadas

### Frontend (Dashboard)

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 14 | Framework React com App Router |
| React | 18 | UI Library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3 | Styling |
| shadcn/ui | latest | Component library |
| Recharts | 2 | Gráficos |
| Lucide | latest | Ícones |

### Backend

| Tecnologia | Uso |
|------------|-----|
| Supabase | Banco de dados PostgreSQL + Auth |
| OpenAI GPT-4o | Teletraan9 AI |
| Vercel | Hosting |

### Mobile (App de origem dos dados)

| Tecnologia | Uso |
|------------|-----|
| React Native | Framework mobile |
| Expo | Toolchain |
| expo-sqlite | Banco local |
| expo-location | Geofencing |

---

## 8. Estrutura de Arquivos

```
onsite-analytics/
├── app/
│   ├── api/
│   │   └── ai/
│   │       └── chat/
│   │           └── route.ts          # Teletraan9 API endpoint
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx              # Login page
│   │   └── pending/
│   │       └── page.tsx              # Waiting approval
│   └── dashboard/
│       ├── overview/
│       │   └── page.tsx              # Main dashboard
│       ├── identity/
│       │   └── page.tsx              # Users/Cohorts
│       ├── business/
│       │   └── page.tsx              # Sessions/Hours
│       ├── product/
│       │   └── page.tsx              # UX/Features
│       ├── debug/
│       │   └── page.tsx              # Errors/Health
│       └── assistant/
│           └── page.tsx              # Teletraan9 chat
├── components/
│   ├── layout/
│   │   ├── header.tsx                # Page header
│   │   └── sidebar.tsx               # Navigation
│   └── ui/                           # shadcn components
├── lib/
│   └── supabase/
│       ├── client.ts                 # Browser client
│       ├── server.ts                 # Server client + Admin
│       ├── middleware.ts             # Auth middleware
│       └── queries.ts                # Database queries
├── types/
│   └── database.ts                   # TypeScript types
└── .env.local                        # Environment variables
```

---

## Conclusão

O OnSite Analytics transforma dados brutos de ponto eletrônico em **insights acionáveis** através de:

1. **Arquitetura em 5 Esferas** - Organização conceitual dos dados
2. **Agregação Inteligente** - Dados diários em vez de eventos granulares
3. **Visualizações Focadas** - Cada página responde perguntas específicas
4. **IA Conversacional** - Teletraan9 para análise natural
5. **Stack Moderna** - Next.js + Supabase + Recharts

O sistema foi projetado para escalar com a base de usuários enquanto mantém performance e custos controlados.

---

*Documentação gerada em Janeiro 2025*  
*OnSite Club - "Wear what you do!"*
