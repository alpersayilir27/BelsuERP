import {
  TrendingUp,
  AlertTriangle,
  Users,
  Activity,
  ArrowRight
} from "lucide-react";

const stats = [
  {
    title: "Bekleyen Siparişler",
    value: "142",
    icon: TrendingUp,
    trend: "+12%",
    trendColor: "text-emerald-400",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    iconColor: "text-emerald-400",
    bg: "bg-[#111111]"
  },
  {
    title: "Kritik Stok (Kg)",
    value: "850",
    icon: AlertTriangle,
    trend: "-5%",
    trendColor: "text-rose-400",
    glow: "shadow-[0_0_30px_rgba(244,63,94,0.15)]",
    iconColor: "text-rose-400",
    bg: "bg-[#111111]"
  },
  {
    title: "Toplam Müşteri",
    value: "1,204",
    icon: Users,
    trend: "+24 Bu Ay",
    trendColor: "text-cyan-400",
    glow: "shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    iconColor: "text-cyan-400",
    bg: "bg-[#111111]"
  },
  {
    title: "Aktif Üretim",
    value: "8 Band",
    icon: Activity,
    trend: "%92 Kapasite",
    trendColor: "text-violet-400",
    glow: "shadow-[0_0_30px_rgba(139,92,246,0.15)]",
    iconColor: "text-violet-400",
    bg: "bg-[#111111]"
  }
];

const mockOrders = [
  { id: "#ORD-9021", customer: "Vortex Agency", amount: "₺45.000", status: "Üretimde", date: "Bugün, 14:30" },
  { id: "#ORD-9020", customer: "Beta Ltd.", amount: "₺12.500", status: "Bekliyor", date: "Bugün, 11:15" },
  { id: "#ORD-9019", customer: "Gamma A.Ş.", amount: "₺89.200", status: "Tamamlandı", date: "Dün, 16:45" },
  { id: "#ORD-9018", customer: "Delta Plastik", amount: "₺34.000", status: "Üretimde", date: "Dün, 09:20" },
];

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header section */}
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Hoş Geldiniz, Alper</h2>
        <p className="text-slate-400 mt-1">İşletmenizin bugünkü genel durumu.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl ${stat.bg} border border-[#222] ${stat.glow} transition-transform hover:-translate-y-1 duration-300 relative overflow-hidden group`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-white/10 transition-colors" />

              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-white mt-3 tracking-tight">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-black/50 ${stat.iconColor} border border-[#222]`}>
                  <Icon size={24} />
                </div>
              </div>
              <div className="mt-5 flex items-center relative z-10">
                <span className={`text-sm font-medium ${stat.trendColor}`}>{stat.trend}</span>
                <span className="text-sm text-slate-500 ml-2">önceki döneme göre</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Table Skeleton */}
      <div className="bg-[#111111] rounded-2xl border border-[#222] overflow-hidden shadow-2xl relative">
        <div className="p-6 border-b border-[#222] flex justify-between items-center bg-[#151515]">
          <h3 className="text-lg font-semibold text-white">Son Siparişler</h3>
          <button className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 group">
            Tümünü Gör
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A0A0A] border-b border-[#222]">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sipariş No</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Müşteri</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tutar</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {mockOrders.map((order, i) => (
                <tr key={i} className="hover:bg-[#151515] transition-colors cursor-pointer group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">{order.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300">{order.customer}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-300 font-medium">{order.amount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                      ${order.status === 'Tamamlandı' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                        order.status === 'Üretimde' ? 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]' :
                          'bg-amber-400/10 text-amber-400 border-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]'}`}
                    >
                      {order.status === 'Tamamlandı' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>}
                      {order.status === 'Üretimde' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2 shadow-[0_0_5px_rgba(6,182,212,0.8)]"></span>}
                      {order.status === 'Bekliyor' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2 shadow-[0_0_5px_rgba(251,191,36,0.8)]"></span>}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {order.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
