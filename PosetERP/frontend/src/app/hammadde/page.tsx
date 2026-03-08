"use client";

import { useEffect, useState } from "react";
import { Plus, Package, AlertCircle, X, Loader2, Scale, Pencil, Trash2 } from "lucide-react";

interface RawMaterial {
  id: string;
  name: string;
  stockKg: number;
  minimumStockAlert: number;
}

export default function HammaddePage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    stockAmount: "",
    criticalStockLevel: "",
  });

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5257/api/RawMaterials");
      if (!response.ok) {
        throw new Error("Hammadde verileri alınırken bir hata oluştu.");
      }
      const data = await response.json();
      setMaterials(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.stockAmount === "" || formData.criticalStockLevel === "") return;

    try {
      setIsSubmitting(true);
      
      let url = "http://localhost:5257/api/RawMaterials";
      let method = "POST";
      let payload: any = {
        name: formData.name,
        stockKg: Number(formData.stockAmount) || 0,
        minimumStockAlert: Number(formData.criticalStockLevel) || 0,
      };

      if (editingId) {
        url = `http://localhost:5257/api/RawMaterials/${editingId}`;
        method = "PUT";
        payload = {
          id: editingId,
          name: formData.name,
          stockKg: Number(formData.stockAmount) || 0,
          minimumStockAlert: Number(formData.criticalStockLevel) || 0,
        };
        console.log("PUT İsteği İçin Giden Payload:", payload);
      } else {
        console.log("POST İsteği İçin Giden Payload:", payload);
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend Hatası:", errorText);
        throw new Error(`Hammadde ${editingId ? "güncellenirken" : "eklenirken"} bir hata oluştu: ${errorText}`);
      }

      closeModal();
      await fetchMaterials();
    } catch (err: any) {
      console.error("Catch Hatası:", err);
      alert(err.message || "İşlem başarısız oldu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (material: RawMaterial) => {
    setEditingId(material.id);
    setFormData({
      name: material.name,
      stockAmount: material.stockKg.toString(),
      criticalStockLevel: material.minimumStockAlert.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`'${name}' hammaddesini silmek istediğinize emin misiniz?`)) return;

    try {
      const response = await fetch(`http://localhost:5257/api/RawMaterials/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Hammadde silinirken bir hata oluştu.");
      }

      await fetchMaterials();
    } catch (err: any) {
      alert(err.message || "Silme işlemi başarısız oldu.");
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", stockAmount: "", criticalStockLevel: "" });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Hammadde Deposu</h2>
          <p className="text-slate-400 mt-1">Stoktaki ham maddeleri görüntüleyin ve güncelleyin.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative px-6 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-medium rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 flex items-center gap-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>Yeni Hammadde Ekle</span>
        </button>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#222] shadow-2xl relative overflow-hidden min-h-[400px]">
        {loading ? (
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
        ) : materials.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10">
            <div className="p-4 rounded-full bg-[#1A1A1A] text-slate-500 mb-4 border border-[#2A2A2A]">
              <Package size={32} />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">Depo Boş</h3>
            <p className="text-slate-400 text-sm">Sisteme kayıtlı herhangi bir hammadde bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] border-b border-[#222]">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Hammadde Adı</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Mevcut Stok (Kg)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Kritik Sınır (Kg)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Durum</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {materials.map((material) => {
                  const isCritical = (material.stockKg || 0) <= (material.minimumStockAlert || 0);
                  
                  return (
                    <tr key={material.id} className="hover:bg-[#151515] transition-colors group cursor-default">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors
                            ${isCritical 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 group-hover:border-rose-400' 
                              : 'bg-slate-800 text-slate-400 border-slate-700 group-hover:border-cyan-500/30 group-hover:text-cyan-400'}`}>
                            <Package size={14} />
                          </div>
                          <span className="text-sm font-medium text-white group-hover:text-cyan-100 transition-colors">
                            {material.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Scale size={14} className={isCritical ? "text-rose-500/70" : "text-slate-500"} />
                          <span className={`text-sm font-semibold ${isCritical ? 'text-rose-400' : 'text-slate-200'}`}>
                            {(material.stockKg || 0).toLocaleString('tr-TR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-slate-400">
                          {(material.minimumStockAlert || 0).toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isCritical ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-2 shadow-[0_0_5px_rgba(244,63,94,0.8)] animate-pulse"></span>
                            Kritik Stok
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2"></span>
                            Yeterli
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(material)}
                            className="text-slate-400 hover:text-amber-400 transition-colors p-1.5 rounded-lg hover:bg-amber-400/10 hover:shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                            title="Düzenle"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(material.id, material.name)}
                            className="text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-400/10 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />
          
          <div className="relative bg-[#111111] border border-[#222] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#151515]">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? "Hammadde Düzenle" : "Yeni Hammadde Ekle"}
              </h3>
              <button 
                onClick={closeModal}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-white transition-colors bg-transparent border-none p-1 rounded-md hover:bg-[#222]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-300">
                  Hammadde Adı <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Package size={16} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all placeholder:text-slate-600"
                    placeholder="Örn: Beyaz Granül / Polietilen"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="stockAmount" className="text-sm font-medium text-slate-300">
                  Başlangıç Stoğu (Kg) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Scale size={16} className="text-slate-500" />
                  </div>
                  <input
                    type="number"
                    id="stockAmount"
                    name="stockAmount"
                    required
                    min="0"
                    step="0.01"
                    value={formData.stockAmount}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all placeholder:text-slate-600"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="criticalStockLevel" className="text-sm font-medium text-slate-300">
                  Kritik Stok Sınırı (Kg) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AlertCircle size={16} className="text-slate-500" />
                  </div>
                  <input
                    type="number"
                    id="criticalStockLevel"
                    name="criticalStockLevel"
                    required
                    min="0"
                    step="0.01"
                    value={formData.criticalStockLevel}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all placeholder:text-slate-600"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-[#222] rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim() || formData.stockAmount === "" || formData.criticalStockLevel === ""}
                  className="px-5 py-2 flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-[#050505] font-semibold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    "Kaydet"
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
