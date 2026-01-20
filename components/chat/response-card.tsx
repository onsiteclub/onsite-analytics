'use client';

import { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  BarChart3,
  Copy,
  Check,
  Code,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ArgusVisualization } from '@/lib/supabase/schema';
import { SimpleLineChart } from '@/components/charts/line-chart';
import { SimpleBarChart } from '@/components/charts/bar-chart';

interface ResponseCardProps {
  visualization: ArgusVisualization;
  sql?: string;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onRefresh?: () => void;
}

export function ResponseCard({
  visualization,
  sql,
  onExportPDF,
  onExportExcel,
  onRefresh,
}: ResponseCardProps) {
  const [showSQL, setShowSQL] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const copySQL = async () => {
    if (sql) {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderVisualization = () => {
    switch (visualization.type) {
      case 'chart':
        return renderChart();
      case 'table':
        return renderTable();
      case 'metric':
        return renderMetric();
      case 'alert':
        return renderAlert();
      case 'user_card':
        return renderUserCard();
      default:
        return null;
    }
  };

  const renderChart = () => {
    if (!visualization.data || !Array.isArray(visualization.data)) {
      return <div className="text-zinc-500 text-sm">No chart data available</div>;
    }

    const chartData = visualization.data as { name: string; value: number }[];

    return (
      <div className="h-64">
        {visualization.chartType === 'line' ? (
          <SimpleLineChart
            data={chartData}
            dataKey="value"
            xAxisKey="name"
            color="#f97316"
          />
        ) : visualization.chartType === 'bar' ? (
          <SimpleBarChart
            data={chartData}
            dataKey="value"
            xAxisKey="name"
            color="#f97316"
          />
        ) : visualization.chartType === 'pie' ? (
          <SimpleBarChart
            data={chartData}
            dataKey="value"
            xAxisKey="name"
            color="#f97316"
          />
        ) : (
          <SimpleLineChart
            data={chartData}
            dataKey="value"
            xAxisKey="name"
            color="#f97316"
          />
        )}
      </div>
    );
  };

  const renderTable = () => {
    if (!visualization.data || !Array.isArray(visualization.data)) {
      return <div className="text-zinc-500 text-sm">No table data available</div>;
    }

    const columns = visualization.columns || Object.keys(visualization.data[0] || {});
    const rows = visualization.data as Record<string, unknown>[];

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((row, i) => (
              <tr
                key={i}
                className="border-b border-zinc-800 hover:bg-zinc-800/50"
              >
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 text-zinc-300">
                    {formatValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 10 && (
          <div className="text-center py-2 text-xs text-zinc-500">
            Showing 10 of {rows.length} rows
          </div>
        )}
      </div>
    );
  };

  const renderMetric = () => {
    const data = visualization.data as unknown as {
      value: string | number;
      change?: number;
      changeLabel?: string;
    };
    const value = visualization.value || data?.value;
    const change = data?.change;

    return (
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold text-white">{value}</div>
        {change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm',
              change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-zinc-500'
            )}
          >
            {change > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : change < 0 ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
            <span>{Math.abs(change)}%</span>
            {data?.changeLabel && (
              <span className="text-zinc-500">{data.changeLabel}</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAlert = () => {
    const items = visualization.items || [];

    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
          >
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
            <span className="text-sm text-yellow-200">{item}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderUserCard = () => {
    const data = visualization.data as unknown as {
      email?: string;
      name?: string;
      plan?: string;
      region?: string;
      sessions?: number;
      expected?: number;
    };

    return (
      <div className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-lg">
        <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-orange-500" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-white">{data?.name || 'Unknown User'}</div>
          <div className="text-sm text-zinc-400">{data?.email}</div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            {data?.plan && (
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded">
                {data.plan}
              </span>
            )}
            {data?.region && (
              <span className="text-zinc-500">{data.region}</span>
            )}
            {data?.sessions !== undefined && (
              <span className="text-zinc-400">
                {data.sessions} sessions
                {data.expected !== undefined && data.sessions !== data.expected && (
                  <span className="text-yellow-500 ml-1">
                    (expected: {data.expected})
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return value.toLocaleString();
      return value.toFixed(2);
    }
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          <span className="font-medium">
            {visualization.title || getTypeLabel(visualization.type)}
          </span>
        </button>

        <div className="flex items-center gap-1">
          {visualization.downloadable && onExportPDF && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExportPDF}
              className="h-8 px-2 text-zinc-400 hover:text-white"
              title="Export as PDF"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          {visualization.downloadable && onExportExcel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExportExcel}
              className="h-8 px-2 text-zinc-400 hover:text-white"
              title="Export as Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </Button>
          )}
          {sql && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSQL(!showSQL)}
              className={cn(
                'h-8 px-2',
                showSQL ? 'text-orange-500' : 'text-zinc-400 hover:text-white'
              )}
              title="Show SQL"
            >
              <Code className="w-4 h-4" />
            </Button>
          )}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-8 px-2 text-zinc-400 hover:text-white"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4">
          {renderVisualization()}

          {/* SQL Block */}
          {showSQL && sql && (
            <div className="mt-4 relative">
              <div className="absolute right-2 top-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copySQL}
                  className="h-7 px-2 text-xs text-zinc-400 hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 overflow-x-auto">
                <code>{sql}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getTypeLabel(type: ArgusVisualization['type']): string {
  switch (type) {
    case 'chart':
      return 'Chart';
    case 'table':
      return 'Data Table';
    case 'metric':
      return 'Metric';
    case 'alert':
      return 'Alert';
    case 'user_card':
      return 'User Info';
    default:
      return 'Result';
  }
}
