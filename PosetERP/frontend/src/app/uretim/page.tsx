"use client";

import { useEffect, useState } from "react";
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
}

interface OrderGroup {
  orderId: string;
  customerName: string;
  bagType: string;
  requestedAmountKg: number;
  stages: ProductionStage[];
}

interface RawMaterial {
  id: string;
  name: string;
  stockKg: number;
}

export default function UretimPage() {
  const [orderGroups, setOrderGroups] = useState<OrderGroup[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        fetch("http://localhost:5257/api/production"),
        fetch("http://localhost:5257/api/RawMaterials")
      ]);

      if (!stagesRes.ok || !materialsRes.ok) {
        throw new Error("Veriler alınırken bir hata oluştu.");
      }

      const stagesData: ProductionStage[] = await stagesRes.json();
      const materialsData: RawMaterial[] = await materialsRes.json();
      
      // Siparişe göre grupla
      const groupsMap = new Map<string, OrderGroup>();
      stagesData.forEach(stage => {
        if (!groupsMap.has(stage.orderId)) {
          groupsMap.set(stage.orderId, {
            orderId: stage.orderId,
            customerName: stage.customerName,
            bagType: stage.bagType.replace('_', ' '),
            requestedAmountKg: stage.requestedAmountKg,
            stages: []
          });
        }
        groupsMap.get(stage.orderId)!.stages.push(stage);
      });

      // Aşamaları tiplerine göre sırala (Extruder -> Printing -> Cutting)
      const stageOrder: Record<string, number> = { "Extruder": 1, "Printing": 2, "Cutting": 3 };
      const groupsArray = Array.from(groupsMap.values()).map(group => {
        group.stages.sort((a, b) => (stageOrder[a.stageType] || 99) - (stageOrder[b.stageType] || 99));
        return group;
      });

      setOrderGroups(groupsArray);
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
    setFormData({
      materialId: materials.length > 0 ? materials[0].id : "",
      consumedAmountKg: "",
      wasteKg: "",
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStage || !formData.materialId || formData.consumedAmountKg === "") return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`http://localhost:5257/api/production/${selectedStage.id}/consume-material`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: formData.materialId,
          consumedAmountKg: Number(formData.consumedAmountKg) || 0,
          wasteKg: Number(formData.wasteKg) || 0,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.Error || "İşlem başarısız oldu.");
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "İşlem başarısız oldu.");
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Üretim Hattı</h2>
          <p className="text-slate-400 mt-1">Aktif siparişlerin üretim aşamalarını ve hammadde kullanımını yönetin.</p>
        </div>
      </div>

      {loading ? (
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
      ) : orderGroups.length === 0 ? (
        <div className="bg-[#111111] rounded-2xl border border-[#222] shadow-2xl relative min-h-[400px] flex flex-col items-center justify-center">
          <div className="p-4 rounded-full bg-[#1A1A1A] text-slate-500 mb-4 border border-[#2A2A2A]">
            <Factory size={32} />
          </div>
          <h3 className="text-white font-medium text-lg mb-2">Aktif Üretim Yok</h3>
          <p className="text-slate-400 text-sm">Üretime alınmış herhangi bir sipariş bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orderGroups.map((group) => (
            <div key={group.orderId} className="bg-[#111111] rounded-2xl border border-[#222] shadow-xl overflow-hidden group/card hover:border-[#333] transition-colors">
              {/* Card Header */}
              <div className="p-5 border-b border-[#222] bg-gradient-to-br from-[#151515] to-[#111111] relative overflow-hidden">
                <div className="absolute top-0 right-[-10%] w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover/card:bg-cyan-500/10 transition-colors pointer-events-none" />
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">{group.customerName}</h3>
                    <div className="flex items-center gap-2 mt-1.5 opacity-90">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#222] text-slate-300 border border-[#333]">
                        {group.bagType}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Hedef Üretim</p>
                    <p className="text-xl font-bold text-emerald-400">{group.requestedAmountKg.toLocaleString('tr-TR')} <span className="text-sm font-medium text-slate-500">Kg</span></p>
                  </div>
                </div>
              </div>

              {/* Card Body - Stages */}
              <div className="p-2 space-y-1 bg-[#0A0A0A]">
                {group.stages.map((stage, idx) => {
                  const statusInfo = getStatusDisplay(stage.status);
                  const Icon = statusInfo.icon;
                  const isFinished = stage.status === "Finished";
                  
                  return (
                    <div key={stage.id} className={`p-4 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:bg-[#151515] transition-colors border border-transparent hover:border-[#222]
                      ${idx !== group.stages.length - 1 ? 'border-b-[#111]' : ''}`}>
                      
                      {/* Stage Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-2.5 rounded-lg border ${statusInfo.bg} ${statusInfo.border} ${statusInfo.color} ${statusInfo.glow || ''}`}>
                          <Icon size={18} className={statusInfo.animate} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{getStageNameTr(stage.stageType)}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs font-medium">
                            <span className={`${statusInfo.color}`}>{statusInfo.text}</span>
                            {isFinished && (
                              <>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400">Harcanan: <span className="text-white">{stage.consumedMaterialKg} Kg</span></span>
                                {stage.wasteKg > 0 && (
                                  <>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-rose-400">Fire: {stage.wasteKg} Kg</span>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      {!isFinished && (
                        <button
                          onClick={() => handleOpenModal(stage)}
                          className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-lg border border-cyan-500/20 transition-all flex items-center justify-center gap-1.5 group/btn"
                        >
                          İşlemi Tamamla & Düş
                          <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && selectedStage && (
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
                  Bu aşamayı tamamlamak için kullanılan hammadde miktarını girin. Varsa fire miktarını da belirtebilirsiniz. Stok otomatik düşülecektir.
                </p>
              </div>

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
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 appearance-none transition-all"
                  >
                    <option value="" disabled>Hammadde seçin...</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name} (Stok: {m.stockKg} Kg)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                    placeholder="0"
                  />
                </div>

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
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
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
                  disabled={isSubmitting || !formData.materialId || formData.consumedAmountKg === ""}
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
                      Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
