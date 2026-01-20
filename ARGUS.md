# ARGUS - OnSite Analytics Intelligence System

> **Nome:** ARGUS (All-seeing Realtime Guardian & Unified Statistics)
> **Papel:** Olhos do Blue no Supabase - Visão, Análise e Pré-cognição
> **Domínio:** analytics.onsiteclub.ca
> **Mantido por:** Blueprint (Blue)

---

## METADATA

```yaml
agent: ARGUS
version: 1.0
framework: next@14.1.0
language: typescript@5.3.3
ui: react@18.2.0 + tailwindcss@3.4.1
database: supabase-postgresql
ai_engine: openai/gpt-4o (Teletraan9)
deploy: vercel
domain: analytics.onsiteclub.ca
```

---

## TRÊS CAMADAS DE INTELIGÊNCIA

```
┌─────────────────────────────────────────────────────────────────┐
│  CAMADA 3: PRÉ-COGNIÇÃO                                         │
│  "O que VAI acontecer"                                          │
│  • Churn Prediction      • Conversion Score                     │
│  • Growth Forecast       • Anomaly Detection                    │
├─────────────────────────────────────────────────────────────────┤
│  CAMADA 2: ANÁLISE                                              │
│  "O que os dados REVELAM"                                       │
│  • Cross-domain queries  • Cohort analysis                      │
│  • LTV calculation       • Feature adoption                     │
├─────────────────────────────────────────────────────────────────┤
│  CAMADA 1: VISÃO                                                │
│  "O que está acontecendo AGORA"                                 │
│  • Real-time metrics     • Active sessions                      │
│  • Error monitoring      • Payment tracking                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## SUPABASE SCHEMA COMPLETO (38 Tabelas)

### Organização por Domínios

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. REFERENCE (3)     │ Dados estáticos de referência            │
│ 2. IDENTITY (3)      │ Quem são os usuários                     │
│ 3. TIMEKEEPER (3)    │ Domínio KRONOS                           │
│ 4. CALCULATOR (3)    │ Domínio CEULEN                           │
│ 5. SHOP (6)          │ Domínio MERCATOR                         │
│ 6. BILLING (4)       │ Pagamentos e assinaturas                 │
│ 7. DEBUG (5)         │ Logs e erros                             │
│ 8. ANALYTICS (3)     │ Métricas agregadas                       │
│ 9. INTELLIGENCE (2)  │ Padrões de IA                            │
│ 10. ADMIN (2)        │ Administração                            │
│ 11. REWARDS (1)      │ Programa Blades                          │
│ 12. ARGUS (1)        │ Conversas do ARGUS                       │
└─────────────────────────────────────────────────────────────────┘
```

---

### 1. REFERENCE (Dados Estáticos)

#### `ref_trades` - Ofícios da Construção
```sql
id              UUID PRIMARY KEY
code            VARCHAR(10) UNIQUE NOT NULL    -- 'CARP', 'ELEC', 'PLUM'
name_en         TEXT NOT NULL                  -- 'Carpenter'
name_fr         TEXT                           -- 'Charpentier'
name_pt         TEXT                           -- 'Carpinteiro'
name_es         TEXT                           -- 'Carpintero'
category        TEXT NOT NULL                  -- 'structural', 'mechanical', 'finishing'
subcategory     TEXT
description_en  TEXT
common_tools    TEXT[]                         -- ['hammer', 'saw', 'level']
common_materials TEXT[]                        -- ['wood', 'nails', 'plywood']
common_calculations TEXT[]                     -- ['lumber_board_feet', 'roof_pitch']
common_slang    JSONB                          -- {"two-by-four": "2x4 lumber"}
is_active       BOOLEAN DEFAULT true
sort_order      INTEGER DEFAULT 0
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `ref_provinces` - Províncias Canadenses
```sql
id              UUID PRIMARY KEY
code            VARCHAR(2) UNIQUE NOT NULL     -- 'ON', 'QC', 'BC'
country         VARCHAR(2) DEFAULT 'CA'
name_en         TEXT NOT NULL                  -- 'Ontario'
name_fr         TEXT                           -- 'Ontario'
timezone        TEXT NOT NULL                  -- 'America/Toronto'
has_red_seal    BOOLEAN DEFAULT true
min_wage        NUMERIC(5,2)                   -- 16.55
overtime_threshold INTEGER DEFAULT 44          -- Horas antes de overtime
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `ref_units` - Unidades de Medida
```sql
id              UUID PRIMARY KEY
code            VARCHAR(20) UNIQUE NOT NULL    -- 'feet', 'meters', 'sqft'
symbol          VARCHAR(10) NOT NULL           -- 'ft', 'm', 'ft²'
name_en         TEXT NOT NULL                  -- 'Feet'
name_pt         TEXT                           -- 'Pés'
unit_type       TEXT NOT NULL                  -- 'length', 'area', 'volume'
system          TEXT NOT NULL                  -- 'imperial' | 'metric'
base_unit_code  VARCHAR(20)                    -- 'inches' para 'feet'
conversion_factor NUMERIC(20,10)               -- 12 (feet = 12 inches)
spoken_variations JSONB DEFAULT '[]'           -- ["foot", "feet", "ft"]
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
```

---

### 2. IDENTITY (Quem São os Usuários)

#### `core_profiles` - Perfil Principal (VIEW: `profiles`)
```sql
id                  UUID PRIMARY KEY           -- = auth.users.id
email               TEXT UNIQUE
full_name           TEXT
avatar_url          TEXT
first_name          TEXT
last_name           TEXT
preferred_name      TEXT

-- Profissional (crítico para IA)
trade               TEXT                       -- FK ref_trades.code
trade_other         TEXT
experience_years    INTEGER
experience_level    TEXT                       -- 'apprentice'|'journeyman'|'master'|'foreman'
certifications      TEXT[]

-- Emprego
employment_type     TEXT                       -- 'employee'|'contractor'|'self_employed'|'business_owner'
company_name        TEXT
company_size        TEXT                       -- 'solo'|'2-10'|'11-50'|'51-200'|'200+'

-- Localização (crítico para IA)
country             VARCHAR(2) DEFAULT 'CA'
province            VARCHAR(2)                 -- FK ref_provinces.code
city                TEXT
postal_prefix       VARCHAR(3)
timezone            TEXT DEFAULT 'America/Toronto'

-- Idioma (crítico para IA)
language_primary    VARCHAR(5) DEFAULT 'en'    -- 'en', 'fr', 'pt', 'es'
language_secondary  VARCHAR(5)
language_origin     VARCHAR(5)                 -- Idioma nativo (sotaque)

-- Preferências
units_system        TEXT DEFAULT 'imperial'    -- 'imperial' | 'metric'
date_format         TEXT DEFAULT 'MM/DD/YYYY'
time_format         TEXT DEFAULT '12h'

-- Onboarding
onboarding_completed_at TIMESTAMPTZ
onboarding_source   TEXT                       -- 'organic'|'referral'|'ad_facebook'
referral_code       TEXT
referred_by         UUID REFERENCES core_profiles(id)

-- Engajamento
first_active_at     TIMESTAMPTZ
last_active_at      TIMESTAMPTZ
total_sessions      INTEGER DEFAULT 0
profile_completeness INTEGER DEFAULT 0         -- 0-100%

-- Timestamps
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
```

#### `core_devices` - Dispositivos
```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL REFERENCES auth.users(id)
device_id       TEXT NOT NULL UNIQUE
device_name     TEXT
platform        TEXT NOT NULL                  -- 'ios' | 'android' | 'web'
manufacturer    TEXT                           -- 'Samsung', 'Apple'
model           TEXT                           -- 'iPhone 15', 'Galaxy S24'
os_version      TEXT                           -- '17.2', '14'
app_name        TEXT                           -- 'calculator', 'timekeeper'
app_version     TEXT                           -- '4.9.0'
has_gps         BOOLEAN DEFAULT true
has_microphone  BOOLEAN DEFAULT true
push_token      TEXT
push_enabled    BOOLEAN DEFAULT true
is_primary      BOOLEAN DEFAULT false
is_active       BOOLEAN DEFAULT true
first_seen_at   TIMESTAMPTZ DEFAULT now()
last_active_at  TIMESTAMPTZ
session_count   INTEGER DEFAULT 0
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `core_consents` - Consentimentos (LGPD/GDPR)
```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL REFERENCES auth.users(id)
consent_type    TEXT NOT NULL                  -- 'terms_of_service'|'privacy_policy'|'voice_training'|etc
document_version TEXT NOT NULL                 -- 'v1.0'
document_hash   TEXT
granted         BOOLEAN NOT NULL
granted_at      TIMESTAMPTZ
revoked_at      TIMESTAMPTZ
expires_at      TIMESTAMPTZ
ip_address      INET
user_agent      TEXT
app_name        TEXT
app_version     TEXT
collection_method TEXT                         -- 'checkbox'|'popup'|'signup_flow'|'settings'
created_at      TIMESTAMPTZ DEFAULT now()
-- SEM updated_at: Consentimentos são IMUTÁVEIS

UNIQUE(user_id, consent_type)
```

---

### 3. TIMEKEEPER (Domínio KRONOS)

#### `app_timekeeper_projects` - Projetos
```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL REFERENCES auth.users(id)
name            TEXT NOT NULL
description     TEXT
status          TEXT DEFAULT 'active'          -- 'active'|'completed'|'archived'
color           TEXT DEFAULT '#3B82F6'
start_date      DATE
end_date        DATE
budget_hours    INTEGER
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `app_timekeeper_geofences` - Locais/Geofences
```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL REFERENCES auth.users(id)
project_id      UUID REFERENCES app_timekeeper_projects(id)
name            TEXT NOT NULL
latitude        DOUBLE PRECISION NOT NULL
longitude       DOUBLE PRECISION NOT NULL
radius          INTEGER DEFAULT 100            -- metros
color           TEXT DEFAULT '#3B82F6'
address_street  TEXT
address_city    TEXT
address_province TEXT
address_postal  TEXT
location_type   TEXT                           -- 'residential'|'commercial'|'industrial'
project_type    TEXT                           -- 'new_construction'|'renovation'|'maintenance'
status          TEXT DEFAULT 'active'          -- 'active'|'paused'|'archived'
is_favorite     BOOLEAN DEFAULT false
total_entries   INTEGER DEFAULT 0
total_hours     DECIMAL(10,2) DEFAULT 0
last_entry_at   TIMESTAMPTZ
deleted_at      TIMESTAMPTZ
synced_at       TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `app_timekeeper_entries` - Entradas de Tempo
```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL REFERENCES auth.users(id)
geofence_id     UUID REFERENCES app_timekeeper_geofences(id)
location_name   TEXT                           -- Denormalizado para performance
entry_at        TIMESTAMPTZ NOT NULL           -- Clock in
exit_at         TIMESTAMPTZ                    -- Clock out (null = ainda trabalhando)
type            TEXT DEFAULT 'automatic'       -- 'manual'|'automatic'|'voice'
entry_method    TEXT                           -- 'manual'|'geofence'|'qrcode'|'nfc'|'voice'
exit_method     TEXT                           -- 'manual'|'geofence'|'qrcode'|'nfc'|'voice'|'auto_timeout'
manually_edited BOOLEAN DEFAULT false
edit_reason     TEXT
original_entry_at TIMESTAMPTZ
original_exit_at TIMESTAMPTZ
duration_minutes INTEGER                       -- Calculado
pause_minutes   INTEGER DEFAULT 0
notes           TEXT
tags            TEXT[]
device_id       TEXT
synced_at       TIMESTAMPTZ
deleted_at      TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

---

### 4. CALCULATOR (Domínio CEULEN)

#### `consents` - Consentimentos do Calculator
```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL REFERENCES auth.users(id)
consent_type    TEXT NOT NULL                  -- 'voice_training'|'data_analytics'|'marketing'|etc
granted         BOOLEAN NOT NULL DEFAULT false
granted_at      TIMESTAMPTZ
revoked_at      TIMESTAMPTZ
document_version TEXT
ip_address      TEXT
user_agent      TEXT
app_version     TEXT
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(user_id, consent_type)
```

#### `voice_logs` - Logs de Voz (OURO PARA IA)
```sql
id                      UUID PRIMARY KEY
user_id                 UUID REFERENCES auth.users(id)
app_name                TEXT NOT NULL DEFAULT 'calculator'
feature_context         TEXT                   -- 'calculation'|'conversion'|'command'
session_id              UUID

-- Áudio
audio_storage_path      TEXT
audio_duration_ms       INTEGER
audio_sample_rate       INTEGER
audio_format            TEXT                   -- 'wav'|'m4a'|'webm'

-- Transcrição
transcription_raw       TEXT                   -- Texto original do STT
transcription_normalized TEXT                  -- Texto limpo/padronizado
transcription_engine    TEXT                   -- 'whisper'|'google'|'azure'
transcription_confidence DECIMAL(3,2)          -- 0.00-1.00

-- Linguagem
language_detected       VARCHAR(10)            -- 'en'|'fr'|'pt'|'es'
language_confidence     DECIMAL(3,2)
dialect_region          TEXT                   -- 'en-CA'|'pt-BR'|'fr-QC'

-- Intenção
intent_detected         TEXT                   -- 'calculate'|'convert'|'measure'
intent_confidence       DECIMAL(3,2)
intent_fulfilled        BOOLEAN

-- Entidades Extraídas (OURO)
entities                JSONB DEFAULT '{}'     -- {"value": 12, "unit": "feet", "operation": "multiply"}

-- Termos Informais (OURO MÁXIMO)
informal_terms          JSONB DEFAULT '[]'     -- ["two-by-four", "quarter inch"]

-- Qualidade
background_noise_level  TEXT                   -- 'low'|'medium'|'high'
background_noise_type   TEXT                   -- 'construction'|'traffic'|'wind'
speech_clarity          TEXT                   -- 'clear'|'muffled'|'accented'

-- Resultado
was_successful          BOOLEAN
error_type              TEXT
error_message           TEXT

-- Correção do Usuário (SUPERVISÃO HUMANA)
user_corrected          BOOLEAN DEFAULT false
user_correction         TEXT
correction_applied_at   TIMESTAMPTZ

-- Retry
retry_count             INTEGER DEFAULT 0
retry_of_id             UUID REFERENCES voice_logs(id)

-- Device
device_model            TEXT
os                      TEXT
app_version             TEXT
microphone_type         TEXT                   -- 'built-in'|'bluetooth'|'wired'

-- Localização (se permitido)
latitude                DOUBLE PRECISION
longitude               DOUBLE PRECISION

client_timestamp        TIMESTAMPTZ
created_at              TIMESTAMPTZ DEFAULT now()
```

#### `calculations` - Histórico de Cálculos
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES auth.users(id)
calc_type       TEXT NOT NULL                  -- 'length'|'area'|'volume'|'material'|'conversion'|'custom'
calc_subtype    TEXT                           -- 'board_feet'|'roof_pitch'|'concrete_yards'
input_expression TEXT NOT NULL                 -- "12 feet + 6 inches"
input_values    JSONB                          -- {"value1": 12, "unit1": "feet", "value2": 6, "unit2": "inches"}
result_value    DECIMAL(20,6)                  -- 12.5
result_unit     TEXT                           -- 'feet'
result_formatted TEXT                          -- "12 ft 6 in"
input_method    TEXT NOT NULL                  -- 'keypad'|'voice'|'camera'
voice_log_id    UUID REFERENCES voice_logs(id)
template_id     UUID
trade_context   TEXT                           -- FK ref_trades.code
was_successful  BOOLEAN DEFAULT true
was_saved       BOOLEAN DEFAULT false
was_shared      BOOLEAN DEFAULT false
device_id       TEXT
app_version     TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

---

### 5. SHOP (Domínio MERCATOR)

#### `categories` - Categorias de Produtos
```sql
id              UUID PRIMARY KEY
name            VARCHAR(255) NOT NULL
slug            VARCHAR(255) UNIQUE NOT NULL
description     TEXT
image_url       TEXT
sort_order      INTEGER DEFAULT 0
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `app_shop_products` - Produtos
```sql
id              UUID PRIMARY KEY
category_id     UUID REFERENCES categories(id)
name            VARCHAR(255) NOT NULL
slug            VARCHAR(255) UNIQUE NOT NULL
description     TEXT
base_price      NUMERIC(10,2) NOT NULL
compare_at_price NUMERIC(10,2)
images          TEXT[]
sizes           TEXT[]                         -- ['S', 'M', 'L', 'XL']
colors          TEXT[]                         -- ['Black', 'Orange', 'Gray']
target_trades   TEXT[]                         -- ['CARP', 'ELEC'] - Para quem?
is_active       BOOLEAN DEFAULT true
is_featured     BOOLEAN DEFAULT false
is_published    BOOLEAN DEFAULT true
sort_order      INTEGER DEFAULT 0
total_sold      INTEGER DEFAULT 0
total_revenue   NUMERIC(12,2) DEFAULT 0
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `app_shop_product_variants` - Variantes
```sql
id              UUID PRIMARY KEY
product_id      UUID NOT NULL REFERENCES app_shop_products(id)
sku             VARCHAR(100)
size            VARCHAR(50)
color           VARCHAR(50)
price_override  NUMERIC(10,2)
stock_quantity  INTEGER DEFAULT 0
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `app_shop_orders` - Pedidos
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES auth.users(id)
order_number    VARCHAR(50) UNIQUE NOT NULL
status          VARCHAR(50) DEFAULT 'pending'  -- 'pending'|'paid'|'processing'|'shipped'|'delivered'|'cancelled'|'refunded'
subtotal        NUMERIC(10,2) NOT NULL
shipping        NUMERIC(10,2) DEFAULT 0
tax             NUMERIC(10,2) DEFAULT 0
discount        NUMERIC(10,2) DEFAULT 0
total           NUMERIC(10,2) NOT NULL
shipping_address JSONB
stripe_session_id VARCHAR(255)
stripe_payment_intent_id VARCHAR(255)
notes           TEXT
paid_at         TIMESTAMPTZ
shipped_at      TIMESTAMPTZ
delivered_at    TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `app_shop_order_items` - Itens do Pedido
```sql
id              UUID PRIMARY KEY
order_id        UUID NOT NULL REFERENCES app_shop_orders(id)
product_id      UUID REFERENCES app_shop_products(id)
variant_id      UUID REFERENCES app_shop_product_variants(id)
product_name    VARCHAR(255) NOT NULL
product_image   TEXT
size            VARCHAR(50)
color           VARCHAR(50)
quantity        INTEGER NOT NULL DEFAULT 1
unit_price      NUMERIC(10,2) NOT NULL
total_price     NUMERIC(10,2) NOT NULL
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `app_shop_carts` - Carrinhos
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES auth.users(id)
items           JSONB NOT NULL DEFAULT '[]'
subtotal        NUMERIC(10,2) DEFAULT 0
shipping        NUMERIC(10,2) DEFAULT 0
total           NUMERIC(10,2) DEFAULT 0
created_at      TIMESTAMPTZ DEFAULT now()
expires_at      TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
```

---

### 6. BILLING (Pagamentos)

#### `billing_products` - Produtos de Assinatura
```sql
id              UUID PRIMARY KEY
app             TEXT NOT NULL                  -- 'calculator'|'timekeeper'|'shop'
name            TEXT NOT NULL
description     TEXT
stripe_price_id TEXT NOT NULL
stripe_product_id TEXT
price_amount    INTEGER                        -- Centavos
price_currency  VARCHAR(3) DEFAULT 'CAD'
billing_interval TEXT                          -- 'month'|'year'
features        JSONB DEFAULT '[]'
limits          JSONB DEFAULT '{}'
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `billing_subscriptions` - Assinaturas Ativas
```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL REFERENCES auth.users(id)
app_name        TEXT NOT NULL                  -- 'calculator'|'timekeeper'
stripe_customer_id TEXT
stripe_subscription_id TEXT UNIQUE
stripe_price_id TEXT
status          TEXT NOT NULL DEFAULT 'inactive' -- 'inactive'|'trialing'|'active'|'past_due'|'canceled'
current_period_start TIMESTAMPTZ
current_period_end TIMESTAMPTZ
trial_start     TIMESTAMPTZ
trial_end       TIMESTAMPTZ
cancel_at_period_end BOOLEAN DEFAULT false
canceled_at     TIMESTAMPTZ
cancellation_reason TEXT
customer_email  TEXT
customer_name   TEXT
customer_phone  TEXT
has_payment_method BOOLEAN DEFAULT false

-- Endereço de Cobrança
billing_address_line1 TEXT
billing_address_line2 TEXT
billing_address_city TEXT
billing_address_state TEXT
billing_address_postal_code TEXT
billing_address_country TEXT

created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(user_id, app_name)
```

#### `payment_history` - Histórico de Pagamentos
```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL REFERENCES auth.users(id)
app_name        TEXT NOT NULL
stripe_customer_id TEXT
stripe_subscription_id TEXT
stripe_invoice_id TEXT
stripe_payment_intent_id TEXT
amount          INTEGER NOT NULL               -- Centavos
currency        VARCHAR(3) DEFAULT 'CAD'
status          TEXT NOT NULL                  -- 'succeeded'|'pending'|'failed'

-- Snapshot do endereço no momento do pagamento
billing_address_line1 TEXT
billing_address_line2 TEXT
billing_address_city TEXT
billing_address_state TEXT
billing_address_postal_code TEXT
billing_address_country TEXT

paid_at         TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `checkout_codes` - Códigos Temporários para Checkout
```sql
code            TEXT PRIMARY KEY               -- 8 chars, sem 0/O/1/I/L
user_id         UUID NOT NULL REFERENCES auth.users(id)
email           TEXT NOT NULL
app             TEXT NOT NULL DEFAULT 'calculator'
redirect_url    TEXT                           -- Deep link para retorno
expires_at      TIMESTAMPTZ NOT NULL           -- TTL 60 segundos
used            BOOLEAN DEFAULT FALSE
created_at      TIMESTAMPTZ DEFAULT now()
```

---

### 7. DEBUG (Saúde do Sistema)

#### `log_errors` - Log de Erros
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES auth.users(id)
error_type      TEXT NOT NULL                  -- 'crash'|'network'|'sync'|'auth'|'validation'
error_message   TEXT NOT NULL
error_stack     TEXT
error_context   JSONB                          -- Contexto adicional
app_name        TEXT                           -- 'calculator'|'timekeeper'|'shop'
screen_name     TEXT                           -- Onde ocorreu
action_attempted TEXT                          -- O que o usuário tentou fazer
app_version     TEXT
os              TEXT                           -- 'ios'|'android'
os_version      TEXT
device_model    TEXT
network_type    TEXT                           -- 'wifi'|'cellular'|'offline'
occurred_at     TIMESTAMPTZ NOT NULL
synced_at       TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `log_events` - Eventos do App
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES auth.users(id)
event_type      TEXT NOT NULL                  -- 'login'|'logout'|'signup'|'feature_used'|etc
event_data      JSONB
app_name        TEXT
app_version     TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `log_locations` - Auditoria GPS
```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL REFERENCES auth.users(id)
session_id      UUID
event_type      TEXT NOT NULL                  -- 'entry'|'exit'|'heartbeat'|'dispute'|'correction'
location_id     UUID
location_name   TEXT
latitude        DOUBLE PRECISION NOT NULL
longitude       DOUBLE PRECISION NOT NULL
accuracy        DOUBLE PRECISION               -- Precisão GPS em metros
altitude        DOUBLE PRECISION
heading         DOUBLE PRECISION
speed           DOUBLE PRECISION
distance_from_center DOUBLE PRECISION
occurred_at     TIMESTAMPTZ NOT NULL
synced_at       TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `log_voice` - Log de Interações de Voz
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES auth.users(id)
session_id      UUID
audio_duration_ms INTEGER
was_successful  BOOLEAN
error_type      TEXT
language_detected TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `app_logs` - Logs Gerais da Aplicação
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES auth.users(id)
level           TEXT NOT NULL                  -- 'debug'|'info'|'warn'|'error'
module          TEXT NOT NULL                  -- 'auth'|'sync'|'payment'|'voice'
action          TEXT NOT NULL
message         TEXT
context         JSONB
device_info     JSONB
ip              TEXT
user_agent      TEXT
duration_ms     INTEGER
success         BOOLEAN
app_name        TEXT
app_version     TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

---

### 8. ANALYTICS (Métricas Agregadas)

#### `agg_user_daily` - Métricas Diárias por Usuário (VIEW: `analytics_daily`)
```sql
date            DATE NOT NULL
user_id         UUID NOT NULL REFERENCES auth.users(id)

-- Sessões Timekeeper
sessions_count  INTEGER DEFAULT 0
total_minutes   INTEGER DEFAULT 0
manual_entries  INTEGER DEFAULT 0
auto_entries    INTEGER DEFAULT 0
locations_created INTEGER DEFAULT 0
locations_deleted INTEGER DEFAULT 0

-- Uso do App
app_opens       INTEGER DEFAULT 0
app_foreground_seconds INTEGER DEFAULT 0
notifications_shown INTEGER DEFAULT 0
notifications_actioned INTEGER DEFAULT 0
features_used   JSONB DEFAULT '[]'

-- Calculator
calculations_count INTEGER DEFAULT 0
calculations_voice INTEGER DEFAULT 0
voice_success_rate DECIMAL(3,2)

-- Debug
errors_count    INTEGER DEFAULT 0
sync_attempts   INTEGER DEFAULT 0
sync_failures   INTEGER DEFAULT 0
geofence_triggers INTEGER DEFAULT 0
geofence_accuracy_avg DOUBLE PRECISION

-- Device
app_version     TEXT
os              TEXT
device_model    TEXT

synced_at       TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()

PRIMARY KEY (date, user_id)
```

#### `agg_platform_daily` - Métricas Diárias da Plataforma
```sql
date            DATE NOT NULL PRIMARY KEY
total_users     INTEGER DEFAULT 0
active_users    INTEGER DEFAULT 0              -- Usuários com sessão no dia
new_signups     INTEGER DEFAULT 0
total_sessions  INTEGER DEFAULT 0
total_hours     DECIMAL(10,2) DEFAULT 0
total_calculations INTEGER DEFAULT 0
voice_calculations INTEGER DEFAULT 0
errors_count    INTEGER DEFAULT 0
revenue_cents   INTEGER DEFAULT 0
created_at      TIMESTAMPTZ DEFAULT now()
```

#### `agg_trade_weekly` - Métricas Semanais por Ofício
```sql
week_start      DATE NOT NULL                  -- Segunda-feira da semana
trade           TEXT NOT NULL                  -- FK ref_trades.code
active_users    INTEGER DEFAULT 0
total_hours     DECIMAL(10,2) DEFAULT 0
avg_hours_per_user DECIMAL(5,2) DEFAULT 0
calculations_count INTEGER DEFAULT 0
voice_adoption_rate DECIMAL(3,2)               -- % usando voice
created_at      TIMESTAMPTZ DEFAULT now()

PRIMARY KEY (week_start, trade)
```

---

### 9. INTELLIGENCE (Padrões de IA)

#### `int_voice_patterns` - Dicionário de Padrões de Linguagem
```sql
id              UUID PRIMARY KEY
pattern_type    TEXT NOT NULL                  -- 'term'|'phrase'|'pronunciation'|'intent'|'slang'
raw_form        TEXT NOT NULL                  -- "two-by-four"
normalized_form TEXT                           -- "2x4 lumber"
language        VARCHAR(10) NOT NULL           -- 'en'|'fr'|'pt'
dialect_region  TEXT                           -- 'en-CA'|'fr-QC'
trade_context   TEXT                           -- 'CARP'|'ELEC' - Qual ofício usa?
occurrence_count INTEGER DEFAULT 1
unique_users_count INTEGER DEFAULT 1
confidence_avg  NUMERIC(3,2)
variations      JSONB DEFAULT '[]'             -- ["two by four", "2 by 4", "2x4"]
example_contexts JSONB DEFAULT '[]'            -- ["I need three two-by-fours"]
is_validated    BOOLEAN DEFAULT false          -- Humano validou?
validated_by    TEXT
validated_at    TIMESTAMPTZ
first_seen_at   TIMESTAMPTZ DEFAULT now()
last_seen_at    TIMESTAMPTZ DEFAULT now()
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()

UNIQUE(pattern_type, raw_form, language)
```

#### `int_behavior_patterns` - Padrões de Comportamento
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES auth.users(id)
pattern_type    TEXT NOT NULL                  -- 'work_schedule'|'app_usage'|'churn_risk'
pattern_data    JSONB                          -- Dados do padrão detectado
confidence      DECIMAL(3,2)                   -- 0.00-1.00
detected_at     TIMESTAMPTZ DEFAULT now()
expires_at      TIMESTAMPTZ                    -- Padrão tem validade?
created_at      TIMESTAMPTZ DEFAULT now()
```

---

### 10. ADMIN (Administração)

#### `admin_users` - Administradores
```sql
id              UUID PRIMARY KEY
user_id         UUID UNIQUE REFERENCES auth.users(id)
email           TEXT NOT NULL
name            TEXT NOT NULL
role            TEXT DEFAULT 'admin'           -- 'super_admin'|'admin'|'support'|'analyst'
permissions     JSONB DEFAULT '[]'
is_active       BOOLEAN DEFAULT true
approved        BOOLEAN DEFAULT false
approved_at     TIMESTAMPTZ
approved_by     UUID REFERENCES admin_users(id)
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

#### `admin_logs` - Log de Ações Administrativas
```sql
id              UUID PRIMARY KEY
admin_id        UUID REFERENCES admin_users(id)
action          TEXT NOT NULL                  -- 'user_suspended'|'refund_issued'|'product_updated'
entity_type     TEXT                           -- 'user'|'order'|'product'
entity_id       TEXT
details         JSONB
ip_address      TEXT
user_agent      TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

---

### 11. REWARDS (Programa Blades)

#### `blades_transactions` - Ledger de Recompensas
```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL REFERENCES auth.users(id)
amount          INTEGER NOT NULL               -- Positivo=earn, Negativo=redeem
type            TEXT NOT NULL                  -- 'earn'|'redeem'|'bonus'|'adjustment'|'referral'
reason          TEXT
order_id        UUID REFERENCES app_shop_orders(id)
product_id      UUID REFERENCES app_shop_products(id)
metadata        JSONB
created_at      TIMESTAMPTZ DEFAULT now()
```

---

### 12. ARGUS (Conversas do Analytics)

#### `argus_conversations` - Histórico de Conversas
```sql
id              UUID PRIMARY KEY
user_id         UUID NOT NULL REFERENCES auth.users(id)
title           TEXT                           -- Auto-gerado ou editável
messages        JSONB NOT NULL DEFAULT '[]'    -- [{role: "user"|"assistant", content: "...", data: {...}}]
starred         BOOLEAN DEFAULT false
archived        BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

---

## VIEWS SQL PARA MÉTRICAS

### v_churn_risk - Score de Risco de Churn
```sql
CREATE VIEW v_churn_risk AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.trade,
  p.province,
  EXTRACT(days FROM now() - p.last_active_at) as days_inactive,
  bs.status as subscription_status,
  bs.trial_end,
  bs.has_payment_method,
  CASE
    WHEN EXTRACT(days FROM now() - p.last_active_at) > 14 THEN 'high'
    WHEN EXTRACT(days FROM now() - p.last_active_at) > 7 THEN 'medium'
    ELSE 'low'
  END as churn_risk,
  CASE
    WHEN bs.status = 'trialing' AND bs.trial_end < now() + interval '7 days' AND NOT bs.has_payment_method THEN true
    ELSE false
  END as trial_expiring_soon
FROM core_profiles p
LEFT JOIN billing_subscriptions bs ON p.id = bs.user_id;
```

### v_user_health - Score de Saúde do Usuário
```sql
CREATE VIEW v_user_health AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.trade,
  COUNT(DISTINCT c.id) as calculations_30d,
  COUNT(DISTINCT v.id) as voice_uses_30d,
  COUNT(DISTINCT te.id) as timekeeper_entries_30d,
  (
    COALESCE(COUNT(DISTINCT c.id), 0) +
    COALESCE(COUNT(DISTINCT v.id), 0) * 2 +
    COALESCE(COUNT(DISTINCT te.id), 0)
  ) as health_score
FROM core_profiles p
LEFT JOIN calculations c ON p.id = c.user_id AND c.created_at > now() - interval '30 days'
LEFT JOIN voice_logs v ON p.id = v.user_id AND v.created_at > now() - interval '30 days'
LEFT JOIN app_timekeeper_entries te ON p.id = te.user_id AND te.created_at > now() - interval '30 days'
GROUP BY p.id, p.email, p.full_name, p.trade;
```

### v_revenue_by_province - Receita por Província
```sql
CREATE VIEW v_revenue_by_province AS
SELECT
  p.province,
  rp.name_en as province_name,
  COUNT(DISTINCT ph.user_id) as paying_users,
  SUM(ph.amount) / 100.0 as total_revenue_cad,
  AVG(ph.amount) / 100.0 as avg_payment_cad
FROM payment_history ph
JOIN core_profiles p ON ph.user_id = p.id
LEFT JOIN ref_provinces rp ON p.province = rp.code
WHERE ph.status = 'succeeded'
GROUP BY p.province, rp.name_en
ORDER BY total_revenue_cad DESC;
```

### v_voice_adoption_by_trade - Adoção de Voice por Ofício
```sql
CREATE VIEW v_voice_adoption_by_trade AS
SELECT
  p.trade,
  rt.name_en as trade_name,
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT v.user_id) as voice_users,
  COUNT(v.id) as total_voice_logs,
  ROUND(COUNT(DISTINCT v.user_id)::numeric / NULLIF(COUNT(DISTINCT p.id), 0) * 100, 2) as adoption_rate_pct
FROM core_profiles p
LEFT JOIN ref_trades rt ON p.trade = rt.code
LEFT JOIN voice_logs v ON p.id = v.user_id AND v.created_at > now() - interval '30 days'
WHERE p.trade IS NOT NULL
GROUP BY p.trade, rt.name_en
ORDER BY adoption_rate_pct DESC;
```

---

## TELETRAAN9 SYSTEM PROMPT

```markdown
# IDENTITY

You are Teletraan9, the AI engine powering ARGUS - OnSite Analytics Intelligence System.
You are the "eyes" of Blue (the orchestrator) on the Supabase database.
You help Cristony and the team understand data through natural language queries.

# CAPABILITIES

You have three layers of intelligence:

1. **VISION** (NOW): Real-time metrics, active sessions, recent errors
2. **ANALYSIS** (WHY): Cross-domain queries, cohort analysis, feature adoption
3. **PRE-COGNITION** (WHAT'S NEXT): Churn prediction, growth forecast, anomaly detection

# DATABASE SCHEMA

You have access to 38 tables across 12 domains:

## REFERENCE (3)
- ref_trades: code, name_en, category, common_tools[], common_slang
- ref_provinces: code, name_en, timezone, min_wage, overtime_threshold
- ref_units: code, symbol, name_en, unit_type, system, spoken_variations[]

## IDENTITY (3)
- core_profiles: id, email, full_name, trade, province, language_primary, last_active_at
- core_devices: user_id, platform, model, app_version, is_primary
- core_consents: user_id, consent_type, granted, granted_at

## TIMEKEEPER (3)
- app_timekeeper_projects: user_id, name, status
- app_timekeeper_geofences: user_id, name, latitude, longitude, radius, total_hours
- app_timekeeper_entries: user_id, geofence_id, entry_at, exit_at, type, duration_minutes

## CALCULATOR (3)
- consents: user_id, consent_type, granted
- voice_logs: user_id, transcription_raw, intent_detected, was_successful, language_detected, entities, informal_terms
- calculations: user_id, calc_type, input_expression, result_value, input_method

## SHOP (6)
- categories: name, slug, is_active
- app_shop_products: category_id, name, base_price, target_trades[], total_sold
- app_shop_product_variants: product_id, sku, size, color, stock_quantity
- app_shop_orders: user_id, order_number, status, total, paid_at
- app_shop_order_items: order_id, product_id, quantity, unit_price
- app_shop_carts: user_id, items, total

## BILLING (4)
- billing_products: app, name, stripe_price_id, price_amount
- billing_subscriptions: user_id, app_name, status, trial_end, has_payment_method
- payment_history: user_id, app_name, amount, status, paid_at
- checkout_codes: code, user_id, app, expires_at, used

## DEBUG (5)
- log_errors: user_id, error_type, error_message, app_version, occurred_at
- log_events: user_id, event_type, event_data
- log_locations: user_id, event_type, latitude, longitude, accuracy
- log_voice: user_id, audio_duration_ms, was_successful
- app_logs: user_id, level, module, action, message

## ANALYTICS (3)
- agg_user_daily: date, user_id, sessions_count, total_minutes, calculations_count, errors_count
- agg_platform_daily: date, active_users, total_sessions, revenue_cents
- agg_trade_weekly: week_start, trade, active_users, avg_hours_per_user

## INTELLIGENCE (2)
- int_voice_patterns: pattern_type, raw_form, normalized_form, language, trade_context, occurrence_count
- int_behavior_patterns: user_id, pattern_type, confidence

## ADMIN (2)
- admin_users: user_id, email, role, is_active
- admin_logs: admin_id, action, entity_type, entity_id

## REWARDS (1)
- blades_transactions: user_id, amount, type, reason

## VIEWS
- v_churn_risk: id, email, days_inactive, churn_risk, trial_expiring_soon
- v_user_health: id, email, health_score, calculations_30d, voice_uses_30d
- v_revenue_by_province: province, paying_users, total_revenue_cad
- v_voice_adoption_by_trade: trade, total_users, voice_users, adoption_rate_pct

# HOW TO RESPOND

1. **Always show your work**: Include the SQL query you would use
2. **Visualize when possible**: Suggest charts, tables, or metrics
3. **Be actionable**: Don't just show data, give insights
4. **Cross-reference**: Connect data from multiple domains when relevant
5. **Predict**: When asked about trends, project forward

# EXAMPLE QUERIES

**"How many paying users do we have?"**
```sql
SELECT COUNT(DISTINCT user_id) as paying_users
FROM billing_subscriptions
WHERE status = 'active';
```

**"Which trade uses voice the most?"**
```sql
SELECT p.trade, COUNT(v.id) as voice_uses
FROM core_profiles p
JOIN voice_logs v ON p.id = v.user_id
WHERE v.was_successful = true
GROUP BY p.trade
ORDER BY voice_uses DESC
LIMIT 10;
```

**"Who might churn this week?"**
```sql
SELECT * FROM v_churn_risk
WHERE churn_risk = 'high' OR trial_expiring_soon = true
ORDER BY days_inactive DESC;
```

# RESPONSE FORMAT

Always structure responses with:
1. **Answer** - Direct answer to the question
2. **Data** - Table/chart/metric if applicable
3. **Query** - SQL used (for transparency)
4. **Insight** - What this means for the business
5. **Action** - What should be done about it
```

---

## INTERFACE: CHAT MINIMALISTA

### Layout
```
┌─────────────┬─────────────────────────────────────────────────────┐
│  SIDEBAR    │                    CHAT AREA                        │
│             │                                                     │
│ 🔶 ARGUS    │  Olá, o que quer saber hoje?                       │
│             │                                                     │
│ + New Chat  │  ┌─────────────────────────────────────────────┐   │
│             │  │ Resposta com TABELA + botões de ação        │   │
│ HISTÓRICO   │  │                                             │   │
│ 📄 Churn    │  │ [📥 PDF] [📊 Excel] [📈 Chart] [🔗 Share]   │   │
│ 📄 Revenue  │  └─────────────────────────────────────────────┘   │
│             │                                                     │
│ ⚙️ Settings │  ┌─────────────────────────────────────────────┐   │
│ 👤 User     │  │ 💬 Digite sua pergunta...            [Send] │   │
│ 🚪 Logout   │  └─────────────────────────────────────────────┘   │
└─────────────┴─────────────────────────────────────────────────────┘
```

### Comandos Rápidos
```
/report weekly     → Relatório semanal
/report monthly    → Relatório mensal
/churn             → Usuários em risco
/revenue           → MRR atual e projetado
/errors today      → Erros das últimas 24h
/export pdf        → Exporta conversa como PDF
/sql               → Mostra última query
```

### Plugins de Output
| Plugin | Ícone | Ação |
|--------|-------|------|
| PDF | 📥 | Gera relatório PDF |
| Excel | 📊 | Exporta para .xlsx |
| Chart | 📈 | Expande visualização |
| Share | 🔗 | Copia link |
| SQL | 💻 | Mostra query |
| Refresh | 🔄 | Re-executa query |

---

## INTEGRAÇÃO BLUE ↔ ARGUS

```
┌─────────────────────────────────────────────────────────────────┐
│                         BLUE (Orchestrator)                     │
│                              ↕                                  │
│     ┌─────────────────────────────────────────────────────┐     │
│     │                    ARGUS                            │     │
│     │  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐  │     │
│     │  │ VISÃO   │  │ ANÁLISE │  │ PRÉ-COGNIÇÃO        │  │     │
│     │  │ (NOW)   │  │ (WHY)   │  │ (WHAT'S NEXT)       │  │     │
│     │  └────┬────┘  └────┬────┘  └──────────┬──────────┘  │     │
│     │       └────────────┴──────────────────┘             │     │
│     │                    ↓                                │     │
│     │              Teletraan9 AI                          │     │
│     │         (Natural Language Interface)                │     │
│     └─────────────────────────────────────────────────────┘     │
│                              ↕                                  │
│                     38 Tabelas Supabase                         │
└─────────────────────────────────────────────────────────────────┘
```

### API para Blue
```typescript
// Blue pergunta ao ARGUS
const insights = await argus.ask("Quais usuários estão em risco de churn?");
const forecast = await argus.predict("MRR para os próximos 3 meses");
const anomaly = await argus.detect("Padrões anormais nas últimas 24h");

// ARGUS responde com dados estruturados
{
  type: "churn_risk",
  users: [...],
  confidence: 0.85,
  recommendation: "Enviar email de re-engajamento para 12 usuários"
}
```

---

## IMPLEMENTAÇÃO NEXT.JS

### Estrutura de Arquivos

```
onsite-analytics/
├── app/
│   ├── chat/
│   │   ├── layout.tsx              # Layout com ChatSidebar
│   │   ├── page.tsx                # Nova conversa
│   │   └── [id]/page.tsx           # Conversa existente
│   └── api/
│       └── ai/
│           └── chat/route.ts       # API endpoint Teletraan9
├── components/
│   └── chat/
│       ├── index.ts                # Exports
│       ├── chat-sidebar.tsx        # Sidebar de navegação
│       ├── chat-input.tsx          # Input com comandos
│       ├── message-list.tsx        # Lista de mensagens
│       └── response-card.tsx       # Cards de visualização
├── lib/
│   ├── supabase/
│   │   ├── schema.ts               # Types das 38 tabelas
│   │   ├── conversations.ts        # CRUD client-side
│   │   └── conversations-server.ts # CRUD server-side
│   └── export/
│       └── index.ts                # PDF, Excel, CSV export
└── ARGUS.md                        # Esta documentação
```

---

### TIPOS TYPESCRIPT (lib/supabase/schema.ts)

#### Mensagens e Visualizações

```typescript
// Mensagem do chat
interface ArgusMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  visualization?: ArgusVisualization | null;
  sql?: string | null;
}

// Tipos de visualização suportados
interface ArgusVisualization {
  type: 'chart' | 'table' | 'metric' | 'alert' | 'user_card';
  chartType?: 'line' | 'bar' | 'pie';
  title?: string;
  data?: unknown[];
  columns?: string[];
  value?: string | number;
  items?: string[];
  downloadable?: boolean;
}

// Conversa persistida
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

#### Views Tipadas

```typescript
interface VChurnRisk {
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

interface VUserHealth {
  id: string;
  email: string;
  full_name: string | null;
  trade: string | null;
  calculations_30d: number;
  voice_uses_30d: number;
  timekeeper_entries_30d: number;
  health_score: number;
}

interface VRevenueByProvince {
  province: string | null;
  province_name: string | null;
  paying_users: number;
  total_revenue_cad: number;
  avg_payment_cad: number;
}

interface VVoiceAdoptionByTrade {
  trade: string;
  trade_name: string | null;
  total_users: number;
  voice_users: number;
  total_voice_logs: number;
  adoption_rate_pct: number;
}
```

#### Mapeamento de Nomes de Tabelas

```typescript
const TABLE_NAMES = {
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

// Legacy aliases
type Profile = CoreProfile;
type Location = TimekeeperGeofence;
type TimeEntry = TimekeeperEntry;
type ErrorLog = LogError;
type LocationAudit = LogLocation;
type AnalyticsDaily = AggUserDaily;
```

---

### FUNÇÕES DE CONVERSAÇÃO (lib/supabase/conversations.ts)

#### Client-Side Functions

```typescript
// Listar conversas
async function getConversations(): Promise<ArgusConversation[]>

// Conversas favoritas
async function getStarredConversations(): Promise<ArgusConversation[]>

// Buscar conversa por ID
async function getConversation(id: string): Promise<ArgusConversation | null>

// Criar nova conversa
async function createConversation(
  userId: string,
  initialMessage?: string
): Promise<ArgusConversation | null>

// Adicionar mensagem
async function addMessage(
  conversationId: string,
  message: ArgusMessage
): Promise<boolean>

// Atualizar título
async function updateTitle(
  conversationId: string,
  title: string
): Promise<boolean>

// Favoritar/desfavoritar
async function toggleStar(
  conversationId: string,
  starred: boolean
): Promise<boolean>

// Arquivar conversa
async function archiveConversation(
  conversationId: string
): Promise<boolean>

// Deletar conversa
async function deleteConversation(
  conversationId: string
): Promise<boolean>

// Buscar por conteúdo
async function searchConversations(
  query: string
): Promise<ArgusConversation[]>

// Estatísticas
async function getConversationStats(): Promise<{
  total: number;
  starred: number;
  thisWeek: number;
}>

// Gerar título automaticamente
function generateTitle(message: string): string
```

#### Server-Side Functions (conversations-server.ts)

```typescript
// Adicionar mensagem com resposta AI (API routes)
async function addMessageWithResponse(
  conversationId: string,
  userMessage: ArgusMessage,
  aiResponse: ArgusMessage
): Promise<boolean>

// Criar conversa com primeira troca (API routes)
async function createConversationWithResponse(
  userId: string,
  userMessage: ArgusMessage,
  aiResponse: ArgusMessage
): Promise<ArgusConversation | null>
```

---

### COMPONENTES REACT (components/chat/)

#### ChatSidebar

```typescript
interface ChatSidebarProps {
  onNewChat: () => void;
}

// Funcionalidades:
// - Logo ARGUS
// - Botão "New Chat"
// - Campo de busca
// - Seção "Starred" (conversas favoritas)
// - Seção "Recent" (histórico)
// - Menu de contexto (star, rename, archive, delete)
// - Links: Settings, Logout
```

#### ChatInput

```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

// Quick Commands suportados:
const QUICK_COMMANDS = [
  { command: '/report weekly', description: 'Generate weekly report' },
  { command: '/report monthly', description: 'Generate monthly report' },
  { command: '/churn', description: 'Show users at risk of churning' },
  { command: '/revenue', description: 'Show MRR and revenue metrics' },
  { command: '/errors today', description: 'Show errors from last 24h' },
  { command: '/sql', description: 'Show last SQL query used' },
  { command: '/export pdf', description: 'Export conversation as PDF' },
];

// Funcionalidades:
// - Textarea auto-resize (max 200px)
// - Dropdown de comandos (quando digita /)
// - Navegação por teclado (↑/↓/Tab/Enter/Esc)
// - Enter para enviar, Shift+Enter para nova linha
```

#### MessageList

```typescript
interface MessageListProps {
  messages: ArgusMessage[];
  isTyping: boolean;
  onExportPDF?: (messageIndex: number) => void;
  onExportExcel?: (messageIndex: number) => void;
}

// Funcionalidades:
// - Auto-scroll para última mensagem
// - Avatar diferenciado (user/assistant)
// - Indicador de "typing..."
// - Tela de boas-vindas quando vazio
// - Sugestões de perguntas iniciais
```

#### ResponseCard

```typescript
interface ResponseCardProps {
  visualization: ArgusVisualization;
  sql?: string;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onRefresh?: () => void;
}

// Tipos de renderização:
// - chart: SimpleLineChart ou SimpleBarChart
// - table: Tabela com colunas dinâmicas (max 10 rows)
// - metric: Valor grande + indicador de mudança
// - alert: Lista de alertas amarelos
// - user_card: Card de perfil de usuário

// Funcionalidades:
// - Expandir/colapsar
// - Mostrar/copiar SQL
// - Botões de export (PDF, Excel)
// - Refresh de dados
```

---

### API ENDPOINT (app/api/ai/chat/route.ts)

#### Request/Response

```typescript
// POST /api/ai/chat

// Request Body
interface ChatRequest {
  message: string;
  history?: ArgusMessage[];
  conversationId?: string;
}

// Response
interface ChatResponse {
  message: string;
  visualization?: ArgusVisualization;
  sql?: string;
  conversationId: string;
}
```

#### Detecção de Intenção

```typescript
interface DetectedIntent {
  sphere: 'vision' | 'analysis' | 'precognition';
  topic: 'users' | 'revenue' | 'errors' | 'voice' | 'timekeeper' | 'shop' | 'general';
  entities: {
    timeframe?: string;    // 'today', 'week', 'month', '30d'
    province?: string;     // 'ON', 'BC', 'QC'
    trade?: string;        // 'CARP', 'ELEC', 'PLUM'
    userId?: string;
    refCode?: string;      // 'REF-XXXXX'
  };
}
```

#### Comandos Processados

```typescript
// Comandos detectados no message:
'/churn'           → getChurnRisk()
'/revenue'         → getRevenueByProvince()
'/errors'          → getRecentErrors() ou getErrorsByType()
'/report weekly'   → Relatório semanal agregado
'/report monthly'  → Relatório mensal agregado

// Ref # Code Detection
'REF-XXXXX'        → lookupUserByRefCode(code)
'who is REF-'      → lookupUserByRefCode(code)
'lookup REF-'      → lookupUserByRefCode(code)
```

#### Database Helpers

```typescript
// Métricas gerais
async function getMetrics(): Promise<{
  activeUsers: number;
  totalRevenue: number;
  errorsToday: number;
  voiceUsage: number;
}>

// Lookup de usuário por Ref Code
async function lookupUserByRefCode(refCode: string): Promise<{
  found: boolean;
  user?: CoreProfile;
  subscription?: BillingSubscription;
  stats?: UserStats;
}>

// Dados de churn
async function getChurnRisk(): Promise<VChurnRisk[]>

// Revenue por província
async function getRevenueByProvince(): Promise<VRevenueByProvince[]>

// Erros recentes
async function getRecentErrors(hours: number): Promise<LogError[]>

// Erros agrupados por tipo
async function getErrorsByType(): Promise<ErrorTypeCount[]>

// Tendência de sessões
async function getSessionsTrend(days: number): Promise<SessionTrend[]>

// Análise de cohort
async function getCohortAnalysis(): Promise<CohortData[]>

// Adoção de voz
async function getVoiceAdoption(): Promise<VVoiceAdoptionByTrade[]>
```

---

### EXPORT FUNCTIONS (lib/export/index.ts)

#### PDF Export

```typescript
async function exportConversationToPDF(
  title: string,
  messages: ArgusMessage[]
): Promise<void>

// Funcionalidades:
// - Header com logo ARGUS
// - Título e data do relatório
// - Renderiza cada tipo de visualização:
//   - metric: Valor grande com indicador
//   - table: Tabela com max 15 rows
//   - chart: Informações do gráfico
//   - alert: Lista de alertas
//   - user_card: Card de perfil
// - Bloco SQL quando presente
// - Footer com paginação
// - Cores dark mode (zinc palette)
```

#### Excel Export

```typescript
async function exportTableToExcel(
  title: string,
  data: Record<string, unknown>[]
): Promise<void>

// Funcionalidades:
// - Sheet "Data" com dados
// - Sheet "Info" com metadata
// - Colunas auto-dimensionadas
// - Headers em destaque
```

#### CSV Export

```typescript
async function exportToCSV(
  title: string,
  data: Record<string, unknown>[]
): Promise<void>

// Funcionalidades:
// - Escape de aspas e vírgulas
// - Download direto no browser
```

---

### FLUXO DE DADOS

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERACTION                               │
│                                                                          │
│  [ChatInput] ──message──→ [ConversationPage] ──POST──→ [/api/ai/chat]   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API PROCESSING                                 │
│                                                                          │
│  1. Parse message & detect intent                                        │
│  2. Check for commands (/churn, /revenue, /errors)                      │
│  3. Check for Ref # codes (REF-XXXXX)                                   │
│  4. Build context from database helpers                                  │
│  5. Call OpenAI GPT-4o with Teletraan9 system prompt                    │
│  6. Parse response for visualization data                                │
│  7. Return { message, visualization, sql }                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           UI RENDERING                                   │
│                                                                          │
│  [MessageList] renders:                                                  │
│    ├── User message (right-aligned, blue bg)                            │
│    └── Assistant message (left-aligned)                                 │
│         └── [ResponseCard] if visualization present                     │
│              ├── Chart (line/bar via Recharts)                          │
│              ├── Table (dynamic columns)                                │
│              ├── Metric (big number + change)                           │
│              ├── Alert (yellow warning list)                            │
│              └── UserCard (profile display)                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           PERSISTENCE                                    │
│                                                                          │
│  [conversations.ts] → Supabase (argus_conversations table)              │
│                                                                          │
│  Messages stored as JSONB array with structure:                          │
│  [{                                                                      │
│    role: 'user' | 'assistant',                                          │
│    content: string,                                                      │
│    timestamp: ISO string,                                                │
│    visualization?: ArgusVisualization,                                   │
│    sql?: string                                                          │
│  }]                                                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### DEPENDÊNCIAS

```json
{
  "dependencies": {
    "jspdf": "^4.0.0",           // PDF generation
    "xlsx": "^0.18.5",            // Excel export
    "recharts": "^2.12.2",        // Charts
    "openai": "^6.15.0",          // GPT-4o API
    "@supabase/supabase-js": "^2.49.2",
    "lucide-react": "^0.344.0"    // Icons
  }
}
```

---

### ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...
```

---

### SEGURANÇA

1. **RLS (Row Level Security)**
   - Todas queries filtradas por `user_id`
   - Políticas em `argus_conversations`

2. **Input Validation**
   - Mensagens sanitizadas antes de enviar para OpenAI
   - Ref codes validados com regex

3. **Rate Limiting**
   - Implementado a nível de API

4. **Audit Logs**
   - Queries logadas em `admin_logs`

---

*Última atualização: 2026-01-19*
*Mantido por: Blueprint (Blue)*
