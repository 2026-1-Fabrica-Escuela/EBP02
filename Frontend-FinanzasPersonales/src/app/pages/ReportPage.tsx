import { useState } from "react";
import { AlertTriangle, BarChart2, Search } from "lucide-react";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentCard } from "../components/ui/FluentCard";
import { FluentInput } from "../components/ui/FluentInput";
import { useApp, type Transaction } from "../context/AppContext";

type FilterError = "required" | "invalid" | null;

interface CategoryRow {
  category: string;
  count: number;
  total: number;
}

interface ReportResult {
  rows: CategoryRow[];
  grandTotal: number;
  dailyAvg: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const getUtcDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

const daysBetweenInclusive = (from: string, to: string): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((getUtcDate(to) - getUtcDate(from)) / msPerDay) + 1;
};

const groupExpensesByCategory = (transactions: Transaction[]): CategoryRow[] => {
  const categoryMap = new Map<string, { count: number; total: number }>();

  for (const transaction of transactions) {
    const current = categoryMap.get(transaction.category) ?? { count: 0, total: 0 };
    categoryMap.set(transaction.category, {
      count: current.count + 1,
      total: current.total + transaction.amount,
    });
  }

  return Array.from(categoryMap.entries())
    .map(([category, value]) => ({ category, ...value }))
    .sort((left, right) => left.total - right.total || left.category.localeCompare(right.category, "es"));
};

function EmptyState({
  title,
  description,
  iconBackgroundClassName,
  iconClassName,
}: {
  title: string;
  description: string;
  iconBackgroundClassName: string;
  iconClassName: string;
}) {
  return (
    <FluentCard>
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${iconBackgroundClassName}`}>
          <BarChart2 size={28} className={iconClassName} />
        </div>
        <p className="text-[#1a1a2e]">{title}</p>
        <p className="max-w-xs text-[0.8125rem] text-[#6b7280]">{description}</p>
      </div>
    </FluentCard>
  );
}

export function ReportPage() {
  const { user, transactions } = useApp();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filterError, setFilterError] = useState<FilterError>(null);
  const [result, setResult] = useState<ReportResult | null>(null);

  const handleGenerate = () => {
    if (!from || !to) {
      setFilterError("required");
      setResult(null);
      return;
    }

    if (to < from) {
      setFilterError("invalid");
      setResult(null);
      return;
    }

    const activeUserId = user?.id;
    if (!activeUserId) {
      setResult(null);
      return;
    }

    const expenses = transactions.filter(
      (transaction) =>
        transaction.userId === activeUserId &&
        transaction.type === "gasto" &&
        transaction.date >= from &&
        transaction.date <= to,
    );

    const rows = groupExpensesByCategory(expenses);
    const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);
    const totalDays = daysBetweenInclusive(from, to);

    setFilterError(null);
    setResult({
      rows,
      grandTotal,
      dailyAvg: totalDays > 0 ? grandTotal / totalDays : 0,
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="mb-1 text-[#1a1a2e]">Reportes</h1>
        <p className="text-[#6b7280]">Genera un reporte de gastos agrupado por categoría dentro de un período</p>
      </div>

      <FluentCard padding="lg">
        <p className="mb-5 text-[0.8125rem] text-[#6b7280]">
          Selecciona el rango de fechas para generar el reporte
        </p>

        <div className="flex flex-col items-end gap-4 sm:flex-row">
          <div className="flex-1">
            <FluentInput
              label="Fecha Inicio *"
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setFilterError(null);
                setResult(null);
              }}
              error={filterError === "required" && !from ? "Campo obligatorio" : undefined}
            />
          </div>

          <div className="flex-1">
            <FluentInput
              label="Fecha Fin *"
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setFilterError(null);
                setResult(null);
              }}
              error={filterError === "required" && !to ? "Campo obligatorio" : undefined}
            />
          </div>

          <FluentButton className="w-full sm:w-auto" onClick={handleGenerate}>
            <Search size={18} />
            Generar Reporte
          </FluentButton>
        </div>

        {filterError === "required" && (
          <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-[#FF5252]/30 bg-[#FF5252]/5 p-3">
            <AlertTriangle size={18} className="shrink-0 text-[#FF5252]" />
            <p className="text-[0.8125rem] text-[#FF5252]">
              Debes seleccionar un rango de fechas para generar el reporte
            </p>
          </div>
        )}

        {filterError === "invalid" && (
          <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-[#FF5252]/30 bg-[#FF5252]/5 p-3">
            <AlertTriangle size={18} className="shrink-0 text-[#FF5252]" />
            <p className="text-[0.8125rem] text-[#FF5252]">
              La fecha final debe ser igual o posterior a la fecha inicial
            </p>
          </div>
        )}
      </FluentCard>

      {result && (
        <>
          {result.rows.length === 0 ? (
            <EmptyState
              title="Sin datos para este período"
              description="No hay datos disponibles para el periodo seleccionado"
              iconBackgroundClassName="bg-[#FFC107]/10"
              iconClassName="text-[#FFC107]"
            />
          ) : (
            <FluentCard padding="md">
              <div className="overflow-x-auto">
                <table className="w-full text-[0.875rem]">
                  <thead>
                    <tr className="border-b border-[#e0e0e0]">
                      <th className="px-3 py-3 text-left text-[0.75rem] uppercase tracking-wide text-[#6b7280]">
                        Categoría
                      </th>
                      <th className="px-3 py-3 text-center text-[0.75rem] uppercase tracking-wide text-[#6b7280]">
                        Cantidad de Movimientos
                      </th>
                      <th className="px-3 py-3 text-right text-[0.75rem] uppercase tracking-wide text-[#6b7280]">
                        Monto Total por Categoría
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, index) => (
                      <tr
                        key={row.category}
                        className={`border-b border-[#e0e0e0]/50 ${index % 2 === 0 ? "bg-white" : "bg-[#F5F7FA]"}`}
                      >
                        <td className="px-3 py-3 text-[#1a1a2e]">{row.category}</td>
                        <td className="px-3 py-3 text-center text-[#6b7280]">{row.count}</td>
                        <td className="px-3 py-3 text-right font-semibold text-[#FF5252]">
                          {formatCurrency(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>
                        <div className="mt-3 flex flex-col gap-3 rounded-[10px] bg-[#1A237E] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-center sm:text-left">
                            <p className="mb-0.5 text-[0.6875rem] uppercase tracking-wide text-white/60">
                              Gasto Total del Periodo
                            </p>
                            <p className="text-[1.25rem] font-bold text-white">
                              {formatCurrency(result.grandTotal)}
                            </p>
                          </div>

                          <div className="hidden h-10 w-px bg-white/20 sm:block" />

                          <div className="text-center sm:text-right">
                            <p className="mb-0.5 text-[0.6875rem] uppercase tracking-wide text-white/60">
                              Promedio de Gasto Diario
                            </p>
                            <p className="text-[1.25rem] font-bold text-[#00E676]">
                              {formatCurrency(result.dailyAvg)}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </FluentCard>
          )}
        </>
      )}

      {!result && !filterError && (
        <EmptyState
          title="Genera tu primer reporte"
          description={'Ingresa una fecha de inicio y una fecha fin, luego haz clic en "Generar Reporte" para analizar tus gastos'}
          iconBackgroundClassName="bg-[#1A237E]/10"
          iconClassName="text-[#1A237E]"
        />
      )}
    </div>
  );
}