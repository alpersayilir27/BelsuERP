"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";
import { 
  PackageOpen, 
  CheckCircle2, 
  Truck,
  Loader2,
  Calendar,
  AlertCircle,
  X
} from "lucide-react";

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  targetDeliveryDate?: string;
  bagType: string;
  dimensions?: string;
  thicknessMicron: number;
  requestedAmountKg: number;
  status: string;
}

export default function SevkiyatPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"bekleyen" | "arsiv">("bekleyen");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCompletedOrders = async () => {
    try {
      setLoading(true);
      const response = await authFetch("http://localhost:5257/api/orders");
      if (!response.ok) throw new Error("Siparişler getirilemedi.");
      
      const data: Order[] = await response.json();
      setOrders(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  const handleOpenModal = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleDeliver = async () => {
    if (!selectedOrder) return;
    try {
      setIsSubmitting(true);
      const response = await authFetch(`http://localhost:5257/api/orders/${selectedOrder.id}/deliver`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.Error || "Teslimat işlemi başarısız oldu.");
      }

      await fetchCompletedOrders();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-400">Sevkiyat bekleyen siparişler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col blur-0 transition-all duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] p-6 rounded-2xl border border-[#222] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all">
            <Truck className="text-cyan-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1 drop-shadow-sm">Sevkiyat Yönetimi</h1>
            <p className="text-sm text-slate-400">Üretimi tamamlanmış siparişlerin teslimatını ve arşivlenmesini yönetin.</p>
          </div>
        </div>

        {/* TAB TOGGLE */}
        <div className="flex bg-[#111111] border border-[#333] rounded-xl p-1 shrink-0 relative z-10 mt-4 sm:mt-0">
          <button
            onClick={() => setActiveTab("bekleyen")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${activeTab === "bekleyen" ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-slate-400 hover:text-white"}`}
          >
            Bekleyen Sevkiyatlar
          </button>
          <button
            onClick={() => setActiveTab("arsiv")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${activeTab === "arsiv" ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-slate-400 hover:text-white"}`}
          >
            Sevkiyat Arşivi
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-rose-400 shrink-0" size={20} />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.filter(o => activeTab === "bekleyen" ? o.status === "Completed" : o.status === "Shipped").length === 0 && !error ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-[#111111] border border-[#222] rounded-2xl border-dashed">
            <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2 pb-2">
              {activeTab === "bekleyen" ? "Sevkiyat Bekleyen Sipariş Yok" : "Arşivde Sipariş Yok"}
            </h3>
            <p className="text-slate-500 text-sm text-center max-w-sm">
              {activeTab === "bekleyen" 
                ? "Tüm üretim süreçleri tamamlanan bir sipariş olduğunda burada teslimat için listelenecektir." 
                : "Henüz teslim edilerek arşive kaldırılmış bir sipariş bulunmuyor."}
            </p>
          </div>
        ) : (
          orders
            .filter(o => activeTab === "bekleyen" ? o.status === "Completed" : o.status === "Shipped")
            .map(order => (
            <div key={order.id} className="bg-[#111111] border border-[#222] rounded-2xl p-6 flex flex-col hover:border-cyan-500/30 transition-all hover:shadow-[0_4px_20px_rgba(6,182,212,0.1)] group relative">
              
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {order.customerName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#222] text-slate-300 border border-[#333]">
                      {order.bagType}
                    </span>
                    {activeTab === "bekleyen" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Üretim Bitti
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {new Date().toLocaleDateString('tr-TR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 flex items-center gap-2">
                    <PackageOpen size={14} /> Miktar:
                  </span>
                  <span className="text-white font-medium">{order.requestedAmountKg.toLocaleString('tr-TR')} Kg</span>
                </div>
                {order.targetDeliveryDate && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 flex items-center gap-2">
                      <Calendar size={14} /> Teslim Tarihi:
                    </span>
                    <span className="text-slate-300 font-medium">{new Date(order.targetDeliveryDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                )}
                {order.dimensions && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Ebat:</span>
                    <span className="text-slate-300">{order.dimensions}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Kalınlık:</span>
                  <span className="text-slate-300">{order.thicknessMicron} Mikron</span>
                </div>
              </div>
              
              {activeTab === "bekleyen" ? (
                <button
                  onClick={() => handleOpenModal(order)}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500/10 to-emerald-400/10 hover:from-emerald-500 hover:to-emerald-400 text-emerald-400 hover:text-[#050505] font-semibold rounded-xl border border-emerald-500/20 hover:border-transparent hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <Truck size={18} />
                  <span>Teslim Et / Arşivle</span>
                </button>
              ) : (
                <div className="mt-auto self-end flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#333] opacity-80 backdrop-blur-sm">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">Teslim Edildi</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* İRSALİYE / TESLİMAT MODALI */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />
          
          <div className="relative bg-[#111111] border border-[#222] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#151515]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Teslimat Onayı (İrsaliye)</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-white transition-colors bg-transparent border-none p-1 rounded-md hover:bg-[#222]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: İrsaliye Tasarımı */}
            <div className="p-8 space-y-6">
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white tracking-widest uppercase opacity-90">BELSU <span className="text-cyan-400 opacity-80">ERP</span></h2>
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#444] to-transparent mx-auto mt-4 mb-2"></div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-4">
                  <span>Tarih: {new Date().toLocaleDateString('tr-TR')}</span>
                  <span>|</span>
                  <span>Saat: {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                </p>
              </div>

              <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6 relative overflow-hidden group">
                {/* Çok şık bir hologramik detay */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors"></div>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-baseline border-b border-[#222] pb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Müşteri Firması</span>
                    <span className="text-lg font-bold text-cyan-400 text-right">{selectedOrder.customerName}</span>
                  </div>
                  
                  <div className="flex justify-between items-baseline border-b border-[#222] pb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Poşet Tipi</span>
                    <span className="text-white font-medium">{selectedOrder.bagType}</span>
                  </div>

                  <div className="flex justify-between items-baseline border-b border-[#222] pb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ebat & Kalınlık</span>
                    <span className="text-slate-300 font-medium">
                      {selectedOrder.dimensions ? `${selectedOrder.dimensions} / ` : ''}{selectedOrder.thicknessMicron} Mikron
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Toplam Miktar</span>
                    <span className="text-2xl font-black text-emerald-400 text-right drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                      {selectedOrder.requestedAmountKg.toLocaleString('tr-TR')} <span className="text-sm font-medium text-emerald-500/70">Kg</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex gap-3 text-emerald-300/80 text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>Bu siparişi teslim ettiğinizde, statüsü arşivlenecek ve aktif listeden kaldırılacaktır. Bu işlem geri alınamaz.</p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#222] bg-[#151515] flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-transparent hover:bg-[#222] rounded-xl transition-colors disabled:opacity-50"
              >
                İptal Et
              </button>
              <button
                type="button"
                onClick={handleDeliver}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-bold flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#050505] rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <Truck size={18} />
                    Teslimatı Onayla
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
