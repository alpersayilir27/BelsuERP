"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface RawMaterial {
  id: string;
  name: string;
  stockKg: number;
  minimumStockAlert: number;
}

interface CriticalStockListProps {
  rawMaterials: RawMaterial[];
}

export default function CriticalStockList({ rawMaterials }: CriticalStockListProps) {
  const criticalItems = rawMaterials.filter(m => m.stockKg <= m.minimumStockAlert);

  return (
    <div className="bg-[#111111] rounded-2xl border border-[#222] p-6 h-full shadow-xl relative overflow-hidden group flex flex-col">
      {/* Background Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertTriangle size={20} />
        </div>
        <h3 className="text-lg font-semibold text-white">Kritik Stok Uyarıları</h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar relative z-10">
        {criticalItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center h-full">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-3">
              <CheckCircle2 size={24} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <p className="text-sm font-medium text-emerald-400">Kritik seviyede hammadde yok</p>
            <p className="text-xs text-slate-500 mt-1">Tüm hammaddeler optimum düzeyde.</p>
          </div>
        ) : (
          criticalItems.map(item => (
            <div 
              key={item.id} 
              className="flex justify-between items-center p-4 rounded-xl bg-[#151515] border border-rose-500/30 hover:border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.05)] hover:shadow-[0_0_20px_rgba(244,63,94,0.15)] transition-all"
            >
              <div>
                <p className="text-sm font-bold text-white tracking-wide">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 w-16 bg-[#222] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" 
                      style={{ width: `${Math.min((item.stockKg / item.minimumStockAlert) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Kritik Eşik: {item.minimumStockAlert} Kg</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.4)]">
                  {item.stockKg.toLocaleString('tr-TR')}
                </span>
                <span className="text-xs text-rose-500/80 ml-1">Kg</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
