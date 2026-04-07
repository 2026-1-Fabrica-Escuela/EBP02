import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { UserPlus } from "lucide-react";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentInput } from "../components/ui/FluentInput";
import { FluentCard } from "../components/ui/FluentCard";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, user, isInitializing } = useApp();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isInitializing && user) {
      navigate(user.role === "admin" ? "/dashboard/admin" : "/dashboard", { replace: true });
    }
  }, [isInitializing, navigate, user]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Campo obligatorio";
    if (!form.email.trim()) e.email = "Campo obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Formato de correo inválido";
    if (!form.password) e.password = "Campo obligatorio";
    else if (form.password.length < 8) e.password = "Mínimo 8 caracteres";
    // En RegisterPage.tsx, línea 31 aprox.
    else if (!/(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(form.password))
    e.password = "Debe incluir mayúscula, número y carácter especial";
    if (!form.confirmPassword) e.confirmPassword = "Campo obligatorio";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Las contraseñas no coinciden";
    if (Object.keys(e).length > 0 && (!form.name || !form.email || !form.password || !form.confirmPassword)) {
      toast.error("Por favor completa todos los campos obligatorios");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await register(form.name, form.email, form.password);
      if (result.success) {
        toast.success(result.message);
        if (result.user) {
          navigate(result.user.role === "admin" ? "/dashboard/admin" : "/dashboard", {
            replace: true,
          });
        } else {
          navigate("/login", { replace: true });
        }
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[#1A237E] mb-1">Fluent</h1>
          <p className="text-[#6b7280]">Crea tu cuenta gratuita</p>
        </div>
        <FluentCard padding="lg">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <h2 className="text-center text-[#1a1a2e]">Registrar Usuario</h2>
            <FluentInput label="Nombre completo" placeholder="Tu nombre" value={form.name} onChange={set("name")} error={errors.name} />
            <FluentInput label="Correo electrónico" type="email" placeholder="tu@email.com" value={form.email} onChange={set("email")} error={errors.email} />
            <FluentInput label="Contraseña" type="password" placeholder="Mín. 8 caracteres" value={form.password} onChange={set("password")} error={errors.password} />
            <FluentInput label="Confirmar contraseña" type="password" placeholder="Repite tu contraseña" value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} />
            <FluentButton type="submit" fullWidth disabled={isSubmitting}>
              <UserPlus size={18} /> {isSubmitting ? "Registrando..." : "Registrarse"}
            </FluentButton>
            <p className="text-center text-[0.8125rem] text-[#6b7280]">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-[#1A237E] hover:underline">Inicia sesión</Link>
            </p>
          </form>
        </FluentCard>
      </div>
    </div>
  );
}
