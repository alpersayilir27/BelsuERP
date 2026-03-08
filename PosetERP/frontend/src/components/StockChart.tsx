"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

interface RawMaterial {
  id: string;
  name: string;
  stockKg: number;
  minimumStockAlert: number;
}

interface StockChartProps {
  data: RawMaterial[];
}

export default function StockChart({ data }: StockChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-[#111111] rounded-2xl border border-[#222]">
        <span className="text-slate-500">Stok verisi bulunamadı.</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#111111] p-6 rounded-2xl border border-[#222] shadow-2xl relative group overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Hammadde Stok Durumu</h3>
          <p className="text-sm text-slate-400 mt-1">Sistemde kayıtlı olan hammaddelerin güncel stok miktarları (Kg).</p>
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 20,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#52525b" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#52525b" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `${value} kg`}
            />
            <Tooltip
              cursor={{ fill: '#1a1a1a' }}
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #222',
                borderRadius: '12px',
                color: '#fff',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ color: '#06b6d4', fontWeight: 500 }}
              labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
            />
            <Bar dataKey="stockKg" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.stockKg < entry.minimumStockAlert ? '#f43f5e' : '#06b6d4'} 
                  className="transition-all duration-300 hover:opacity-80 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
          <span className="text-slate-400">Yeterli Stok</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <span className="text-slate-400">Kritik Stok</span>
        </div>
      </div>
    </div>
  );
}
