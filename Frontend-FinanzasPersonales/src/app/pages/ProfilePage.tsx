import React, { useState } from "react";
import { User, X } from "lucide-react";
import { toast } from "sonner";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentCard } from "../components/ui/FluentCard";
import { FluentInput } from "../components/ui/FluentInput";
import { useApp } from "../context/AppContext";

export function ProfilePage() {
  const { user, updateProfile } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validate = () => {
    const e: Record<string, string> = {};

    if (!name.trim()) {
      e.name = "Campo obligatorio";
    }

    if (!email.trim()) {
      e.email = "Campo obligatorio";
    } else if (!validateEmail(email.trim())) {
      e.email = "Ingresa un correo electrónico válido";
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
      const result = await updateProfile(name.trim(), email.trim());
      if (result.success) {
        toast.success(result.message);
        setEditing(false);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setErrors({});
    setEditing(false);
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="mb-1 text-[#1a1a2e]">Mi Perfil</h1>
        <p className="text-[#6b7280]">Gestiona tu información personal</p>
      </div>

      <FluentCard padding="lg">
        {!editing ? (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1A237E]">
              <span className="text-2xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="w-full space-y-4">
              <div className="rounded-[10px] bg-[#F5F7FA] px-4 py-3">
                <p className="text-[0.75rem] uppercase tracking-wide text-[#6b7280] mb-0.5">Nombre</p>
                <p className="text-[0.9375rem] text-[#1a1a2e] font-medium">{user.name}</p>
              </div>
              <div className="rounded-[10px] bg-[#F5F7FA] px-4 py-3">
                <p className="text-[0.75rem] uppercase tracking-wide text-[#6b7280] mb-0.5">Correo electrónico</p>
                <p className="text-[0.9375rem] text-[#1a1a2e] font-medium">{user.email}</p>
              </div>
              <div className="rounded-[10px] bg-[#F5F7FA] px-4 py-3">
                <p className="text-[0.75rem] uppercase tracking-wide text-[#6b7280] mb-0.5">Rol</p>
                <p className="text-[0.9375rem] text-[#1a1a2e] font-medium capitalize">{user.role}</p>
              </div>
            </div>

            <FluentButton fullWidth onClick={() => { setName(user.name); setEmail(user.email); setEditing(true); }}>
              <User size={18} />
              Editar
            </FluentButton>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[#1a1a2e]">Editar Perfil</h3>
              <button
                type="button"
                onClick={handleCancel}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#1a1a2e]"
              >
                <X size={18} />
              </button>
            </div>

            <FluentInput
              label="Nombre *"
              type="text"
              placeholder="Tu nombre completo"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
              error={errors.name}
            />
            <FluentInput
              label="Correo electrónico *"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: "" })); }}
              error={errors.email}
            />

            <div className="flex gap-3 pt-1">
              <FluentButton fullWidth onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </FluentButton>
              <FluentButton variant="outline" fullWidth onClick={handleCancel} disabled={isSubmitting}>
                Cancelar
              </FluentButton>
            </div>
          </div>
        )}
      </FluentCard>
    </div>
  );
}