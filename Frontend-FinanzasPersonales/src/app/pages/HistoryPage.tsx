import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Search, Filter } from "lucide-react";
import { FluentCard } from "../components/ui/FluentCard";
import { useApp } from "../context/AppContext";

export function HistoryPage() {
  const { user, transactions } = useApp();
  const userTx = transactions.filter((t) => t.userId === user?.id);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "ingreso" | "gasto">("all");

  const filtered = userTx.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !t.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <h1 className="text-[#1a1a2e] mb-2">Historial de Transacciones</h1>
      <p className="text-[#6b7280] mb-6">Consulta todas tus transacciones registradas</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input
            type="text"
            placeholder="Buscar por descripción o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-[10px] border border-[#e0e0e0] bg-white focus:border-[#1A237E] focus:ring-2 focus:ring-[#1A237E]/10 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "ingreso", "gasto"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2.5 rounded-[10px] text-[0.8125rem] transition-all cursor-pointer
                ${filterType === type ? "bg-[#1A237E] text-white" : "bg-white border border-[#e0e0e0] text-[#6b7280] hover:border-[#1A237E]"}`}
            >
              <Filter size={14} className="inline mr-1.5" />
              {type === "all" ? "Todos" : type === "ingreso" ? "Ingresos" : "Gastos"}
            </button>
          ))}
        </div>
      </div>

      <FluentCard padding="sm">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#6b7280]">
            <p>No se encontraron transacciones</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e0e0e0]/30">
            {filtered.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${tx.type === "ingreso" ? "bg-[#00E676]/10" : "bg-[#FF5252]/10"}`}>
                    {tx.type === "ingreso" ? <ArrowUpRight size={20} className="text-[#00E676]" /> : <ArrowDownRight size={20} className="text-[#FF5252]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.875rem] text-[#1a1a2e] truncate">{tx.description}</p>
                    <p className="text-[0.75rem] text-[#6b7280]">
                      <span className="inline-block px-2 py-0.5 bg-[#F5F7FA] rounded-md mr-2">{tx.category}</span>
                      {tx.date}
                    </p>
                  </div>
                </div>
                <p className={`text-[0.9375rem] flex-shrink-0 ml-4 ${tx.type === "ingreso" ? "text-[#00C853]" : "text-[#FF5252]"}`} style={{ fontWeight: 600 }}>
                  {tx.type === "ingreso" ? "+" : "-"}{fmt(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </FluentCard>
    </div>
  );
}
