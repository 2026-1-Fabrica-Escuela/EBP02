import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, Loader2, Save, ShieldCheck, User as UserIcon } from "lucide-react";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentCard } from "../components/ui/FluentCard";
import { FluentInput } from "../components/ui/FluentInput";
import { useApp } from "../context/AppContext";

function StatusBadge({ status }: { status?: "activa" | "suspendida" }) {
  return status === "suspendida" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5252]/12 px-2 py-0.5 text-[0.6875rem] text-[#FF5252]">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF5252]" />
      Suspendida
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#00E676]/15 px-2 py-0.5 text-[0.6875rem] text-[#00A849]">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00C853]" />
      Activa
    </span>
  );
}

export function AdminUserEditPage() {
  const { user, users, updateUserProfile, isInitializing } = useApp();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  
  if (isInitializing) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#1A237E]" />
      </div>
    );
  }

  const targetUser = users.find((entry) => entry.id === userId) ?? null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (targetUser) {
      setName(targetUser.name);
      setEmail(targetUser.email);
    }
  }, [targetUser]);

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!userId || !targetUser) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <FluentCard>
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FF5252]/10">
              <AlertTriangle size={28} className="text-[#FF5252]" />
            </div>
            <p className="text-[#1a1a2e]">Usuario no encontrado</p>
            <p className="max-w-xs text-[0.8125rem] text-[#6b7280]">
              ID buscado: <code className="bg-gray-100 px-1">{userId}</code>
            </p>
            <div className="mt-4 w-full text-left">
              <p className="text-[0.75rem] font-bold text-[#6b7280]">Usuarios disponibles ({users.length}):</p>
              <ul className="mt-1 max-h-40 overflow-auto rounded border p-2 text-[0.625rem] text-[#6b7280]">
                {users.map(u => (
                  <li key={u.id}>{u.id} - {u.role} - {u.name}</li>
                ))}
              </ul>
            </div>
            <FluentButton onClick={() => navigate("/dashboard/admin")} className="mt-4">
              <ArrowLeft size={18} />
              Volver al panel
            </FluentButton>
          </div>
        </FluentCard>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const result = await updateUserProfile(targetUser.id, {
      name,
      email,
    });

    setIsSaving(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/dashboard/admin");
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="mb-1 text-[#1a1a2e]">Editar usuario</h1>
        <p className="text-[#6b7280]">Actualiza la información básica de la cuenta seleccionada</p>
      </div>

      <FluentCard padding="lg">
        <div className="mb-5 flex items-center gap-3 rounded-[10px] bg-[#F5F7FA] px-4 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1A237E] text-white">
            <UserIcon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.875rem] text-[#1a1a2e]" style={{ fontWeight: 600 }}>
              {targetUser.name}
            </p>
            <p className="truncate text-[0.8125rem] text-[#6b7280]">{targetUser.email}</p>
          </div>
          <StatusBadge status={targetUser.status} />
        </div>

        {targetUser.status === "suspendida" && targetUser.suspendReason && (
          <div className="mb-5 flex items-start gap-3 rounded-[10px] border border-[#FF5252]/30 bg-[#FF5252]/5 p-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#FF5252]" />
            <p className="text-[0.8125rem] text-[#FF5252]">
              <span className="font-semibold">Motivo de suspensión:</span> {targetUser.suspendReason}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <FluentInput
            label="Nombre"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
          />

          <FluentInput
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-[10px] border border-[#e0e0e0]/60 bg-[#F5F7FA] p-4">
              <p className="mb-1 text-[0.6875rem] uppercase tracking-wide text-[#6b7280]">Rol</p>
              <p className="text-[0.875rem] text-[#1a1a2e]" style={{ fontWeight: 600 }}>
                {targetUser.role === "admin" ? "Administrador" : "Usuario"}
              </p>
            </div>
            <div className="rounded-[10px] border border-[#e0e0e0]/60 bg-[#F5F7FA] p-4">
              <p className="mb-1 text-[0.6875rem] uppercase tracking-wide text-[#6b7280]">Estado</p>
              <StatusBadge status={targetUser.status} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-[10px] border border-[#FF5252]/30 bg-[#FF5252]/5 p-3">
              <AlertTriangle size={18} className="shrink-0 text-[#FF5252]" />
              <p className="text-[0.8125rem] text-[#FF5252]">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <FluentButton type="submit" fullWidth disabled={isSaving}>
              <Save size={18} />
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </FluentButton>
            <FluentButton type="button" variant="outline" fullWidth onClick={() => navigate("/dashboard/admin")}>
              <ShieldCheck size={18} />
              Volver
            </FluentButton>
          </div>
        </form>
      </FluentCard>
    </div>
  );
}
