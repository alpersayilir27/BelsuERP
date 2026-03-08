"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "../lib/api";
import StockChart from "../components/StockChart";
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Activity,
  ArrowRight,
  Loader2
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    pendingOrdersCount: 0,
    totalCustomersCount: 0,
    criticalStockCount: 0,
    activeProductionCount: 0,
    recentOrders: [] as any[],
    rawMaterials: [] as any[]
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, customersRes, rawMaterialsRes, productionRes] = await Promise.all([
          fetchApi<any>('/Orders').catch(() => []),
          fetchApi<any>('/Customers').catch(() => []),
          fetchApi<any>('/RawMaterials').catch(() => []),
          fetchApi<any>('/Production').catch(() => [])
        ]);

        const extractArray = (res: any) => Array.isArray(res) ? res : (res?.data || res?.items || []);
        
        const orders = extractArray(ordersRes);
        const customers = extractArray(customersRes);
        const rawMaterials = extractArray(rawMaterialsRes);
        const productions = extractArray(productionRes);

        const pendingOrders = orders.filter((o: any) => o.status === 0 || o.status === 'Pending').length;
        const totalCustomers = customers.length;
        const criticalStocks = rawMaterials.filter((m: any) => m.stockKg < m.minimumStockAlert).length;
        const activeProductions = productions.filter((p: any) => p.status === 1 || p.status === 'InProgress').length;

        const sortedOrders = [...orders]
          .sort((a: any, b: any) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
          .slice(0, 5);

        setData({
          pendingOrdersCount: pendingOrders,
          totalCustomersCount: totalCustomers,
          criticalStockCount: criticalStocks,
          activeProductionCount: activeProductions,
          recentOrders: sortedOrders,
          rawMaterials: rawMaterials
        });
      } catch (error) {
        console.error("Dashboard veri yükleme hatası:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const stats = [
    {
      title: "Bekleyen Siparişler",
      value: data.pendingOrdersCount.toString(),
      icon: TrendingUp,
      trend: "Sırada bekleyen",
      trendColor: "text-emerald-400",
      glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
      iconColor: "text-emerald-400",
      bg: "bg-[#111111]"
    },
    {
      title: "Kritik Stok (Çeşit)",
      value: data.criticalStockCount.toString(),
      icon: AlertTriangle,
      trend: "İzleniyor",
      trendColor: "text-rose-400",
      glow: "shadow-[0_0_30px_rgba(244,63,94,0.15)]",
      iconColor: "text-rose-400",
      bg: "bg-[#111111]"
    },
    {
      title: "Toplam Müşteri",
      value: data.totalCustomersCount.toString(),
      icon: Users,
      trend: "Sistemdeki cari",
      trendColor: "text-cyan-400",
      glow: "shadow-[0_0_30px_rgba(6,182,212,0.15)]",
      iconColor: "text-cyan-400",
      bg: "bg-[#111111]"
    },
    {
      title: "Aktif Üretim",
      value: data.activeProductionCount.toString(),
      icon: Activity,
      trend: "Devam eden",
      trendColor: "text-violet-400",
      glow: "shadow-[0_0_30px_rgba(139,92,246,0.15)]",
      iconColor: "text-violet-400",
      bg: "bg-[#111111]"
    }
  ];

  const getStatusDisplay = (status: number | string) => {
    switch(status) {
      case 0:
      case 'Pending':
        return { text: 'Bekliyor', classes: 'bg-amber-400/10 text-amber-400 border-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]', dot: 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)]' };
      case 1:
      case 'InProduction':
        return { text: 'Üretimde', classes: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]', dot: 'bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.8)]' };
      case 2:
      case 'Completed':
        return { text: 'Tamamlandı', classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]', dot: 'bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)]' };
      case 3:
      case 'Shipped':
        return { text: 'Sevk Edildi', classes: 'bg-blue-400/10 text-blue-400 border-blue-400/20 shadow-[0_0_10px_rgba(96,165,250,0.1)]', dot: 'bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.8)]' };
      default:
        return { text: 'Bilinmiyor', classes: 'bg-gray-400/10 text-gray-400 border-gray-400/20', dot: 'bg-gray-400' };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header section */}
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Hoş Geldiniz, Alper</h2>
        <p className="text-slate-400 mt-1">İşletmenizin bugünkü genel durumu.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-[#222] rounded-full"></div>
            <div className="w-12 h-12 border-4 border-cyan-400 rounded-full border-t-transparent animate-spin absolute top-0 left-0 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
          </div>
          <p className="text-cyan-400 animate-pulse font-medium">Veriler yükleniyor...</p>
        </div>
      ) : (
        <>
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
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stock Chart */}
          <StockChart data={data.rawMaterials} />

          {/* Recent Orders Table */}
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
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Miktar (Kg)</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {data.recentOrders.length > 0 ? (
                    data.recentOrders.map((order, i) => {
                      const statusInfo = getStatusDisplay(order.status);
                      return (
                        <tr key={order.id || i} className="hover:bg-[#151515] transition-colors cursor-pointer group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                              {order.id ? `#ORD-${order.id.toString().substring(0,6).toUpperCase()}` : "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-300">{order.customerName || order.customer?.companyName || "Bilinmiyor"}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-300 font-medium">{order.requestedAmountKg || 0} Kg</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.classes}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${statusInfo.dot}`}></span>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {formatDate(order.orderDate)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        Henüz hiç sipariş bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
