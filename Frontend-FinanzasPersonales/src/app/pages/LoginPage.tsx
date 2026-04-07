import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { LogIn } from "lucide-react";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentInput } from "../components/ui/FluentInput";
import { FluentCard } from "../components/ui/FluentCard";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isInitializing } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!isInitializing && user) {
      navigate(user.role === "admin" ? "/dashboard/admin" : "/dashboard", { replace: true });
    }
  }, [isInitializing, navigate, user]);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Campo obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "El correo electrónico no es válido";
    if (!password.trim()) e.password = "Campo obligatorio";
    if (!email.trim() || !password.trim()) {
      toast.error("Todos los campos son obligatorios");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success(result.message);
        navigate(result.user?.role === "admin" ? "/dashboard/admin" : "/dashboard", {
          replace: true,
        });
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[#1A237E] mb-1">Fluent</h1>
          <p className="text-[#6b7280]">Gestión inteligente de tus finanzas</p>
        </div>
        <FluentCard padding="lg">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <h2 className="text-center text-[#1a1a2e]">Iniciar Sesión</h2>
            <FluentInput
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <FluentInput
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <Link to="/forgot-password" className="text-[0.8125rem] text-[#1A237E] hover:underline self-end -mt-2">
              Recuperar Contraseña
            </Link>
            <FluentButton type="submit" fullWidth disabled={isSubmitting}>
              <LogIn size={18} /> {isSubmitting ? "Entrando..." : "Entrar"}
            </FluentButton>
            <p className="text-center text-[0.8125rem] text-[#6b7280]">
              ¿No tienes cuenta?{" "}
              <Link to="/register" className="text-[#1A237E] hover:underline">Regístrate</Link>
            </p>
          </form>
        </FluentCard>
      </div>
    </div>
  );
}