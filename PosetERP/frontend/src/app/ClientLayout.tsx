"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Factory,
  PackageOpen,
  Bell,
  UserCircle,
  LogOut,
  UsersRound,
  Store,
  ClipboardList,
  Globe
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "../components/ToastProvider";
import { useTranslations } from "next-intl";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const tSidebar = useTranslations("Sidebar");
  const tHeader = useTranslations("Header");

  useEffect(() => {
    if (pathname !== "/login") {
      const role = localStorage.getItem("userRole");
      const name = localStorage.getItem("userName");
      setUserRole(role);
      setUserName(name);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const switchLanguage = () => {
    const currentLocale = document.cookie.includes('NEXT_LOCALE=en') ? 'en' : 'tr';
    const nextLocale = currentLocale === 'tr' ? 'en' : 'tr';
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  if (pathname === "/login") {
    return (
      <ToastProvider>
        {children}
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-64 bg-[#111111] border-r border-[#222] flex flex-col justify-between hidden md:flex">
          <div>
            <div className="h-16 flex items-center px-6 border-b border-[#222]">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-baseline gap-1">
                BELSU <span className="text-cyan-400 text-xs font-semibold uppercase tracking-widest">ERP</span>
              </h1>
            </div>
            <nav className="p-4 space-y-2">
              {userRole !== "Usta" && (
                <>
                  <Link href="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                    <LayoutDashboard size={20} />
                    <span className="font-medium">{tSidebar("dashboard")}</span>
                  </Link>
                  <Link href="/musteriler" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/musteriler" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                    <Users size={20} />
                    <span className="font-medium">{tSidebar("customers")}</span>
                  </Link>
                  <Link href="/tedarikciler" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/tedarikciler" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                    <Store size={20} />
                    <span className="font-medium">{tSidebar("suppliers")}</span>
                  </Link>
                  <Link href="/siparisler" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/siparisler" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                    <ShoppingCart size={20} />
                    <span className="font-medium">{tSidebar("orders")}</span>
                  </Link>
                  <Link href="/sevkiyat" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/sevkiyat" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                    <PackageOpen size={20} />
                    <span className="font-medium">{tSidebar("shipping")}</span>
                  </Link>
                  {/* Sadece Admin: Kullanıcı Yönetimi + Sistem Kayıtları */}
                  {userRole === "Admin" && (
                    <>
                      <Link href="/kullanicilar" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/kullanicilar" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                        <UsersRound size={20} />
                        <span className="font-medium">{tSidebar("users")}</span>
                      </Link>
                      <Link href="/sistem-kayitlari" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/sistem-kayitlari" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                        <ClipboardList size={20} />
                        <span className="font-medium">{tSidebar("auditLogs")}</span>
                      </Link>
                    </>
                  )}
                </>
              )}
              
              <Link href="/uretim" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/uretim" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                <Factory size={20} />
                <span className="font-medium">{tSidebar("production")}</span>
              </Link>
              <Link href="/hammadde" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/hammadde" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                <PackageOpen size={20} />
                <span className="font-medium">{tSidebar("rawMaterial")}</span>
              </Link>
            </nav>
          </div>

          {/* Sidebar Footer with Logout */}
          <div className="p-4 border-t border-[#222] space-y-4">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 bg-[#1A1A1A] hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-all group shadow-none hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]"
            >
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
              <span className="font-medium">{tSidebar("logout")}</span>
            </button>
            
            <div className="text-xs text-slate-500 text-center">
              &copy; {new Date().getFullYear()} Belsu Agency
            </div>
          </div>
        </aside>

        {/* MAIN WRAPPER */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[#050505]">

          {/* BACKGROUND GLOW */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-700/5 blur-[120px] pointer-events-none" />

          {/* HEADER */}
          <header className="h-16 bg-[#111111]/80 backdrop-blur-md border-b border-[#222] flex items-center justify-end px-8 z-10 sticky top-0">
            <div className="flex items-center gap-6">
              <button onClick={switchLanguage} className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors bg-[#1A1A1A] px-3 py-1.5 rounded-full border border-[#333] hover:border-cyan-500/50">
                <Globe size={16} />
                <span className="text-xs font-semibold uppercase">TR/EN</span>
              </button>
              
              <button className="relative text-slate-400 hover:text-cyan-400 transition-colors">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-cyan-400 rounded-full border border-[#111] animate-pulse glow-cyan"></span>
              </button>
              <div className="flex items-center gap-3 pl-6 border-l border-[#333] cursor-pointer group">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                    {userName || "Kullanıcı"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {userRole === "Admin" ? "Sistem Yöneticisi" : userRole === "Yonetici" ? "Yönetici" : userRole === "Usta" ? "Usta" : userRole ?? ""}
                  </p>
                </div>
                <UserCircle size={36} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <main className="flex-1 overflow-y-auto p-8 z-10">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
