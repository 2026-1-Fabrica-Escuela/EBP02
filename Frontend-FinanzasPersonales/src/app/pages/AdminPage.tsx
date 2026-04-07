import React from "react";
import { ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";

export function AdminPage() {
  const { user } = useApp();

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#FF5252]/10 flex items-center justify-center mb-4">
          <ShieldCheck size={32} className="text-[#FF5252]" />
        </div>
        <h2 className="text-[#1a1a2e] mb-2">Acceso restringido a administradores</h2>
        <p className="text-[#6b7280]">No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-[#1a1a2e] mb-2">Panel de Administración</h1>
      <p className="text-[#6b7280]">
        Esta sección estará disponible en una próxima entrega.
      </p>
    </div>
  );
}