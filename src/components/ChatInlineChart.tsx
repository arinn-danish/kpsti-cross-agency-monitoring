import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import { ChatInlineChartData } from '../types';

interface ChatInlineChartProps {
  chart: ChatInlineChartData;
}

export const ChatInlineChart: React.FC<ChatInlineChartProps> = ({ chart }) => {
  const isLine = chart.type === 'line';
  const isHorizontal = chart.layout === 'horizontal';

  return (
    <div className="mt-3.5 pt-3 border-t border-slate-800/90 w-full min-w-0 animate-fade-in">
      {/* 1. SHORT ONE-LINE SUMMARY (Prominently displayed right above the chart) */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 min-w-0">
          {isLine ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
          <span className="truncate" title={chart.title}>
            {chart.title}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shrink-0">
          <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
          <span>Mini-Laporan</span>
        </span>
      </div>

      {/* 2. Mini-Report Summary Stats Strip */}
      {chart.summaryStats && chart.summaryStats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2.5">
          {chart.summaryStats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-slate-950/60 border border-slate-800/80 rounded-lg px-2 py-1 text-left"
            >
              <div className="text-[10px] text-slate-400 font-medium truncate">
                {stat.label}
              </div>
              <div className="text-xs font-bold text-slate-100 font-mono truncate">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Small Chart Container (using same approach as Analytics Engine) */}
      <div className="w-full h-44 sm:h-48 bg-slate-950/70 rounded-xl p-2 sm:p-2.5 border border-slate-800/80 relative">
        <ResponsiveContainer width="100%" height="100%">
          {isLine ? (
            <AreaChart
              data={chart.data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="chatLineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  fontSize: '11px',
                  padding: '6px 10px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: '#34d399' }}
                formatter={(val: any) => [`${val} ${chart.unit || 'Entri'}`, 'Jumlah']}
                labelFormatter={(label) => `Garis Masa: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#059669"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#chatLineGradient)"
                activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 1.5 }}
              />
            </AreaChart>
          ) : isHorizontal ? (
            <BarChart
              data={chart.data}
              layout="vertical"
              margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                dataKey="label"
                type="category"
                width={70}
                tick={{ fontSize: 10, fill: '#cbd5e1', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  fontSize: '11px',
                  padding: '6px 10px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                }}
                formatter={(val: any) => [`${val} ${chart.unit || 'Item'}`, 'Nilai']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                {chart.data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || '#059669'}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart
              data={chart.data}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  fontSize: '11px',
                  padding: '6px 10px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                }}
                formatter={(val: any) => [`${val} ${chart.unit || 'Item'}`, 'Jumlah']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20}>
                {chart.data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || '#059669'}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* 4. Compact Legend Strip below chart for rapid scanning */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          {chart.data.slice(0, 4).map((item, idx) => (
            <span key={idx} className="flex items-center gap-1 font-mono">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color || '#059669' }}
              />
              <span className="text-slate-300">{item.label}:</span>
              <strong className="text-white">{item.value}{chart.unit === '%' ? '%' : ''}</strong>
            </span>
          ))}
        </div>
        <span className="text-[9px] text-slate-500 font-mono">
          Enjin Analitik KPSTI
        </span>
      </div>
    </div>
  );
};
