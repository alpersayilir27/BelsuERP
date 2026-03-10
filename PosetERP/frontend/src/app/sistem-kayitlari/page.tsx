"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";
import { ClipboardList, Clock, Loader2, ArrowRightCircle, PlusCircle, Pencil, Trash2, ShieldAlert } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string | null;
  actionType: string;
  entityName: string;
  entityId: string;
  oldValues: string | null;
  newValues: string | null;
  timestamp: string;
}

export default function SistemKayitlariPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await authFetch("http://localhost:5257/api/AuditLogs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Audit log error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionConfig = (action: string) => {
    switch(action) {
      case 'Added':
        return { icon: PlusCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]', text: 'Eklendi' };
      case 'Modified':
        return { icon: Pencil, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', shadow: 'shadow-[0_0_15px_rgba(251,191,36,0.2)]', text: 'Güncellendi' };
      case 'Deleted':
        return { icon: Trash2, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.2)]', text: 'Silindi' };
      default:
        return { icon: ShieldAlert, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]', text: action };
    }
  };

  const formatJSON = (jsonString: string | null) => {
    if (!jsonString) return null;
    try {
      const obj = JSON.parse(jsonString);
      return (
        <pre className="text-xs text-slate-400 font-mono mt-2 bg-[#0A0A0A] p-2 rounded-lg border border-[#333] overflow-x-auto">
          {JSON.stringify(obj, null, 2)}
        </pre>
      );
    } catch {
      return <span className="text-slate-500 text-xs">{jsonString}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-[#111111] p-6 rounded-2xl border border-[#222] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <ClipboardList className="text-cyan-400" size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Sistem Kayıtları</h1>
          </div>
          <p className="text-slate-400">Veritabanında yapılan tüm kritik CRUD işlemlerini izleyin. (Audit Log)</p>
        </div>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#222] shadow-2xl relative overflow-hidden min-h-[500px] p-8">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]/50 backdrop-blur-sm z-10">
            <Loader2 size={40} className="text-cyan-500 animate-spin mb-4 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            <p className="text-cyan-400 font-medium animate-pulse">Kayıtlar Yükleniyor...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-24 text-slate-500">
            <ShieldAlert size={64} className="mb-4 opacity-20" />
            <p className="text-lg">Henüz hiç sistem kaydı (Audit Log) oluşmamış.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-[#333] pl-8 space-y-8 pb-4">
            {logs.map((log) => {
              const config = getActionConfig(log.actionType);
              const Icon = config.icon;
              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Node */}
                  <div className={`absolute -left-[41px] top-1 w-5 h-5 rounded-full ${config.bg} ${config.color} border border-current flex items-center justify-center z-10 ${config.shadow}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  </div>

                  <div className="bg-[#151515] border border-[#222] rounded-xl p-5 hover:border-[#333] transition-colors shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.bg} ${config.border} border`}>
                          <Icon size={18} className={config.color} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-medium">{log.entityName}</h3>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.bg} ${config.color} border ${config.border}`}>
                              {config.text}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-slate-500 mt-1">ID: {log.entityId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Clock size={14} />
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                      {log.oldValues && log.oldValues !== "{}" && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest pl-1 mb-1">Eski Değerler</p>
                          {formatJSON(log.oldValues)}
                        </div>
                      )}
                      {log.newValues && log.newValues !== "{}" && (
                        <div>
                          <p className="text-xs font-semibold text-cyan-500 uppercase tracking-widest pl-1 mb-1">Yeni Değerler</p>
                          {formatJSON(log.newValues)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
