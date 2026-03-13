"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "../../lib/authFetch";
import { Plus, Building2, UserCircle, Phone, AlertCircle, X, Loader2, UserCircle2, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Filter, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import { ExportButtons } from "../../components/ExportButtons";

interface Customer {
  id: string;
  companyName: string;
  contactPerson: string | null;
  phoneNumber: string | null;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

type SortField = "companyName" | "contactPerson" | "phoneNumber" | "createdBy" | "createdAt";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 10;

export default function MusterilerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Sort / Filter / Pagination
  const [searchFilter, setSearchFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("companyName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<{id: string, name: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phoneNumber: "",
  });
  
  const router = useRouter();

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="ml-1 opacity-30 inline" />;
    return sortDir === "asc" ? <ArrowUp size={13} className="ml-1 text-cyan-400 inline" /> : <ArrowDown size={13} className="ml-1 text-cyan-400 inline" />;
  };

  const fmtDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const filtered = customers.filter(c =>
    !searchFilter || c.companyName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.contactPerson?.toLowerCase().includes(searchFilter.toLowerCase()) ?? false)
  );

  const sorted = [...filtered].sort((a, b) => {
    let va: any = (a as any)[sortField] ?? "";
    let vb: any = (b as any)[sortField] ?? "";
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await authFetch("http://localhost:5257/api/Customers");
      if (!response.ok) {
        throw new Error("Müşteri verileri alınırken bir hata oluştu.");
      }
      const data = await response.json();
      setCustomers(data);
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
    
    fetchCustomers();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) return;

    try {
      setIsSubmitting(true);
      
      let url = "http://localhost:5257/api/Customers";
      let method = "POST";
      let payload: any = {
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        phoneNumber: formData.phoneNumber,
      };

      if (editingId) {
        url = `http://localhost:5257/api/Customers/${editingId}`;
        method = "PUT";
        payload = {
          id: editingId,
          companyName: formData.companyName,
          contactPerson: formData.contactPerson,
          phoneNumber: formData.phoneNumber,
        };
        console.log("PUT İsteği İçin Giden Payload:", payload);
      } else {
        console.log("POST İsteği İçin Giden Payload:", payload);
      }

      const response = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend Hatası:", errorText);
        throw new Error(`Müşteri ${editingId ? "güncellenirken" : "eklenirken"} bir hata oluştu: ${errorText}`);
      }

      closeModal();
      await fetchCustomers();
      toast({
        type: "success",
        title: editingId ? "Müşteri Güncellendi" : "Müşteri Eklendi",
        message: `'${formData.companyName}' başarıyla kaydedildi.`
      });
    } catch (err: any) {
      console.error("Catch Hatası:", err);
      toast({
        type: "error",
        title: "Kayıt Başarısız",
        message: err.message || "İşlem başarısız oldu."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      companyName: customer.companyName,
      contactPerson: customer.contactPerson || "",
      phoneNumber: customer.phoneNumber || "",
    });
    setIsModalOpen(true);
  };

  const confirmDelete = (id: string, companyName: string) => {
    setCustomerToDelete({ id, name: companyName });
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;

    try {
      setIsSubmitting(true);
      const response = await authFetch(`http://localhost:5257/api/Customers/${customerToDelete.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        let errorMsg = "";
        try {
          const errorJson = await response.json();
          errorMsg = errorJson?.message || errorJson?.error || JSON.stringify(errorJson);
        } catch {
          errorMsg = await response.text();
        }

        const isActiveOrderError =
          response.status === 409 ||
          errorMsg.toLowerCase().includes("order") ||
          errorMsg.toLowerCase().includes("sipari") ||
          errorMsg.toLowerCase().includes("saving the entity") ||
          errorMsg.toLowerCase().includes("foreign key") ||
          errorMsg.toLowerCase().includes("reference");

        if (isActiveOrderError) {
          throw new Error(
            `'${customerToDelete.name}' müşterisine ait aktif siparişler mevcut olduğu için bu müşteri silinemiyor. Silmeden önce lütfen ilgili siparişleri tamamlayın veya iptal edin.`
          );
        }
        throw new Error("Müşteri silinirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
      }

      await fetchCustomers();
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
      toast({
        type: "success",
        title: "Kayıt Silindi",
        message: `'${customerToDelete.name}' sistemden tamamen kaldırıldı.`
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Hata Oluştu",
        message: err.message || "Silme işlemi başarısız oldu."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ companyName: "", contactPerson: "", phoneNumber: "" });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Müşteriler</h2>
          <p className="text-slate-400 mt-1">Kayıtlı tüm firmaları ve bakiye durumlarını yönetin.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <ExportButtons 
            excelUrl="http://localhost:5257/api/Export/excel/customers" 
            excelFilename={`Musteriler_${new Date().toISOString().split('T')[0]}.xlsx`} 
          />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group relative px-6 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-medium rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Yeni Müşteri Ekle</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#111111] p-4 rounded-2xl border border-[#222] flex flex-wrap gap-4 items-end shadow-lg">
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-xs text-slate-500 font-medium ml-1">Müşteri Ara</label>
          <input type="text" placeholder="Firma adı veya yetkili..." value={searchFilter}
            onChange={e => { setSearchFilter(e.target.value); setPage(1); }}
            className="bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50" />
        </div>
        {searchFilter && (
          <button onClick={() => { setSearchFilter(""); setPage(1); }}
            className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 border border-[#333] hover:border-rose-500/30 rounded-lg px-3 py-2 transition-colors self-end">
            <X size={12} /> Temizle
          </button>
        )}
      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#222] shadow-2xl relative overflow-hidden min-h-[400px]">
        {loading && customers.length === 0 && !error ? (
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
        ) : customers.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10">
            <div className="p-4 rounded-full bg-[#1A1A1A] text-slate-500 mb-4 border border-[#2A2A2A]">
              <Building2 size={32} />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">Henüz müşteri yok</h3>
            <p className="text-slate-400 text-sm">Sisteme kayıtlı herhangi bir müşteri bulunamadı.</p>
          </div>
        ) : (
          <div className={`overflow-x-auto w-full transition-all duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {loading && customers.length > 0 && (
              <div className="absolute top-4 right-4 z-20 bg-[#111] p-2 rounded-full shadow-lg border border-[#333]">
                <Loader2 size={16} className="text-cyan-500 animate-spin" />
              </div>
            )}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] border-b border-[#222]">
                  <th onClick={() => handleSort("companyName")} className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-cyan-400 transition-colors">
                    Firma Adı<SortIcon field="companyName" />
                  </th>
                  <th onClick={() => handleSort("contactPerson")} className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-cyan-400 transition-colors">
                    Yetkili<SortIcon field="contactPerson" />
                  </th>
                  <th onClick={() => handleSort("phoneNumber")} className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-cyan-400 transition-colors">
                    Telefon<SortIcon field="phoneNumber" />
                  </th>
                  <th onClick={() => handleSort("createdBy")} className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-cyan-400 transition-colors">
                    Oluşturan<SortIcon field="createdBy" />
                  </th>
                  <th onClick={() => handleSort("createdAt")} className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-cyan-400 transition-colors">
                    Kayıt Tarihi<SortIcon field="createdAt" />
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Son Güncelleme</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {paginated.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#151515] transition-colors group cursor-default">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-colors">
                          <Building2 size={14} />
                        </div>
                        <span className="text-sm font-medium text-white group-hover:text-cyan-100 transition-colors">{customer.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <UserCircle2 size={16} className="text-slate-500" />
                        <span className="text-sm">{customer.contactPerson || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone size={14} className="text-slate-500" />
                        <span className="text-sm font-mono">{customer.phoneNumber || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <UserCircle2 size={13} className="text-slate-500" />
                        <span className="text-xs">{customer.createdBy || "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={13} className="text-slate-500" />
                        <span className="text-xs">{fmtDate(customer.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.updatedAt ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-slate-400">{fmtDate(customer.updatedAt)}</span>
                          <span className="text-xs text-slate-600">{customer.updatedBy}</span>
                        </div>
                      ) : <span className="text-xs text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 transition-opacity">
                        <button onClick={() => handleEdit(customer)}
                          className="text-slate-400 hover:text-amber-400 transition-colors p-1.5 rounded-lg hover:bg-amber-400/10" title="Düzenle">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => confirmDelete(customer.id, customer.companyName)}
                          className="text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-400/10" title="Sil">
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

        {/* Pagination */}
        {!loading && sorted.length > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-[#222] bg-[#151515] flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Toplam <span className="text-cyan-400 font-medium">{sorted.length}</span> müşteriden{" "}
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
                {editingId ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}
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
                <label htmlFor="companyName" className="text-sm font-medium text-slate-300">
                  Firma Adı <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 size={16} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all placeholder:text-slate-600"
                    placeholder="Örn: Vortex Ltd. Şti."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="contactPerson" className="text-sm font-medium text-slate-300">
                  Yetkili Kişi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircle2 size={16} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all placeholder:text-slate-600"
                    placeholder="Örn: Ahmet Yılmaz"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="text-sm font-medium text-slate-300">
                  Telefon Numarası
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={16} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all placeholder:text-slate-600"
                    placeholder="Örn: 0555 123 4567"
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
                  disabled={isSubmitting || !formData.companyName.trim()}
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

      {/* DELETE CONFIRM MODAL */}
      {isDeleteModalOpen && customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => !isSubmitting && setIsDeleteModalOpen(false)}
          />
          
          <div className="relative bg-[#111111] border border-[#222] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto border border-rose-500/20 mb-2">
                <AlertCircle size={32} className="text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Müşteriyi Sil</h3>
              <p className="text-slate-400 text-sm">
                <span className="text-white font-medium">'{customerToDelete.name}'</span> isimli müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            
            <div className="p-4 border-t border-[#222] bg-[#151515] flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-[#222] hover:bg-[#333] rounded-xl transition-colors disabled:opacity-50"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_25px_rgba(244,63,94,0.5)] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={16} />
                    Evet, Sil
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
