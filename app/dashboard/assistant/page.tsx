'use client';

import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Download,
  BarChart3,
  Table,
  FileSpreadsheet,
  Sparkles,
  Copy,
  Check,
  FileText,
  Pencil,
  Save,
  X,
  TrendingUp,
  AlertTriangle,
  GitCompare,
  Trophy,
  Activity,
  Calendar,
  Mail,
  UserCheck,
  Clock,
  Zap,
  ChevronRight,
  PlayCircle,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ============================================
// TYPES
// ============================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  visualization?: Visualization;
}

interface Visualization {
  type: 'chart' | 'table' | 'number' | 'list';
  chartType?: 'line' | 'bar' | 'pie';
  title?: string;
  data?: any[];
  columns?: string[];
  value?: string | number;
  items?: string[];
  downloadable?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  type: 'instant' | 'guided';
  prompt?: string; // For instant actions
  questions?: string[]; // For guided actions
  category: 'analysis' | 'reports' | 'visualizations' | 'actions';
}

// ============================================
// QUICK ACTIONS CONFIG
// ============================================

const QUICK_ACTIONS: QuickAction[] = [
  // ANÁLISE DE DADOS
  {
    id: 'weekly-growth',
    label: 'Crescimento Semanal',
    icon: TrendingUp,
    type: 'instant',
    prompt: 'Gere um relatório completo de crescimento semanal com gráfico de novos usuários, sessões e taxa de engajamento dos últimos 7 dias comparado com a semana anterior.',
    category: 'analysis',
  },
  {
    id: 'anomalies',
    label: 'Detectar Anomalias',
    icon: AlertTriangle,
    type: 'instant',
    prompt: 'Analise os dados e identifique anomalias: sessões muito longas ou curtas, horários incomuns, usuários com comportamento atípico, falhas de sync acima do normal.',
    category: 'analysis',
  },
  {
    id: 'compare-periods',
    label: 'Comparar Períodos',
    icon: GitCompare,
    type: 'guided',
    questions: [
      'Qual período você quer comparar? (ex: essa semana, esse mês, últimos 30 dias)',
      'Comparar com qual período? (ex: semana passada, mês passado, mesmo período ano anterior)',
      'Quais métricas? (usuários, sessões, engajamento, todas)',
    ],
    category: 'analysis',
  },
  {
    id: 'ranking',
    label: 'Gerar Ranking',
    icon: Trophy,
    type: 'guided',
    questions: [
      'Ranking de quê? (usuários mais ativos, locais mais usados, dias com mais sessões)',
      'Qual período? (última semana, último mês, todo o período)',
      'Quantos no ranking? (top 5, top 10, top 20)',
    ],
    category: 'analysis',
  },
  {
    id: 'trends',
    label: 'Análise de Tendências',
    icon: Activity,
    type: 'instant',
    prompt: 'Faça uma análise de tendências: o uso está crescendo ou diminuindo? Qual o padrão de uso semanal? Existem sazonalidades? Previsão para o próximo mês.',
    category: 'analysis',
  },

  // RELATÓRIOS
  {
    id: 'weekly-report',
    label: 'Relatório Semanal',
    icon: Calendar,
    type: 'instant',
    prompt: 'Gere um relatório semanal completo em formato estruturado com: resumo executivo, métricas principais, gráfico de atividade, tabela de usuários mais ativos, e recomendações. Inclua dados para exportar.',
    category: 'reports',
  },
  {
    id: 'user-report',
    label: 'Relatório de Usuário',
    icon: UserCheck,
    type: 'guided',
    questions: [
      'Qual usuário? (digite o email ou nome)',
      'Qual período? (última semana, último mês, todo histórico)',
      'Incluir detalhes de sessões? (sim/não)',
    ],
    category: 'reports',
  },
  {
    id: 'monthly-summary',
    label: 'Resumo Mensal',
    icon: FileText,
    type: 'instant',
    prompt: 'Gere um resumo mensal completo com: total de usuários novos, sessões realizadas, horas trabalhadas, taxa de automação, comparativo com mês anterior, e gráficos de evolução.',
    category: 'reports',
  },
  {
    id: 'custom-report',
    label: 'Relatório Customizado',
    icon: Pencil,
    type: 'guided',
    questions: [
      'Qual o foco do relatório? (usuários, produtividade, engajamento, técnico)',
      'Qual período de análise?',
      'Precisa de gráficos? Quais tipos?',
      'Alguma métrica específica para destacar?',
    ],
    category: 'reports',
  },

  // VISUALIZAÇÕES
  {
    id: 'dashboard-overview',
    label: 'Dashboard Geral',
    icon: BarChart3,
    type: 'instant',
    prompt: 'Mostre um dashboard geral com: número de usuários, sessões totais, taxa de automação, e um gráfico de atividade dos últimos 14 dias.',
    category: 'visualizations',
  },
  {
    id: 'users-table',
    label: 'Tabela de Usuários',
    icon: Table,
    type: 'instant',
    prompt: 'Gere uma tabela completa de usuários com: email, nome, ofício, plataforma, data de cadastro. Ordenado por mais recente.',
    category: 'visualizations',
  },
  {
    id: 'sessions-chart',
    label: 'Gráfico de Sessões',
    icon: Activity,
    type: 'instant',
    prompt: 'Crie um gráfico de linha mostrando sessões por dia nas últimas 2 semanas.',
    category: 'visualizations',
  },
  {
    id: 'automation-pie',
    label: 'Taxa de Automação',
    icon: Zap,
    type: 'instant',
    prompt: 'Mostre um gráfico de pizza comparando entradas automáticas (geofence) vs manuais.',
    category: 'visualizations',
  },

  // AÇÕES RÁPIDAS
  {
    id: 'export-all',
    label: 'Exportar Todos Dados',
    icon: Download,
    type: 'guided',
    questions: [
      'Quais dados exportar? (usuários, sessões, eventos, todos)',
      'Formato? (CSV, Excel, PDF)',
      'Período? (tudo, último mês, última semana)',
    ],
    category: 'actions',
  },
  {
    id: 'health-check',
    label: 'Check de Saúde',
    icon: HelpCircle,
    type: 'instant',
    prompt: 'Faça um diagnóstico completo do sistema: taxa de sync, erros recentes, sessões abertas sem fechar, usuários inativos há muito tempo, e qualquer problema que precise de atenção.',
    category: 'actions',
  },
];

const CATEGORIES = [
  { id: 'analysis', label: 'Análise de Dados', icon: TrendingUp },
  { id: 'reports', label: 'Relatórios', icon: FileText },
  { id: 'visualizations', label: 'Visualizações', icon: BarChart3 },
  { id: 'actions', label: 'Ações Rápidas', icon: Zap },
];

const CHART_COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

// ============================================
// EDITABLE TABLE COMPONENT
// ============================================

function EditableTable({ data: initialData, columns, title }: { data: any[]; columns: string[]; title: string; }) {
  const [data, setData] = useState(initialData);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (rowIndex: number, colKey: string, value: any) => {
    setEditingCell({ row: rowIndex, col: colKey });
    setEditValue(String(value ?? ''));
  };

  const saveEdit = () => {
    if (editingCell) {
      const newData = [...data];
      newData[editingCell.row] = { ...newData[editingCell.row], [editingCell.col]: editValue };
      setData(newData);
    }
    setEditingCell(null);
  };

  const exportCSV = () => {
    const headers = columns.join(',');
    const rows = data.map(row => columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','));
    downloadFile([headers, ...rows].join('\n'), `${title}.csv`, 'text/csv');
  };

  const exportExcel = () => {
    const headers = columns.join('\t');
    const rows = data.map(row => columns.map(col => String(row[col] ?? '')).join('\t'));
    downloadFile('\uFEFF' + [headers, ...rows].join('\n'), `${title}.xls`, 'application/vnd.ms-excel');
  };

  const exportPDF = async () => {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default;
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(128);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
    autoTable(doc, {
      head: [columns],
      body: data.map(row => columns.map(col => String(row[col] ?? '-'))),
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [249, 115, 22] },
    });
    doc.save(`${title}.pdf`);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="mt-3 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Table className="h-4 w-4 text-primary" />
            <span className="font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <FileSpreadsheet className="h-3 w-3 mr-1" />CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportExcel}>
              <FileSpreadsheet className="h-3 w-3 mr-1" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <FileText className="h-3 w-3 mr-1" />PDF
            </Button>
          </div>
        </div>

        {editingCell && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-muted rounded-lg">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border rounded"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingCell(null); }}
            />
            <Button size="sm" onClick={saveEdit}><Save className="h-3 w-3" /></Button>
            <Button size="sm" variant="outline" onClick={() => setEditingCell(null)}><X className="h-3 w-3" /></Button>
          </div>
        )}

        <div className="overflow-x-auto max-h-72 border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="text-left p-2 font-medium border-b">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 50).map((row, i) => (
                <tr key={i} className="border-b hover:bg-muted/30">
                  {columns.map((col) => (
                    <td key={col} className="p-2 cursor-pointer hover:bg-muted/50" onClick={() => startEdit(i, col, row[col])}>
                      {String(row[col] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">💡 Clique em qualquer célula para editar</p>
      </CardContent>
    </Card>
  );
}

// ============================================
// GUIDED ACTION MODAL
// ============================================

function GuidedActionModal({ 
  action, 
  onSubmit, 
  onClose 
}: { 
  action: QuickAction; 
  onSubmit: (answers: string[]) => void; 
  onClose: () => void;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const questions = action.questions || [];

  const handleNext = () => {
    const newAnswers = [...answers, inputValue];
    setAnswers(newAnswers);
    setInputValue('');

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      onSubmit(newAnswers);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <action.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{action.label}</h3>
              <p className="text-xs text-muted-foreground">Pergunta {currentQuestion + 1} de {questions.length}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm mb-3">{questions[currentQuestion]}</p>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua resposta..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && inputValue.trim()) handleNext(); }}
            />
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-1.5 mb-4">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all" 
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleNext} disabled={!inputValue.trim()} className="flex-1">
              {currentQuestion < questions.length - 1 ? 'Próxima' : 'Gerar'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'E aí! Sou o Dr. André, seu analista de dados. Pode me perguntar qualquer coisa sobre os números do OnSite, ou usar os atalhos aí do lado pra gerar análises rapidinho. No que posso ajudar?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('analysis');
  const [guidedAction, setGuidedAction] = useState<QuickAction | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'Hmm, não consegui processar isso.',
        timestamp: new Date(),
        visualization: data.visualization,
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Eita, deu um erro aqui. Tenta de novo?',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.type === 'instant' && action.prompt) {
      sendMessage(action.prompt);
    } else if (action.type === 'guided') {
      setGuidedAction(action);
    }
  };

  const handleGuidedSubmit = (answers: string[]) => {
    if (!guidedAction) return;
    
    // Build prompt from answers
    const prompt = `${guidedAction.label}: ${answers.join(', ')}. Gere uma análise completa baseada nesses parâmetros.`;
    setGuidedAction(null);
    sendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render visualization
  const renderVisualization = (viz: Visualization) => {
    if (!viz) return null;

    switch (viz.type) {
      case 'chart':
        return (
          <Card className="mt-3">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="font-medium">{viz.title}</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  {viz.chartType === 'pie' ? (
                    <PieChart>
                      <Pie data={viz.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                        {viz.data?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  ) : viz.chartType === 'bar' ? (
                    <BarChart data={viz.data}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={viz.data}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );

      case 'table':
        return <EditableTable data={viz.data || []} columns={viz.columns || []} title={viz.title || 'Dados'} />;

      case 'number':
        return (
          <Card className="mt-3 inline-block">
            <CardContent className="p-5 text-center">
              <p className="text-4xl font-bold text-primary">{viz.value}</p>
              {viz.title && <p className="text-sm text-muted-foreground mt-1">{viz.title}</p>}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const filteredActions = QUICK_ACTIONS.filter(a => a.category === activeCategory);

  return (
    <div className="flex flex-col h-full">
      <Header title="Dr. André - Assistente IA" description="Análise inteligente com gráficos e tabelas editáveis" />

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                
                <div className={cn('max-w-[80%] rounded-lg', message.role === 'user' ? 'bg-primary text-primary-foreground p-3' : 'bg-card border p-4')}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.visualization && renderVisualization(message.visualization)}
                  
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => copyToClipboard(message.content)}>
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span className="ml-1">{copied ? 'Copiado!' : 'Copiar'}</span>
                      </Button>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground">Analisando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4 bg-card">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte qualquer coisa..."
                className="flex-1 resize-none rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-32"
                rows={1}
                disabled={loading}
              />
              <Button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} className="h-auto">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              PhD em Data Science • Tabelas editáveis • Export CSV/Excel/PDF
            </p>
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="w-72 border-l bg-card flex flex-col hidden lg:flex">
          {/* Category Tabs */}
          <div className="p-2 border-b flex flex-wrap gap-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                  activeCategory === cat.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                )}
              >
                <cat.icon className="h-3 w-3" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Actions List */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {filteredActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  disabled={loading}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all',
                    'hover:bg-muted group',
                    loading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    'bg-muted group-hover:bg-primary/10'
                  )}>
                    <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{action.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.type === 'instant' ? (
                        <span className="flex items-center gap-1">
                          <PlayCircle className="h-3 w-3" /> Clique para executar
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <HelpCircle className="h-3 w-3" /> {action.questions?.length} perguntas
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t">
            <p className="text-xs text-muted-foreground text-center">
              <Zap className="h-3 w-3 inline mr-1" />
              {QUICK_ACTIONS.filter(a => a.type === 'instant').length} ações diretas •{' '}
              {QUICK_ACTIONS.filter(a => a.type === 'guided').length} guiadas
            </p>
          </div>
        </div>
      </div>

      {/* Guided Action Modal */}
      {guidedAction && (
        <GuidedActionModal
          action={guidedAction}
          onSubmit={handleGuidedSubmit}
          onClose={() => setGuidedAction(null)}
        />
      )}
    </div>
  );
}
