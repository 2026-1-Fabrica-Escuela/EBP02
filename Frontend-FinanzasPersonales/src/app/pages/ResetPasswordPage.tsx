import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { Lock } from "lucide-react";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentInput } from "../components/ui/FluentInput";
import { FluentCard } from "../components/ui/FluentCard";
import { resetPasswordRequest } from "../services/api";
import { toErrorMessage } from "../context/errors";
import { toast } from "sonner";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const e: typeof errors = {};

    if (!newPassword.trim()) {
      e.newPassword = "La contraseña es obligatoria";
    } else if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/\d/.test(newPassword)
    ) {
      e.newPassword =
        "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número";
    }

    if (!confirmPassword.trim()) {
      e.confirmPassword = "Debes confirmar la contraseña";
    } else if (newPassword !== confirmPassword) {
      e.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await resetPasswordRequest(token, newPassword);
      toast.success("Tu contraseña fue restablecida con éxito");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(toErrorMessage(error, "No se pudo restablecer la contraseña"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[#1A237E] mb-1">Fluent</h1>
          <p className="text-[#6b7280]">Nueva Contraseña</p>
        </div>

        <FluentCard padding="lg">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <h2 className="text-center text-[#1a1a2e]">Restablece tu contraseña</h2>
            <p className="text-[0.875rem] text-[#6b7280] text-center -mt-2">
              Ingresa tu nueva contraseña.
            </p>

            <FluentInput
              label="Nueva Contraseña"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.newPassword}
            />

            <FluentInput
              label="Confirmar Contraseña"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
            />

            <FluentButton type="submit" fullWidth disabled={isSubmitting}>
              <Lock size={18} /> {isSubmitting ? "Guardando..." : "Guardar"}
            </FluentButton>

            <p className="text-center text-[0.8125rem] text-[#6b7280]">
              <Link to="/login" className="text-[#1A237E] hover:underline">
                Volver al inicio de sesión
              </Link>
            </p>
          </form>
        </FluentCard>
      </div>
    </div>
  );
}
