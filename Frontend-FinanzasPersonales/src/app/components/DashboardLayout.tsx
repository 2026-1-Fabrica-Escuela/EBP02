import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router";
import { LayoutDashboard, PlusCircle, MinusCircle, LogOut, Menu, X, Shield } from "lucide-react";
import { useApp } from "../context/AppContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/income", label: "Registrar Ingreso", icon: PlusCircle },
  { to: "/dashboard/expense", label: "Registrar Gasto", icon: MinusCircle },
];

const ADMIN_NAV_ITEMS = [
  { to: "/dashboard/admin", label: "Admin Panel", icon: Shield },
];

export function DashboardLayout() {
  const { user, logout, isInitializing } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isInitializing && !user) {
      navigate("/login", { replace: true });
    }
  }, [isInitializing, navigate, user]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
    navigate("/login", { replace: true });
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center text-[#6b7280]">
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = user.role === "admin" ? ADMIN_NAV_ITEMS : NAV_ITEMS;

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-[#e0e0e0]/50">
        <h2 className="text-[#1A237E]">Fluent</h2>
      </div>
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-[10px] transition-all duration-200 text-[0.875rem]
                ${active ? "bg-[#1A237E] text-white shadow-sm" : "text-[#4a4a5a] hover:bg-[#1A237E]/5"}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#e0e0e0]/50">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#1A237E] flex items-center justify-center text-white text-[0.75rem]">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.8125rem] text-[#1a1a2e] truncate">{user.name}</p>
            <p className="text-[0.6875rem] text-[#6b7280] truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-[#FF5252] hover:bg-[#FF5252]/5 transition-all text-[0.875rem] cursor-pointer"
        >
          <LogOut size={18} /> {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 bg-white border-r border-[#e0e0e0]/50 fixed inset-y-0 left-0">
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white h-full shadow-xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-[#6b7280] cursor-pointer">
              <X size={20} />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        <header className="lg:hidden bg-white border-b border-[#e0e0e0]/50 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="text-[#1A237E] cursor-pointer">
            <Menu size={24} />
          </button>
          <h3 className="text-[#1A237E]">Fluent</h3>
          <div className="w-6" />
        </header>
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}