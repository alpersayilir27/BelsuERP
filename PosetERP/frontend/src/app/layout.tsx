"use client";

import { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Factory,
  PackageOpen,
  Bell,
  UserCircle,
  LogOut,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "../components/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Exclude login page from check for now 
    if (pathname !== "/login") {
      const role = localStorage.getItem("userRole");
      setUserRole(role);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  // If on login page, just render children without sidebar
  if (pathname === "/login") {
    return (
      <html lang="tr" className="dark">
        <body className={`${inter.className} bg-[#0A0A0A] text-slate-200 antialiased selection:bg-cyan-500/30`}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="tr" className="dark">
      <body className={`${inter.className} bg-[#0A0A0A] text-slate-200 antialiased selection:bg-cyan-500/30`}>
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
                        <span className="font-medium">Dashboard</span>
                      </Link>
                      <Link href="/musteriler" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/musteriler" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                        <Users size={20} />
                        <span className="font-medium">Müşteriler</span>
                      </Link>
                      <Link href="/siparisler" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/siparisler" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                        <ShoppingCart size={20} />
                        <span className="font-medium">Siparişler</span>
                      </Link>
                      <Link href="/sevkiyat" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/sevkiyat" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                        <PackageOpen size={20} />
                        <span className="font-medium">Sevkiyat</span>
                      </Link>
                      {userRole === "Admin" && (
                        <Link href="/kullanicilar" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/kullanicilar" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                          <UsersRound size={20} />
                          <span className="font-medium">Kullanıcılar</span>
                        </Link>
                      )}
                    </>
                  )}
                  
                  <Link href="/uretim" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/uretim" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                    <Factory size={20} />
                    <span className="font-medium">Üretim</span>
                  </Link>
                  <Link href="/hammadde" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${pathname === "/hammadde" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "text-slate-400 hover:bg-[#1A1A1A] hover:text-white border border-transparent"}`}>
                    <PackageOpen size={20} />
                    <span className="font-medium">Hammadde Deposu</span>
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
                  <span className="font-medium">Çıkış Yap</span>
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
                  <button className="relative text-slate-400 hover:text-cyan-400 transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-cyan-400 rounded-full border border-[#111] animate-pulse glow-cyan"></span>
                  </button>
                  <div className="flex items-center gap-3 pl-6 border-l border-[#333] cursor-pointer group">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">Alper Sayılır</p>
                      <p className="text-xs text-slate-500">Yönetici</p>
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
      </body>
    </html>
  );
}
