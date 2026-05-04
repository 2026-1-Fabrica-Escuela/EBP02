import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Info,
  Scale,
  Search,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentCard } from "../components/ui/FluentCard";
import { FluentInput } from "../components/ui/FluentInput";
import { useApp, type Transaction } from "../context/AppContext";

type FilterError = "required" | "invalid-range" | null;

interface AppliedRange {
  from: string;
  to: string;
}

interface ResultState {
  transactions: Transaction[];
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  from: string;
  to: string;
}

interface SummaryCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBackgroundClassName: string;
  iconClassName: string;
  valueClassName: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) => {
  const normalizedDate = value.split("T")[0];
  const [year, month, day] = normalizedDate.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
};

const CATEGORY_COLORS: Record<string, string> = {
  Salario: "#1A237E",
  Freelance: "#1A237E",
  Alimentación: "#FFC107",
  Transporte: "#00E676",
  Servicios: "#FF5252",
  Salud: "#7C4DFF",
  Entretenimiento: "#FF6D00",
  Educación: "#00BCD4",
  Ropa: "#EC407A",
  "Otros gastos": "#78909C",
};

const categoryColor = (category: string) => CATEGORY_COLORS[category] ?? "#6b7280";

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconBackgroundClassName,
  iconClassName,
  valueClassName,
}: SummaryCardProps) {
  return (
    <FluentCard className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" padding="md">
      <div className="mb-3 flex items-start justify-between">
        <p className="text-[0.75rem] uppercase tracking-wide text-[#6b7280]">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBackgroundClassName}`}>
          <Icon size={18} className={iconClassName} />
        </div>
      </div>
      <p className={`text-[1.375rem] font-bold ${valueClassName}`}>{value}</p>
    </FluentCard>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === "ingreso";

  return (
    <div className="flex items-center justify-between rounded-[10px] bg-[#F5F7FA] px-3 py-3 transition-colors hover:bg-[#eef0f7]">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            isIncome ? "bg-[#00E676]/13" : "bg-[#FF5252]/10"
          }`}
        >
          {isIncome ? (
            <ArrowUpCircle size={18} className="text-[#00C853]" />
          ) : (
            <ArrowDownCircle size={18} className="text-[#FF5252]" />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[0.875rem] text-[#1a1a2e]">{transaction.description}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-1.5 py-0.5 text-[0.6875rem] font-medium text-white"
              style={{ background: categoryColor(transaction.category) }}
            >
              {transaction.category}
            </span>
            <span className="text-[0.75rem] text-[#6b7280]">{formatDate(transaction.date)}</span>
          </div>
        </div>
      </div>

      <p
        className={`ml-3 shrink-0 text-[0.9375rem] font-semibold ${
          isIncome ? "text-[#00C853]" : "text-[#FF5252]"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatCurrency(transaction.amount)}
      </p>
    </div>
  );
}

export function HistoryPage() {
  const { user, transactions } = useApp();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filterError, setFilterError] = useState<FilterError>(null);
  const [appliedRange, setAppliedRange] = useState<AppliedRange | null>(null);

  const userTransactions = useMemo(() => {
    if (!user) {
      return [];
    }

    return [...transactions]
      .filter((transaction) => transaction.userId === user.id)
      .sort((left, right) => right.date.localeCompare(left.date));
  }, [transactions, user?.id]);

  const result = useMemo<ResultState | null>(() => {
    if (!appliedRange) {
      return null;
    }

    const filteredTransactions = userTransactions.filter(
      (transaction) => transaction.date >= appliedRange.from && transaction.date <= appliedRange.to,
    );

    const totalIngresos = filteredTransactions
      .filter((transaction) => transaction.type === "ingreso")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalEgresos = filteredTransactions
      .filter((transaction) => transaction.type === "gasto")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      transactions: filteredTransactions,
      totalIngresos,
      totalEgresos,
      balance: totalIngresos - totalEgresos,
      from: appliedRange.from,
      to: appliedRange.to,
    };
  }, [appliedRange, userTransactions]);

  const handleVisualize = () => {
    if (!from || !to) {
      setFilterError("required");
      setAppliedRange(null);
      return;
    }

    if (to < from) {
      setFilterError("invalid-range");
      setAppliedRange(null);
      return;
    }

    setFilterError(null);
    setAppliedRange({ from, to });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="mb-1 text-[#1a1a2e]">Historial de Transacciones</h1>
        <p className="text-[#6b7280]">Consulta tus movimientos y balance financiero por período</p>
      </div>

      <FluentCard padding="lg">
        <p className="mb-5 text-[0.8125rem] text-[#6b7280]">
          Selecciona el rango de fechas para filtrar tus transacciones
        </p>

        <div className="flex flex-col gap-4 items-end sm:flex-row">
          <div className="flex-1">
            <FluentInput
              label="Fecha Inicio *"
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setFilterError(null);
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
              }}
              error={filterError === "required" && !to ? "Campo obligatorio" : undefined}
            />
          </div>

          <FluentButton className="w-full sm:w-auto" onClick={handleVisualize}>
            <Search size={18} />
            Visualizar
          </FluentButton>
        </div>

        {filterError === "invalid-range" && (
          <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-[#FF5252]/30 bg-[#FF5252]/5 p-3">
            <AlertTriangle size={18} className="shrink-0 text-[#FF5252]" />
            <p className="text-[0.8125rem] text-[#FF5252]">
              El periodo de fechas seleccionado no es válido
            </p>
          </div>
        )}

        {filterError === "required" && (
          <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-[#FF5252]/30 bg-[#FF5252]/5 p-3">
            <AlertTriangle size={18} className="shrink-0 text-[#FF5252]" />
            <p className="text-[0.8125rem] text-[#FF5252]">
              Debes ingresar ambas fechas para aplicar el filtro
            </p>
          </div>
        )}
      </FluentCard>

      {result && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-[0.8125rem] text-[#6b7280]">
            <History size={15} />
            <span>
              Período: <strong className="text-[#1a1a2e]">{formatDate(result.from)}</strong>
              {" — "}
              <strong className="text-[#1a1a2e]">{formatDate(result.to)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Total Ingresos"
              value={formatCurrency(result.totalIngresos)}
              icon={TrendingUp}
              iconBackgroundClassName="bg-[#00E676]/15"
              iconClassName="text-[#00C853]"
              valueClassName="text-[#00C853]"
            />
            <SummaryCard
              label="Total Egresos"
              value={formatCurrency(result.totalEgresos)}
              icon={TrendingDown}
              iconBackgroundClassName="bg-[#FF5252]/10"
              iconClassName="text-[#FF5252]"
              valueClassName="text-[#FF5252]"
            />
            <SummaryCard
              label="Balance Neto"
              value={formatCurrency(result.balance)}
              icon={Scale}
              iconBackgroundClassName={
                result.balance >= 0 ? "bg-[#1A237E]/10" : "bg-[#FF5252]/10"
              }
              iconClassName={result.balance >= 0 ? "text-[#1A237E]" : "text-[#FF5252]"}
              valueClassName={result.balance >= 0 ? "text-[#1A237E]" : "text-[#FF5252]"}
            />
          </div>

          {result.transactions.length === 0 ? (
            <FluentCard>
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFC107]/10">
                  <Info size={28} className="text-[#FFC107]" />
                </div>
                <p className="text-[#1a1a2e]">Sin movimientos en este período</p>
                <p className="max-w-xs text-[0.8125rem] text-[#6b7280]">
                  No existen movimientos registrados, por lo tanto no se puede establecer el balance
                </p>
              </div>
            </FluentCard>
          ) : (
            <FluentCard padding="md">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-[#1a1a2e]">Movimientos</h3>
                <span className="rounded-full bg-[#F5F7FA] px-2.5 py-0.5 text-[0.75rem] text-[#6b7280]">
                  {result.transactions.length} {result.transactions.length === 1 ? "transacción" : "transacciones"}
                </span>
              </div>

              <div className="space-y-2">
                {result.transactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </div>
            </FluentCard>
          )}
        </div>
      )}

      {!result && !filterError && (
        <FluentCard>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1A237E]/10">
              <History size={28} className="text-[#1A237E]" />
            </div>
            <p className="text-[#1a1a2e]">Selecciona un período para comenzar</p>
            <p className="max-w-xs text-[0.8125rem] text-[#6b7280]">
              Ingresa una fecha de inicio y una fecha fin, luego haz clic en "Visualizar" para ver tus
              movimientos
            </p>
          </div>
        </FluentCard>
      )}
    </div>
  );
}
