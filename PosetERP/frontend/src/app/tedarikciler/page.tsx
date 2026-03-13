"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/authFetch";
import { Plus, Store, Phone, Mail, AlertCircle, X, Loader2, Pencil, Trash2 } from "lucide-react";
import { useToast } from "../../components/ToastProvider";

interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string | null;
  phoneNumber: string | null;
  email: string | null;
}

export default function TedarikcilerPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phoneNumber: "",
    email: ""
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const res = await authFetch("http://localhost:5257/api/Suppliers");
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      } else {
        throw new Error("Tedarikçiler getirilemedi");
      }
    } catch (error) {
      toast({ type: "error", title: "Hata", message: "Tedarikçiler yüklenirken bir sorun oluştu." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setIsEditMode(true);
      setEditingId(supplier.id);
      setFormData({
        companyName: supplier.companyName,
        contactPerson: supplier.contactPerson || "",
        phoneNumber: supplier.phoneNumber || "",
        email: supplier.email || ""
      });
    } else {
      setIsEditMode(false);
      setEditingId(null);
      setFormData({
        companyName: "",
        contactPerson: "",
        phoneNumber: "",
        email: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast({ type: "error", title: "Uyarı", message: "Firma adı zorunludur." });
      return;
    }

    try {
      if (isEditMode && editingId) {
        const res = await authFetch(`http://localhost:5257/api/Suppliers/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...formData })
        });
        if (res.ok) {
          toast({ type: "success", title: "Başarılı", message: "Tedarikçi güncellendi." });
          fetchSuppliers();
        } else {
          const errText = await res.text();
          console.error("Güncelleme hatası:", errText);
          throw new Error(errText);
        }
      } else {
        const res = await authFetch("http://localhost:5257/api/Suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          toast({ type: "success", title: "Başarılı", message: "Yeni tedarikçi eklendi." });
          fetchSuppliers();
        } else {
          const errText = await res.text();
          console.error("Ekleme hatası:", errText);
          throw new Error(errText);
        }
      }
      setIsModalOpen(false);
    } catch {
      toast({ type: "error", title: "Hata", message: "İşlem başarısız oldu." });
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await authFetch(`http://localhost:5257/api/Suppliers/${deletingId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast({ type: "success", title: "Başarılı", message: "Tedarikçi silindi." });
        setSuppliers(prev => prev.filter(s => s.id !== deletingId));
      } else {
        throw new Error();
      }
    } catch {
      toast({ type: "error", title: "Hata", message: "Tedarikçi silinemedi." });
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-[#111111] p-6 rounded-2xl border border-[#222] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <Store className="text-cyan-400" size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Tedarikçiler</h1>
          </div>
          <p className="text-slate-400">Hammadde sağlayıcılarınızı ve tedarikçi firmalarınızı yönetin.</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="group relative px-6 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-medium rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 flex items-center gap-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>Yeni Tedarikçi Ekle</span>
        </button>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#222] shadow-2xl relative overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]/50 backdrop-blur-sm z-10">
            <Loader2 size={40} className="text-cyan-500 animate-spin mb-4 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            <p className="text-cyan-400 font-medium animate-pulse">Tedarikçiler Yükleniyor...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-24 text-slate-500">
            <Store size={64} className="mb-4 opacity-20" />
            <p className="text-lg">Henüz hiç tedarikçi eklenmemiş.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] border-b border-[#222]">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Firma Adı</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">İletişim Kişisi</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Telefon</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">E-posta</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]/50 relative z-0">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-[#151515] transition-colors group cursor-default">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-colors">
                          <Store size={14} />
                        </div>
                        <span className="font-medium text-slate-200 group-hover:text-white transition-colors">{supplier.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-400">{supplier.contactPerson || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-slate-400">{supplier.phoneNumber || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-slate-400">{supplier.email || "-"}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(supplier)}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors border border-transparent hover:border-cyan-500/20"
                          title="Düzenle"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(supplier.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#111111] border border-[#222] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            <div className="px-6 py-5 border-b border-[#222] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {isEditMode ? "Tedarikçi Düzenle" : "Yeni Tedarikçi Ekle"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-[#1A1A1A] p-1.5 rounded-lg border border-[#333] hover:border-[#444]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Firma Adı <span className="text-rose-500">*</span></label>
                <div className="relative group">
                  <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="text"
                    required
                    maxLength={200}
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    placeholder="Firma ünvanı"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">İletişim Kişisi (Yetkili)</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors uppercase text-xs font-bold w-4 text-center">A</div>
                  <input
                    type="text"
                    maxLength={150}
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    placeholder="Yetkili Adı Soyadı"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Telefon</label>
                <div className="relative group">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="text"
                    maxLength={50}
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl py-2.5 pl-10 pr-4 font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    placeholder="+90 555 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">E-posta</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    placeholder="info@firma.com"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#222] text-slate-300 font-medium rounded-xl border border-[#333] transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl border border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                >
                  {isEditMode ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)} />
           <div className="relative bg-[#111111] border border-[#222] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50" />
             <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 mx-auto">
                    <AlertCircle className="text-rose-500" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">Tedarikçi Silinecek</h3>
                <p className="text-slate-400 text-center text-sm mb-6">
                    Bu tedarikçiyi listeden kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="flex-1 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#222] text-slate-300 font-medium rounded-xl border border-[#333] transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl border border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all"
                    >
                        Sil
                    </button>
                </div>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}
