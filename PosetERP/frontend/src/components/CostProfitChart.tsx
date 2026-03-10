"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Order {
  status: number | string;
  orderDate: string;
  totalPrice?: number;
  totalCost?: number;
  netProfit?: number;
}

interface CostProfitChartProps {
  orders: Order[];
}

export default function CostProfitChart({ orders }: CostProfitChartProps) {
  const chartData = useMemo(() => {
    const monthlyData = orders.reduce((acc: Record<string, any>, order) => {
      // Sadece tamamlanmış/sevk edilmiş siparişleri kâr hesabına dahil et
      const isCompleted = order.status === 2 || order.status === 3 || order.status === 'Completed' || order.status === 'Shipped';
      if (!isCompleted) return acc;
      
      const d = new Date(order.orderDate);
      const m = d.toLocaleString('tr-TR', { month: 'short' });
      const y = d.getFullYear();
      const label = `${m} ${y}`;

      if (!acc[label]) {
        acc[label] = { 
          month: label, 
          ciro: 0, 
          maliyet: 0, 
          kar: 0,
          timestamp: d.getTime()
        };
      }
      
      acc[label].ciro += (order.totalPrice || 0);
      acc[label].maliyet += (order.totalCost || 0);
      acc[label].kar += (order.netProfit || 0);
      
      return acc;
    }, {});

    return Object.values(monthlyData)
      .sort((a: any, b: any) => a.timestamp - b.timestamp)
      .map((item: any) => ({
        month: item.month,
        "Ciro": Number(item.ciro.toFixed(2)),
        "Maliyet": Number(item.maliyet.toFixed(2)),
        "Net Kâr": Number(item.kar.toFixed(2))
      }));
  }, [orders]);

  if (chartData.length === 0) {
    return (
      <div className="bg-[#111111] rounded-2xl border border-[#222] p-6 h-full flex flex-col items-center justify-center shadow-xl">
        <p className="text-slate-500 text-sm">Finansal veri bulunmuyor.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0A0A0A] border border-[#333] p-4 rounded-xl shadow-2xl">
          <p className="text-slate-300 font-medium mb-3 border-b border-[#333] pb-2 text-sm">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }} />
                  <span className="text-slate-400 text-xs font-medium">{entry.name}</span>
                </div>
                <span className="text-white text-xs font-bold font-mono">
                  {entry.value.toLocaleString('tr-TR')} ₺
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#111111] rounded-2xl border border-[#222] p-6 h-full shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
      
      <div className="mb-6 z-10 relative">
        <h3 className="text-lg font-semibold text-white tracking-tight">Maliyet & Kâr Analizi</h3>
        <p className="text-xs text-slate-500 mt-1">Tamamlanan siparişlerin aylık finansal eğilimi</p>
      </div>
      
      <div className="h-[280px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCiro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorMaliyet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorKar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="#555" 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#555" 
              fontSize={11} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
            />
            <Area 
              type="monotone" 
              dataKey="Ciro" 
              stroke="#06b6d4" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCiro)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#06b6d4', style: { filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.8))' } }}
            />
            <Area 
              type="monotone" 
              dataKey="Maliyet" 
              stroke="#f43f5e" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorMaliyet)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e', style: { filter: 'drop-shadow(0 0 8px rgba(244,63,94,0.8))' } }}
            />
            <Area 
              type="monotone" 
              dataKey="Net Kâr" 
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorKar)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981', style: { filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.8))' } }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
