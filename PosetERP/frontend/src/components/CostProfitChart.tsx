"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

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
      // Sadece tamamlanmı/sevk edilmiş/teslim edilmiş siparişleri kâr hesabına dahil et
      const isCompleted = order.status === 2 || order.status === 3 || order.status === 4 || 
                         order.status === 'Completed' || order.status === 'Shipped' || order.status === 'Delivered';
      if (!isCompleted) return acc;
      
      const orderDate = (order as any).orderDate || (order as any).OrderDate;
      const d = new Date(orderDate);
      if (isNaN(d.getTime())) return acc;
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
      
      const ciro = Number((order as any).totalPrice || (order as any).TotalPrice || 0);
      const maliyet = Number((order as any).totalCost || (order as any).TotalCost || (order as any).estimatedCost || (order as any).EstimatedCost || 0);
      const kar = (order as any).netProfit !== undefined || (order as any).NetProfit !== undefined 
                  ? Number((order as any).netProfit ?? (order as any).NetProfit) 
                  : (ciro - maliyet);

      acc[label].ciro += ciro;
      acc[label].maliyet += maliyet;
      acc[label].kar += kar;
      
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
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill || entry.color, boxShadow: `0 0 8px ${entry.fill || entry.color}` }} />
                  <span className="text-slate-400 text-xs font-medium">{entry.name}</span>
                </div>
                <span className="text-white text-xs font-bold font-mono">
                  {Number(entry.value).toLocaleString('tr-TR')} ₺
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
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barGap={8}
          >
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1a1a1a' }} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
            />
            <Bar 
              dataKey="Ciro" 
              fill="#06b6d4" 
              radius={[4, 4, 0, 0]}
              className="drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]"
            />
            <Bar 
              dataKey="Maliyet" 
              fill="#f43f5e" 
              radius={[4, 4, 0, 0]}
              className="drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"
            />
            <Bar 
              dataKey="Net Kâr" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
              className="drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
