import React, { useState } from "react";
import { MinusCircle } from "lucide-react";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentInput } from "../components/ui/FluentInput";
import { FluentSelect } from "../components/ui/FluentSelect";
import { FluentCard } from "../components/ui/FluentCard";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  { value: "Alimentación", label: "Alimentación" },
  { value: "Transporte", label: "Transporte" },
  { value: "Vivienda", label: "Vivienda" },
  { value: "Servicios", label: "Servicios" },
  { value: "Salud", label: "Salud" },
  { value: "Entretenimiento", label: "Entretenimiento" },
  { value: "Educación", label: "Educación" },
  { value: "Ropa", label: "Ropa" },
  { value: "Otros gastos", label: "Otros gastos" },
];

export function RegisterExpensePage() {
  const { addTransaction } = useApp();
  const [form, setForm] = useState({ amount: "", date: "", description: "", category: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.amount.trim()) e.amount = "Campo obligatorio";
    else if (!/^\d+(\.\d+)?$/.test(form.amount.trim())) e.amount = "El valor ingresado debe ser numérico";
    else if (parseFloat(form.amount) <= 0) e.amount = "El valor del gasto debe ser mayor a cero";
    if (!form.date) e.date = "Campo obligatorio";
    if (!form.description.trim()) e.description = "Campo obligatorio";
    if (!form.category) e.category = "Debes seleccionar una categoría";
    if (Object.keys(e).length > 0) toast.error("Por favor completa todos los campos obligatorios");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await addTransaction({
        type: "gasto",
        amount: parseFloat(form.amount),
        date: form.date,
        description: form.description,
        category: form.category,
      });

      if (result.success) {
        toast.success(result.message);
        setForm({ amount: "", date: "", description: "", category: "" });
        setErrors({});
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-[#1a1a2e] mb-2">Registrar Gasto</h1>
      <p className="text-[#6b7280] mb-6">Registra un nuevo egreso para controlar tus finanzas</p>
      <FluentCard padding="lg">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FluentInput label="Monto *" type="text" placeholder="Ej: 50000" value={form.amount} onChange={set("amount")} error={errors.amount} />
          <FluentInput label="Fecha *" type="date" value={form.date} onChange={set("date")} error={errors.date} />
          <FluentSelect label="Categoría *" value={form.category} onChange={(v) => setForm((p) => ({ ...p, category: v }))} options={EXPENSE_CATEGORIES} error={errors.category} />
          <FluentInput label="Descripción *" placeholder="Ej: Compra en supermercado" value={form.description} onChange={set("description")} error={errors.description} />
          <FluentButton type="submit" fullWidth variant="danger" disabled={isSubmitting}>
            <MinusCircle size={18} /> {isSubmitting ? "Guardando..." : "Guardar Gasto"}
          </FluentButton>
        </form>
      </FluentCard>
    </div>
  );
}
