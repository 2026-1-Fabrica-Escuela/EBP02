import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { FluentCard } from "../components/ui/FluentCard";
import { useApp } from "../context/AppContext";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const COLORS = ["#1A237E", "#00E676", "#FFC107", "#FF5252", "#7C4DFF", "#00BCD4"];

export function DashboardHome() {
  const { user, transactions } = useApp();

  const userTx = transactions.filter((t) => t.userId === user?.id);

  const totalIncome = userTx.filter((t) => t.type === "ingreso").reduce((s, t) => s + t.amount, 0);
  const totalExpense = userTx.filter((t) => t.type === "gasto").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  // Category breakdown for expenses
  const expenseByCategory = userTx
    .filter((t) => t.type === "gasto")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  const barData = useMemo(() => {
    const now = new Date();
    const monthFormatter = new Intl.DateTimeFormat("es-CO", { month: "short" });

    const buckets = Array.from({ length: 6 }, (_, index) => {
      const current = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${current.getFullYear()}-${current.getMonth()}`;
      const monthLabel = monthFormatter.format(current).replace(".", "");

      return {
        key,
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        ingresos: 0,
        gastos: 0,
      };
    });

    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    for (const transaction of userTx) {
      const txDate = new Date(transaction.date);
      if (Number.isNaN(txDate.getTime())) {
        continue;
      }

      const key = `${txDate.getFullYear()}-${txDate.getMonth()}`;
      const bucket = bucketMap.get(key);
      if (!bucket) {
        continue;
      }

      if (transaction.type === "ingreso") {
        bucket.ingresos += transaction.amount;
      } else {
        bucket.gastos += transaction.amount;
      }
    }

    return buckets.map((bucket) => ({
      month: bucket.month,
      ingresos: bucket.ingresos,
      gastos: bucket.gastos,
    }));
  }, [userTx]);

  const stats = [
    { label: "Ingresos", value: fmt(totalIncome), icon: TrendingUp, color: "#00E676", bgColor: "#00E676" },
    { label: "Gastos", value: fmt(totalExpense), icon: TrendingDown, color: "#FF5252", bgColor: "#FF5252" },
    { label: "Balance", value: fmt(balance), icon: Wallet, color: "#1A237E", bgColor: "#1A237E" },
  ];

  const recentTx = [...userTx]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#1a1a2e] mb-1">Bienvenido, {user?.name?.split(" ")[0]}</h1>
        <p className="text-[#6b7280]">Aquí tienes un resumen de tus finanzas</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <FluentCard key={s.label} padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.8125rem] text-[#6b7280] mb-1">{s.label}</p>
                <p className="text-[1.25rem] text-[#1a1a2e]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{s.value}</p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bgColor + "15" }}>
                <s.icon size={22} style={{ color: s.color }} />
              </div>
            </div>
          </FluentCard>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FluentCard>
          <h3 className="text-[#1a1a2e] mb-4">Resumen Mensual</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value: number) => fmt(value)} />
              <Bar dataKey="ingresos" fill="#00E676" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" fill="#FF5252" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </FluentCard>

        <FluentCard>
          <h3 className="text-[#1a1a2e] mb-4">Gastos por Categoría</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => fmt(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-[#6b7280]">Sin datos de gastos</div>
          )}
          <div className="flex flex-wrap gap-3 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[0.75rem] text-[#6b7280]">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {d.name}
              </div>
            ))}
          </div>
        </FluentCard>
      </div>

      {/* Recent transactions */}
      <FluentCard>
        <h3 className="text-[#1a1a2e] mb-4">Transacciones Recientes</h3>
        <div className="space-y-3">
          {recentTx.length === 0 ? (
            <p className="text-[#6b7280] text-center py-8">No hay transacciones aún</p>
          ) : (
            recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#e0e0e0]/30 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.type === "ingreso" ? "bg-[#00E676]/10" : "bg-[#FF5252]/10"}`}>
                    {tx.type === "ingreso" ? <ArrowUpRight size={18} className="text-[#00E676]" /> : <ArrowDownRight size={18} className="text-[#FF5252]" />}
                  </div>
                  <div>
                    <p className="text-[0.875rem] text-[#1a1a2e]">{tx.description}</p>
                    <p className="text-[0.75rem] text-[#6b7280]">{tx.category} · {tx.date}</p>
                  </div>
                </div>
                <p className={`text-[0.875rem] ${tx.type === "ingreso" ? "text-[#00C853]" : "text-[#FF5252]"}`} style={{ fontWeight: 500 }}>
                  {tx.type === "ingreso" ? "+" : "-"}{fmt(tx.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </FluentCard>
    </div>
  );
}
