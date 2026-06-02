import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ListOrdered,
  Pencil,
  PlusCircle,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentCard } from "../components/ui/FluentCard";
import { FluentInput } from "../components/ui/FluentInput";
import { FluentSelect } from "../components/ui/FluentSelect";
import { useApp, type Budget, type Pocket, type Category } from "../context/AppContext";

type View = "form" | "list";

interface FormState {
  month: string;
  category: string;
  amount: string;
}


const MONTHS = [
  { value: "2025-10", label: "Octubre 2025" },
  { value: "2025-11", label: "Noviembre 2025" },
  { value: "2025-12", label: "Diciembre 2025" },
  { value: "2026-01", label: "Enero 2026" },
  { value: "2026-02", label: "Febrero 2026" },
  { value: "2026-03", label: "Marzo 2026" },
  { value: "2026-04", label: "Abril 2026" },
  { value: "2026-05", label: "Mayo 2026" },
  { value: "2026-06", label: "Junio 2026" },
  { value: "2026-07", label: "Julio 2026" },
  { value: "2026-08", label: "Agosto 2026" },
  { value: "2026-09", label: "Septiembre 2026" },
  { value: "2026-10", label: "Octubre 2026" },
  { value: "2026-11", label: "Noviembre 2026" },
  { value: "2026-12", label: "Diciembre 2026" },
];

const monthLabel = (value: string) => MONTHS.find((item) => item.value === value)?.label ?? value;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const formatPeriodLabel = (month: number, year: number) => {
  const label = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));

  return label.charAt(0).toUpperCase() + label.slice(1);
};

const parseMonthValue = (value: string) => {
  const [yearValue, monthValue] = value.split("-");
  const year = Number(yearValue);
  const month = Number(monthValue);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
};

const parseAmount = (value: string) => Number(value.replace(",", "."));

const isAmountValid = (value: string) => {
  const trimmed = value.trim();
  return /^\d+([.,]\d+)?$/.test(trimmed) && Number.isFinite(parseAmount(trimmed)) && parseAmount(trimmed) > 0;
};

const normalizeText = (value: string) => value.trim().toLowerCase();

const findMonthBudget = (budgets: Budget[], month: number, year: number) =>
  budgets.find((budget) => budget.month === month && budget.year === year) ?? null;

const getBudgetPockets = (pockets: Pocket[], budgetId: string) =>
  pockets.filter((pocket) => pocket.budgetId === budgetId);

function EditBudgetModal({
  budget,
  label,
  onSave,
  onClose,
}: {
  budget: Budget;
  label: string;
  onSave: (totalAmount: number) => Promise<void>;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(budget.totalAmount));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};

    if (!amount.trim()) {
      e.amount = "Campo obligatorio";
    } else if (!/^\d+(\.\d+)?$/.test(amount.trim())) {
      e.amount = "El monto debe ser un valor numérico";
    } else if (parseFloat(amount) <= 0) {
      e.amount = "El monto del presupuesto debe ser mayor a cero";
    }

    if (Object.keys(e).length > 0) {
      toast.error("Por favor completa todos los campos obligatorios");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSave(parseFloat(amount));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e0e0e0]/50 px-6 py-4">
          <h3 className="text-[#1a1a2e]">Editar Presupuesto</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#1a1a2e]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-6">
          <div className="rounded-[10px] bg-[#F5F7FA] px-4 py-3">
            <p className="text-[0.75rem] uppercase tracking-wide text-[#6b7280] mb-1">Período</p>
            <p className="text-[0.9375rem] text-[#1a1a2e] font-medium">{label}</p>
          </div>

          <FluentInput
            label="Monto *"
            type="text"
            placeholder="Ej: 2500000"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors((prev) => ({ ...prev, amount: "" })); }}
            error={errors.amount}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#e0e0e0]/50 px-6 py-4">
          <FluentButton variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </FluentButton>
          <FluentButton onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Confirmar"}
          </FluentButton>
        </div>
      </div>
    </div>
  );
}

export function BudgetPage() {
  const { budgets, pockets, categories, createBudget, updateBudget, createPocket, refreshData } = useApp();

  const expenseCategories = useMemo(() => {
    return categories
      .filter((cat) => cat.type === "EXPENSE")
      .map((cat) => ({ value: cat.categoryId, label: cat.title }));
  }, [categories]);

  const [view, setView] = useState<View>("form");
  const [form, setForm] = useState<FormState>({ month: "", category: "", amount: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateMsg, setDuplicateMsg] = useState(false);
  const [discardMsg, setDiscardMsg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{ budget: Budget; pockets: Pocket[]; label: string } | null>(null);

  const groupedBudgets = useMemo(() => {
    return [...budgets]
      .sort((left, right) => {
        if (left.year !== right.year) {
          return right.year - left.year;
        }

        if (left.month !== right.month) {
          return right.month - left.month;
        }

        return left.budgetId.localeCompare(right.budgetId);
      })
      .map((budget) => {
        const monthPockets = getBudgetPockets(pockets, budget.budgetId);

        return {
          budget,
          pockets: monthPockets,
          label: formatPeriodLabel(budget.month, budget.year),
          total: monthPockets.reduce((sum, pocket) => sum + pocket.allocatedAmount, 0),
        };
      });
  }, [budgets, pockets]);

  const hasContent = () =>
    form.month.trim() !== "" || form.category.trim() !== "" || form.amount.trim() !== "";

  const clearFieldError = (field: keyof FormState) => {
    setErrors((current) => ({ ...current, [field]: "" }));
    setDuplicateMsg(false);
    setDiscardMsg(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const parsedPeriod = parseMonthValue(form.month);

    if (!form.month) {
      nextErrors.month = "Campo obligatorio";
    } else if (!parsedPeriod) {
      nextErrors.month = "Selecciona un periodo válido";
    }

    if (!form.category) {
      nextErrors.category = "Campo obligatorio";
    }

    if (!form.amount.trim()) {
      nextErrors.amount = "Campo obligatorio";
    } else if (!isAmountValid(form.amount)) {
      nextErrors.amount = "El monto contiene un valor numérico no válido";
    }

    if (Object.keys(nextErrors).length > 0 || !parsedPeriod) {
      setErrors(nextErrors);
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    const amount = parseAmount(form.amount);
    const categoryId = form.category;
    const categoryLabel = expenseCategories.find(c => c.value === categoryId)?.label || "";
    const existingBudget = findMonthBudget(budgets, parsedPeriod.month, parsedPeriod.year);

    if (existingBudget) {
      const monthPockets = getBudgetPockets(pockets, existingBudget.budgetId);
      const duplicatePocket = monthPockets.some(
        (pocket) => normalizeText(pocket.categoryTitle ?? pocket.title) === normalizeText(categoryLabel),
      );

      if (duplicatePocket) {
        setDuplicateMsg(true);
        toast.error("Ya existe un presupuesto activo para esta categoría en el mes seleccionado");
        return;
      }
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      let budgetId = existingBudget?.budgetId ?? "";
      const originalTotal = existingBudget?.totalAmount ?? 0;

      if (existingBudget) {
        const updateResult = await updateBudget(existingBudget.budgetId, {
          totalAmount: originalTotal + amount,
        });

        if (!updateResult.success) {
          toast.error(updateResult.message);
          return;
        }
      } else {
        const createBudgetResult = await createBudget({
          month: parsedPeriod.month,
          year: parsedPeriod.year,
          totalAmount: amount,
        });

        if (!createBudgetResult.success || !createBudgetResult.budget) {
          toast.error(createBudgetResult.message);
          return;
        }

        budgetId = createBudgetResult.budget.budgetId;
      }

      const pocketResult = await createPocket({
        budgetId,
        title: categoryLabel,
        categoryId: categoryId,
        allocatedAmount: amount,
        isSavings: false,
      });

      if (!pocketResult.success) {
        if (existingBudget) {
          await updateBudget(existingBudget.budgetId, { totalAmount: originalTotal });
        }

        toast.error(pocketResult.message);
        return;
      }

      toast.success("Presupuesto creado con éxito");
      setForm({ month: "", category: "", amount: "" });
      setErrors({});
      setDuplicateMsg(false);
      setDiscardMsg(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasContent()) {
      setDiscardMsg(true);
      toast.info("Se ha descartado la información previamente ingresada");
    }

    setForm({ month: "", category: "", amount: "" });
    setErrors({});
    setDuplicateMsg(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-[#1a1a2e] mb-1">Presupuesto Mensual</h1>
        <p className="text-[#6b7280]">Asigna límites de gasto por categoría para controlar tus finanzas</p>
      </div>

      <div className="flex gap-2 bg-white rounded-xl border border-[#e0e0e0]/50 p-1 shadow-sm w-fit">
        <button
          type="button"
          onClick={() => {
            setView("form");
            setDiscardMsg(false);
            setDuplicateMsg(false);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-[0.875rem] transition-all cursor-pointer ${
            view === "form"
              ? "bg-[#1A237E] text-white shadow-sm"
              : "text-[#6b7280] hover:text-[#1A237E] hover:bg-[#1A237E]/5"
          }`}
        >
          <PlusCircle size={16} />
          Crear Presupuesto
        </button>
        <button
          type="button"
          onClick={() => {
            setView("list");
            setDiscardMsg(false);
            setDuplicateMsg(false);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-[0.875rem] transition-all cursor-pointer ${
            view === "list"
              ? "bg-[#1A237E] text-white shadow-sm"
              : "text-[#6b7280] hover:text-[#1A237E] hover:bg-[#1A237E]/5"
          }`}
        >
          <ListOrdered size={16} />
          Lista de Presupuestos
        </button>
      </div>

      {view === "form" && (
        <FluentCard padding="lg">
          {discardMsg && (
            <div className="flex items-start gap-3 bg-[#FFC107]/10 border border-[#FFC107]/40 rounded-[10px] p-3 mb-5">
              <AlertTriangle size={18} className="text-[#FFC107] mt-0.5 shrink-0" />
              <p className="text-[0.8125rem] text-[#92610a]">Se ha descartado la información previamente ingresada</p>
            </div>
          )}

          {duplicateMsg && (
            <div className="flex items-start gap-3 bg-[#FF5252]/5 border border-[#FF5252]/30 rounded-[10px] p-3 mb-5">
              <AlertTriangle size={18} className="text-[#FF5252] mt-0.5 shrink-0" />
              <p className="text-[0.8125rem] text-[#FF5252]">
                Ya existe un presupuesto activo para esta categoría en el mes seleccionado
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FluentSelect
              label="Mes *"
              value={form.month}
              onChange={(value) => {
                setForm((current) => ({ ...current, month: value }));
                clearFieldError("month");
              }}
              options={MONTHS}
              placeholder="Selecciona un mes"
              error={errors.month}
            />

            <FluentSelect
              label="Categoría *"
              value={form.category}
              onChange={(value) => {
                setForm((current) => ({ ...current, category: value }));
                clearFieldError("category");
              }}
              options={expenseCategories}
              placeholder="Selecciona una categoría"
              error={errors.category}
            />

            <FluentInput
              label="Monto límite *"
              type="text"
              placeholder="Ej: 500000"
              value={form.amount}
              onChange={(event) => {
                setForm((current) => ({ ...current, amount: event.target.value }));
                clearFieldError("amount");
              }}
              error={errors.amount}
            />

            <div className="flex gap-3 pt-1">
              <FluentButton type="submit" fullWidth disabled={isSubmitting}>
                <CheckCircle2 size={18} />
                Guardar
              </FluentButton>
              <FluentButton type="button" variant="outline" fullWidth onClick={handleCancel}>
                <X size={18} />
                Cancelar
              </FluentButton>
            </div>
          </form>
        </FluentCard>
      )}

      {view === "list" && (
        <div className="space-y-5">
          {groupedBudgets.length === 0 ? (
            <FluentCard>
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-14 h-14 rounded-xl bg-[#1A237E]/10 flex items-center justify-center">
                  <Wallet size={28} className="text-[#1A237E]" />
                </div>
                <p className="text-[#1a1a2e]">No tienes presupuestos creados</p>
                <p className="text-[0.8125rem] text-[#6b7280]">
                  Crea tu primer presupuesto mensual para empezar a controlar tus gastos
                </p>
                <FluentButton size="sm" onClick={() => setView("form")}>
                  <PlusCircle size={15} />
                  Crear presupuesto
                </FluentButton>
              </div>
            </FluentCard>
          ) : (
            groupedBudgets.map((group) => (
              <FluentCard key={group.budget.budgetId} padding="md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-6 bg-[#1A237E] rounded-full" />
                    <h3 className="text-[#1a1a2e]">{group.label}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingBudget({ budget: group.budget, pockets: group.pockets, label: group.label })}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#1A237E]/10 hover:text-[#1A237E]"
                      title="Editar presupuesto"
                    >
                      <Pencil size={14} />
                    </button>
                    <span className="text-[0.75rem] text-[#6b7280] bg-[#F5F7FA] px-2.5 py-0.5 rounded-full">
                      {group.pockets.length} {group.pockets.length === 1 ? "categoría" : "categorías"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.pockets.map((pocket) => (
                    <div
                      key={pocket.pocketId}
                      className="flex items-center justify-between px-3 py-2.5 rounded-[10px] bg-[#F5F7FA]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#1A237E]/10 flex items-center justify-center">
                          <Wallet size={16} className="text-[#1A237E]" />
                        </div>
                        <span className="text-[0.875rem] text-[#1a1a2e] truncate">
                          {pocket.categoryTitle ?? pocket.title}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[0.875rem] text-[#1A237E]" style={{ fontWeight: 600 }}>
                          {formatCurrency(pocket.currentAmount)}
                        </span>
                        <span className="text-[0.6875rem] text-[#6b7280]">
                          de {formatCurrency(pocket.allocatedAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-[#e0e0e0]/50 flex justify-between items-center">
                  <span className="text-[0.8125rem] text-[#6b7280]">Total presupuestado</span>
                  <span className="text-[0.9375rem] text-[#1a1a2e]" style={{ fontWeight: 600 }}>
                    {formatCurrency(group.budget.totalAmount)}
                  </span>
                </div>
              </FluentCard>
            ))
          )}
        </div>
      )}

      {editingBudget && (
        <EditBudgetModal
          budget={editingBudget.budget}
          label={editingBudget.label}
          onSave={async (totalAmount) => {
            const result = await updateBudget(editingBudget.budget.budgetId, { totalAmount });
            if (result.success) {
              toast.success("La modificación ha sido exitosa.");
              setEditingBudget(null);
              await refreshData();
            } else {
              toast.error(result.message);
            }
          }}
          onClose={() => setEditingBudget(null)}
        />
      )}
    </div>
  );
}
