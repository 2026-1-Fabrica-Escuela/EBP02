import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Info,
  Loader2,
  Pencil,
  Scale,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentCard } from "../components/ui/FluentCard";
import { FluentInput } from "../components/ui/FluentInput";
import { FluentSelect } from "../components/ui/FluentSelect";
import { useApp } from "../context/AppContext";
import { getTransactionsByPeriodRequest, getStoredAuthToken } from "../services/api";

type FilterError = "required" | "invalid-range" | null;

interface TransactionRow {
  id: string;
  type: "ingreso" | "gasto";
  amount: number;
  date: string;
  description: string;
  category: string;
  categoryId?: string;
}

interface ResultState {
  transactions: TransactionRow[];
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

const normalizeTransactionType = (value: string | null): "ingreso" | "gasto" | null => {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (["ingreso", "income", "entrada"].includes(normalized)) return "ingreso";
  if (["gasto", "expense", "egreso"].includes(normalized)) return "gasto";
  return null;
};

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

function TransactionRowComponent({ transaction, onEdit, onDelete }: { transaction: TransactionRow; onEdit: (t: TransactionRow) => void; onDelete: (t: TransactionRow) => void }) {
  const isIncome = transaction.type === "ingreso";

  return (
    <div className="flex items-center justify-between rounded-[10px] bg-[#F5F7FA] px-3 py-3 transition-colors hover:bg-[#eef0f7]">
      <div className="flex min-w-0 items-center gap-3 flex-1">
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

      <div className="flex items-center gap-1 shrink-0">
        <p
          className={`text-[0.9375rem] font-semibold ${
            isIncome ? "text-[#00C853]" : "text-[#FF5252]"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </p>
        <button
          type="button"
          onClick={() => onEdit(transaction)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#1A237E]/10 hover:text-[#1A237E]"
          title="Editar transacción"
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(transaction)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#FF5252]/10 hover:text-[#FF5252]"
          title="Eliminar transacción"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function EditTransactionModal({
  transaction,
  categories,
  onSave,
  onClose,
}: {
  transaction: TransactionRow;
  categories: { categoryId: string; title: string; type: string }[];
  onSave: (data: { amount: number; date: string; description: string; categoryId: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(transaction.amount));
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description);
  const [categoryId, setCategoryId] = useState(transaction.categoryId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions = React.useMemo(() => {
    const typeFilter = transaction.type === "ingreso" ? "INCOME" : "EXPENSE";
    return categories
      .filter((cat) => cat.type === typeFilter)
      .map((cat) => ({ value: cat.categoryId, label: cat.title }));
  }, [categories, transaction.type]);

  const validate = () => {
    const e: Record<string, string> = {};

    if (!amount.trim()) {
      e.amount = "Campo obligatorio";
    } else if (!/^\d+(\.\d+)?$/.test(amount.trim())) {
      e.amount = "El monto debe ser un valor numérico mayor a cero";
    } else if (parseFloat(amount) <= 0) {
      e.amount = "El monto debe ser un valor numérico mayor a cero";
    }

    if (!date) {
      e.date = "Campo obligatorio";
    }

    if (!description.trim()) {
      e.description = "Campo obligatorio";
    }

    if (!categoryId) {
      e.categoryId = "Debes seleccionar una categoría";
    }

    if (Object.keys(e).length > 0) {
      toast.error("Por favor, completa todos los campos obligatorios");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSave({
        amount: parseFloat(amount),
        date,
        description: description.trim(),
        categoryId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e0e0e0]/50 px-6 py-4">
          <h3 className="text-[#1a1a2e]">Editar Transacción</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#1a1a2e]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-6">
          <FluentInput
            label="Monto *"
            type="text"
            placeholder="Ej: 1500000"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors((prev) => ({ ...prev, amount: "" })); }}
            error={errors.amount}
          />
          <FluentInput
            label="Fecha *"
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setErrors((prev) => ({ ...prev, date: "" })); }}
            error={errors.date}
          />
          <FluentSelect
            label="Categoría *"
            value={categoryId}
            onChange={(v) => { setCategoryId(v); setErrors((prev) => ({ ...prev, categoryId: "" })); }}
            options={categoryOptions}
            error={errors.categoryId}
          />
          <FluentInput
            label="Descripción *"
            placeholder="Ej: Descripción de la transacción"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setErrors((prev) => ({ ...prev, description: "" })); }}
            error={errors.description}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#e0e0e0]/50 px-6 py-4">
          <FluentButton variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </FluentButton>
          <FluentButton onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </FluentButton>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({
  transaction,
  onConfirm,
  onCancel,
}: {
  transaction: TransactionRow;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e0e0e0]/50 px-6 py-4">
          <h3 className="text-[#1a1a2e]">Eliminar Transacción</h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#1a1a2e]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF5252]/10">
            <Trash2 size={28} className="text-[#FF5252]" />
          </div>
          <p className="text-[0.9375rem] text-[#1a1a2e]">
            ¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer
          </p>
          <p className="text-[0.8125rem] text-[#6b7280]">
            {transaction.description} — {formatCurrency(transaction.amount)}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#e0e0e0]/50 px-6 py-4">
          <FluentButton variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </FluentButton>
          <FluentButton variant="danger" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? "Eliminando..." : "Confirmar"}
          </FluentButton>
        </div>
      </div>
    </div>
  );
}

export function HistoryPage() {
  const { user, categories, updateTransaction, deleteTransaction } = useApp();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filterError, setFilterError] = useState<FilterError>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<TransactionRow | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionRow | null>(null);

  const handleVisualize = async () => {
    if (!from || !to) {
      setFilterError("required");
      setResult(null);
      return;
    }

    if (to < from) {
      setFilterError("invalid-range");
      setResult(null);
      return;
    }

    setFilterError(null);
    setApiError(null);
    setLoading(true);

    try {
      const token = getStoredAuthToken();
      const payload = await getTransactionsByPeriodRequest(from, to, token);

      // The backend returns a list of TransactionResponse objects
      const rawList: unknown[] = Array.isArray(payload)
        ? payload
        : (payload as any)?.transactions ?? (payload as any)?.data ?? (Array.isArray(payload) ? payload : [payload]);

      const finalList: unknown[] = Array.isArray(rawList) ? rawList : [];

      const transactions: TransactionRow[] = finalList
        .map((item: any) => {
          const id = item.transactionId ?? item.id ?? "";
          const type = normalizeTransactionType(item.categoryType ?? item.type) ?? "gasto";
          const amount = typeof item.amount === "number" ? item.amount : Number(item.amount) || 0;
          const date = item.date ?? "";
          const description = item.description ?? "Sin descripción";
          const category = item.categoryTitle ?? item.category ?? "Sin categoría";
          const categoryId = item.categoryId ?? "";
          return { id: String(id), type, amount, date, description, category, categoryId } as TransactionRow;
        })
        .filter((t) => t.id && t.date);

      const totalIngresos = transactions
        .filter((t) => t.type === "ingreso")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalEgresos = transactions
        .filter((t) => t.type === "gasto")
        .reduce((sum, t) => sum + t.amount, 0);

      setResult({
        transactions,
        totalIngresos,
        totalEgresos,
        balance: totalIngresos - totalEgresos,
        from,
        to,
      });
    } catch (error: any) {
      setApiError(error?.message ?? "Error al consultar las transacciones");
      setResult(null);
    } finally {
      setLoading(false);
    }
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

          <FluentButton className="w-full sm:w-auto" onClick={handleVisualize} disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {loading ? "Cargando..." : "Visualizar"}
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

        {apiError && (
          <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-[#FF5252]/30 bg-[#FF5252]/5 p-3">
            <AlertTriangle size={18} className="shrink-0 text-[#FF5252]" />
            <p className="text-[0.8125rem] text-[#FF5252]">{apiError}</p>
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
                  <TransactionRowComponent key={transaction.id} transaction={transaction} onEdit={setEditingTransaction} onDelete={setDeletingTransaction} />
                ))}
              </div>
            </FluentCard>
          )}
        </div>
      )}

      {!result && !filterError && !apiError && (
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

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          categories={categories}
          onSave={async (data) => {
            const resultAction = await updateTransaction(editingTransaction.id, data);
            if (resultAction.success) {
              toast.success(resultAction.message);
              setEditingTransaction(null);
              if (from && to) {
                setResult(null);
                setFrom("");
                setTo("");
              }
            } else {
              toast.error(resultAction.message);
            }
          }}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      {deletingTransaction && (
        <DeleteConfirmDialog
          transaction={deletingTransaction}
          onConfirm={async () => {
            const resultAction = await deleteTransaction(deletingTransaction.id);
            if (resultAction.success) {
              toast.success(resultAction.message);
              setDeletingTransaction(null);
            } else {
              toast.error(resultAction.message);
              setDeletingTransaction(null);
            }
          }}
          onCancel={() => setDeletingTransaction(null)}
        />
      )}
    </div>
  );
}
