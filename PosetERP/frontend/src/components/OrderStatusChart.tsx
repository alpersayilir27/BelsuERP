"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface Order {
  status: number | string;
}

interface OrderStatusChartProps {
  orders: Order[];
}

export default function OrderStatusChart({ orders }: OrderStatusChartProps) {
  // Group orders by status
  const pending = orders.filter(o => o.status === 0 || o.status === 'Pending').length;
  const inProduction = orders.filter(o => o.status === 1 || o.status === 'InProduction').length;
  const completed = orders.filter(o => o.status === 2 || o.status === 'Completed').length;
  const shipped = orders.filter(o => o.status === 3 || o.status === 'Shipped').length;

  const data = [
    { name: "Bekleyen", value: pending, color: "#f59e0b" }, // Amber-500
    { name: "Üretimde", value: inProduction, color: "#06b6d4" }, // Cyan-500
    { name: "Tamamlandı", value: completed, color: "#10b981" }, // Emerald-500
    { name: "Sevk Edildi", value: shipped, color: "#8b5cf6" }, // Violet-500
  ].filter(item => item.value > 0);

  if (orders.length === 0) {
    return (
      <div className="bg-[#111111] rounded-2xl border border-[#222] p-6 h-full flex flex-col items-center justify-center relative shadow-xl">
        <p className="text-slate-500 text-sm">Sipariş verisi bulunmuyor.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0A0A0A] border border-[#333] p-3 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <p className="text-sm font-medium text-white">{payload[0].name}</p>
          <p className="text-xs font-bold mt-1" style={{ color: payload[0].payload.color }}>
            {payload[0].value} Sipariş
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#111111] rounded-2xl border border-[#222] p-6 h-full shadow-xl relative overflow-hidden group">
      {/* Background glow based on active slice colors or general cyan */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />
      
      <h3 className="text-lg font-semibold text-white mb-6">Sipariş Durumu Dağılımı</h3>
      
      <div className="h-64 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  style={{ filter: `drop-shadow(0 0 8px ${entry.color}80)` }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              formatter={(value, entry: any) => (
                <span className="text-slate-300 text-xs font-medium ml-1">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
