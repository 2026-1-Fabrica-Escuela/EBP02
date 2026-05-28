import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Pencil,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { FluentCard } from "../components/ui/FluentCard";
import { useApp, type User } from "../context/AppContext";

const SUSPEND_REASONS = [
  "Incumplimiento de los términos de uso",
  "Actividad sospechosa o fraudulenta",
  "Contenido o comportamiento inapropiado",
  "Solicitud del propio usuario",
  "Cuenta duplicada o no verificada",
  "Otro motivo justificado",
];

type UserStatus = NonNullable<User["status"]>;

function StatusBadge({ status }: { status?: User["status"] }) {
  const currentStatus: UserStatus = status ?? "activa";

  return currentStatus === "activa" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#00E676]/15 px-2 py-0.5 text-[0.6875rem] text-[#00A849]">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00C853]" />
      Activa
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FF5252]/12 px-2 py-0.5 text-[0.6875rem] text-[#FF5252]">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF5252]" />
      Suspendida
    </span>
  );
}

interface SuspendModalProps {
  targetUser: User;
  reason: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function SuspendModal({ targetUser, reason, onConfirm, onCancel }: SuspendModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative flex w-full max-w-md flex-col gap-5 rounded-xl bg-white p-6 shadow-2xl">
        <button onClick={onCancel} className="absolute right-4 top-4 cursor-pointer text-[#6b7280] transition-colors hover:text-[#1a1a2e]">
          <X size={18} />
        </button>
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FF5252]/10">
            <UserX size={28} className="text-[#FF5252]" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="mb-1 text-[#1a1a2e]">Confirmar suspensión</h3>
          <p className="text-[0.875rem] text-[#6b7280]">¿Está seguro que quiere suspender a este usuario?</p>
        </div>
        <div className="flex flex-col gap-0.5 rounded-[10px] bg-[#F5F7FA] px-4 py-3">
          <p className="text-[0.875rem] text-[#1a1a2e]" style={{ fontWeight: 600 }}>{targetUser.name}</p>
          <p className="text-[0.8125rem] text-[#6b7280]">{targetUser.email}</p>
          <p className="mt-1 text-[0.75rem] text-[#6b7280]">
            Motivo: <span className="text-[#1a1a2e]">{reason}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 cursor-pointer rounded-[10px] border border-[#e0e0e0] px-4 py-2.5 text-[0.875rem] text-[#6b7280] transition-colors hover:bg-[#F5F7FA]">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 cursor-pointer rounded-[10px] bg-[#FF5252] px-4 py-2.5 text-[0.875rem] text-white transition-colors hover:bg-[#e53935]" style={{ fontWeight: 600 }}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

interface ActivateModalProps {
  targetUser: User;
  onConfirm: () => void;
  onCancel: () => void;
}

function ActivateModal({ targetUser, onConfirm, onCancel }: ActivateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative flex w-full max-w-md flex-col gap-5 rounded-xl bg-white p-6 shadow-2xl">
        <button onClick={onCancel} className="absolute right-4 top-4 cursor-pointer text-[#6b7280] transition-colors hover:text-[#1a1a2e]">
          <X size={18} />
        </button>
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#00E676]/15">
            <UserCheck size={28} className="text-[#00C853]" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="mb-1 text-[#1a1a2e]">Confirmar reactivación</h3>
          <p className="text-[0.875rem] text-[#6b7280]">¿Está seguro que quiere reactivar esta cuenta?</p>
        </div>
        <div className="flex flex-col gap-0.5 rounded-[10px] bg-[#F5F7FA] px-4 py-3">
          <p className="text-[0.875rem] text-[#1a1a2e]" style={{ fontWeight: 600 }}>{targetUser.name}</p>
          <p className="text-[0.8125rem] text-[#6b7280]">{targetUser.email}</p>
          {targetUser.suspendReason && (
            <p className="mt-1 text-[0.75rem] text-[#6b7280]">
              Motivo de suspensión: <span className="text-[#1a1a2e]">{targetUser.suspendReason}</span>
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 cursor-pointer rounded-[10px] border border-[#e0e0e0] px-4 py-2.5 text-[0.875rem] text-[#6b7280] transition-colors hover:bg-[#F5F7FA]">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 cursor-pointer rounded-[10px] bg-[#00C853] px-4 py-2.5 text-[0.875rem] text-white transition-colors hover:bg-[#00A849]" style={{ fontWeight: 600 }}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

interface UserRowProps {
  u: User;
  onSuspendClick: (u: User, reason: string) => void;
  onActivateClick: (u: User) => void;
  onEditClick: (u: User) => void;
}

function UserRow({ u, onSuspendClick, onActivateClick, onEditClick }: UserRowProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [suspendError, setSuspendError] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const currentStatus: UserStatus = u.status ?? "activa";

  const handleSuspend = () => {
    if (!selectedReason || currentStatus !== "activa") {
      setSuspendError(true);
      return;
    }

    setSuspendError(false);
    onSuspendClick(u, selectedReason);
  };

  const handleActivate = () => {
    if (currentStatus !== "suspendida") {
      setActivateError("La cuenta no puede activarse porque no está Suspendida");
      return;
    }

    setActivateError(null);
    onActivateClick(u);
  };

  return (
    <div className="rounded-[10px] bg-[#F5F7FA] p-4">
      <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A237E] text-white">
            <span className="text-[0.875rem]" style={{ fontWeight: 600 }}>{u.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-[0.875rem] text-[#1a1a2e]" style={{ fontWeight: 600 }}>{u.name}</p>
            <p className="text-[0.75rem] text-[#6b7280]">{u.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={u.status} />
          <button
            onClick={() => onEditClick(u)}
            title="Editar usuario"
            className="flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-[#1A237E]/25 px-2.5 py-1 text-[0.75rem] text-[#1A237E] transition-colors hover:bg-[#1A237E]/5"
            style={{ fontWeight: 500 }}
          >
            <Pencil size={13} />
            Editar
          </button>
        </div>
      </div>

      {currentStatus === "suspendida" && (
        <div className="space-y-3">
          <div className="rounded-[8px] border border-[#FF5252]/20 bg-[#FF5252]/5 px-3 py-2">
            <p className="text-[0.75rem] text-[#FF5252]">
              Motivo de suspensión: <span className="text-[#1a1a2e]">{u.suspendReason}</span>
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleActivate}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[#00C853] px-4 py-2 text-[0.8125rem] text-white transition-colors hover:bg-[#00A849]"
              style={{ fontWeight: 600 }}
            >
              <RefreshCw size={15} />
              Activar cuenta
            </button>
          </div>
          {activateError && (
            <div className="flex items-center gap-2 rounded-[8px] border border-[#FF5252]/30 bg-[#FF5252]/5 px-3 py-2">
              <AlertTriangle size={14} className="shrink-0 text-[#FF5252]" />
              <p className="text-[0.75rem] text-[#FF5252]">{activateError}</p>
            </div>
          )}
        </div>
      )}

      {currentStatus === "activa" && (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-[0.75rem] text-[#1a1a2e]/70">Motivo de suspensión</label>
              <div className="relative">
                <select
                  value={selectedReason}
                  onChange={(event) => {
                    setSelectedReason(event.target.value);
                    setSuspendError(false);
                    setActivateError(null);
                  }}
                  className={`w-full appearance-none rounded-[10px] border bg-white px-3 py-2 pr-8 text-[0.8125rem] outline-none transition-all
                    ${suspendError && !selectedReason ? "border-[#FF5252] focus:ring-2 focus:ring-[#FF5252]/20" : "border-[#e0e0e0] focus:border-[#1A237E] focus:ring-2 focus:ring-[#1A237E]/10"}
                  `}
                >
                  <option value="">— Selecciona un motivo —</option>
                  {SUSPEND_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                onClick={handleSuspend}
                className="flex cursor-pointer items-center gap-2 rounded-[10px] bg-[#FF5252] px-4 py-2 text-[0.8125rem] text-white transition-colors hover:bg-[#e53935]"
                style={{ fontWeight: 600 }}
              >
                <UserX size={15} />
                Suspender
              </button>
              <button
                onClick={handleActivate}
                className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#e0e0e0] bg-white px-4 py-2 text-[0.8125rem] text-[#6b7280] transition-colors hover:bg-[#F5F7FA]"
                style={{ fontWeight: 600 }}
                title="Activar cuenta"
              >
                <RefreshCw size={15} />
                Activar
              </button>
            </div>
          </div>

          {suspendError && (
            <div className="flex items-center gap-2 rounded-[8px] border border-[#FF5252]/30 bg-[#FF5252]/5 px-3 py-2">
              <AlertTriangle size={14} className="shrink-0 text-[#FF5252]" />
              <p className="text-[0.75rem] text-[#FF5252]">No se puede suspender un usuario sin motivo o con la cuenta inactiva</p>
            </div>
          )}

          {activateError && (
            <div className="flex items-center gap-2 rounded-[8px] border border-[#FF5252]/30 bg-[#FF5252]/5 px-3 py-2">
              <AlertTriangle size={14} className="shrink-0 text-[#FF5252]" />
              <p className="text-[0.75rem] text-[#FF5252]">{activateError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type ModalState =
  | { type: "suspend"; targetUser: User; reason: string }
  | { type: "activate"; targetUser: User }
  | null;

export function AdminPage() {
  const { user, users, suspendUser, activateUser } = useApp();
  const navigate = useNavigate();

  const [modal, setModal] = useState<ModalState>(null);
  const [notification, setNotification] = useState<{ msg: string; kind: "success" | "error" } | null>(null);

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF5252]/10">
          <ShieldCheck size={32} className="text-[#FF5252]" />
        </div>
        <h2 className="mb-2 text-[#1a1a2e]">Acceso restringido a administradores</h2>
        <p className="text-[#6b7280]">No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  const managedUsers = users;
  const activeCount = managedUsers.filter((entry) => (entry.status ?? "activa") === "activa").length;
  const suspendedCount = managedUsers.filter((entry) => (entry.status ?? "activa") === "suspendida").length;

  const handleSuspendClick = (targetUser: User, reason: string) => {
    setModal({ type: "suspend", targetUser, reason });
    setNotification(null);
  };

  const handleActivateClick = (targetUser: User) => {
    setModal({ type: "activate", targetUser });
    setNotification(null);
  };

  const handleEditClick = (targetUser: User) => {
    navigate(`/dashboard/admin/edit/${targetUser.id}`);
  };

  const handleConfirmSuspend = async () => {
    if (modal?.type !== "suspend") return;

    const result = await suspendUser(modal.targetUser.id, modal.reason);
    setModal(null);
    setNotification({ msg: result.message, kind: result.success ? "success" : "error" });
  };

  const handleConfirmActivate = async () => {
    if (modal?.type !== "activate") return;

    const result = await activateUser(modal.targetUser.id);
    setModal(null);
    setNotification({ msg: result.message, kind: result.success ? "success" : "error" });
  };

  return (
    <>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <h1 className="mb-1 text-[#1a1a2e]">Panel de Usuarios</h1>
          <p className="text-[#6b7280]">Gestión de usuarios de la plataforma</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FluentCard padding="md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A237E]/10">
                <Users size={20} className="text-[#1A237E]" />
              </div>
              <div>
                <p className="text-[0.6875rem] uppercase tracking-wide text-[#6b7280]">Total usuarios</p>
                <p className="text-[1.375rem] text-[#1a1a2e]" style={{ fontWeight: 700 }}>{managedUsers.length}</p>
              </div>
            </div>
          </FluentCard>

          <FluentCard padding="md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00E676]/15">
                <CheckCircle size={20} className="text-[#00C853]" />
              </div>
              <div>
                <p className="text-[0.6875rem] uppercase tracking-wide text-[#6b7280]">Cuentas activas</p>
                <p className="text-[1.375rem] text-[#00C853]" style={{ fontWeight: 700 }}>{activeCount}</p>
              </div>
            </div>
          </FluentCard>

          <FluentCard padding="md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF5252]/10">
                <UserX size={20} className="text-[#FF5252]" />
              </div>
              <div>
                <p className="text-[0.6875rem] uppercase tracking-wide text-[#6b7280]">Suspendidas</p>
                <p className="text-[1.375rem] text-[#FF5252]" style={{ fontWeight: 700 }}>{suspendedCount}</p>
              </div>
            </div>
          </FluentCard>
        </div>

        {notification && (
          <div className={`flex items-center gap-3 rounded-[10px] border p-3
            ${notification.kind === "success"
              ? "border-[#00C853]/30 bg-[#00E676]/10"
              : "border-[#FF5252]/30 bg-[#FF5252]/5"
            }`}
          >
            {notification.kind === "success"
              ? <CheckCircle size={18} className="shrink-0 text-[#00C853]" />
              : <AlertTriangle size={18} className="shrink-0 text-[#FF5252]" />
            }
            <p className={`text-[0.8125rem] ${notification.kind === "success" ? "text-[#00A849]" : "text-[#FF5252]"}`}>
              {notification.msg}
            </p>
            <button onClick={() => setNotification(null)} className="ml-auto cursor-pointer text-[#6b7280] hover:text-[#1a1a2e]">
              <X size={14} />
            </button>
          </div>
        )}

        <FluentCard padding="md">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[#1a1a2e]">Gestión de Usuarios</h3>
            <span className="rounded-full border border-[#e0e0e0]/60 bg-[#F5F7FA] px-2.5 py-0.5 text-[0.75rem] text-[#6b7280]">
              {managedUsers.length} usuarios
            </span>
          </div>

          {managedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1A237E]/10">
                <Users size={28} className="text-[#1A237E]" />
              </div>
              <p className="text-[#1a1a2e]">No hay usuarios para mostrar</p>
              <p className="max-w-xs text-[0.8125rem] text-[#6b7280]">
                Cuando el backend devuelva cuentas de usuario, aparecerán aquí para gestionarlas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {managedUsers.map((entry) => (
                <UserRow
                  key={entry.id}
                  u={entry}
                  onSuspendClick={handleSuspendClick}
                  onActivateClick={handleActivateClick}
                  onEditClick={handleEditClick}
                />
              ))}
            </div>
          )}
        </FluentCard>
      </div>

      {modal?.type === "suspend" && (
        <SuspendModal
          targetUser={modal.targetUser}
          reason={modal.reason}
          onConfirm={handleConfirmSuspend}
          onCancel={() => setModal(null)}
        />
      )}

      {modal?.type === "activate" && (
        <ActivateModal
          targetUser={modal.targetUser}
          onConfirm={handleConfirmActivate}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}