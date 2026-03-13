"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "../../lib/authFetch";
import { Plus, UsersRound, UserCircle2, AlertCircle, X, Loader2, Shield, Calendar, Pencil, Trash2, KeyRound } from "lucide-react";
import { useToast } from "../../components/ToastProvider";

interface User {
  id: string;
  username: string;
  role: string;
}

export default function KullanicilarPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: string, username: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "Usta",
  });
  
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authFetch("http://localhost:5257/api/Users");
      if (!response.ok) {
        throw new Error("Kullanıcı verileri alınırken bir hata oluştu.");
      }
      const data = await response.json();
      setUsers(data);
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
    if (userRole !== "Admin") {
      router.push("/");
      return;
    }
    
    fetchUsers();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.role) return;
    if (!editingId && !formData.password) {
      toast({ type: "error", title: "Hata", message: "Yeni kullanıcı için şifre zorunludur." });
      return;
    }

    try {
      setIsSubmitting(true);
      
      let url = "http://localhost:5257/api/Users";
      let method = "POST";
      let payload: any = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
      };

      if (editingId) {
        url = `http://localhost:5257/api/Users/${editingId}`;
        method = "PUT";
        payload = {
          id: editingId,
          username: formData.username,
          password: formData.password,
          role: formData.role,
        };
      }

      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Kullanıcı ${editingId ? "güncellenirken" : "eklenirken"} bir hata oluştu.`);
      }

      closeModal();
      await fetchUsers();
      toast({
        type: "success",
        title: editingId ? "Kullanıcı Güncellendi" : "Kullanıcı Eklendi",
        message: `'${formData.username}' başarıyla kaydedildi.`
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Kayıt Başarısız",
        message: err.message || "İşlem başarısız oldu."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      password: "", // do not show password
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const confirmDelete = (id: string, username: string) => {
    setUserToDelete({ id, username });
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      setIsSubmitting(true);
      const response = await authFetch(`http://localhost:5257/api/Users/${userToDelete.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Kullanıcı silinirken bir hata oluştu.");
      }

      await fetchUsers();
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      toast({
        type: "success",
        title: "Kayıt Silindi",
        message: `'${userToDelete.username}' sistemden tamamen kaldırıldı.`
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
    setFormData({ username: "", password: "", role: "Usta" });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Kullanıcı Yönetimi</h2>
          <p className="text-slate-400 mt-1">Sisteme erişimi olan kullanıcıları ve yetkilerini yönetin.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative px-6 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-medium rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 flex items-center gap-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>Yeni Kullanıcı Ekle</span>
        </button>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#222] shadow-2xl relative overflow-hidden min-h-[400px]">
        {loading && users.length === 0 && !error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-[#222] rounded-full"></div>
              <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin glow-cyan"></div>
            </div>
            <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse">Kullanıcılar yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10 px-4 text-center">
            <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">Bağlantı Hatası</h3>
            <p className="text-slate-400 text-sm max-w-md">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111] z-10">
            <div className="p-4 rounded-full bg-[#1A1A1A] text-slate-500 mb-4 border border-[#2A2A2A]">
              <UsersRound size={32} />
            </div>
            <h3 className="text-white font-medium text-lg mb-2">Henüz kullanıcı yok</h3>
            <p className="text-slate-400 text-sm">Sisteme kayıtlı herhangi bir kullanıcı bulunamadı.</p>
          </div>
        ) : (
          <div className={`overflow-x-auto w-full transition-all duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] border-b border-[#222]">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kullanıcı Adı</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#151515] transition-colors group cursor-default">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-slate-500" title={user.id}>{user.id.split('-')[0]}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-colors">
                          <UserCircle2 size={14} />
                        </div>
                        <span className="text-sm font-medium text-white group-hover:text-cyan-100 transition-colors">
                          {user.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className={
                          user.role === 'Admin' ? 'text-cyan-400' 
                          : user.role === 'Yonetici' ? 'text-violet-400'
                          : 'text-slate-500'
                        } />
                        <span className={`text-sm font-medium px-2 py-0.5 rounded-md border ${
                          user.role === 'Admin' 
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                            : user.role === 'Yonetici'
                            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                            : 'bg-[#222] text-slate-300 border-[#333]'
                        }`}>
                          {user.role === 'Yonetici' ? 'Yönetici' : user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 transition-opacity">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-slate-400 hover:text-amber-400 transition-colors p-1.5 rounded-lg hover:bg-amber-400/10 hover:shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                          title="Düzenle / Şifre Değiştir"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => confirmDelete(user.id, user.username)}
                          className="text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-400/10 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)]"
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

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />
          
          <div className="relative bg-[#111111] border border-[#222] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#151515]">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}
              </h3>
              <button 
                onClick={closeModal}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-white transition-colors bg-transparent border-none p-1 rounded-md hover:bg-[#222]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Kullanıcı Adı <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircle2 size={16} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all placeholder:text-slate-600"
                    placeholder="Örn: usta1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Şifre {editingId ? <span className="text-xs text-slate-500 font-normal">(Boş bırakılırsa değişmez)</span> : <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound size={16} className="text-slate-500" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required={!editingId}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all placeholder:text-slate-600"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Rol <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield size={16} className="text-slate-500" />
                  </div>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all appearance-none"
                  >
                    <option value="Usta">Usta</option>
                    <option value="Yonetici">Yönetici</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

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
                  disabled={isSubmitting || !formData.username.trim()}
                  className="px-5 py-2 flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-[#050505] font-semibold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {isDeleteModalOpen && userToDelete && (
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
              <h3 className="text-xl font-bold text-white">Kullanıcıyı Sil</h3>
              <p className="text-slate-400 text-sm">
                <span className="text-white font-medium">'{userToDelete.username}'</span> adlı kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /> Evet, Sil</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
