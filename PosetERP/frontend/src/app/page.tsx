"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "../lib/api";
import StockChart from "../components/StockChart";
import OrderStatusChart from "../components/OrderStatusChart";
import CriticalStockList from "../components/CriticalStockList";
import CostProfitChart from "../components/CostProfitChart";
import {
  TrendingUp,
  AlertTriangle,
  Wallet,
  Activity,
  ArrowRight,
  Loader2
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    pendingOrdersCount: 0,
    totalProfit: 0,
    criticalStockCount: 0,
    activeProductionCount: 0,
    recentOrders: [] as any[],
    rawMaterials: [] as any[],
    allOrders: [] as any[]
  });
  const [userName, setUserName] = useState<string>("");
  
  const router = useRouter();
  const t = useTranslations("Dashboard");

  useEffect(() => {
    // Role Guard
    const userRole = localStorage.getItem("userRole");
    if (userRole === "Usta") {
      router.push("/uretim");
      return;
    }

    setUserName(localStorage.getItem("userName") || "");

    async function loadData() {
      try {
        const [ordersRes, customersRes, rawMaterialsRes, productionRes] = await Promise.all([
          fetchApi<any>('/Orders').catch(() => []),
          fetchApi<any>('/Customers').catch(() => []),
          fetchApi<any>('/RawMaterials').catch(() => []),
          fetchApi<any>('/Production').catch(() => [])
        ]);

        const extractArray = (res: any) => Array.isArray(res) ? res : (res?.Items || res?.data || res?.items || []);
        
        const orders = extractArray(ordersRes);
        const customers = extractArray(customersRes);
        const rawMaterials = (extractArray(rawMaterialsRes)).map((m: any) => ({
          id: m.id || m.Id,
          name: m.name || m.Name || "Bilinmiyor",
          stockKg: Number(m.stockKg ?? m.StockKg ?? 0),
          minimumStockAlert: Number(m.minimumStockAlert ?? m.MinimumStockAlert ?? 0)
        }));
        const productions = extractArray(productionRes);

        const pendingOrders = orders.filter((o: any) => o.status === 0 || o.status === 'Pending').length;
        const totalProfit = orders
          .filter((o: any) => o.status === 2 || o.status === 3 || o.status === 4 || o.status === 'Completed' || o.status === 'Shipped' || o.status === 'Delivered')
          .reduce((sum: number, o: any) => {
            const price = Number(o.totalPrice ?? o.TotalPrice ?? 0);
            const cost = Number(o.totalCost ?? o.TotalCost ?? o.estimatedCost ?? o.EstimatedCost ?? 0);
            return sum + (price - cost);
          }, 0);
        const criticalStocks = rawMaterials.filter((m: any) => m.stockKg < m.minimumStockAlert).length;
        const activeProductions = orders.filter((o: any) => o.status === 1 || o.status === 'InProduction').length;

        const sortedOrders = [...orders]
          .sort((a: any, b: any) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
          .slice(0, 5);

        setData({
          pendingOrdersCount: pendingOrders,
          totalProfit: totalProfit,
          criticalStockCount: criticalStocks,
          activeProductionCount: activeProductions,
          recentOrders: sortedOrders,
          rawMaterials: rawMaterials,
          allOrders: orders
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
      title: t("pendingOrders"),
      value: data.pendingOrdersCount.toString(),
      icon: TrendingUp,
      trend: "Sırada bekleyen",
      trendColor: "text-emerald-400",
      glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
      iconColor: "text-emerald-400",
      bg: "bg-[#111111]"
    },
    {
      title: t("criticalStock"),
      value: data.criticalStockCount.toString(),
      icon: AlertTriangle,
      trend: "İzleniyor",
      trendColor: "text-rose-400",
      glow: "shadow-[0_0_30px_rgba(244,63,94,0.15)]",
      iconColor: "text-rose-400",
      bg: "bg-[#111111]"
    },
    {
      title: "Net Kâr",
      value: `₺${data.totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      trend: "Sistemde kayıtlı toplam kâr",
      trendColor: "text-emerald-400",
      glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
      iconColor: "text-emerald-400",
      bg: "bg-[#111111]"
    },
    {
      title: t("activeProduction"),
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
      case 4:
      case 'Delivered':
        return { text: 'Teslim Edildi', classes: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]', dot: 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' };
      case 5:
      case 'Cancelled':
        return { text: 'İptal Edildi', classes: 'bg-rose-400/10 text-rose-400 border-rose-400/20 shadow-[0_0_10px_rgba(251,113,133,0.1)]', dot: 'bg-rose-400 shadow-[0_0_5px_rgba(251,113,133,0.8)]' };
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
        <h2 className="text-2xl font-semibold text-white tracking-tight">
          {t("welcome")}{userName ? `, ${userName}` : ""}
        </h2>
        <p className="text-slate-400 mt-1">{t("subtitle")}</p>
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

          {/* Status & Critical Analysis Grid */}
          <div className="grid grid-cols-1 gap-6">
            <div className="h-[400px] col-span-full">
              <CostProfitChart orders={data.allOrders} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-full min-h-[400px]">
                <OrderStatusChart orders={data.allOrders} />
              </div>
              <div className="h-full min-h-[400px]">
                <CriticalStockList rawMaterials={data.rawMaterials} />
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-[#111111] rounded-2xl border border-[#222] overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-[#222] flex justify-between items-center bg-[#151515]">
              <h3 className="text-lg font-semibold text-white">{t("recentOrders")}</h3>
              <button onClick={() => router.push('/siparisler')} className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 group">
                {t("viewAll")}
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
