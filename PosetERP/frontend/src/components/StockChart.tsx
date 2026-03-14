"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { LayoutGrid, PieChart as PieIcon } from "lucide-react";

interface RawMaterial {
  id: string;
  name: string;
  stockKg: number;
  minimumStockAlert: number;
  unit?: string;
}

interface StockChartProps {
  data: RawMaterial[];
}

const NEON_COLORS = [
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#f43f5e", // Rose
  "#f59e0b", // Amber
];

export default function StockChart({ data }: StockChartProps) {
  const [chartView, setChartView] = useState<'bar' | 'donut'>('bar');

  const mappedData = useMemo(() => {
    if (!data) return [];
    return data.map(item => ({
      name: item.name || "Bilinmiyor",
      value: Number(item.stockKg ?? (item as any).StockKg ?? 0),
      isCritical: Number(item.stockKg ?? (item as any).StockKg ?? 0) < Number(item.minimumStockAlert ?? (item as any).MinimumStockAlert ?? 0),
      unit: item.unit || "Kg"
    }));
  }, [data]);

  if (!mappedData || mappedData.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-[#111111] rounded-2xl border border-[#222]">
        <span className="text-slate-500">Stok verisi bulunamadı.</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#111111] p-6 rounded-2xl border border-[#222] shadow-2xl relative group overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Hammadde Stok Durumu</h3>
          <p className="text-sm text-slate-400 mt-1">Sistemde kayıtlı olan hammaddelerin güncel stok miktarları.</p>
        </div>

        {/* Toggle UI */}
        <div className="flex bg-black/40 p-1 rounded-xl border border-[#222] shadow-inner">
          <button
            onClick={() => setChartView('bar')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
              chartView === 'bar'
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <LayoutGrid size={14} />
            Sütun
          </button>
          <button
            onClick={() => setChartView('donut')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
              chartView === 'donut'
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <PieIcon size={14} />
            Halka
          </button>
        </div>
      </div>
      
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartView === 'bar' ? (
            <BarChart
              data={mappedData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#52525b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                interval={0}
                tick={({ x, y, payload }) => (
                  <text x={x} y={Number(y) + 12} fill="#52525b" fontSize={10} textAnchor="middle">
                    {payload.value.length > 15 ? `${payload.value.substring(0, 12)}...` : payload.value}
                  </text>
                )}
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                cursor={{ fill: '#1a1a1a' }}
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #222',
                  borderRadius: '12px',
                  boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: '#06b6d4', fontWeight: 500 }}
                labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                formatter={(value: any, name: any, props: any) => [`${value} ${props.payload.unit || 'Kg'}`, 'Miktar']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                {mappedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isCritical ? '#f43f5e' : '#06b6d4'} 
                    className="transition-all duration-300 hover:opacity-80 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={mappedData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {mappedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={NEON_COLORS[index % NEON_COLORS.length]} 
                    className="outline-none hover:opacity-80 transition-opacity drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #222',
                  borderRadius: '12px',
                  boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ fontWeight: 500 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(value: any, name: any, props: any) => [`${value} ${props.payload.unit || 'Kg'}`, 'Miktar']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '20px' }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex gap-4 text-xs border-t border-[#222] pt-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
          <span className="text-slate-400">Yeterli Stok</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <span className="text-slate-400">Kritik Stok</span>
        </div>
      </div>
    </div>
  );
}
