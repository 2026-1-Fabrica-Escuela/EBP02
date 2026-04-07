import React, { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentInput } from "../components/ui/FluentInput";
import { FluentSelect } from "../components/ui/FluentSelect";
import { FluentCard } from "../components/ui/FluentCard";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";
import { request } from "../services/api/http";
// IMPORTANTE: Importamos la utilidad del token desde donde esté definida
// Ajusta la ruta si tus servicios están en otra carpeta
import { getStoredAuthToken } from "../services/api"; 

interface BackendCategory {
  categoryId: string;
  title: string;
  type: "INCOME" | "EXPENSE";
}

export function RegisterIncomePage() {
  // Extraemos 'user' para que el useEffect sepa cuándo dispararse
  const { addTransaction, user } = useApp(); 
  const [form, setForm] = useState({ amount: "", date: "", description: "", category: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = getStoredAuthToken();
        
        // Si por alguna razón no hay token, no procedemos
        if (!token) return;

        // Llamada al backend
        const data = await request<BackendCategory[]>("/categories", { method: "GET" }, token);
        
        const incomeOptions = data
          .filter((cat) => cat.type === "INCOME")
          .map((cat) => ({
            value: cat.categoryId, 
            label: cat.title,      
          }));
        
        setDynamicCategories(incomeOptions);
      } catch (err) {
        console.error("Error crítico al cargar categorías:", err);
      }
    };

    // Solo intentamos cargar si el usuario está autenticado
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.amount.trim()) e.amount = "Campo obligatorio";
    else if (!/^\d+(\.\d+)?$/.test(form.amount.trim())) e.amount = "El monto debe ser un valor numérico";
    else if (parseFloat(form.amount) <= 0) e.amount = "El monto del ingreso debe ser mayor a cero";
    if (!form.date) e.date = "Campo obligatorio";
    if (!form.description.trim()) e.description = "Campo obligatorio";
    if (!form.category) e.category = "Debes seleccionar una categoría";
    
    if (Object.keys(e).length > 0) toast.error("Por favor, completa todos los campos obligatorios");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await addTransaction({
        categoryId: form.category,
        amount: parseFloat(form.amount),
        date: form.date,
        description: form.description,
        status: "COMPLETED",
        pocketId: null       
      } as any);

      if (result.success) {
        toast.success(result.message || "Ingreso registrado correctamente");
        setForm({ amount: "", date: "", description: "", category: "" });
        setErrors({});
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-[#1a1a2e] mb-2">Registrar Ingreso</h1>
      <p className="text-[#6b7280] mb-6">Añade una nueva entrada de dinero a tu registro</p>
      <FluentCard padding="lg">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FluentInput label="Monto *" type="text" placeholder="Ej: 1500000" value={form.amount} onChange={set("amount")} error={errors.amount} />
          <FluentInput label="Fecha *" type="date" value={form.date} onChange={set("date")} error={errors.date} />
          
          <FluentSelect 
            label="Categoría *" 
            value={form.category} 
            onChange={(v) => setForm((p) => ({ ...p, category: v }))} 
            options={dynamicCategories} 
            error={errors.category} 
          />
          
          <FluentInput label="Descripción *" placeholder="Ej: Salario mensual de marzo" value={form.description} onChange={set("description")} error={errors.description} />
          <FluentButton type="submit" fullWidth disabled={isSubmitting}>
            <PlusCircle size={18} /> {isSubmitting ? "Guardando..." : "Guardar Ingreso"}
          </FluentButton>
        </form>
      </FluentCard>
    </div>
  );
}