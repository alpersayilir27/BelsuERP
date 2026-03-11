"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "../../lib/authFetch";
import { Plus, ShoppingCart, Calendar, AlertCircle, X, Loader2, Play, FilePlus, ArrowRight, ClipboardList, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import { ExportButtons } from "../../components/ExportButtons";

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  targetDeliveryDate: string;
  bagType: string;
  dimensions: string | null;
  thicknessMicron: number;
  requestedAmountKg: number;
  totalPrice: number;
  estimatedCost?: number;
  status: string;
}

interface Customer {
  id: string;
  companyName: string;
}

export default function SiparislerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [targetDeliveryDateFilter, setTargetDeliveryDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingProduction, setIsStartingProduction] = useState<string | null>(null);
  
  const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean, orderId: string | null }>({ isOpen: false, orderId: null });

  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customerId: "",
    bagType: "0", // Default: Baskili
    dimensions: "",
    thicknessMicron: "",
    requestedAmountKg: "",
    totalPrice: "",
    estimatedCost: "",
    targetDeliveryDate: "",
  });
  
  const router = useRouter();

  const bagTypes = [
    { value: "0", label: "Baskılı" },
    { value: "1", label: "Baskısız" },
    { value: "2", label: "Atlet Poşet" },
    { value: "3", label: "Takviyeli" }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      
      let ordersUrl = `http://localhost:5257/api/Orders?page=${page}&pageSize=${pageSize}`;
      if (targetDeliveryDateFilter) ordersUrl += `&targetDeliveryDate=${targetDeliveryDateFilter}`;
      if (statusFilter && statusFilter !== "ALL") ordersUrl += `&status=${statusFilter}`;

      const [ordersRes, customersRes] = await Promise.all([
        authFetch(ordersUrl),
        authFetch("http://localhost:5257/api/Customers")
      ]);

      if (!ordersRes.ok || !customersRes.ok) {
        throw new Error("Veriler alınırken bir hata oluştu.");
      }

      const ordersData = await ordersRes.json();
      const customersData = await customersRes.json();
      
      const items = Array.isArray(ordersData) ? ordersData : (ordersData.items || []);
      setOrders(items);
      if (!Array.isArray(ordersData)) {
          setTotalPages(ordersData.totalPages || 1);
          setTotalCount(ordersData.totalCount || items.length);
      }
      setCustomers(customersData);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Role Guard
    const userRole = localStorage.getItem("userRole");
    if (userRole === "Usta") {
      router.push("/uretim");
      return;
    }
    
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [router, page, targetDeliveryDateFilter, statusFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const preventInvalidNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
      e.preventDefault();
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value: rawValue } = e.target;
    const value = rawValue.replace(/\D/g, ""); // Keep only digits
    if (!value) {
      setFormData((prev) => ({ ...prev, [name]: "" }));
      return;
    }
    const formatted = new Intl.NumberFormat("tr-TR").format(parseInt(value, 10));
    setFormData((prev) => ({ ...prev, [name]: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.targetDeliveryDate || !formData.requestedAmountKg) return;

    try {
      setIsSubmitting(true);
      const response = await authFetch("http://localhost:5257/api/Orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: formData.customerId,
          targetDeliveryDate: new Date(formData.targetDeliveryDate).toISOString(),
          bagType: Number(formData.bagType),
          dimensions: formData.dimensions,
          thicknessMicron: Number(formData.thicknessMicron) || 0,
          requestedAmountKg: Number(formData.requestedAmountKg) || 0,
          totalPrice: Number(formData.totalPrice.replace(/\./g, "")) || 0,
          estimatedCost: Number(formData.estimatedCost.replace(/\./g, "")) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Sipariş eklenirken bir hata oluştu.");
      }

      setIsModalOpen(false);
      setFormData({
        customerId: "",
        bagType: "0",
        dimensions: "",
        thicknessMicron: "",
        requestedAmountKg: "",
        totalPrice: "",
        estimatedCost: "",
        targetDeliveryDate: "",
      });
      await fetchData();
      toast({
        type: "success",
        title: "Sipariş Oluşturuldu",
        message: `${formData.requestedAmountKg} Kg sipariş başarıyla eklendi.`
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Hata Oluştu",
        message: err.message || "Ekleme başarısız oldu."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeStartProduction = async () => {
    const orderId = confirmModalState.orderId;
    if (!orderId) return;
    
    try {
      setConfirmModalState({ isOpen: false, orderId: null });
      setIsStartingProduction(orderId);
      const response = await authFetch(`http://localhost:5257/api/Orders/${orderId}/start-production`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Üretime alma işlemi başarısız oldu.");
      }

      await fetchData();
      toast({
        type: "success",
        title: "Üretim Başladı",
        message: "Sipariş başarıyla üretim bandına alındı."
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Hata Oluştu",
        message: err.message || "İşlem başarısız oldu."
      });
    } finally {
      setIsStartingProduction(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2 shadow-[0_0_5px_rgba(245,158,11,0.8)]"></span>
            Bekliyor
          </span>
        );
      case "InProduction":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2 shadow-[0_0_5px_rgba(6,182,212,0.8)] animate-pulse"></span>
            Üretimde
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
            Tamamlandı
          </span>
        );
      case "Shipped":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(96,165,250,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2 shadow-[0_0_5px_rgba(96,165,250,0.8)]"></span>
            Sevk Edildi
          </span>
        );
      case "Delivered":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_10px_rgba(167,139,250,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mr-2 shadow-[0_0_5px_rgba(167,139,250,0.8)]"></span>
            Teslim Edildi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-500/10 text-slate-400 border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Siparişler</h2>
          <p className="text-slate-400 mt-1">Müşteri siparişlerini kaydedin ve üretim sürecini başlatın.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <ExportButtons 
              excelUrl={`http://localhost:5257/api/Export/excel/orders?targetDeliveryDate=${targetDeliveryDateFilter}&status=${statusFilter}`} 
              excelFilename={`Siparisler_${new Date().toISOString().split('T')[0]}.xlsx`} 
          />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group relative px-6 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-medium rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Yeni Sipariş Ekle</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-[#111111] p-4 rounded-2xl border border-[#222] flex flex-col sm:flex-row gap-4 items-center shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="flex flex-col gap-1 flex-1 sm:max-w-[200px]">
            <label className="text-xs text-slate-500 font-medium ml-1">Durum Filtresi</label>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 w-full"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="Pending">Bekliyor</option>
              <option value="InProduction">Üretimde</option>
              <option value="Completed">Tamamlandı</option>
              <option value="Shipped">Sevk Edildi</option>
              <option value="Delivered">Teslim Edildi</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 sm:max-w-[200px]">
            <label className="text-xs text-slate-500 font-medium ml-1">Teslim Tarihi</label>
            <input 
              type="date" 
              value={targetDeliveryDateFilter}
              onChange={e => { setTargetDeliveryDateFilter(e.target.value); setPage(1); }}
              className="bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 [color-scheme:dark] w-full"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#222] shadow-2xl relative overflow-hidden min-h-[400px]">
        {loading && orders.length === 0 && !error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-[#222] rounded-full"></div>
              <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin glow-cyan"></div>
            </div>
            <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse">Veriler yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10 px-4 text-center">
            <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">Bağlantı Hatası</h3>
            <p className="text-slate-400 text-sm max-w-md">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10">
            <div className="p-4 rounded-full bg-[#1A1A1A] text-slate-500 mb-4 border border-[#2A2A2A]">
              <ShoppingCart size={32} />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">Henüz sipariş yok</h3>
            <p className="text-slate-400 text-sm">Sisteme kayıtlı veya bekleyen herhangi bir sipariş bulunamadı.</p>
          </div>
        ) : (
          <div className={`overflow-x-auto w-full pb-4 transition-all duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {loading && orders.length > 0 && (
              <div className="absolute top-4 right-4 z-20 bg-[#111] p-2 rounded-full shadow-lg border border-[#333]">
                <Loader2 size={16} className="text-cyan-500 animate-spin" />
              </div>
            )}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] border-b border-[#222]">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Müşteri</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Poşet Tipi / Ebat</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Miktar (Kg)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Maliyet</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Tutar</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Teslim Tarihi</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Durum</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#151515] transition-colors group cursor-default">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white group-hover:text-cyan-100 transition-colors">
                          {order.customerName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-200">
                          {order.bagType.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">
                          {order.dimensions || "Ölçü Girilmedi"} {order.thicknessMicron ? `• ${order.thicknessMicron} Mikron` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-emerald-400">
                        {order.requestedAmountKg.toLocaleString('tr-TR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                        {order.estimatedCost ? order.estimatedCost.toLocaleString('tr-TR') : "0"} ₺
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                        {order.totalPrice ? order.totalPrice.toLocaleString('tr-TR') : "0"} ₺
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar size={14} className="text-slate-500" />
                        <span className="text-sm">
                          {new Date(order.targetDeliveryDate).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.status === "Pending" && (
                        <button
                          onClick={() => setConfirmModalState({ isOpen: true, orderId: order.id })}
                          disabled={isStartingProduction === order.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-[#050505] text-xs font-semibold rounded-lg border border-cyan-500/30 hover:border-transparent transition-all shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isStartingProduction === order.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Play size={14} />
                          )}
                          Üretime Al
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && orders.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#222] bg-[#151515] flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Toplam <span className="text-cyan-400 font-medium">{totalCount}</span> siparişten <span className="font-medium text-white">{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)}</span> arası gösteriliyor.
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-[#0A0A0A] border border-[#333] rounded-lg text-slate-400 hover:text-white hover:border-cyan-500/50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center px-3 font-medium text-sm text-slate-300">
                {page} / {totalPages}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-[#0A0A0A] border border-[#333] rounded-lg text-slate-400 hover:text-white hover:border-cyan-500/50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />
          
          <div className="relative bg-[#111111] border border-[#222] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#151515]">
              <h3 className="text-lg font-semibold text-white">Yeni Sipariş Oluştur</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-white transition-colors bg-transparent border-none p-1 rounded-md hover:bg-[#222]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="customerId" className="text-sm font-medium text-slate-300">
                    Müşteri Seçimi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="customerId"
                    name="customerId"
                    required
                    value={formData.customerId}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all appearance-none"
                  >
                    <option value="" disabled>Müşteri seçin...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="bagType" className="text-sm font-medium text-slate-300">
                    Poşet Tipi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="bagType"
                    name="bagType"
                    required
                    value={formData.bagType}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all appearance-none"
                  >
                    {bagTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="targetDeliveryDate" className="text-sm font-medium text-slate-300">
                    Hedef Teslim Tarihi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="targetDeliveryDate"
                    name="targetDeliveryDate"
                    required
                    value={formData.targetDeliveryDate}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="dimensions" className="text-sm font-medium text-slate-300">En x Boy (cm)</label>
                  <input
                    type="text"
                    id="dimensions"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                    placeholder="Örn: 30x40"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="thicknessMicron" className="text-sm font-medium text-slate-300">Kalınlık (Mikron)</label>
                  <input
                    type="number"
                    id="thicknessMicron"
                    name="thicknessMicron"
                    min="0"
                    value={formData.thicknessMicron}
                    onChange={handleInputChange}
                    onKeyDown={preventInvalidNumberInput}
                    className={`w-full bg-[#0A0A0A] border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all placeholder:text-slate-600 ${Number(formData.thicknessMicron) < 0 ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50' : 'border-[#333] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50'}`}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="requestedAmountKg" className="text-sm font-medium text-slate-300">
                    Miktar (Kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="requestedAmountKg"
                    name="requestedAmountKg"
                    required
                    min="1"
                    value={formData.requestedAmountKg}
                    onChange={handleInputChange}
                    onKeyDown={preventInvalidNumberInput}
                    className={`w-full bg-[#0A0A0A] border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all placeholder:text-slate-600 ${Number(formData.requestedAmountKg) < 0 ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50' : 'border-[#333] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50'}`}
                    placeholder="0"
                  />
                  {Number(formData.requestedAmountKg) < 0 && (
                    <p className="mt-1 text-xs font-bold text-rose-500 animate-pulse text-shadow-sm">
                      Negatif değer girilemez
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="estimatedCost" className="text-sm font-medium text-slate-300">
                    Tahmini Maliyet (₺)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="estimatedCost"
                      name="estimatedCost"
                      value={formData.estimatedCost}
                      onChange={handleCurrencyChange}
                      className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-4 pr-10 py-2.5 text-rose-400 font-bold text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 focus:shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all placeholder:text-rose-900/50"
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-rose-500 font-semibold">
                      ₺
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="totalPrice" className="text-sm font-medium text-slate-300">
                    Toplam Tutar (₺)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="totalPrice"
                      name="totalPrice"
                      value={formData.totalPrice}
                      onChange={handleCurrencyChange}
                      className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-4 pr-10 py-2.5 text-emerald-400 font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all placeholder:text-emerald-900/50"
                      placeholder="0"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-emerald-500 font-semibold">
                      ₺
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 mt-2 flex items-center justify-end gap-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-[#222] rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.customerId || !formData.targetDeliveryDate || !formData.requestedAmountKg || Number(formData.requestedAmountKg) < 0 || Number(formData.thicknessMicron) < 0}
                  className="px-5 py-2 flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-[#050505] font-semibold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    "Oluştur"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmModalState.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setConfirmModalState({ isOpen: false, orderId: null })}
          />
          <div className="relative bg-[#111111] border border-[#333] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-sm px-6 py-8 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/30">
              <Play size={28} className="text-cyan-400 translate-x-0.5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Üretime Al</h3>
            <p className="text-sm text-slate-400 mb-8">Bu siparişi onaylıyor ve üretim panosuna (Makinede) aktarmak istediğinize emin misiniz?</p>
            
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setConfirmModalState({ isOpen: false, orderId: null })}
                className="flex-1 py-3 bg-transparent text-slate-300 hover:text-white hover:bg-[#222] font-medium rounded-xl border border-[#333] transition-colors"
              >
                İptal Et
              </button>
              <button
                onClick={executeStartProduction}
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
