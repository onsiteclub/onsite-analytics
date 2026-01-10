# 🔖 Sistema de Referência (Ref #)

## Documentação do Código de Referência para Relatórios PDF

> Sistema de identificação única para rastreamento de relatórios exportados.  
> Implementado em Janeiro 2025

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Formato do Código](#2-formato-do-código)
3. [Códigos de Região](#3-códigos-de-região)
4. [Como Decodificar](#4-como-decodificar)
5. [Busca no Supabase](#5-busca-no-supabase)
6. [Integração com Teletraan9](#6-integração-com-teletraan9)
7. [Implementação Técnica](#7-implementação-técnica)

---

## 1. Visão Geral

### O que é o Ref #?

O **Ref #** (Reference Number) é um código único gerado em cada relatório PDF exportado pelo app OnSite Timekeeper. Ele permite:

1. **Identificar o usuário** - Mesmo sem acesso ao email
2. **Verificar autenticidade** - Confirmar que o relatório é legítimo
3. **Suporte eficiente** - Localizar rapidamente os dados do cliente
4. **Auditoria** - Rastrear quando e por quem o relatório foi gerado

### Por que não usar o User ID diretamente?

- **Privacidade**: O UUID completo é muito longo e expõe mais informação que o necessário
- **Praticidade**: O Ref # é curto e fácil de comunicar por telefone ou email
- **Contexto**: Inclui informações úteis como região e data de exportação
- **Segurança**: Não é possível deduzir o UUID completo a partir do suffix

---

## 2. Formato do Código

```
Ref #   QC-A3F8-0106-03
        │   │    │    │
        │   │    │    └── Quantidade de sessões no relatório
        │   │    └─────── Data de exportação (MMDD)
        │   └──────────── Últimos 4 caracteres do user_id
        └──────────────── Código da região
```

### Componentes

| Posição | Nome | Exemplo | Descrição |
|---------|------|---------|-----------|
| 1-2 | Region Code | `QC` | Código da província/estado/região |
| 4-7 | User Suffix | `A3F8` | Últimos 4 chars do UUID (hexadecimal) |
| 9-12 | Export Date | `0106` | Mês (01-12) + Dia (01-31) |
| 14-15 | Session Count | `03` | Número de sessões no relatório |

### Exemplos

| Ref # | Significado |
|-------|-------------|
| `QC-A3F8-0106-03` | Quebec, user ...a3f8, 6 de Janeiro, 3 sessões |
| `ON-B2C1-1225-12` | Ontario, user ...b2c1, 25 de Dezembro, 12 sessões |
| `BC-9DEF-0715-01` | British Columbia, user ...9def, 15 de Julho, 1 sessão |

---

## 3. Códigos de Região

### Canadá

| Código | Província/Território |
|--------|---------------------|
| `QC` | Quebec |
| `ON` | Ontario |
| `BC` | British Columbia |
| `AB` | Alberta |
| `MB` | Manitoba |
| `SK` | Saskatchewan |
| `NS` | Nova Scotia |
| `NB` | New Brunswick |
| `NL` | Newfoundland and Labrador |
| `PE` | Prince Edward Island |
| `YT` | Yukon |
| `NT` | Northwest Territories |
| `NU` | Nunavut |

### Estados Unidos

| Código | Região |
|--------|--------|
| `NE` | Northeast |
| `SE` | Southeast |
| `MW` | Midwest |
| `SW` | Southwest |
| `WE` | West |
| `AK` | Alaska |
| `HI` | Hawaii |

### Outros

| Código | Região |
|--------|--------|
| `EU` | Europe |
| `NA` | North America (Other) |
| `AF` | Africa |
| `SA` | South America |

### Determinação Automática da Região

A região é determinada automaticamente pelo app com base no `timezone` do usuário:

```typescript
function getRegionFromTimezone(timezone: string): string {
  if (timezone.includes('Toronto') || timezone.includes('Eastern')) return 'ON';
  if (timezone.includes('Montreal') || timezone.includes('Quebec')) return 'QC';
  if (timezone.includes('Vancouver') || timezone.includes('Pacific')) return 'BC';
  if (timezone.includes('Edmonton') || timezone.includes('Mountain')) return 'AB';
  // ... etc
  return 'NA'; // Fallback
}
```

---

## 4. Como Decodificar

### Manual

1. **Separe pelos hífens**: `QC-A3F8-0106-03` → `['QC', 'A3F8', '0106', '03']`
2. **Região**: `QC` = Quebec
3. **User Suffix**: `A3F8` = ID do usuário termina em `a3f8`
4. **Data**: `0106` = Mês 01, Dia 06 = 6 de Janeiro
5. **Sessões**: `03` = 3 sessões no relatório

### Via Dashboard (Support Page)

1. Acesse `/dashboard/support`
2. Cole o Ref # no campo de busca
3. Clique em "Decode"
4. Veja os dados decodificados e SQL para busca

### Via Teletraan9 (AI)

Simplesmente pergunte:

> "Busca o cliente QC-A3F8-0106-03"

O Teletraan9 vai:
1. Detectar o Ref # automaticamente
2. Decodificar os componentes
3. Buscar o usuário no banco
4. Retornar as informações encontradas

---

## 5. Busca no Supabase

### Query Passo a Passo

```sql
-- ==========================================
-- PASSO 1: Encontrar o usuário pelo suffix
-- ==========================================
-- Para Ref # QC-A3F8-0106-03, o suffix é 'a3f8'

SELECT id, email, name, plan_type, created_at, last_active_at
FROM profiles
WHERE id::text LIKE '%a3f8';

-- Resultado esperado: 1 usuário (ou 0 se não existir)

-- ==========================================
-- PASSO 2: Verificar sessões na data
-- ==========================================
-- Substitua <USER_ID> pelo ID encontrado no passo 1
-- Data: 0106 = 2025-01-06 (assumindo ano atual)

SELECT 
  id,
  location_name,
  entry_at,
  exit_at,
  type,
  EXTRACT(EPOCH FROM (exit_at - entry_at)) / 60 AS duration_minutes
FROM records
WHERE user_id = '<USER_ID>'
AND DATE(entry_at) = '2025-01-06'
ORDER BY entry_at;

-- Resultado esperado: 3 sessões (conforme o Ref #)

-- ==========================================
-- PASSO 3: Confirmar contagem
-- ==========================================

SELECT COUNT(*) AS session_count
FROM records
WHERE user_id = '<USER_ID>'
AND DATE(entry_at) = '2025-01-06';

-- Se retornar 3, o Ref # está correto ✅
```

### Query Única (Avançada)

```sql
-- Query combinada para verificação rápida
WITH user_found AS (
  SELECT id, email, name
  FROM profiles
  WHERE id::text LIKE '%a3f8'
  LIMIT 1
)
SELECT 
  u.email,
  u.name,
  COUNT(r.id) AS session_count,
  SUM(EXTRACT(EPOCH FROM (r.exit_at - r.entry_at)) / 3600) AS total_hours
FROM user_found u
LEFT JOIN records r ON r.user_id = u.id AND DATE(r.entry_at) = '2025-01-06'
GROUP BY u.email, u.name;
```

---

## 6. Integração com Teletraan9

### Detecção Automática

O Teletraan9 detecta automaticamente códigos Ref # em mensagens do usuário:

```typescript
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
```

### Exemplos de Perguntas

| Pergunta do Usuário | Ação do Teletraan9 |
|--------------------|-------------------|
| "Busca o cliente QC-A3F8-0106-03" | Decodifica → Busca user → Retorna dados |
| "Quem é Ref # ON-B2C1-1225-12?" | Decodifica → Busca user → Retorna dados |
| "Verifica BC-9DEF-0715-01" | Decodifica → Busca user → Verifica sessões |

### Resposta do Teletraan9

Quando encontra um usuário:

```
Encontrei o usuário pelo Ref # QC-A3F8-0106-03:

📧 Email: joao@exemplo.com
👤 Nome: João Silva
📍 Região: Quebec
📊 Plano: Pro
📅 Cadastro: 15/10/2024
🕐 Último acesso: 06/01/2025

No dia 06/01/2025, ele registrou 3 sessões (✅ bate com o Ref #).
```

Quando não encontra:

```
Não encontrei nenhum usuário com ID terminando em "a3f8".

Possíveis causas:
- O usuário foi deletado
- O Ref # está incorreto
- Erro de digitação no código
```

---

## 7. Implementação Técnica

### Geração do Ref # (App Mobile)

```typescript
// src/lib/reports.ts

interface RefCodeInput {
  userId: string;
  timezone: string;
  sessionCount: number;
  exportDate?: Date;
}

export function generateRefCode(input: RefCodeInput): string {
  const { userId, timezone, sessionCount, exportDate = new Date() } = input;
  
  // 1. Region code from timezone
  const regionCode = getRegionFromTimezone(timezone);
  
  // 2. Last 4 chars of user ID (uppercase hex)
  const userSuffix = userId.slice(-4).toUpperCase();
  
  // 3. Export date as MMDD
  const month = String(exportDate.getMonth() + 1).padStart(2, '0');
  const day = String(exportDate.getDate()).padStart(2, '0');
  const dateCode = `${month}${day}`;
  
  // 4. Session count (padded to 2 digits)
  const sessionsCode = String(Math.min(sessionCount, 99)).padStart(2, '0');
  
  return `${regionCode}-${userSuffix}-${dateCode}-${sessionsCode}`;
}

// Helper para timezone → region
function getRegionFromTimezone(timezone: string): string {
  const tzLower = timezone.toLowerCase();
  
  // Canada
  if (tzLower.includes('toronto') || tzLower.includes('eastern')) return 'ON';
  if (tzLower.includes('montreal') || tzLower.includes('quebec')) return 'QC';
  if (tzLower.includes('vancouver') || tzLower.includes('pacific')) return 'BC';
  if (tzLower.includes('edmonton') || tzLower.includes('mountain')) return 'AB';
  if (tzLower.includes('winnipeg') || tzLower.includes('central')) return 'MB';
  if (tzLower.includes('regina') || tzLower.includes('saskatchewan')) return 'SK';
  if (tzLower.includes('halifax') || tzLower.includes('atlantic')) return 'NS';
  if (tzLower.includes('st_johns') || tzLower.includes('newfoundland')) return 'NL';
  
  // US
  if (tzLower.includes('new_york')) return 'NE';
  if (tzLower.includes('chicago')) return 'MW';
  if (tzLower.includes('denver')) return 'SW';
  if (tzLower.includes('los_angeles')) return 'WE';
  if (tzLower.includes('anchorage')) return 'AK';
  if (tzLower.includes('honolulu')) return 'HI';
  
  return 'NA'; // Fallback
}
```

### Decodificação (Dashboard/AI)

```typescript
// lib/refCode.ts

interface DecodedRef {
  isValid: boolean;
  regionCode: string | null;
  regionName: string | null;
  userSuffix: string | null;
  exportMonth: number | null;
  exportDay: number | null;
  sessionCount: number | null;
  error?: string;
}

export function decodeRefCode(refCode: string): DecodedRef {
  // Clean input (remove "Ref #" prefix if present)
  const clean = refCode.replace(/^Ref\s*#?\s*/i, '').trim().toUpperCase();
  
  // Validate format: XX-YYYY-MMDD-NN
  const pattern = /^([A-Z]{2})-([A-F0-9]{4})-(\d{4})-(\d{2})$/;
  const match = clean.match(pattern);
  
  if (!match) {
    return {
      isValid: false,
      regionCode: null,
      regionName: null,
      userSuffix: null,
      exportMonth: null,
      exportDay: null,
      sessionCount: null,
      error: 'Invalid format. Expected: XX-YYYY-MMDD-NN',
    };
  }
  
  const [, regionCode, userSuffix, dateStr, sessionsStr] = match;
  const exportMonth = parseInt(dateStr.slice(0, 2), 10);
  const exportDay = parseInt(dateStr.slice(2, 4), 10);
  const sessionCount = parseInt(sessionsStr, 10);
  
  // Validate month
  if (exportMonth < 1 || exportMonth > 12) {
    return { ...baseResult, error: `Invalid month: ${exportMonth}` };
  }
  
  // Validate day
  if (exportDay < 1 || exportDay > 31) {
    return { ...baseResult, error: `Invalid day: ${exportDay}` };
  }
  
  return {
    isValid: true,
    regionCode,
    regionName: REGION_NAMES[regionCode] || 'Unknown',
    userSuffix: userSuffix.toLowerCase(),
    exportMonth,
    exportDay,
    sessionCount,
  };
}
```

### Uso no PDF Export

```typescript
// Quando gera o PDF
const refCode = generateRefCode({
  userId: user.id,
  timezone: user.timezone || 'America/Toronto',
  sessionCount: records.length,
});

// Adiciona ao PDF
doc.setFontSize(8);
doc.setTextColor(128, 128, 128);
doc.text(`Ref # ${refCode}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
```

---

## Considerações de Segurança

### O que é exposto

- **Região** - Informação geográfica geral (não endereço)
- **User Suffix** - Apenas 4 caracteres do UUID (impossível reconstruir)
- **Data** - Apenas mês/dia (não ano)
- **Contagem** - Número de sessões

### O que NÃO é exposto

- Email do usuário
- Nome completo
- UUID completo
- Dados de localização GPS
- Informações financeiras

### Colisões

A probabilidade de colisão (dois usuários com mesmo suffix) é baixa mas possível:
- 4 caracteres hex = 65,536 combinações
- Com <10,000 usuários, colisão é rara
- Em caso de colisão, use email ou data para desambiguar

---

## Troubleshooting

### "Usuário não encontrado"

1. Verifique se o Ref # foi digitado corretamente
2. Confira se o usuário não foi deletado
3. Tente buscar pelo suffix diretamente no Supabase

### "Contagem de sessões não bate"

1. O usuário pode ter adicionado/removido sessões após exportar
2. Verifique se a data está correta (assumindo ano atual)
3. Confira timezone do usuário vs. timezone do servidor

### "Região desconhecida"

1. O usuário pode ter timezone não mapeado
2. Fallback para 'NA' é aplicado
3. Adicione novos mapeamentos conforme necessário

---

*Documentação do Sistema Ref # - OnSite Club*  
*Janeiro 2025*
