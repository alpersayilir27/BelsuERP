"use client";

import { useEffect, useState } from "react";
import { Plus, Building2, UserCircle2, Phone, Wallet, AlertCircle, X, Loader2 } from "lucide-react";

interface Customer {
  id: number;
  companyName: string;
  contactPerson: string | null;
  phoneNumber: string | null;
  balance: number;
}

export default function MusterilerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phoneNumber: "",
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5257/api/Customers");
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
    fetchCustomers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("http://localhost:5257/api/Customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          contactPerson: formData.contactPerson, // Empty string will be sent as string, backend accepts string | null
          phoneNumber: formData.phoneNumber,
          balance: 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Müşteri eklenirken bir hata oluştu.");
      }

      setIsModalOpen(false);
      setFormData({ companyName: "", contactPerson: "", phoneNumber: "" });
      await fetchCustomers();
    } catch (err: any) {
      alert(err.message || "Ekleme başarısız oldu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Müşteriler</h2>
          <p className="text-slate-400 mt-1">Kayıtlı tüm firmaları ve bakiye durumlarını yönetin.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative px-6 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-medium rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 flex items-center gap-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>Yeni Müşteri Ekle</span>
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
        ) : customers.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10">
            <div className="p-4 rounded-full bg-[#1A1A1A] text-slate-500 mb-4 border border-[#2A2A2A]">
              <Building2 size={32} />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">Henüz müşteri yok</h3>
            <p className="text-slate-400 text-sm">Sisteme kayıtlı herhangi bir müşteri bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] border-b border-[#222]">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Firma Adı</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Yetkili</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Telefon</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Bakiye</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#151515] transition-colors group cursor-default">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-colors">
                          <Building2 size={14} />
                        </div>
                        <span className="text-sm font-medium text-white group-hover:text-cyan-100 transition-colors">
                          {customer.companyName}
                        </span>
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Wallet size={14} className="text-slate-500" />
                        <span className="text-sm font-medium text-emerald-400">
                          ₺{(customer.balance || 0).toLocaleString('tr-TR')}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
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
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />
          
          <div className="relative bg-[#111111] border border-[#222] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#151515]">
              <h3 className="text-lg font-semibold text-white">Yeni Müşteri Ekle</h3>
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
                  onClick={() => setIsModalOpen(false)}
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
    </div>
  );
}
