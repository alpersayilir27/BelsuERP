"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";
import { 
  Factory, 
  Settings2, 
  CheckCircle2, 
  CircleDashed,
  AlertCircle,
  Loader2,
  X,
  PackageCheck,
  PackageOpen,
  ArrowRight
} from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import { ExportButtons } from "../../components/ExportButtons";

interface ProductionStage {
  id: string;
  orderId: string;
  customerName: string;
  bagType: string;
  requestedAmountKg: number;
  stageType: string;
  status: string;
  consumedMaterialKg: number;
  wasteKg: number;
  targetDeliveryDate?: string;
  orderStatus?: string;
}

interface RawMaterial {
  id: string;
  name: string;
  stockKg: number;
  category: string;
}

export default function UretimPage() {
  const [stages, setStages] = useState<ProductionStage[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"aktif" | "gecmis">("aktif");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ProductionStage | null>(null);

  const [formData, setFormData] = useState({
    materialId: "",
    consumedAmountKg: "",
    wasteKg: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [stagesRes, materialsRes] = await Promise.all([
        authFetch("http://localhost:5257/api/production"),
        authFetch("http://localhost:5257/api/RawMaterials")
      ]);

      if (!stagesRes.ok || !materialsRes.ok) {
        throw new Error("Veriler alınırken bir hata oluştu.");
      }

      const stagesData: ProductionStage[] = await stagesRes.json();
      const materialsData: RawMaterial[] = await materialsRes.json();
      
      setStages(stagesData);
      setMaterials(materialsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (stage: ProductionStage) => {
    setSelectedStage(stage);
    
    // Filtreleme Mantığı
    let defaultMaterialId = "";
    if (stage.stageType === "Extruder") {
      const granul = materials.filter(m => m.category === "Granül");
      if (granul.length > 0) defaultMaterialId = granul[0].id;
    } else if (stage.stageType === "Printing") {
      const boya = materials.filter(m => m.category === "Boya");
      if (boya.length > 0) defaultMaterialId = boya[0].id;
    }

    setFormData({
      materialId: defaultMaterialId,
      consumedAmountKg: "",
      wasteKg: "",
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const preventInvalidNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStage) return;
    
    const isCutting = selectedStage.stageType === "Cutting";
    if (!isCutting && (!formData.materialId || formData.consumedAmountKg === "")) return;

    try {
      setIsSubmitting(true);
      const response = await authFetch(`http://localhost:5257/api/production/${selectedStage.id}/consume-material`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: isCutting ? null : formData.materialId,
          consumedAmountKg: isCutting ? 0 : (Number(formData.consumedAmountKg) || 0),
          wasteKg: Number(formData.wasteKg) || 0,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.Error || "İşlem başarısız oldu.");
      }

      // 2. Statü Güncellemesi (Finished)
      const statusResponse = await authFetch(`http://localhost:5257/api/production/${selectedStage.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(2) // 2 = Finished
      });

      if (!statusResponse.ok) {
        const statusErrData = await statusResponse.json();
        throw new Error(statusErrData.Error || "Hammade düşüldü ancak statü güncellenemedi.");
      }

      await fetchData();
      setIsModalOpen(false);
      toast({
        type: "success",
        title: "Üretim Tamamlandı",
        message: `${selectedStage.stageType} aşaması tamamlandı ve hammadde düşüldü.`
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Kayıt Hatası",
        message: err.message || "İşlem başarısız oldu."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "NotStarted":
        return { 
          icon: CircleDashed, 
          text: "Başlamadı",
          color: "text-slate-500", 
          bg: "bg-slate-500/10",
          border: "border-slate-500/20"
        };
      case "InProgress":
        return { 
          icon: Settings2, 
          text: "Devam Ediyor",
          color: "text-amber-400", 
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          glow: "shadow-[0_0_10px_rgba(245,158,11,0.1)]",
          animate: "animate-spin-slow"
        };
      case "Finished":
        return { 
          icon: CheckCircle2, 
          text: "Tamamlandı",
          color: "text-emerald-400", 
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
          glow: "shadow-[0_0_10px_rgba(16,185,129,0.1)]"
        };
      default:
        return { icon: CircleDashed, text: status, color: "text-slate-400", bg: "bg-slate-800", border: "border-slate-700" };
    }
  };

  const getStageNameTr = (stage: string) => {
    switch(stage) {
      case "Extruder": return "Ekstruder (Film Çekimi)";
      case "Printing": return "Matbaa (Baskı)";
      case "Cutting": return "Kesim (Şekillendirme)";
      default: return stage;
    }
  };

  const handleDragStart = (e: React.DragEvent, stageId: string) => {
    e.dataTransfer.setData("stageId", stageId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const stageId = e.dataTransfer.getData("stageId");
    if (!stageId) return;

    const stage = stages.find(s => s.id === stageId);
    if (!stage || stage.status === newStatus) return;

    if (newStatus === "Finished") {
      handleOpenModal(stage);
    } else {
      try {
        const statusValue = newStatus === "InProgress" ? 1 : 0;
        const response = await authFetch(`http://localhost:5257/api/production/${stageId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(statusValue)
        });
        if (response.ok) {
          await fetchData();
          toast({
            type: "success",
            title: "Durum Güncellendi",
            message: `Aşama ${newStatus === 'InProgress' ? 'Makinede' : 'Bekliyor'} olarak işaretlendi.`
          });
        } else {
          const errData = await response.json();
          toast({ type: "error", title: "Hata", message: errData.Error || "Durum güncellenemedi." });
        }
      } catch (err: any) {
        toast({ type: "error", title: "Beklenmeyen Hata", message: err.message || "İşlem başarısız oldu." });
      }
    }
  };

  const columns = [
    { id: "NotStarted", title: "Bekleyenler", borderColor: "border-slate-500/30", bg: "bg-slate-500/5", titleColor: "text-slate-300" },
    { id: "InProgress", title: "Makinede", borderColor: "border-amber-500/30", bg: "bg-amber-500/5", titleColor: "text-amber-400" },
    { id: "Finished", title: "Tamamlananlar", borderColor: "border-emerald-500/30", bg: "bg-emerald-500/5", titleColor: "text-emerald-400" }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Üretim Hattı</h2>
          <p className="text-slate-400 mt-1">Aktif siparişlerin üretim aşamalarını ve hammadde kullanımını yönetin.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto z-20 relative">
          {/* TAB TOGGLE */}
          <div className="flex bg-[#111111] border border-[#333] rounded-xl p-1 shrink-0">
            <button
              onClick={() => setActiveTab("aktif")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 ${activeTab === "aktif" ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-slate-400 hover:text-white"}`}
            >
              Aktif Pano
            </button>
            <button
              onClick={() => setActiveTab("gecmis")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 ${activeTab === "gecmis" ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-slate-400 hover:text-white"}`}
            >
              Üretim Geçmişi
            </button>
          </div>

          {/* Dropdown Filter - Only show in Aktif Pano */}
          {activeTab === "aktif" && (
            <div className="w-full sm:w-72 relative">
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-[#111111] border border-[#333] hover:border-[#555] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 appearance-none transition-all shadow-lg cursor-pointer"
              >
                <option value="ALL">Tüm Siparişler</option>
                {Array.from(new Map(stages.filter(s => s.orderStatus !== "Completed" && s.orderStatus !== "Shipped" && s.orderStatus !== "Delivered").map(s => [s.orderId, { id: s.orderId, name: s.customerName, bag: s.bagType }])).values()).map(o => (
                  <option key={o.id} value={o.id}>{o.name} - {o.bag.replace('_', ' ')}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          )}
          
          {/* Export Buttons - Only show in Uretim Gecmisi */}
          {activeTab === "gecmis" && (
            <ExportButtons 
              excelUrl={`http://localhost:5257/api/Export/excel/production`} 
              excelFilename={`Uretim_Gecmisi_${new Date().toISOString().split('T')[0]}.xlsx`} 
            />
          )}
        </div>
      </div>

      {loading && stages.length === 0 && !error ? (
        <div className="bg-[#111111] rounded-2xl border border-[#222] shadow-2xl relative min-h-[400px] flex flex-col items-center justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-[#222] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin glow-cyan"></div>
          </div>
          <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse">Üretim verileri yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="bg-[#111111] rounded-2xl border border-[#222] shadow-2xl relative min-h-[400px] flex flex-col items-center justify-center px-4 text-center">
          <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-white font-medium text-lg mb-2">Bağlantı Hatası</h3>
          <p className="text-slate-400 text-sm max-w-md">{error}</p>
        </div>
      ) : stages.length === 0 ? (
        <div className="bg-[#111111] rounded-2xl border border-[#222] shadow-2xl relative min-h-[400px] flex flex-col items-center justify-center">
          <div className="p-4 rounded-full bg-[#1A1A1A] text-slate-500 mb-4 border border-[#2A2A2A]">
            <Factory size={32} />
          </div>
          <h3 className="text-white font-medium text-lg mb-2">Aktif Üretim Yok</h3>
          <p className="text-slate-400 text-sm">Üretime alınmış herhangi bir sipariş bulunmuyor.</p>
        </div>
      ) : (
        <div className={`relative transition-all duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          {loading && stages.length > 0 && (
            <div className="absolute top-[-48px] right-2 z-20 bg-[#111] p-2 rounded-full shadow-lg border border-[#333]">
              <Loader2 size={16} className="text-cyan-500 animate-spin" />
            </div>
          )}
          {activeTab === "gecmis" ? (
            <div className="bg-[#111111] border border-[#222] rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] border-b border-[#222]">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sipariş No</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Müşteri</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Poşet Tipi</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tamamlanan Aşama</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Harcanan Malzeme (Kg)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Fire (Kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {stages
                  .filter(s => s.status === "Finished" && (s.orderStatus === "Completed" || s.orderStatus === "Shipped" || s.orderStatus === "Delivered"))
                  .sort((a, b) => {
                    const orderIdCompare = a.orderId.localeCompare(b.orderId);
                    if (orderIdCompare !== 0) return orderIdCompare;
                    const stageOrderMapping: Record<string, number> = { "Extruder": 1, "Printing": 2, "Cutting": 3 };
                    return (stageOrderMapping[a.stageType] || 99) - (stageOrderMapping[b.stageType] || 99);
                  })
                  .map((stage, idx, arr) => {
                    const isNewOrder = idx > 0 && arr[idx - 1].orderId !== stage.orderId;
                    return (
                    <tr key={stage.id} className={`hover:bg-[#1A1A1A]/50 transition-colors group ${isNewOrder ? 'border-t-2 border-[#444]' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-cyan-500/80 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                            #ORD-{stage.orderId.substring(0, 6).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">{stage.customerName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#222] text-slate-300 border border-[#333]">
                          {stage.bagType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 size={16} />
                          <span className="text-sm">{getStageNameTr(stage.stageType)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-white drop-shadow-sm">{stage.consumedMaterialKg.toLocaleString('tr-TR')}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-slate-400">{stage.wasteKg.toLocaleString('tr-TR')}</span>
                      </td>
                    </tr>
                  )})}
                {stages.filter(s => s.status === "Finished" && (s.orderStatus === "Completed" || s.orderStatus === "Shipped" || s.orderStatus === "Delivered")).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 bg-[#111]">Geçmiş üretim kaydı bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map(col => {
            let colStages = stages.filter(s => 
              s.status === col.id && 
              s.orderStatus !== "Completed" && 
              s.orderStatus !== "Shipped" && 
              s.orderStatus !== "Delivered"
            );
            
            if (selectedOrderId !== "ALL") {
              colStages = colStages.filter(s => s.orderId === selectedOrderId);
            }
            
            const stageOrderMapping: Record<string, number> = { "Extruder": 1, "Printing": 2, "Cutting": 3 };
            colStages.sort((a, b) => {
              const customerCompare = a.customerName.localeCompare(b.customerName);
              if (customerCompare !== 0) return customerCompare;
              
              const orderIdCompare = a.orderId.localeCompare(b.orderId);
              if (orderIdCompare !== 0) return orderIdCompare;
              
              return (stageOrderMapping[a.stageType] || 99) - (stageOrderMapping[b.stageType] || 99);
            });

            const neonBorders = [
              "border-l-cyan-500",
              "border-l-fuchsia-500",
              "border-l-emerald-500",
              "border-l-amber-500",
              "border-l-rose-500",
              "border-l-indigo-500",
              "border-l-lime-500"
            ];
            
            const getOrderBorderColor = (orderId: string) => {
              let hash = 0;
              for (let i = 0; i < orderId.length; i++) {
                hash = orderId.charCodeAt(i) + ((hash << 5) - hash);
              }
              return neonBorders[Math.abs(hash) % neonBorders.length];
            };

            return (
              <div 
                key={col.id} 
                className={`flex flex-col bg-[#111111] rounded-2xl border ${col.borderColor} shadow-xl overflow-hidden min-h-[500px]`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className={`p-4 border-b border-[#222] ${col.bg} flex justify-between items-center`}>
                  <h3 className={`text-lg font-bold ${col.titleColor} tracking-wide`}>{col.title}</h3>
                  <span className="bg-[#222] text-slate-300 text-xs font-bold px-2.5 py-1 rounded-full">{colStages.length}</span>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto bg-[#0A0A0A] pb-6">
                  {colStages.map((stage, idx) => {
                    const statusInfo = getStatusDisplay(stage.status);
                    const Icon = statusInfo.icon;
                    const prevStage = idx > 0 ? colStages[idx - 1] : null;
                    const isNewOrderGroup = prevStage ? prevStage.orderId !== stage.orderId : true;

                    return (
                      <div key={stage.id}>
                        {isNewOrderGroup && idx > 0 && (
                          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#333] to-transparent my-4"></div>
                        )}
                        <div 
                          draggable
                          onDragStart={(e) => handleDragStart(e, stage.id)}
                          className={`border-l-4 ${getOrderBorderColor(stage.orderId)} p-4 rounded-xl bg-[#151515] border-y border-r border-[#2A2A2A] hover:border-y-[#444] hover:border-r-[#444] shadow-md cursor-grab active:cursor-grabbing transition-all hover:-translate-y-1 relative group/card ${!isNewOrderGroup ? 'mt-2' : ''}`}
                        >
                         {/* Card Badge Target Date */}
                         {(stage as any).targetDeliveryDate && (() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const delivery = new Date((stage as any).targetDeliveryDate);
                            delivery.setHours(0, 0, 0, 0);
                            const diffTime = delivery.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            const isOverdue = diffDays < 0;
                            const isToday = diffDays === 0;
                            
                            let badgeClasses = "bg-slate-500/10 text-slate-400 border-slate-500/20";
                            let badgeText = `${diffDays} Gün`;
                            if (isOverdue) {
                              badgeClasses = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                              badgeText = "Gecikti!";
                            } else if (isToday) {
                              badgeClasses = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                              badgeText = "Bugün";
                            }
                            return (
                              <div className="absolute top-4 right-4 text-right">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeClasses}`}>
                                  {badgeText}
                                </span>
                              </div>
                            );
                         })()}

                         <h4 className="text-white font-bold text-sm pr-16">{stage.customerName}</h4>
                         <p className="text-xs text-slate-400 mt-1">{stage.bagType.replace('_', ' ')} • <span className="text-cyan-400 font-medium">{stage.requestedAmountKg} Kg</span></p>
                         
                         <div className="mt-4 flex items-center justify-between gap-2">
                           <div className="flex items-center gap-2">
                             <div className={`p-1.5 rounded-md border ${statusInfo.bg} ${statusInfo.border} ${statusInfo.color} ${statusInfo.glow || ''}`}>
                               <Icon size={14} className={statusInfo.animate} />
                             </div>
                             <span className="text-sm font-semibold text-slate-300">{getStageNameTr(stage.stageType)}</span>
                           </div>
                         </div>

                         {stage.status === "Finished" && (
                           <div className="mt-3 pt-3 border-t border-[#222] text-xs text-slate-400 flex flex-col gap-1">
                             <div className="flex justify-between">
                               <span>Harcanan:</span>
                               <span className="text-white font-medium">{stage.consumedMaterialKg} Kg</span>
                             </div>
                             {stage.wasteKg > 0 && (
                               <div className="flex justify-between">
                                 <span>Fire:</span>
                                 <span className="text-rose-400 font-medium">{stage.wasteKg} Kg</span>
                               </div>
                             )}
                           </div>
                         )}
                        </div>
                      </div>
                    );
                  })}
                  {colStages.length === 0 && (
                     <div className="h-full min-h-[150px] flex items-center justify-center p-6 border-2 border-dashed border-[#222] rounded-xl text-slate-500 text-xs text-center pointer-events-none">
                       Sürükleyip buraya bırakın
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
      )}

      {/* MODAL */}
      {isModalOpen && selectedStage && (() => {
        const selectedMaterial = materials.find(m => m.id === formData.materialId);
        const isStockInsufficient = selectedMaterial ? Number(formData.consumedAmountKg) > selectedMaterial.stockKg : false;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => !isSubmitting && setIsModalOpen(false)}
            />
            
            <div className="relative bg-[#111111] border border-[#222] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#151515]">
                <div>
                  <h3 className="text-lg font-semibold text-white">Aşama Tamamlama</h3>
                  <p className="text-xs text-cyan-400 font-medium mt-0.5">{getStageNameTr(selectedStage.stageType)}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-slate-400 hover:text-white transition-colors bg-transparent border-none p-1 rounded-md hover:bg-[#222]"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
                <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 flex items-start gap-3">
                  <AlertCircle size={18} className="text-cyan-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-300">
                    {selectedStage.stageType === "Cutting" 
                      ? "Bu aşamada hammadde girişi yapılmaz. Sadece varsa fire/hurda miktarını belirtebilirsiniz. Ekrandan otomatik olarak düşülecektir."
                      : "Bu aşamayı tamamlamak için kullanılan hammadde miktarını girin. Varsa fire miktarını da belirtebilirsiniz. Stok otomatik düşülecektir."}
                  </p>
                </div>

                {selectedStage.stageType !== "Cutting" && (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="materialId" className="text-sm font-medium text-slate-300">
                        Kullanılan Hammadde <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <PackageOpen size={16} className="text-slate-500" />
                        </div>
                        <select
                          id="materialId"
                          name="materialId"
                          required
                          value={formData.materialId}
                          onChange={handleInputChange}
                          className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 appearance-none transition-all cursor-pointer"
                        >
                          <option value="" disabled>Hammadde seçin...</option>
                          {materials
                            .filter(m => 
                              selectedStage.stageType === "Extruder" ? m.category === "Granül" : 
                              selectedStage.stageType === "Printing" ? m.category === "Boya" : true
                            )
                            .map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                      {selectedMaterial && (
                        <p className="mt-1.5 text-xs font-medium text-cyan-400">
                          Mevcut Stok: {selectedMaterial.stockKg.toLocaleString('tr-TR')} Kg
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className={`grid ${selectedStage.stageType !== "Cutting" ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
                  {selectedStage.stageType !== "Cutting" && (
                    <div className="space-y-2">
                      <label htmlFor="consumedAmountKg" className="text-sm font-medium text-slate-300">
                        Harcanan (Kg) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="consumedAmountKg"
                        name="consumedAmountKg"
                        required
                        min="0.1"
                        step="0.1"
                        value={formData.consumedAmountKg}
                        onChange={handleInputChange}
                        onKeyDown={preventInvalidNumberInput}
                        className={`w-full bg-[#0A0A0A] border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all placeholder:text-slate-600 ${isStockInsufficient || Number(formData.consumedAmountKg) < 0 ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50' : 'border-[#333] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50'}`}
                        placeholder="0"
                      />
                      {isStockInsufficient && (
                        <p className="mt-1 text-xs font-bold text-rose-500 animate-pulse text-shadow-sm">
                          Yetersiz Stok!
                        </p>
                      )}
                      {Number(formData.consumedAmountKg) < 0 && (
                        <p className="mt-1 text-xs font-bold text-rose-500 animate-pulse text-shadow-sm">
                          Negatif değer girilemez
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="wasteKg" className="text-sm font-medium text-slate-300">
                      Fire/Hurda (Kg)
                    </label>
                    <input
                      type="number"
                      id="wasteKg"
                      name="wasteKg"
                      min="0"
                      step="0.1"
                      value={formData.wasteKg}
                      onChange={handleInputChange}
                      onKeyDown={preventInvalidNumberInput}
                      className={`w-full bg-[#0A0A0A] border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all placeholder:text-slate-600 ${Number(formData.wasteKg) < 0 ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50' : 'border-[#333] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50'}`}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#222]">
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
                    disabled={
                      isSubmitting || 
                      (selectedStage.stageType !== "Cutting" && (
                        !formData.materialId || 
                        formData.consumedAmountKg === "" || 
                        isStockInsufficient ||
                        Number(formData.consumedAmountKg) < 0
                      )) ||
                      Number(formData.wasteKg) < 0
                    }
                    className="px-5 py-2 flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-[#050505] font-semibold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        İşleniyor...
                      </>
                    ) : (
                      <>
                        <PackageCheck size={16} />
                        Kaydet & Düş
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
