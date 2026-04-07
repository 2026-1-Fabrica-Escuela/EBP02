import React, { useState, useEffect } from "react";
import { MinusCircle } from "lucide-react";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentInput } from "../components/ui/FluentInput";
import { FluentSelect } from "../components/ui/FluentSelect";
import { FluentCard } from "../components/ui/FluentCard";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";
import { request } from "../services/api/http";
import { getStoredAuthToken } from "../services/api"; // Asegúrate de que la ruta sea correcta

interface BackendCategory {
  categoryId: string;
  title: string;
  type: "INCOME" | "EXPENSE";
}

export function RegisterExpensePage() {
  const { addTransaction, user } = useApp();
  const [form, setForm] = useState({ amount: "", date: "", description: "", category: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para categorías de gastos
  const [dynamicCategories, setDynamicCategories] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = getStoredAuthToken();
        if (!token) return;

        const data = await request<BackendCategory[]>("/categories", { method: "GET" }, token);
        
        // FILTRAR SOLO GASTOS (EXPENSE)
        const expenseOptions = data
          .filter((cat) => cat.type === "EXPENSE")
          .map((cat) => ({
            value: cat.categoryId,
            label: cat.title,
          }));
        
        setDynamicCategories(expenseOptions);
      } catch (err) {
        console.error("Error al cargar categorías de gastos:", err);
      }
    };

    if (user) {
      fetchCategories();
    }
  }, [user]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.amount.trim()) e.amount = "Campo obligatorio";
    else if (isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) 
      e.amount = "El monto debe ser un valor numérico positivo";
    if (!form.date) e.date = "Campo obligatorio";
    if (!form.description.trim()) e.description = "Campo obligatorio";
    if (!form.category) e.category = "Debes seleccionar una categoría";
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Enviamos el gasto al backend
      const result = await addTransaction({
        categoryId: form.category,
        amount: parseFloat(form.amount),
        date: form.date,
        description: form.description,
        status: "COMPLETED",
        pocketId: null 
      });

      if (result.success) {
        toast.success("Gasto registrado correctamente");
        setForm({ amount: "", date: "", description: "", category: "" });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-[#1a1a2e] mb-2">Registrar Gasto</h1>
      <p className="text-[#6b7280] mb-6">Registra una salida de dinero</p>
      <FluentCard padding="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FluentInput label="Monto *" type="text" placeholder="Ej: 50000" value={form.amount} onChange={set("amount")} error={errors.amount} />
          <FluentInput label="Fecha *" type="date" value={form.date} onChange={set("date")} error={errors.date} />
          
          <FluentSelect 
            label="Categoría *" 
            value={form.category} 
            onChange={(v) => setForm((p) => ({ ...p, category: v }))} 
            options={dynamicCategories} 
            error={errors.category} 
          />
          
          <FluentInput label="Descripción *" placeholder="Ej: Pago de servicios públicos" value={form.description} onChange={set("description")} error={errors.description} />
          <FluentButton type="submit" fullWidth disabled={isSubmitting} variant="danger">
            <MinusCircle size={18} /> {isSubmitting ? "Guardando..." : "Guardar Gasto"}
          </FluentButton>
        </form>
      </FluentCard>
    </div>
  );
}