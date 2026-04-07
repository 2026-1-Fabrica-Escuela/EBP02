import React, { useState } from "react";
import { Link } from "react-router";
import { Mail } from "lucide-react";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentInput } from "../components/ui/FluentInput";
import { FluentCard } from "../components/ui/FluentCard";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useApp();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const validate = () => {
    if (!email.trim()) {
      setError("Campo obligatorio");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Formato de correo inválido");
      return false;
    }
    setError(undefined);
    return true;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        setFeedback(result.message);
        toast.success(result.message);
      } else {
        setFeedback("");
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
          <p className="text-[#6b7280]">Recuperar Contraseña</p>
        </div>

        <FluentCard padding="lg">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <h2 className="text-center text-[#1a1a2e]">¿Olvidaste tu contraseña?</h2>
            <p className="text-[0.875rem] text-[#6b7280] text-center -mt-2">
              Ingresa tu correo y te enviaremos instrucciones para restablecerla.
            </p>

            <FluentInput
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />

            {feedback ? (
              <p className="text-[0.8125rem] text-[#00A152] bg-[#00E676]/10 border border-[#00E676]/25 rounded-[10px] px-3 py-2">
                {feedback}
              </p>
            ) : null}

            <FluentButton type="submit" fullWidth disabled={isSubmitting}>
              <Mail size={18} /> {isSubmitting ? "Enviando..." : "Enviar enlace"}
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
