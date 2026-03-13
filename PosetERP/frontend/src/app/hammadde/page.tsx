"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";
import {
  Plus, Package, AlertCircle, X, Loader2, Scale, Pencil, Trash2,
  ArrowUpDown, ArrowUp, ArrowDown, Filter, ChevronLeft, ChevronRight, UserCircle2, Clock
} from "lucide-react";
import { useToast } from "../../components/ToastProvider";

interface RawMaterial {
  id: string;
  name: string;
  stockKg: number;
  minimumStockAlert: number;
  category: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

type SortField = "name" | "category" | "stockKg" | "minimumStockAlert" | "createdAt" | "createdBy";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

export default function HammaddePage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "critical" | "ok">("ALL");
  const [searchFilter, setSearchFilter] = useState("");

  // Sort
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Pagination
  const [page, setPage] = useState(1);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    stockAmount: "",
    criticalStockLevel: "",
    category: "Granül",
  });

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await authFetch("http://localhost:5257/api/RawMaterials");
      if (!response.ok) throw new Error("Hammadde verileri alınırken bir hata oluştu.");
      const data = await response.json();
      setMaterials(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaterials(); }, []);

  // ── Filtering ──────────────────────────────────────────────────────────
  const filtered = materials.filter(m => {
    if (categoryFilter !== "ALL" && m.category !== categoryFilter) return false;
    if (stockFilter === "critical" && (m.stockKg || 0) > (m.minimumStockAlert || 0)) return false;
    if (stockFilter === "ok" && (m.stockKg || 0) <= (m.minimumStockAlert || 0)) return false;
    if (searchFilter && !m.name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  // ── Sorting ─────────────────────────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    let va: any, vb: any;
    switch (sortField) {
      case "name": va = a.name; vb = b.name; break;
      case "category": va = a.category; vb = b.category; break;
      case "stockKg": va = a.stockKg; vb = b.stockKg; break;
      case "minimumStockAlert": va = a.minimumStockAlert; vb = b.minimumStockAlert; break;
      case "createdAt": va = a.createdAt ?? ""; vb = b.createdAt ?? ""; break;
      case "createdBy": va = a.createdBy ?? ""; vb = b.createdBy ?? ""; break;
      default: return 0;
    }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const uniqueCategories = Array.from(new Set(materials.map(m => m.category)));

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="ml-1 opacity-30 inline" />;
    return sortDir === "asc"
      ? <ArrowUp size={13} className="ml-1 text-cyan-400 inline" />
      : <ArrowDown size={13} className="ml-1 text-cyan-400 inline" />;
  };

  const fmtDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // ── Form ─────────────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const preventInvalidNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
  };

  const handleEdit = (material: RawMaterial) => {
    setEditingId(material.id);
    setFormData({
      name: material.name,
      stockAmount: material.stockKg.toString(),
      criticalStockLevel: material.minimumStockAlert.toString(),
      category: material.category || "Granül",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.stockAmount === "" || formData.criticalStockLevel === "") return;

    try {
      setIsSubmitting(true);
      const url = editingId
        ? `http://localhost:5257/api/RawMaterials/${editingId}`
        : "http://localhost:5257/api/RawMaterials";
      const method = editingId ? "PUT" : "POST";
      const payload: any = editingId
        ? { id: editingId, name: formData.name, stockKg: Number(formData.stockAmount) || 0, minimumStockAlert: Number(formData.criticalStockLevel) || 0, category: formData.category }
        : { name: formData.name, stockKg: Number(formData.stockAmount) || 0, minimumStockAlert: Number(formData.criticalStockLevel) || 0, category: formData.category };

      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hammadde ${editingId ? "güncellenirken" : "eklenirken"} bir hata oluştu: ${errorText}`);
      }

      closeModal();
      await fetchMaterials();
      toast({
        type: "success",
        title: editingId ? "Başarıyla Güncellendi" : "Başarıyla Eklendi",
        message: `'${formData.name}' stoklarımıza işlendi.`
      });
    } catch (err: any) {
      toast({ type: "error", title: "Kayıt Hatası", message: err.message || "İşlem başarısız oldu." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const response = await authFetch(`http://localhost:5257/api/RawMaterials/${deleteTarget.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Hammadde silinirken bir hata oluştu.");
      await fetchMaterials();
      setDeleteTarget(null);
      toast({ type: "success", title: "Silme İşlemi Başarılı", message: `'${deleteTarget.name}' listeden kaldırıldı.` });
    } catch (err: any) {
      toast({ type: "error", title: "Hata", message: err.message || "Silme işlemi başarısız oldu." });
    } finally {
      setIsDeleting(false);
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", stockAmount: "", criticalStockLevel: "", category: "Granül" });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
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

      {/* Filter Bar */}
      <div className="bg-[#111111] p-4 rounded-2xl border border-[#222] flex flex-wrap gap-4 items-end shadow-lg">
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className="text-xs text-slate-500 font-medium ml-1">Hammadde Ara</label>
          <input
            type="text"
            placeholder="İsme göre filtrele..."
            value={searchFilter}
            onChange={e => { setSearchFilter(e.target.value); setPage(1); }}
            className="bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs text-slate-500 font-medium ml-1 flex items-center gap-1"><Filter size={11} /> Kategori</label>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50">
            <option value="ALL">Tüm Kategoriler</option>
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs text-slate-500 font-medium ml-1 flex items-center gap-1"><Filter size={11} /> Stok Durumu</label>
          <select value={stockFilter} onChange={e => { setStockFilter(e.target.value as any); setPage(1); }}
            className="bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50">
            <option value="ALL">Tüm Durumlar</option>
            <option value="critical">Kritik Stok</option>
            <option value="ok">Yeterli</option>
          </select>
        </div>
        {(categoryFilter !== "ALL" || stockFilter !== "ALL" || searchFilter) && (
          <button onClick={() => { setCategoryFilter("ALL"); setStockFilter("ALL"); setSearchFilter(""); setPage(1); }}
            className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 border border-[#333] hover:border-rose-500/30 rounded-lg px-3 py-2 transition-colors self-end">
            <X size={12} /> Temizle
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#111111] rounded-2xl border border-[#222] shadow-2xl relative overflow-hidden min-h-[400px]">
        {loading && materials.length === 0 && !error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-[#222] rounded-full" />
              <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse">Veriler yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10 px-4 text-center">
            <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20"><AlertCircle size={32} /></div>
            <h3 className="text-white font-medium text-lg mb-2">Bağlantı Hatası</h3>
            <p className="text-slate-400 text-sm max-w-md">{error}</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10">
            <div className="p-4 rounded-full bg-[#1A1A1A] text-slate-500 mb-4 border border-[#2A2A2A]"><Package size={32} /></div>
            <h3 className="text-white font-medium text-lg mb-2">Kayıt bulunamadı</h3>
            <p className="text-slate-400 text-sm">Seçilen filtrelere uygun hammadde yok.</p>
          </div>
        ) : (
          <div className={`overflow-x-auto w-full transition-all duration-300 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
            {loading && materials.length > 0 && (
              <div className="absolute top-4 right-4 z-20 bg-[#111] p-2 rounded-full shadow-lg border border-[#333]">
                <Loader2 size={16} className="text-cyan-500 animate-spin" />
              </div>
            )}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] border-b border-[#222]">
                  {[
                    { key: "name", label: "Hammadde Adı" },
                    { key: "category", label: "Kategori" },
                    { key: "stockKg", label: "Mevcut Stok (Kg)", right: true },
                    { key: "minimumStockAlert", label: "Kritik Sınır (Kg)", right: true },
                  ].map(col => (
                    <th key={col.key} onClick={() => handleSort(col.key as SortField)}
                      className={`px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-cyan-400 transition-colors ${col.right ? "text-right" : ""}`}>
                      {col.label}<SortIcon field={col.key as SortField} />
                    </th>
                  ))}
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Durum</th>
                  <th onClick={() => handleSort("createdBy")}
                    className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-cyan-400 transition-colors">
                    Oluşturan<SortIcon field="createdBy" />
                  </th>
                  <th onClick={() => handleSort("createdAt")}
                    className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-cyan-400 transition-colors">
                    Kayıt Tarihi<SortIcon field="createdAt" />
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Son Güncelleme</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {paginated.map(material => {
                  const isCritical = (material.stockKg || 0) <= (material.minimumStockAlert || 0);
                  return (
                    <tr key={material.id} className="hover:bg-[#151515] transition-colors group cursor-default">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${isCritical ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : "bg-slate-800 text-slate-400 border-slate-700 group-hover:border-cyan-500/30 group-hover:text-cyan-400"}`}>
                            <Package size={14} />
                          </div>
                          <span className="text-sm font-medium text-white group-hover:text-cyan-100 transition-colors">{material.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#222] text-slate-300 border border-[#333]">
                          {material.category || "Granül"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Scale size={14} className={isCritical ? "text-rose-500/70" : "text-slate-500"} />
                          <span className={`text-sm font-semibold ${isCritical ? "text-rose-400" : "text-slate-200"}`}>
                            {(material.stockKg || 0).toLocaleString("tr-TR")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-slate-400">{(material.minimumStockAlert || 0).toLocaleString("tr-TR")}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isCritical ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-rose-500/10 text-rose-400 border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-2 animate-pulse" />Kritik
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />Yeterli
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <UserCircle2 size={13} className="text-slate-500" />
                          <span className="text-xs">{material.createdBy || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock size={13} className="text-slate-500" />
                          <span className="text-xs">{fmtDate(material.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {material.updatedAt ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-slate-400">{fmtDate(material.updatedAt)}</span>
                            <span className="text-xs text-slate-600">{material.updatedBy}</span>
                          </div>
                        ) : <span className="text-xs text-slate-600">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(material)}
                            className="text-slate-400 hover:text-amber-400 transition-colors p-1.5 rounded-lg hover:bg-amber-400/10" title="Düzenle">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => setDeleteTarget({ id: material.id, name: material.name })}
                            className="text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-400/10" title="Sil">
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

        {/* Pagination */}
        {!loading && sorted.length > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-[#222] bg-[#151515] flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Toplam <span className="text-cyan-400 font-medium">{sorted.length}</span> kayıttan{" "}
              <span className="font-medium text-white">{(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, sorted.length)}</span> arası gösteriliyor.
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 bg-[#0A0A0A] border border-[#333] rounded-lg text-slate-400 hover:text-white hover:border-cyan-500/50 transition-colors disabled:opacity-50 disabled:pointer-events-none">
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center px-3 font-medium text-sm text-slate-300">{page} / {totalPages}</div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 bg-[#0A0A0A] border border-[#333] rounded-lg text-slate-400 hover:text-white hover:border-cyan-500/50 transition-colors disabled:opacity-50 disabled:pointer-events-none">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ADD/EDIT MODAL ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-[#111111] border border-[#222] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#151515]">
              <h3 className="text-lg font-semibold text-white">{editingId ? "Hammadde Düzenle" : "Yeni Hammadde Ekle"}</h3>
              <button onClick={closeModal} disabled={isSubmitting} className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-[#222]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Hammadde Adı <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Package size={16} className="text-slate-500" /></div>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                    placeholder="Örn: Beyaz Granül / Polietilen" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Kategori <span className="text-rose-500">*</span></label>
                <select name="category" required value={formData.category} onChange={(e: any) => setFormData(p => ({ ...p, category: e.target.value }))}
                  className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 appearance-none transition-all cursor-pointer">
                  <option value="Granül">Granül</option>
                  <option value="Boya">Boya</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Başlangıç Stoğu (Kg) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Scale size={16} className="text-slate-500" /></div>
                  <input type="number" name="stockAmount" required min="0" step="0.01" value={formData.stockAmount} onChange={handleInputChange} onKeyDown={preventInvalidNumberInput}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                    placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Kritik Stok Sınırı (Kg) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><AlertCircle size={16} className="text-slate-500" /></div>
                  <input type="number" name="criticalStockLevel" required min="0" step="0.01" value={formData.criticalStockLevel} onChange={handleInputChange} onKeyDown={preventInvalidNumberInput}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                    placeholder="0" />
                </div>
              </div>
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#222]">
                <button type="button" onClick={closeModal} disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-[#222] rounded-xl transition-colors">İptal</button>
                <button type="submit" disabled={isSubmitting || !formData.name.trim() || formData.stockAmount === "" || formData.criticalStockLevel === ""}
                  className="px-5 py-2 flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-[#050505] font-semibold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" />Kaydediliyor...</> : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ──────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !isDeleting && setDeleteTarget(null)} />
          <div className="relative bg-[#111111] border border-[#333] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-sm px-6 py-8 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/30">
              <Trash2 size={28} className="text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Hammaddeyi Sil</h3>
            <p className="text-sm text-slate-400 mb-2">
              <span className="text-white font-medium">'{deleteTarget.name}'</span> hammaddesi silinecek.
            </p>
            <p className="text-xs text-rose-400/70 mb-8">Bu işlem geri alınamaz.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={isDeleting}
                className="flex-1 py-3 bg-transparent text-slate-300 hover:text-white hover:bg-[#222] font-medium rounded-xl border border-[#333] transition-colors disabled:opacity-50">
                Vazgeç
              </button>
              <button onClick={handleDeleteConfirm} disabled={isDeleting}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
