import { useState } from "react";
import { Navigate } from "react-router";
import {
  AlertTriangle,
  BarChart2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { FluentButton } from "../components/ui/FluentButton";
import { FluentCard } from "../components/ui/FluentCard";
import { useApp, type LoginLog } from "../context/AppContext";

interface UserActivity {
  userId: string;
  userName: string;
  userEmail: string;
  loginCount: number;
  lastLogin: string;
  firstLogin: string;
}

interface ReportResult {
  totalSessions: number;
  uniqueUsersCount: number;
  userActivity: UserActivity[];
  startDate: string;
  endDate: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isoToDate(iso: string) {
  return iso.substring(0, 10);
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  max?: string;
}

function DateField({ label, value, onChange, error, max }: DateFieldProps) {
  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[0.8125rem] text-[#1a1a2e]/80" style={{ fontWeight: 500 }}>
        {label}
      </label>
      <div className="relative">
        <Calendar size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
        <input
          id={inputId}
          type="date"
          value={value}
          max={max}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-[10px] border bg-white py-2.5 pl-9 pr-3 text-[0.875rem] outline-none transition-all
            ${error ? "border-[#FF5252] ring-2 ring-[#FF5252]/15" : "border-[#e0e0e0] focus:border-[#1A237E] focus:ring-2 focus:ring-[#1A237E]/10"}
          `}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1 text-[0.75rem] text-[#FF5252]">
          <AlertTriangle size={11} className="shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

function UserActivityRow({
  activity,
  maxCount,
  rank,
}: {
  activity: UserActivity;
  maxCount: number;
  rank: number;
}) {
  const barPct = maxCount > 0 ? Math.round((activity.loginCount / maxCount) * 100) : 0;
  const rankColors = ["bg-[#FFC107]", "bg-[#9e9e9e]", "bg-[#cd7f32]"];

  return (
    <div className="flex flex-col gap-3 rounded-[10px] bg-[#F5F7FA] p-3 transition-colors hover:bg-[#eef0f5] sm:flex-row sm:items-center">
      <div className="flex shrink-0 items-center gap-3">
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.625rem] text-white
            ${rank <= 3 ? rankColors[rank - 1] : "bg-[#e0e0e0] text-[#6b7280]"}`}
          style={{ fontWeight: 700 }}
        >
          {rank}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#1A237E] text-white">
          <span className="text-[0.8125rem]" style={{ fontWeight: 600 }}>
            {activity.userName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.875rem] text-[#1a1a2e]" style={{ fontWeight: 600 }}>
              {activity.userName}
            </p>
            <p className="text-[0.75rem] text-[#6b7280]">{activity.userEmail}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-[1rem] text-[#1A237E]" style={{ fontWeight: 700 }}>
                {activity.loginCount}
              </p>
              <p className="text-[0.6875rem] text-[#6b7280]">
                {activity.loginCount === 1 ? "sesión" : "sesiones"}
              </p>
            </div>
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#e0e0e0]">
          <div className="h-full rounded-full bg-[#1A237E] transition-all duration-500" style={{ width: `${barPct}%` }} />
        </div>
        <p className="flex items-center gap-1 text-[0.6875rem] text-[#6b7280]">
          <Clock size={10} />
          Último acceso: {formatDateTime(activity.lastLogin)}
        </p>
      </div>
    </div>
  );
}

export function ActivityReportPage() {
  const { user, loginLogs } = useApp();
  const today = new Date().toISOString().substring(0, 10);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateErrors, setDateErrors] = useState<{
    start?: string;
    end?: string;
    range?: string;
  }>({});
  const [report, setReport] = useState<ReportResult | null>(null);
  const [noData, setNoData] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = (): boolean => {
    const nextErrors: typeof dateErrors = {};

    if (!startDate) nextErrors.start = "Este campo es obligatorio";
    if (!endDate) nextErrors.end = "Este campo es obligatorio";

    if (nextErrors.start || nextErrors.end) {
      setDateErrors(nextErrors);
      return false;
    }

    if (startDate > endDate) {
      setDateErrors({ range: "El rango de fechas es invalido" });
      return false;
    }

    setDateErrors({});
    return true;
  };

  const handleGenerate = () => {
    setReport(null);
    setNoData(false);
    setShowDetail(false);

    if (!validate()) {
      return;
    }

    const filtered: LoginLog[] = loginLogs.filter((log) => {
      const dateOnly = isoToDate(log.timestamp);
      return dateOnly >= startDate && dateOnly <= endDate;
    });

    if (filtered.length === 0) {
      setNoData(true);
      return;
    }

    const map = new Map<string, UserActivity>();
    for (const log of filtered) {
      const existing = map.get(log.userId);
      if (!existing) {
        map.set(log.userId, {
          userId: log.userId,
          userName: log.userName,
          userEmail: log.userEmail,
          loginCount: 1,
          lastLogin: log.timestamp,
          firstLogin: log.timestamp,
        });
      } else {
        existing.loginCount += 1;
        if (log.timestamp > existing.lastLogin) existing.lastLogin = log.timestamp;
        if (log.timestamp < existing.firstLogin) existing.firstLogin = log.timestamp;
      }
    }

    const userActivity = Array.from(map.values()).sort(
      (left, right) => right.loginCount - left.loginCount || right.lastLogin.localeCompare(left.lastLogin),
    );

    setReport({
      totalSessions: filtered.length,
      uniqueUsersCount: userActivity.length,
      userActivity,
      startDate,
      endDate,
    });
  };

  const maxCount = report ? Math.max(...report.userActivity.map((item) => item.loginCount)) : 1;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="mb-1 text-[#1a1a2e]">Reporte de Actividad</h1>
        <p className="text-[#6b7280]">Monitorea los inicios de sesión de usuarios en un período seleccionado</p>
      </div>

      <FluentCard padding="lg">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#1A237E]/8">
            <Calendar size={16} className="text-[#1A237E]" />
          </div>
          <h3 className="text-[#1a1a2e]">Seleccionar período</h3>
        </div>

        <div className="flex flex-col items-start gap-4 sm:flex-row">
          <DateField
            label="Fecha inicio"
            value={startDate}
            onChange={(value) => {
              setStartDate(value);
              setDateErrors({});
              setReport(null);
              setNoData(false);
            }}
            error={dateErrors.start}
            max={today}
          />
          <DateField
            label="Fecha fin"
            value={endDate}
            onChange={(value) => {
              setEndDate(value);
              setDateErrors({});
              setReport(null);
              setNoData(false);
            }}
            error={dateErrors.end}
            max={today}
          />
        </div>

        {dateErrors.range && (
          <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-[#FF5252]/30 bg-[#FF5252]/5 px-3 py-2.5">
            <AlertTriangle size={15} className="shrink-0 text-[#FF5252]" />
            <p className="text-[0.8125rem] text-[#FF5252]">{dateErrors.range}</p>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <FluentButton onClick={handleGenerate}>
            <Search size={16} />
            Generar Reporte
          </FluentButton>
        </div>
      </FluentCard>

      {noData && (
        <div className="flex items-start gap-3 rounded-[10px] border border-[#1A237E]/20 bg-[#1A237E]/5 p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-[#1A237E]" />
          <div>
            <p className="text-[0.875rem] text-[#1A237E]" style={{ fontWeight: 600 }}>
              Sin registros de actividad
            </p>
            <p className="mt-0.5 text-[0.8125rem] text-[#1A237E]/70">
              En el rango de fechas seleccionado no hay registros de actividad
            </p>
          </div>
        </div>
      )}

      {report && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[0.8125rem] text-[#6b7280]">
              Período: <span className="text-[#1a1a2e]" style={{ fontWeight: 500 }}>
                {formatDate(report.startDate)} — {formatDate(report.endDate)}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FluentCard padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1A237E]/10">
                  <Users size={22} className="text-[#1A237E]" />
                </div>
                <div>
                  <p className="text-[0.6875rem] uppercase leading-tight tracking-wide text-[#6b7280]">
                    Usuarios activos
                  </p>
                  <p className="text-[1.625rem] leading-tight text-[#1A237E]" style={{ fontWeight: 700 }}>
                    {report.uniqueUsersCount}
                  </p>
                </div>
              </div>
            </FluentCard>

            <FluentCard padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00E676]/15">
                  <BarChart2 size={22} className="text-[#00C853]" />
                </div>
                <div>
                  <p className="text-[0.6875rem] uppercase leading-tight tracking-wide text-[#6b7280]">
                    Total sesiones
                  </p>
                  <p className="text-[1.625rem] leading-tight text-[#00C853]" style={{ fontWeight: 700 }}>
                    {report.totalSessions}
                  </p>
                </div>
              </div>
            </FluentCard>

            <FluentCard padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFC107]/15">
                  <TrendingUp size={22} className="text-[#FFA000]" />
                </div>
                <div>
                  <p className="text-[0.6875rem] uppercase leading-tight tracking-wide text-[#6b7280]">
                    Prom. por usuario
                  </p>
                  <p className="text-[1.625rem] leading-tight text-[#FFA000]" style={{ fontWeight: 700 }}>
                    {(report.totalSessions / report.uniqueUsersCount).toFixed(1)}
                  </p>
                </div>
              </div>
            </FluentCard>
          </div>

          <FluentCard padding="md">
            <div className="mb-1 flex items-center justify-between">
              <div>
                <h3 className="text-[#1a1a2e]">Detalle por usuario</h3>
                <p className="mt-0.5 text-[0.8125rem] text-[#6b7280]">
                  {report.uniqueUsersCount} {report.uniqueUsersCount === 1 ? "usuario inició" : "usuarios iniciaron"} sesión en el período
                </p>
              </div>
              <button
                onClick={() => setShowDetail((current) => !current)}
                className="flex shrink-0 items-center gap-2 rounded-[10px] border border-[#1A237E]/30 px-3.5 py-2 text-[0.8125rem] text-[#1A237E] transition-colors hover:bg-[#1A237E]/5"
                style={{ fontWeight: 600 }}
              >
                {showDetail ? (
                  <><ChevronUp size={15} /> Ocultar detalle</>
                ) : (
                  <><ChevronDown size={15} /> Detalle</>
                )}
              </button>
            </div>

            {showDetail && (
              <div className="mt-4 space-y-2 border-t border-[#e0e0e0]/60 pt-4">
                <div className="hidden gap-3 px-3 pb-1 sm:grid sm:grid-cols-[2rem_1fr_5rem]">
                  <span />
                  <span className="text-[0.75rem] uppercase tracking-wide text-[#6b7280]">Usuario</span>
                  <span className="text-right text-[0.75rem] uppercase tracking-wide text-[#6b7280]">Sesiones</span>
                </div>
                {report.userActivity.map((activity, index) => (
                  <UserActivityRow
                    key={activity.userId}
                    activity={activity}
                    maxCount={maxCount}
                    rank={index + 1}
                  />
                ))}
              </div>
            )}
          </FluentCard>
        </>
      )}
    </div>
  );
}
